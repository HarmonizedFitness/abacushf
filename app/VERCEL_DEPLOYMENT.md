# 🚀 Vercel Deployment Guide - Harmonized Fitness

This guide will walk you through deploying your Harmonized Fitness application to Vercel.

## 📋 Prerequisites

Before deploying to Vercel, ensure you have:

1. ✅ A [Vercel account](https://vercel.com/signup) (free tier works)
2. ✅ A PostgreSQL database (recommended providers):
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - [Supabase](https://supabase.com/) (free tier available)
   - [Neon](https://neon.tech/) (free tier available)
   - [Railway](https://railway.app/)
   - [PlanetScale](https://planetscale.com/)
3. ✅ Your AbacusAI API key
4. ✅ Git repository (GitHub, GitLab, or Bitbucket)

## 🗄️ Step 1: Set Up Your Database

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Follow the setup wizard
4. Copy the `DATABASE_URL` connection string

### Option B: External Database Provider

1. Create a PostgreSQL database with your chosen provider
2. Copy the connection string (format: `postgresql://username:password@host:port/database`)
3. Ensure the database allows connections from Vercel's IP ranges

### Initialize Your Database

Once you have your database URL, you'll need to run migrations:

```bash
# Set your DATABASE_URL temporarily
export DATABASE_URL="your-database-url-here"

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed production data (optional - creates admin accounts)
ALLOW_PRODUCTION_SEED=true npx tsx scripts/seed-production.ts
```

## 🔐 Step 2: Prepare Environment Variables

You'll need to set these environment variables in Vercel:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | Your production domain | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Secret for NextAuth sessions | Generate with: `openssl rand -base64 32` |
| `ABACUSAI_API_KEY` | Your AbacusAI API key | `your-api-key-here` |
| `NODE_ENV` | Environment mode | `production` |

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

## 🚀 Step 3: Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your Git repository
   - Select the repository containing your app

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `app` (if your Next.js app is in the app folder)
   - **Build Command**: `prisma generate && next build` (auto-configured via vercel.json)
   - **Output Directory**: `.next` (default)

4. **Add Environment Variables**
   - In the project settings, go to "Environment Variables"
   - Add all required variables from Step 2
   - Make sure to add them for "Production", "Preview", and "Development" environments

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 2-5 minutes)

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to your app directory**
   ```bash
   cd app
   ```

4. **Deploy**
   ```bash
   # First deployment (will prompt for configuration)
   vercel
   
   # Follow the prompts:
   # - Set up and deploy? Yes
   # - Which scope? Select your account
   # - Link to existing project? No
   # - What's your project's name? harmonized-fitness
   # - In which directory is your code located? ./
   ```

5. **Add Environment Variables**
   ```bash
   vercel env add DATABASE_URL production
   vercel env add NEXTAUTH_URL production
   vercel env add NEXTAUTH_SECRET production
   vercel env add ABACUSAI_API_KEY production
   vercel env add NODE_ENV production
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## ✅ Step 4: Post-Deployment Verification

### 1. Check Deployment Status

- Visit your Vercel dashboard
- Ensure the deployment shows "Ready"
- Check the deployment logs for any errors

### 2. Test Your Application

Visit your deployed URL and verify:

- ✅ Homepage loads correctly
- ✅ Login functionality works
- ✅ API endpoints respond
- ✅ Database connections are working
- ✅ Authentication flow is functional

### 3. Test Admin Login

Use the default admin credentials:
- **Email**: `john@doe.com`
- **Password**: `johndoe123`

⚠️ **Important**: Change the default admin password immediately after first login!

## 🔧 Step 5: Configure Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Follow Vercel's instructions to configure DNS
5. Update `NEXTAUTH_URL` environment variable to your custom domain
6. Redeploy the application

## 🔄 Continuous Deployment

Vercel automatically deploys your app when you push to your Git repository:

- **Production**: Pushes to `main` branch → Production deployment
- **Preview**: Pushes to other branches → Preview deployment
- **Pull Requests**: Automatic preview deployments for PRs

## 🐛 Troubleshooting

### Build Fails with Prisma Error

**Problem**: `Error: @prisma/client did not initialize yet`

**Solution**: Ensure `prisma generate` runs before build:
```bash
# This is already configured in vercel.json
"buildCommand": "prisma generate && next build"
```

### Database Connection Issues

**Problem**: Cannot connect to database

**Solutions**:
1. Verify `DATABASE_URL` is correctly set in Vercel environment variables
2. Ensure your database allows connections from Vercel's IP ranges
3. Check if database is running and accessible
4. Verify connection string format is correct

### NextAuth Session Issues

**Problem**: Authentication not working

**Solutions**:
1. Verify `NEXTAUTH_URL` matches your deployed domain exactly
2. Ensure `NEXTAUTH_SECRET` is set and is a strong random string
3. Check that cookies are not blocked
4. Verify database has NextAuth tables (run migrations)

### API Routes Timeout

**Problem**: API routes return 504 timeout

**Solutions**:
1. Check function execution time (default: 10s on free tier, 30s configured)
2. Optimize database queries
3. Consider upgrading Vercel plan for longer execution times
4. Add database connection pooling

### Environment Variables Not Working

**Problem**: App can't read environment variables

**Solutions**:
1. Ensure variables are added to the correct environment (Production/Preview/Development)
2. Redeploy after adding new environment variables
3. Check variable names match exactly (case-sensitive)
4. Verify no typos in variable values

## 📊 Monitoring and Logs

### View Deployment Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click on a deployment
4. View "Build Logs" and "Function Logs"

### Real-time Logs

```bash
# Install Vercel CLI
npm i -g vercel

# View logs in real-time
vercel logs --follow
```

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` files** - Use Vercel environment variables
2. ✅ **Use strong secrets** - Generate with `openssl rand -base64 32`
3. ✅ **Enable HTTPS only** - Vercel provides this by default
4. ✅ **Rotate secrets regularly** - Update `NEXTAUTH_SECRET` periodically
5. ✅ **Limit database access** - Use connection pooling and read replicas
6. ✅ **Monitor logs** - Check for suspicious activity
7. ✅ **Change default passwords** - Update admin credentials immediately

## 🎯 Performance Optimization

### Enable Caching

Vercel automatically caches static assets. For API routes:

```typescript
// In your API routes
export const config = {
  runtime: 'edge', // Use Edge Runtime for faster responses
};
```

### Database Connection Pooling

For better performance with Prisma on serverless:

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Image Optimization

Images are already configured in `next.config.js`:
```javascript
images: { unoptimized: true }
```

Consider using Vercel's Image Optimization for better performance (requires Pro plan).

## 📈 Scaling Considerations

### Free Tier Limits
- 100 GB bandwidth per month
- 100 hours of serverless function execution
- 6,000 minutes of build time

### When to Upgrade
- High traffic (>100k requests/month)
- Need longer function execution times
- Require team collaboration features
- Need advanced analytics

## 🆘 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth Documentation](https://next-auth.js.org/)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

## 🎉 Success!

Your Harmonized Fitness application should now be live on Vercel! 

**Next Steps:**
1. Share your deployment URL with your team
2. Set up custom domain (optional)
3. Configure monitoring and alerts
4. Plan for regular updates and maintenance

---

**Deployment URL Format**: `https://your-project-name.vercel.app`

**Need Help?** Check the troubleshooting section or reach out to Vercel support.
