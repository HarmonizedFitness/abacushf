# 🏠 Running Locally - Quick Start Guide

This guide will help you run the Harmonized Fitness application on your local machine.

## ✅ Prerequisites

Before running locally, ensure you have:
- ✅ Node.js 18.x or higher installed
- ✅ npm or yarn package manager
- ✅ PostgreSQL database (local or remote)
- ✅ `.env` file configured

## 🚀 Quick Start (5 Steps)

### Step 1: Install Dependencies

```bash
cd app
npm install
```

This will install all required packages and automatically generate the Prisma client (via the `postinstall` script).

### Step 2: Verify Environment Variables

Check that your `.env` file exists and contains:

```bash
cat .env
```

Required variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_URL` - Set to `http://localhost:3000`
- `NEXTAUTH_SECRET` - Any secure random string
- `ABACUSAI_API_KEY` - Your AbacusAI API key

### Step 3: Set Up Database

```bash
# Generate Prisma Client (if not already done)
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed the database with initial data
npm run prisma db seed
```

### Step 4: Start Development Server

```bash
npm run dev
```

The app will start at: **http://localhost:3000**

### Step 5: Open in Browser

Open your browser and navigate to:
```
http://localhost:3000
```

## 🎯 Default Login Credentials

After seeding the database, you can log in with:

**Admin Account:**
- Email: `john@doe.com`
- Password: `johndoe123`

## 📝 Available Scripts

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm run start

# Run linting
npm run lint

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio
```

## 🗄️ Database Management

### View Database with Prisma Studio

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit your database.

### Reset Database (Development Only)

```bash
# WARNING: This will delete all data!
npx prisma migrate reset
```

### Create New Migration

```bash
npx prisma migrate dev --name your_migration_name
```

## 🔧 Troubleshooting

### Port 3000 Already in Use

If port 3000 is already in use:

```bash
# Option 1: Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Option 2: Use a different port
PORT=3001 npm run dev
```

### Database Connection Error

**Error:** `Can't reach database server`

**Solutions:**
1. Verify your `DATABASE_URL` in `.env` is correct
2. Ensure PostgreSQL is running
3. Check database credentials
4. Test connection:
   ```bash
   npx prisma db pull
   ```

### Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```bash
npx prisma generate
```

### Missing Dependencies

**Error:** Module not found errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

**Error:** TypeScript compilation errors

**Solution:**
```bash
# Check for errors
npm run lint

# If needed, delete build cache
rm -rf .next
npm run dev
```

## 🌐 Environment Configuration

### Local Development (.env)

```env
DATABASE_URL="postgresql://username:password@localhost:5432/harmonized_fitness"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-local-secret-key"
ABACUSAI_API_KEY="your-api-key"
NODE_ENV="development"
```

### Using Local PostgreSQL

If you want to use a local PostgreSQL database:

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb harmonized_fitness

# Update .env
DATABASE_URL="postgresql://your_username@localhost:5432/harmonized_fitness"
```

### Using Docker PostgreSQL

```bash
# Start PostgreSQL in Docker
docker run --name postgres-local \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=harmonized_fitness \
  -p 5432:5432 \
  -d postgres:15

# Update .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/harmonized_fitness"
```

## 🔥 Hot Reload

The development server supports hot reload:
- Changes to React components reload instantly
- Changes to API routes restart the server
- Changes to Prisma schema require running `npx prisma generate`

## 📊 Development Tools

### Prisma Studio
```bash
npx prisma studio
```
Visual database editor at `http://localhost:5555`

### Next.js Dev Tools
- Built-in error overlay
- Fast refresh for React components
- API route debugging

### Browser DevTools
- React DevTools extension recommended
- Network tab for API debugging
- Console for error messages

## 🧪 Testing the Application

### Test Authentication
1. Go to `http://localhost:3000`
2. Click "Login" or navigate to `/login`
3. Use credentials: `john@doe.com` / `johndoe123`
4. Verify you can access the dashboard

### Test API Routes
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test with authentication (after logging in)
curl http://localhost:3000/api/user/profile \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Check Database Connection
```bash
# Pull current schema
npx prisma db pull

# Check migrations status
npx prisma migrate status
```

## 🎨 Development Workflow

### Typical Development Flow

1. **Start the dev server**
   ```bash
   npm run dev
   ```

2. **Make changes to code**
   - Edit files in `app/`, `components/`, `lib/`, etc.
   - Changes auto-reload in browser

3. **Update database schema** (if needed)
   ```bash
   # Edit prisma/schema.prisma
   npx prisma migrate dev --name your_change
   npx prisma generate
   ```

4. **Test changes**
   - Check browser at `http://localhost:3000`
   - Use Prisma Studio for database inspection
   - Check console for errors

5. **Commit changes**
   ```bash
   git add .
   git commit -m "Your changes"
   ```

## 🔒 Security Notes for Local Development

- ✅ `.env` file is in `.gitignore` (never commit it)
- ✅ Use different secrets for local vs production
- ✅ Local database can use simpler credentials
- ✅ HTTPS not required for localhost

## 📱 Accessing from Other Devices

To access the app from other devices on your network:

```bash
# Find your local IP
ipconfig getifaddr en0  # macOS
# or
hostname -I  # Linux

# Start server with host binding
npm run dev -- -H 0.0.0.0

# Update NEXTAUTH_URL in .env
NEXTAUTH_URL="http://YOUR_LOCAL_IP:3000"
```

Then access from other devices: `http://YOUR_LOCAL_IP:3000`

## 🚀 Performance Tips

### Faster Builds
```bash
# Use SWC compiler (already configured)
# Disable TypeScript checking during dev (if needed)
# Edit next.config.js: typescript: { ignoreBuildErrors: true }
```

### Faster Database Queries
```bash
# Use connection pooling
# Add to DATABASE_URL: ?connection_limit=5
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [React Documentation](https://react.dev/)

## 🆘 Still Having Issues?

1. **Check the logs** - Look at terminal output for errors
2. **Clear cache** - Delete `.next` folder and restart
3. **Reinstall dependencies** - Delete `node_modules` and run `npm install`
4. **Check database** - Use Prisma Studio to inspect data
5. **Verify environment** - Ensure all `.env` variables are set

## ✅ Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Database seeded (optional)
- [ ] Dev server running (`npm run dev`)
- [ ] App accessible at `http://localhost:3000`
- [ ] Can log in with test credentials
- [ ] No errors in terminal or browser console

---

**Ready to develop!** 🎉

Your local development environment is now set up and running.

**Next Steps:**
- Explore the codebase
- Make changes and see them live
- Use Prisma Studio to manage data
- Test features before deploying

---

*Happy coding!* 💻
