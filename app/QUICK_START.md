# Quick Start Guide - Harmonized Fitness

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

## Initial Setup

### 1. Install Dependencies
```bash
cd app
npm install --legacy-peer-deps
```

### 2. Environment Configuration
Copy the example environment file and configure your variables:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env
DATABASE_URL="postgresql://username:password@host:port/database"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
ABACUSAI_API_KEY="your-api-key"
```

### 3. Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── dashboard/         # Client dashboard
│   ├── login/             # Authentication pages
│   └── ...
├── components/            # React components
│   ├── ui/               # UI components
│   ├── admin/            # Admin components
│   ├── forms/            # Form components
│   └── ...
├── lib/                   # Utility functions
│   ├── auth.ts           # Authentication utilities
│   ├── db.ts             # Database connection
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema
└── public/               # Static assets
```

## User Roles

### Admin
- Full access to all features
- Client management
- Exercise library management
- Workout creation and assignment
- Analytics and reporting
- Availability management

### Client
- View assigned workouts
- Track personal records
- Book sessions
- View progress
- Manage profile

## Default Credentials

After seeding the database, you can use:

**Admin:**
- Email: admin@example.com
- Password: (check seed file)

**Client:**
- Email: client@example.com
- Password: (check seed file)

## Common Tasks

### Create a New Admin User
```typescript
// Use the signup API or create directly in database
// Make sure to set role: 'ADMIN'
```

### Reset Database
```bash
npx prisma migrate reset
```

### View Database
```bash
npx prisma studio
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Issues
```bash
# Regenerate Prisma Client
npx prisma generate
```

### TypeScript Errors
```bash
# Check for type errors
npx tsc --noEmit
```

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

## Security Notes

- Never commit `.env` file
- Use strong passwords in production
- Rotate `NEXTAUTH_SECRET` regularly
- Keep dependencies updated
- Use HTTPS in production

## Production Deployment

### Build
```bash
npm run build
```

### Environment Variables
Ensure all production environment variables are set:
- `DATABASE_URL` - Production database
- `NEXTAUTH_URL` - Production URL
- `NEXTAUTH_SECRET` - Strong secret key
- `ABACUSAI_API_KEY` - Production API key

### Database Migrations
```bash
npx prisma migrate deploy
```

## Support

For issues or questions, refer to:
- CODE_REVIEW_REPORT.md - Comprehensive code review
- AUDIT_REPORT.md - Security audit report
- PRODUCTION_DEPLOYMENT.md - Deployment guide

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Forms:** React Hook Form + Zod
- **Charts:** Chart.js

## License

[Your License Here]
