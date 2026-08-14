
const express = require('express');
const { z } = require('zod');
const prisma = require('../prismaClient');
const { authenticateToken, standardizedError } = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

router.use(authenticateToken);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const s3 = new S3Client({ region: process.env.AWS_REGION });

const defaultLeaveBalance = { SICK: 12, CASUAL: 8, ANNUAL: 20, UNPAID: 10 };

function parseLeaveBalance(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value || {};
    return { ...defaultLeaveBalance, ...parsed };
  } catch (error) {
    return { ...defaultLeaveBalance };
  }
}

router.get('/profile', async (req, res) => {
  try {
	const profile = await prisma.employeeProfile.findUnique({ where: { userId: req.user.id } });
	return res.json({ success: true, data: profile ? { ...profile, leaveBalance: parseLeaveBalance(profile.leaveBalance) } : null });
  } catch (err) {
	return res.status(500).json({ success: false, message: err.message });
  }
});

const profileUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  profilePicture: z.string().optional(),
  leaveBalance: z.record(z.any()).optional(),
});

router.put('/profile', async (req, res) => {
  try {
	const body = profileUpdateSchema.parse(req.body);
	const payload = { ...body };
	if (payload.leaveBalance) payload.leaveBalance = JSON.stringify(payload.leaveBalance);

	const updated = await prisma.employeeProfile.update({ where: { userId: req.user.id }, data: payload });
	return res.json({ success: true, data: { ...updated, leaveBalance: parseLeaveBalance(updated.leaveBalance) } });
  } catch (err) {
	return res.status(400).json({ success: false, message: err.message });
  }
});

// Clock in / Clock out
router.post('/attendance/clock', async (req, res) => {
  try {
	const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	// Check today's attendance
	const startOfDay = new Date();
	startOfDay.setHours(0,0,0,0);
	const endOfDay = new Date();
	endOfDay.setHours(23,59,59,999);

	let attendance = await prisma.attendance.findFirst({ where: { userId: req.user.id, date: { gte: startOfDay, lte: endOfDay } } });
	if (!attendance) {
	  attendance = await prisma.attendance.create({ data: { userId: req.user.id, checkIn: new Date(), ipAddress: String(ip) } });
	  return res.json({ success: true, data: attendance, message: 'Checked in' });
	}

	// If exists and no checkOut, set checkOut
	if (attendance && !attendance.checkOut) {
	  const updated = await prisma.attendance.update({ where: { id: attendance.id }, data: { checkOut: new Date() } });
	  return res.json({ success: true, data: updated, message: 'Checked out' });
	}

	// If both present, create a new record
	const newRec = await prisma.attendance.create({ data: { userId: req.user.id, checkIn: new Date(), ipAddress: String(ip) } });
	return res.json({ success: true, data: newRec, message: 'Checked in (new record)' });
  } catch (err) {
	return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/attendance', async (req, res) => {
  try {
	const records = await prisma.attendance.findMany({ where: { userId: req.user.id }, orderBy: { date: 'desc' } });
	return res.json({ success: true, data: records });
  } catch (err) {
	return res.status(500).json({ success: false, message: err.message });
  }
});

const leaveSchema = z.object({
  type: z.enum(['SICK','CASUAL','ANNUAL','UNPAID']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
});

router.post('/leave', async (req, res) => {
  try {
	const body = leaveSchema.parse(req.body);
	const start = new Date(body.startDate);
	const end = new Date(body.endDate);
	const leave = await prisma.leaveRequest.create({ data: { userId: req.user.id, type: body.type, startDate: start, endDate: end, reason: body.reason || '' } });
	return res.json({ success: true, data: leave });
  } catch (err) {
	return res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/leave', async (req, res) => {
  try {
	const { status } = req.query;
	const where = { userId: req.user.id };
	if (status) where.status = status;
	const leaves = await prisma.leaveRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
	return res.json({ success: true, data: leaves });
  } catch (err) {
	return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/leave-summary', async (req, res) => {
  try {
    const profile = await prisma.employeeProfile.findUnique({ where: { userId: req.user.id } });
    const leaveRequests = await prisma.leaveRequest.findMany({ where: { userId: req.user.id } });
    const balance = parseLeaveBalance(profile && profile.leaveBalance);
    const approvedDays = leaveRequests.filter(item => item.status === 'APPROVED').reduce((sum, item) => {
      const days = Math.max(1, Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) + 1);
      return sum + days;
    }, 0);

    const pendingDays = leaveRequests.filter(item => item.status === 'PENDING').reduce((sum, item) => {
      const days = Math.max(1, Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) + 1);
      return sum + days;
    }, 0);

    return res.json({
      success: true,
      data: {
        balance,
        approvedDays,
        pendingDays,
        totalUsed: approvedDays,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Documents upload (accept array of {name, base64}) and attach to profile.documents
// Generate presigned URLs for direct S3 upload
router.post('/presign', async (req, res) => {
  try {
	const { files } = req.body; // expect [{ name, type }]
	if (!files || !Array.isArray(files) || files.length === 0) return res.status(400).json({ success: false, message: 'Files required' });
	const bucket = process.env.S3_BUCKET;
	const region = process.env.AWS_REGION;
	const out = [];
	for (const f of files) {
	  const key = `${req.user.id}/${Date.now()}_${f.name}`;
	  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: f.type, ACL: 'private' });
	  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
	  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
	  out.push({ name: f.name, key, uploadUrl, url: publicUrl });
	}
	return res.json({ success: true, data: out });
  } catch (err) {
	return res.status(500).json({ success: false, message: err.message });
  }
});

// Register uploaded file metadata into profile.documents after client uploads directly to S3
router.post('/register-file', async (req, res) => {
  try {
	const { files } = req.body; // expect [{ name, key, url }]
	if (!files || !Array.isArray(files) || files.length === 0) return res.status(400).json({ success: false, message: 'Files required' });
	const profile = await prisma.employeeProfile.findUnique({ where: { userId: req.user.id } });
	const existing = profile.documents || [];
	const toAdd = files.map(f => ({ name: f.name, url: f.url, key: f.key, uploadedAt: new Date() }));
	const updated = await prisma.employeeProfile.update({ where: { userId: req.user.id }, data: { documents: existing.concat(toAdd) } });
	return res.json({ success: true, data: updated });
  } catch (err) {
	return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
