const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function standardizedError(res, status = 401, message = 'Unauthorized') {
  return res.status(status).json({ success: false, message });
}

async function authenticateToken(req, res, next) {
  try {
	const auth = req.headers['authorization'];
	if (!auth) return standardizedError(res, 401, 'Token missing');
	const token = auth.split(' ')[1];
	if (!token) return standardizedError(res, 401, 'Token missing');
	const payload = jwt.verify(token, JWT_SECRET);
	const user = await prisma.user.findUnique({ where: { id: payload.sub } });
	if (!user) return standardizedError(res, 401, 'User not found');
	req.user = { id: user.id, role: user.role, email: user.email, employeeId: user.employeeId };
	next();
  } catch (err) {
	return standardizedError(res, 401, 'Invalid or expired token');
  }
}

function requireRole(role) {
  return (req, res, next) => {
	if (!req.user) return standardizedError(res, 401, 'Unauthorized');
	if (req.user.role !== role) return standardizedError(res, 403, 'Forbidden');
	next();
  };
}

module.exports = { authenticateToken, requireRole, standardizedError };
