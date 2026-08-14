const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../prismaClient');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const ACCESS_EXPIRES = '7d';

const applicantLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', async (req, res) => {
  try {
    const body = applicantLoginSchema.parse(req.body);
    
    // Check if prisma.jobApplicant exists
    if (!prisma.jobApplicant) {
      console.error('ERROR: prisma.jobApplicant is undefined. Available models:', Object.keys(prisma).filter(k => typeof prisma[k] === 'object'));
      return res.status(500).json({ success: false, message: 'Database configuration error. Please restart the server.' });
    }
    
    const applicant = await prisma.jobApplicant.findUnique({ where: { email: body.email } });
    if (!applicant) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const match = await bcrypt.compare(body.password, applicant.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ sub: applicant.id, email: applicant.email }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });

    return res.json({ success: true, data: { token, applicant: { id: applicant.id, firstName: applicant.firstName, lastName: applicant.lastName, email: applicant.email, phone: applicant.phone, role: 'APPLICANT' } } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
});

const applicantRegisterSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  password: z.string().min(6),
});

router.post('/register', async (req, res) => {
  try {
    const body = applicantRegisterSchema.parse(req.body);

    const existing = await prisma.jobApplicant.findUnique({ where: { email: body.email } });
    if (existing) return res.status(409).json({ success: false, message: 'Account already exists' });

    const hashed = await bcrypt.hash(body.password, 10);

    const applicant = await prisma.jobApplicant.create({
      data: {
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone || null,
        password: hashed,
      },
    });

    return res.json({ success: true, data: { id: applicant.id, email: applicant.email, firstName: applicant.firstName, lastName: applicant.lastName } });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/jobs', async (req, res) => {
  try {
    const now = new Date();
    const jobs = await prisma.job.findMany({
      where: {
        closingDate: {
          gte: now,
        },
      },
      orderBy: {
        datePosted: 'desc',
      },
    });
    return res.json({ success: true, data: jobs });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
