# 🚀 Quick Deployment Reference

## Your 500 Error - FIXED ✅

The 500 error was due to Prisma not loading environment variables properly. This has been fixed:

- ✅ `dotenv` now loads BEFORE Prisma initialization
- ✅ Better error logging for debugging
- ✅ Non-blocking database connection
- ✅ Graceful error handling

---

## 3-Step Deployment Process

### Step 1: Prepare GitHub
```bash
cd "c:\Users\4IR Research Lab\Desktop\HR management"

# Initialize git (if not already done)
git init
git add .
git commit -m "Production ready: HR Management System"
git remote add origin https://github.com/YOUR_USERNAME/hr-management.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Frontend (Vercel) - 5 minutes
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repo
4. Configure:
   - **Root Directory:** `frontend`
   - **Environment Variable:** 
     - Key: `VITE_API_BASE`
     - Value: `https://your-backend-url.com/api` (add after backend is deployed)
5. Click "Deploy"
6. Done! ✅ Frontend now live at `your-app.vercel.app`

### Step 3: Deploy Backend (Railway) - 5 minutes

**Option A: Railway CLI (Easiest)**
```bash
# Install Railway
npm install -g @railway/cli

# Login
railway login

# Navigate to backend
cd backend

# Link and deploy
railway link
railway up
```

**Option B: Railway Dashboard**
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose your repo
5. Set environment variables:
   ```
   DATABASE_URL=file:./dev.db
   JWT_SECRET=use-a-random-secret-key
   NODE_ENV=production
   FRONTEND_URL=https://your-app.vercel.app
   ```
6. Deploy automatically! ✅

---

## Environment Variables Reference

### Backend (.env)
```
# Database
DATABASE_URL=file:./dev.db

# Security
JWT_SECRET=GenerateRandomKeyWith32Characters!

# Server
PORT=4000
NODE_ENV=production

# CORS
FRONTEND_URL=https://your-vercel-frontend.vercel.app
```

### Frontend (.env.local)
```
VITE_API_BASE=https://your-railway-backend.railway.app/api
```

---

## Test Your Deployment

After deploying, test these URLs:

1. **Frontend:**
   - https://your-app.vercel.app ✅

2. **Backend Health:**
   - https://your-api.railway.app/api/health ✅

3. **Employee Login:**
   - POST https://your-api.railway.app/api/auth/login
   - Body: `{"email": "test@example.com", "password": "password123"}`

4. **View Jobs:**
   - GET https://your-api.railway.app/api/applicant/jobs

---

## Common Deployment URLs

| Service | URL Pattern |
|---------|-----------|
| Vercel Frontend | `https://your-app.vercel.app` |
| Railway Backend | `https://your-project.railway.app` |
| Render Backend | `https://your-app.onrender.com` |

---

## If You Get Errors

### 500 Error on Backend
✅ Already fixed! Run this to verify:
```bash
cd backend
node -e "require('./prismaClient'); console.log('✓ OK')"
```

### CORS Error
Update `FRONTEND_URL` in backend environment to your actual frontend URL

### Database Error
Ensure `DATABASE_URL` is set in environment variables

### Build Failures
Check deployment logs for specific errors - they now have detailed error messages

---

## Cost Estimate

| Service | Free Tier | Cost |
|---------|-----------|------|
| **Vercel** (Frontend) | ✅ Yes | Free |
| **Railway** (Backend) | ✅ Yes ($5/month credit) | $5/month or free tier |
| **Render** (Backend) | ✅ Yes | Free (sleeps after 15min idle) |

**Total:** Free! (with Railway $5/month for always-on backend)

---

## Files You Need for Deployment

### Pre-configured Files ✅
- `backend/vercel.json` - Vercel deployment config
- `backend/render.yaml` - Render deployment config  
- `backend/.env.example` - Backend env template
- `frontend/.env.example` - Frontend env template
- `backend/start.sh` - Production startup script
- `.gitignore` - Proper git ignore patterns

### Actions You Need to Take
1. Replace `YOUR_USERNAME` in git remote with actual username
2. Copy `.env.example` files and update with real values
3. Never commit `.env` files to GitHub
4. Update `VITE_API_BASE` on frontend after backend URL is known

---

## Deployment Checklist

```
Preparation:
☐ All code committed to GitHub
☐ `.env` files are in `.gitignore`
☐ Frontend builds: `npm run build` in frontend/
☐ Backend starts: `npm run dev` in backend/

Vercel (Frontend):
☐ GitHub repo connected
☐ Frontend directory set to `/frontend`
☐ Project deployed
☐ Note frontend URL

Railway (Backend):
☐ GitHub repo connected
☐ Backend directory set to `/backend`
☐ Environment variables configured
☐ Database migrations auto-applied
☐ Note backend URL

Post-Deployment:
☐ Test `/api/health` endpoint
☐ Update VITE_API_BASE with backend URL
☐ Redeploy frontend with correct API URL
☐ Test login flow end-to-end
☐ Verify jobs load correctly
```

---

## Next Actions

1. **NOW:**
   ```bash
   git push origin main
   ```

2. **Vercel (5 min):**
   - Connect GitHub repo
   - Deploy frontend

3. **Railway (5 min):**
   - Deploy backend
   - Get backend URL

4. **Update Frontend:**
   - Set `VITE_API_BASE` to Railway URL
   - Redeploy on Vercel

5. **Test:**
   - Open your frontend URL
   - Test signup, login, job browsing

---

## Support Links

- **Railway Docs:** https://docs.railway.app
- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Prisma Docs:** https://prisma.io/docs

---

## FAQ

**Q: Can I use SQLite in production?**
A: Works for small apps, but use PostgreSQL for production scalability

**Q: Do I need to run migrations manually?**
A: Railway/Render auto-apply migrations if configured in build command

**Q: How do I update the app after deployment?**
A: Just push to GitHub - deployment services auto-redeploy

**Q: Can I rollback a deployment?**
A: Yes - Railway and Vercel support rollbacks in dashboard

---

**You're ready to deploy! 🎉**

Questions? Check `DEPLOYMENT_GUIDE.md` for detailed information.
