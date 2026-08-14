const express = require('express');
const { z } = require('zod');
const prisma = require('../prismaClient');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole('HR'));

router.get('/stats', async (req, res) => {
  try {
	const totalEmployees = await prisma.user.count({ where: { role: 'EMPLOYEE' } });
	const todayStart = new Date();
	todayStart.setHours(0,0,0,0);
	const todayEnd = new Date();
	todayEnd.setHours(23,59,59,999);
	const activeToday = await prisma.attendance.count({ where: { date: { gte: todayStart, lte: todayEnd } } });
	const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
	const monthStart = new Date();
	monthStart.setDate(1); monthStart.setHours(0,0,0,0);
	const newHires = await prisma.user.count({ where: { createdAt: { gte: monthStart } } });
	const departmentSummary = await prisma.employeeProfile.groupBy({ by: ['department'], _count: { department: true } });
	return res.json({ success: true, data: { totalEmployees, activeToday, pendingLeaves, newHires, departmentSummary } });
  } catch (err) {
	return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/department-summary', async (req, res) => {
  try {
    const summary = await prisma.employeeProfile.groupBy({ by: ['department'], _count: { department: true } });
    return res.json({ success: true, data: summary.map(item => ({ department: item.department || 'Unassigned', count: item._count.department })) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Employee directory
router.get('/employees', async (req, res) => {
  try {
	const { q, take = 50, skip = 0 } = req.query;
	const where = { role: 'EMPLOYEE' };
	if (q) where.OR = [{ email: { contains: q } }, { employeeId: { contains: q } }];
	const users = await prisma.user.findMany({ where, include: { profile: true }, take: Number(take), skip: Number(skip) });
	return res.json({ success: true, data: users });
  } catch (err) {
	return res.status(500).json({ success: false, message: err.message });
  }
});

// Approvals list
router.get('/approvals', async (req, res) => {
  try {
	const pending = await prisma.leaveRequest.findMany({ where: { status: 'PENDING' }, include: { user: { include: { profile: true } } }, orderBy: { createdAt: 'asc' } });
	return res.json({ success: true, data: pending });
  } catch (err) {
	return res.status(500).json({ success: false, message: err.message });
  }
});

const approveSchema = z.object({ id: z.string(), approve: z.boolean(), comment: z.string().optional() });

router.post('/approve', async (req, res) => {
  try {
	const body = approveSchema.parse(req.body);
	const leave = await prisma.leaveRequest.findUnique({ where: { id: body.id } });
	if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
	const status = body.approve ? 'APPROVED' : 'REJECTED';
	const updated = await prisma.leaveRequest.update({ where: { id: body.id }, data: { status, hrComment: body.comment || '' } });

	// If approved, deduct from leave balance (only for ANNUAL or CASUAL/SICK depending rules)
	if (body.approve && leave.type === 'ANNUAL') {
	  const profile = await prisma.employeeProfile.findUnique({ where: { userId: leave.userId } });
	  const current = profile.leaveBalance || {};
	  const start = new Date(leave.startDate);
	  const end = new Date(leave.endDate);
	  const days = Math.ceil((end - start) / (1000*60*60*24)) + 1;
	  const remaining = (current['ANNUAL'] || 0) - days;
	  current['ANNUAL'] = remaining;
	  await prisma.employeeProfile.update({ where: { userId: leave.userId }, data: { leaveBalance: current } });
	}

	return res.json({ success: true, data: updated });
  } catch (err) {
	return res.status(400).json({ success: false, message: err.message });
  }
});

// HR can update employee data
const updateSchema = z.object({
  userId: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  role: z.enum(['EMPLOYEE', 'HR']).optional(),
});

router.put('/employee', async (req, res) => {
  try {
	const body = updateSchema.parse(req.body);
	const profileData = {};
	if (body.firstName) profileData.firstName = body.firstName;
	if (body.lastName) profileData.lastName = body.lastName;
	if (body.department) profileData.department = body.department;
	if (body.designation) profileData.designation = body.designation;

	const userData = {};
	if (body.role) userData.role = body.role;

	const [updatedProfile, updatedUser] = await Promise.all([
	  prisma.employeeProfile.update({ where: { userId: body.userId }, data: profileData }),
	  body.role ? prisma.user.update({ where: { id: body.userId }, data: userData }) : Promise.resolve(null),
	]);

	return res.json({ success: true, data: { profile: updatedProfile, user: updatedUser } });
  } catch (err) {
	return res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
