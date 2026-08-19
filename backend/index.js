require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const hrRoutes = require('./routes/hr.routes');
const applicantRoutes = require('./routes/applicant.routes');
const prisma = require('./prismaClient');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/applicant', applicantRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HR Management API is running',
    healthCheck: '/api/health'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('\n=== ERROR ===');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('===============\n');
  
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server listening on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});
