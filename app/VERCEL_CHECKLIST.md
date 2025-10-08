# ✅ Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment

### Database Setup
- [ ] PostgreSQL database created (Vercel Postgres, Supabase, Neon, etc.)
- [ ] Database connection string obtained
- [ ] Database migrations run: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Production data seeded (optional): `ALLOW_PRODUCTION_SEED=true npx tsx scripts/seed-production.ts`

### Environment Variables Prepared
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_URL` - Production domain URL
- [ ] `NEXTAUTH_SECRET` - Generated with `openssl rand -base64 32`
- [ ] `ABACUSAI_API_KEY` - AbacusAI API key
- [ ] `NODE_ENV` - Set to `production`

### Code Repository
- [ ] Code pushed to Git (GitHub, GitLab, or Bitbucket)
- [ ] All changes committed
- [ ] Working on `main` or `master` branch
- [ ] No sensitive data in repository (.env files excluded)

### Configuration Files
- [ ] `vercel.json` exists in app directory
- [ ] `.vercelignore` exists in app directory
- [ ] `next.config.js` optimized for Vercel
- [ ] `package.json` has build scripts configured

## Deployment

### Vercel Project Setup
- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Root directory set to `app` (if applicable)
- [ ] Build command: `prisma generate && next build` (auto-configured)

### Environment Variables in Vercel
- [ ] All 5 environment variables added in Vercel dashboard
- [ ] Variables added to Production environment
- [ ] Variables added to Preview environment (optional)
- [ ] Variables added to Development environment (optional)
- [ ] No typos in variable names or values

### Initial Deployment
- [ ] Clicked "Deploy" button
- [ ] Build completed successfully (check logs)
- [ ] No build errors
- [ ] Deployment shows "Ready" status

## Post-Deployment

### Verification
- [ ] Deployment URL accessible
- [ ] Homepage loads correctly
- [ ] No console errors in browser
- [ ] API routes responding
- [ ] Database connection working

### Authentication Testing
- [ ] Login page loads
- [ ] Can log in with admin credentials (`john@doe.com` / `johndoe123`)
- [ ] Session persists after login
- [ ] Logout works correctly
- [ ] Protected routes are secured

### Functionality Testing
- [ ] Dashboard loads
- [ ] User profile accessible
- [ ] Workout features work
- [ ] Exercise library loads
- [ ] Personal records display
- [ ] Admin features accessible (if admin)

### Security
- [ ] Default admin password changed
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Environment variables not exposed in client
- [ ] API routes protected with authentication
- [ ] Database credentials secure

## Optional Enhancements

### Custom Domain
- [ ] Custom domain added in Vercel
- [ ] DNS configured correctly
- [ ] SSL certificate issued
- [ ] `NEXTAUTH_URL` updated to custom domain
- [ ] Application redeployed

### Monitoring
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Performance monitoring set up
- [ ] Deployment notifications configured

### Optimization
- [ ] Database connection pooling configured
- [ ] API routes optimized
- [ ] Images optimized
- [ ] Caching strategies implemented

## Troubleshooting

If deployment fails, check:
- [ ] Build logs in Vercel dashboard
- [ ] All environment variables are set correctly
- [ ] Database is accessible from Vercel
- [ ] No TypeScript errors
- [ ] Prisma schema is valid
- [ ] Dependencies are installed correctly

## Continuous Deployment

- [ ] Automatic deployments enabled for `main` branch
- [ ] Preview deployments enabled for pull requests
- [ ] Team members have appropriate access
- [ ] Deployment notifications configured

---

## Quick Commands Reference

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed production database
ALLOW_PRODUCTION_SEED=true npx tsx scripts/seed-production.ts

# Generate NextAuth secret
openssl rand -base64 32

# Deploy via CLI
vercel --prod

# View logs
vercel logs --follow
```

---

## Support Resources

- 📖 [Full Deployment Guide](./VERCEL_DEPLOYMENT.md)
- 🔐 [Environment Variables Reference](./VERCEL_ENV_VARS.md)
- 🚀 [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- 🔒 [Security Guide](./SECURITY.md)

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Deployment Date**: _______________

**Deployed By**: _______________

**Production URL**: _______________
