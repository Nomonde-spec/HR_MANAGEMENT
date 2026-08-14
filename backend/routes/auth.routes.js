const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../prismaClient');
const { authenticateToken, requireRole, standardizedError } = require('../middleware/auth');
const { generateEmployeeId } = require('../utils/idGenerator');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', async (req, res) => {
  try {
	const body = loginSchema.parse(req.body);
	const user = await prisma.user.findUnique({ where: { email: body.email } });
	if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
	const match = await bcrypt.compare(body.password, user.password);
	if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

	const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
	const refreshToken = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });

	await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

	return res.json({ success: true, data: { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role, employeeId: user.employeeId, isFirstLogin: user.isFirstLogin } } });
  } catch (err) {
	return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
	const { refreshToken } = req.body;
	if (!refreshToken) return standardizedError(res, 401, 'Refresh token missing');
	const payload = jwt.verify(refreshToken, JWT_SECRET);
	const user = await prisma.user.findUnique({ where: { id: payload.sub } });
	if (!user || user.refreshToken !== refreshToken) return standardizedError(res, 401, 'Invalid refresh token');
	const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
	return res.json({ success: true, data: { accessToken } });
  } catch (err) {
	return standardizedError(res, 401, 'Invalid refresh token');
  }
});

const signupSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6),
  department: z.string().optional(),
  designation: z.string().optional(),
  role: z.enum(['EMPLOYEE', 'HR', 'APPLICANT']).default('EMPLOYEE'),
});

router.post('/signup', async (req, res) => {
  try {
    const body = signupSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return res.status(409).json({ success: false, message: 'Account already exists' });

    const count = await prisma.user.count();
    const employeeId = generateEmployeeId(count + 1);
    const hashed = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashed,
        role: body.role,
        employeeId: body.role === 'HR' ? null : employeeId,
        isFirstLogin: true,
      },
    });

    if (body.role !== 'APPLICANT') {
      await prisma.employeeProfile.create({
        data: {
          userId: user.id,
          firstName: body.firstName,
          lastName: body.lastName,
          department: body.department || null,
          designation: body.designation || null,
          leaveBalance: '{}',
        },
      });
    }

    return res.json({ success: true, data: { id: user.id, employeeId: body.role === 'HR' ? null : employeeId, email: user.email, role: user.role } });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

const registerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  temporaryPassword: z.string().min(6),
  department: z.string().optional(),
  designation: z.string().optional(),
});

// Only HR can create new employee accounts
router.post('/register', authenticateToken, requireRole('HR'), async (req, res) => {
  try {
	const body = registerSchema.parse(req.body);

	// generate employeeId - simple strategy: count existing users + 1
	const count = await prisma.user.count();
	const employeeId = generateEmployeeId(count + 1);

	const hashed = await bcrypt.hash(body.temporaryPassword, 10);
	const user = await prisma.user.create({
	  data: {
		email: body.email,
		password: hashed,
		role: 'EMPLOYEE',
		employeeId,
	  },
	});

	await prisma.employeeProfile.create({
	  data: {
		userId: user.id,
		firstName: body.firstName,
		lastName: body.lastName,
		department: body.department || null,
		designation: body.designation || null,
		leaveBalance: '{}',
	  },
	});

	return res.json({ success: true, data: { id: user.id, employeeId } });
  } catch (err) {
	return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
	try {
	const { email } = req.body;
	if (!email) return res.status(400).json({ success: false, message: 'Email required' });
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) return res.json({ success: true, message: 'If account exists, password reset instructions sent' });

	// create token
	const token = require('crypto').randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
	await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });

	// send email with nodemailer
	const nodemailer = require('nodemailer');
	const transporter = nodemailer.createTransport({
	  host: process.env.SMTP_HOST,
	  port: process.env.SMTP_PORT || 587,
	  secure: false,
	  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
	});
	const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
	await transporter.sendMail({
	  from: process.env.SMTP_FROM || 'noreply@optimahr.local',
	  to: user.email,
	  subject: 'OptimaHR Password Reset',
	  text: `Reset your password: ${resetUrl}`,
	  html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`
	});

	return res.json({ success: true, message: 'If account exists, password reset instructions sent' });
  } catch (err) {
	return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
	const { token, newPassword } = req.body;
	if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and newPassword required' });
	const entry = await prisma.passwordReset.findUnique({ where: { token } });
	if (!entry || new Date(entry.expiresAt) < new Date()) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
	const hashed = await bcrypt.hash(newPassword, 10);
	await prisma.user.update({ where: { id: entry.userId }, data: { password: hashed, isFirstLogin: false } });
	await prisma.passwordReset.deleteMany({ where: { userId: entry.userId } });
	return res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
	return res.status(500).json({ success: false, message: err.message });
  }
});

// Change temporary password on first login
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
	const { newPassword } = req.body;
	if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password too short' });
	const hashed = await bcrypt.hash(newPassword, 10);
	await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed, isFirstLogin: false } });
	return res.json({ success: true, message: 'Password changed' });
  } catch (err) {
	return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
