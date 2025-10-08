# 📦 Vercel Deployment Package

This directory contains everything you need to deploy your Harmonized Fitness application to Vercel.

## 📁 Deployment Files

### Configuration Files
- **`vercel.json`** - Vercel deployment configuration
  - Build commands
  - Environment variable references
  - Function settings
  - CORS headers

- **`.vercelignore`** - Files to exclude from deployment
  - Development files
  - Test files
  - Documentation
  - Build artifacts

### Documentation

- **`VERCEL_DEPLOYMENT.md`** - Complete deployment guide
  - Step-by-step instructions
  - Database setup
  - Environment configuration
  - Troubleshooting
  - Performance optimization

- **`VERCEL_ENV_VARS.md`** - Environment variables reference
  - Quick copy-paste format
  - How to generate secrets
  - CLI and dashboard instructions
  - Verification steps

- **`VERCEL_CHECKLIST.md`** - Deployment checklist
  - Pre-deployment tasks
  - Deployment steps
  - Post-deployment verification
  - Optional enhancements

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Ensure you have:
✅ Vercel account
✅ PostgreSQL database
✅ Git repository
✅ AbacusAI API key
```

### 2. Prepare Environment Variables
```bash
# Generate NextAuth secret
openssl rand -base64 32

# Collect these values:
- DATABASE_URL (from your database provider)
- NEXTAUTH_URL (your deployment URL)
- NEXTAUTH_SECRET (generated above)
- ABACUSAI_API_KEY (from AbacusAI)
```

### 3. Deploy

**Option A: Via Dashboard**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Set root directory to `app`
4. Add environment variables
5. Click Deploy

**Option B: Via CLI**
```bash
cd app
npm i -g vercel
vercel login
vercel
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add ABACUSAI_API_KEY production
vercel env add NODE_ENV production
vercel --prod
```

## 📚 Documentation Guide

### For First-Time Deployment
1. Start with **`VERCEL_CHECKLIST.md`** - Follow the checklist step by step
2. Reference **`VERCEL_ENV_VARS.md`** - When setting up environment variables
3. Consult **`VERCEL_DEPLOYMENT.md`** - For detailed instructions and troubleshooting

### For Quick Reference
- **Environment Variables**: `VERCEL_ENV_VARS.md`
- **Troubleshooting**: `VERCEL_DEPLOYMENT.md` (Troubleshooting section)
- **Configuration**: Check `vercel.json` and `next.config.js`

### For Advanced Setup
- **Custom Domain**: `VERCEL_DEPLOYMENT.md` (Step 5)
- **Performance**: `VERCEL_DEPLOYMENT.md` (Performance Optimization section)
- **Monitoring**: `VERCEL_DEPLOYMENT.md` (Monitoring and Logs section)

## 🔧 Configuration Details

### Build Process
```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install"
}
```

The build process:
1. Installs dependencies (`npm install`)
2. Generates Prisma Client (`prisma generate`)
3. Builds Next.js application (`next build`)
4. Deploys to Vercel's edge network

### Environment Variables
All environment variables are referenced in `vercel.json` using the `@` prefix:
- `@database_url` → `DATABASE_URL`
- `@nextauth_url` → `NEXTAUTH_URL`
- `@nextauth_secret` → `NEXTAUTH_SECRET`
- `@abacusai_api_key` → `ABACUSAI_API_KEY`

### Function Configuration
- **Max Duration**: 30 seconds (for API routes)
- **Runtime**: Node.js (default)
- **Region**: `iad1` (US East)

## 🗄️ Database Setup

### Recommended Providers
1. **Vercel Postgres** (Easiest integration)
2. **Supabase** (Free tier, great features)
3. **Neon** (Serverless PostgreSQL)
4. **Railway** (Simple setup)
5. **PlanetScale** (MySQL alternative)

### Setup Steps
```bash
# 1. Get your DATABASE_URL from provider
# 2. Run migrations
export DATABASE_URL="your-database-url"
npx prisma migrate deploy

# 3. Generate Prisma Client
npx prisma generate

# 4. Seed production data (optional)
ALLOW_PRODUCTION_SEED=true npx tsx scripts/seed-production.ts
```

## 🔐 Security Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] Environment variables set in Vercel (not in code)
- [ ] `NEXTAUTH_SECRET` is strong and random
- [ ] Database credentials are secure
- [ ] Default admin password changed after deployment
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] API routes have authentication checks

## 🐛 Common Issues

### Build Fails
**Problem**: Prisma Client not generated  
**Solution**: Build command includes `prisma generate` (already configured)

### Database Connection Error
**Problem**: Cannot connect to database  
**Solution**: Verify `DATABASE_URL` in Vercel environment variables

### Authentication Not Working
**Problem**: NextAuth session issues  
**Solution**: Ensure `NEXTAUTH_URL` matches deployed URL exactly

### API Timeout
**Problem**: Function execution timeout  
**Solution**: Optimized to 30s in `vercel.json` (max for Pro plan)

## 📊 Monitoring

### View Logs
```bash
# Real-time logs
vercel logs --follow

# Specific deployment
vercel logs [deployment-url]
```

### Vercel Dashboard
- Build logs: Check for build errors
- Function logs: Monitor API route execution
- Analytics: Track performance and usage

## 🎯 Next Steps After Deployment

1. **Verify Deployment**
   - Test all major features
   - Check authentication flow
   - Verify database connections

2. **Security**
   - Change default admin password
   - Review API route protection
   - Enable monitoring

3. **Optimization**
   - Set up caching strategies
   - Configure database connection pooling
   - Enable Vercel Analytics

4. **Custom Domain** (Optional)
   - Add domain in Vercel dashboard
   - Configure DNS
   - Update `NEXTAUTH_URL`

## 📞 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma Docs**: [prisma.io/docs](https://www.prisma.io/docs)
- **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

## 📝 Notes

- **Free Tier Limits**: 100 GB bandwidth, 100 hours function execution
- **Build Time**: Typically 2-5 minutes
- **Deployment**: Automatic on Git push to main branch
- **Preview Deployments**: Automatic for pull requests

---

**Ready to deploy?** Start with `VERCEL_CHECKLIST.md` and follow along! 🚀
