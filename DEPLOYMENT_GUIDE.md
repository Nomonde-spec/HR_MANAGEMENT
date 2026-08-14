# HR Management - Deployment Guide

## Quick Start

### 1. Initialize Git Repository
```bash
cd "c:\Users\4IR Research Lab\Desktop\HR management"

# Initialize git
git init

# Add files
git add .
git commit -m "Initial commit: HR Management System"

# Add remote (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/hr-management.git
git branch -M main
git push -u origin main
```

---

## Frontend Deployment (Vercel)

### Option 1: Deploy via Vercel CLI
```bash
cd frontend
npm install -g vercel
vercel --prod
```

### Option 2: Deploy via GitHub (Recommended)
1. Connect your GitHub repo to Vercel at https://vercel.com/new
2. Select `frontend` as root directory
3. Set environment variables:
   - `VITE_API_BASE=https://your-backend-url.com/api`

---

## Backend Deployment Options

### Option 1: Railway (Recommended - Free tier available)

1. **Sign up at railway.app**

2. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

3. **Deploy:**
   ```bash
   cd backend
   railway link
   railway up
   ```

4. **Set Environment Variables in Railway Dashboard:**
   - `DATABASE_URL` - Auto-generated PostgreSQL or SQLite file path
   - `JWT_SECRET` - Your secret key
   - `NODE_ENV=production`
   - `FRONTEND_URL` - Your Vercel frontend URL

5. **Run Migrations:**
   ```bash
   railway run npx prisma migrate deploy
   ```

---

### Option 2: Render (Free tier available)

1. **Sign up at render.com**

2. **Create New Web Service:**
   - Connect your GitHub repo
   - Select `backend` directory as root
   - Build Command: `npm install && npx prisma migrate deploy && npx prisma generate`
   - Start Command: `node index.js`

3. **Set Environment Variables:**
   ```
   DATABASE_URL=file:./dev.db
   JWT_SECRET=your_secret_key
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

---

### Option 3: Heroku (Paid tier required)

1. **Install Heroku CLI** and login

2. **Create app:**
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set DATABASE_URL=file:./dev.db
   heroku config:set JWT_SECRET=your_secret_key
   heroku config:set NODE_ENV=production
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

---

### Option 4: AWS or Google Cloud (More complex)

For AWS EC2 / Google Cloud, follow standard Node.js deployment procedures:
1. Set up server with Node.js and PostgreSQL
2. Clone repository
3. Install dependencies
4. Run migrations
5. Set up PM2 or systemd for process management
6. Configure nginx as reverse proxy

---

## Environment Setup Checklist

### Before Deploying, Ensure:
- [ ] `.env` file is in `.gitignore` (never commit secrets)
- [ ] `node_modules/` is in `.gitignore`
- [ ] `dev.db` is in `.gitignore`
- [ ] Database migrations have been run: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] All dependencies installed: `npm install`
- [ ] Backend builds successfully: `npm run build` (if applicable)
- [ ] Frontend builds successfully: `cd frontend && npm run build`

---

## Database Setup for Production

### For SQLite (Simple, file-based):
```bash
# Already set up - just ensure migrations are applied
npx prisma migrate deploy
```

### For PostgreSQL (Recommended for production):
1. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   ```

2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

## Troubleshooting Deployment Errors

### Error: "Cannot read properties of undefined"
**Solution:** Ensure Prisma migrations are applied:
```bash
npx prisma migrate deploy
npx prisma generate
```

### Error: "CORS blocked request"
**Solution:** Update `FRONTEND_URL` in backend `.env` to match your Vercel domain

### Error: "Database connection failed"
**Solution:** Check `DATABASE_URL` is correctly set in deployment platform's environment variables

### Error: "Cannot find module '@prisma/client'"
**Solution:** Ensure `npm install` is run during build process

---

## Testing Deployment

Once deployed, test these endpoints:

1. **Health Check:**
   ```
   GET https://your-backend.com/api/health
   ```

2. **Employee Login:**
   ```
   POST https://your-backend.com/api/auth/login
   Body: { "email": "test@example.com", "password": "password123" }
   ```

3. **View Jobs:**
   ```
   GET https://your-backend.com/api/applicant/jobs
   ```

---

## Post-Deployment

1. Monitor application logs
2. Set up error tracking (Sentry, LogRocket, etc.)
3. Configure backups for database
4. Set up uptime monitoring
5. Enable auto-scaling if needed

---

## Contact & Support

For issues, check:
- Deployment platform documentation
- Prisma documentation: https://www.prisma.io/docs
- Node.js best practices: https://nodejs.org/en/docs/guides/
