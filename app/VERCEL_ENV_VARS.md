# Vercel Environment Variables Quick Reference

Copy and paste these into your Vercel project settings under "Environment Variables".

## Required Environment Variables

### 1. DATABASE_URL
**Description**: PostgreSQL database connection string  
**Example**: `postgresql://username:password@hostname:5432/database_name?schema=public`  
**Where to get it**: From your database provider (Vercel Postgres, Supabase, Neon, etc.)

```
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
```

---

### 2. NEXTAUTH_URL
**Description**: Your production domain URL  
**Example**: `https://your-app.vercel.app` or `https://yourdomain.com`  
**Important**: Must match your actual deployed URL exactly (including https://)

```
NEXTAUTH_URL=https://your-app.vercel.app
```

---

### 3. NEXTAUTH_SECRET
**Description**: Secret key for NextAuth session encryption  
**Generate with**: `openssl rand -base64 32`  
**Important**: Must be a strong, random string (minimum 32 characters)

```
NEXTAUTH_SECRET=your-generated-secret-here
```

**Generate a new secret:**
```bash
openssl rand -base64 32
```

---

### 4. ABACUSAI_API_KEY
**Description**: Your AbacusAI API key for AI features  
**Where to get it**: From your AbacusAI dashboard

```
ABACUSAI_API_KEY=your-abacusai-api-key-here
```

---

### 5. NODE_ENV
**Description**: Environment mode  
**Value**: `production`

```
NODE_ENV=production
```

---

## How to Add in Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. For each variable:
   - Click "Add New"
   - Enter the **Key** (e.g., `DATABASE_URL`)
   - Enter the **Value** (e.g., your actual database URL)
   - Select environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

## How to Add via Vercel CLI

```bash
# Navigate to your app directory
cd app

# Add each environment variable
vercel env add DATABASE_URL production
# Paste your database URL when prompted

vercel env add NEXTAUTH_URL production
# Paste your production URL when prompted

vercel env add NEXTAUTH_SECRET production
# Paste your generated secret when prompted

vercel env add ABACUSAI_API_KEY production
# Paste your API key when prompted

vercel env add NODE_ENV production
# Type: production
```

---

## Verification Checklist

After adding all environment variables:

- [ ] DATABASE_URL is set and valid
- [ ] NEXTAUTH_URL matches your deployed domain
- [ ] NEXTAUTH_SECRET is a strong random string (32+ characters)
- [ ] ABACUSAI_API_KEY is set
- [ ] NODE_ENV is set to "production"
- [ ] All variables are added to Production environment
- [ ] Redeploy your application after adding variables

---

## Testing Environment Variables

After deployment, you can verify environment variables are working:

1. Check deployment logs for any missing variable errors
2. Test authentication (requires NEXTAUTH_URL and NEXTAUTH_SECRET)
3. Test database connection (requires DATABASE_URL)
4. Test AI features (requires ABACUSAI_API_KEY)

---

## Security Notes

⚠️ **Never commit these values to Git**  
⚠️ **Never share your secrets publicly**  
⚠️ **Rotate secrets regularly**  
⚠️ **Use different values for development and production**

---

## Troubleshooting

### "Cannot connect to database"
- Verify DATABASE_URL is correct
- Check database allows connections from Vercel
- Ensure database is running

### "NextAuth session error"
- Verify NEXTAUTH_URL matches deployed URL exactly
- Ensure NEXTAUTH_SECRET is set and strong
- Check for typos in variable names

### "API key invalid"
- Verify ABACUSAI_API_KEY is correct
- Check API key hasn't expired
- Ensure no extra spaces in the value

---

**Need Help?** See the full deployment guide in `VERCEL_DEPLOYMENT.md`
