# 🚀 Quick Start Guide - Break Break

This guide will help you get the Break Break application up and running in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20.x or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **pnpm** (v10.x or higher) - Will be installed automatically if missing

## Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
./setup.sh
```

This will:
1. ✓ Check prerequisites
2. ✓ Install all dependencies
3. ✓ Set up environment files
4. ✓ Guide you through database setup
5. ✓ Generate Prisma client
6. ✓ Run database migrations
7. ✓ Build the applications

## Option 2: Manual Setup

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Set Up Database

Create the PostgreSQL database:

```bash
# Create database
createdb breakapp_db

# Enable required extensions
psql breakapp_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql breakapp_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

### Step 3: Configure Environment Variables

**Backend:**
```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` and update the `DATABASE_URL` if needed:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/breakapp_db"
JWT_SECRET="your-super-secret-key-change-in-production"
```

**Frontend:**
```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

The default frontend configuration should work:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Step 4: Generate Prisma Client and Run Migrations

```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev --name init
cd ../..
```

### Step 5: Build Applications

```bash
pnpm build
```

## Running the Application

### Development Mode (Both Apps)

```bash
pnpm dev
```

This starts:
- **Backend** on http://localhost:3000
- **Frontend** on http://localhost:3001

### Individual Services

**Backend only:**
```bash
cd apps/backend
pnpm dev
```

**Frontend only:**
```bash
cd apps/frontend
pnpm dev
```

## Testing the Setup

Run the automated test suite:

```bash
./test-sprint1.sh
```

This verifies:
- ✓ All files and directories are in place
- ✓ Dependencies are installed
- ✓ Applications build successfully
- ✓ Configuration files exist

## Using the Application

### As a Director

1. **Create a Project:**
   - You need to create a project first using the API or database
   - For testing, you can insert a test project:
   
   ```bash
   cd apps/backend
   npx prisma studio
   ```
   
   Then create a project manually in Prisma Studio.

2. **Generate QR Code:**
   - Use the API: `POST /api/projects/:id/generate-qr`
   - Or access via frontend (future feature)

### As a Crew Member

1. **Open Frontend:**
   - Navigate to http://localhost:3001/login/qr

2. **Scan QR Code:**
   - Click "Start Scanning"
   - Allow camera permissions
   - Point camera at the QR code

3. **Access Dashboard:**
   - After successful scan, you'll be redirected to the dashboard
   - Your JWT token is stored locally

## API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

**Quick Test:**
```bash
# Health check
curl http://localhost:3000/api

# Verify token
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "your-jwt-token"}'
```

## Database Management

### Prisma Studio (GUI)

Open a visual database editor:

```bash
cd apps/backend
npx prisma studio
```

Access at: http://localhost:5555

### Create a Test Project

Using Prisma Studio or psql:

```sql
INSERT INTO projects (id, name, access_token_secret, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Test Film Project',
  encode(gen_random_bytes(32), 'hex'),
  NOW(),
  NOW()
);
```

### Create a Test Director User

```sql
INSERT INTO users (id, project_id, role, user_hash, created_at)
VALUES (
  gen_random_uuid(),
  'YOUR_PROJECT_ID',
  'DIRECTOR',
  'test-director-hash',
  NOW()
);
```

## Troubleshooting

### Database Connection Issues

**Error:** "Connection refused"
- Ensure PostgreSQL is running: `pg_ctl status`
- Check database exists: `psql -l | grep breakapp_db`
- Verify credentials in `.env`

### Port Already in Use

**Error:** "Port 3000 is already in use"
- Change backend port in `apps/backend/.env`: `PORT=3001`
- Change frontend port: `pnpm dev -p 3002` (in frontend directory)

### Prisma Client Not Generated

**Error:** "Cannot find module '@prisma/client'"
- Run: `cd apps/backend && npx prisma generate`

### Camera Not Working in Frontend

- Ensure you're using HTTPS or localhost
- Check browser camera permissions
- Try a different browser (Chrome recommended)

### Build Failures

**TypeScript errors:**
- Run: `pnpm install` to ensure all dependencies are installed
- Check Node.js version: `node --version` (should be 20.x+)

## Directory Structure

```
breakbreak/
├── apps/
│   ├── backend/           # NestJS API server
│   │   ├── src/
│   │   │   ├── modules/   # Feature modules
│   │   │   ├── common/    # Shared code
│   │   │   └── database/  # Prisma service
│   │   └── prisma/        # Database schema
│   └── frontend/          # Next.js web app
│       ├── app/           # Pages and routes
│       ├── components/    # React components
│       └── lib/           # Utilities
├── setup.sh              # Automated setup
├── test-sprint1.sh       # Test suite
└── PROJECT_README.md     # Main documentation
```

## Next Steps

1. **Create your first project** using Prisma Studio or API
2. **Generate a QR code** for the project
3. **Test QR scanning** with the frontend
4. **Explore the API** using the documentation
5. **Add team members** by having them scan the QR code

## Development Scripts

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Run tests
pnpm test

# Clean build artifacts
pnpm clean
```

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/breakapp_db` |
| JWT_SECRET | Secret key for JWT signing | Required, no default |
| JWT_EXPIRATION | JWT token expiration time | `24h` |
| PORT | Backend server port | `3000` |
| NODE_ENV | Environment mode | `development` |
| FRONTEND_URL | Frontend URL for CORS | `http://localhost:3001` |

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | `http://localhost:3000/api` |

## Security Notes

- **Change JWT_SECRET** in production to a strong random string
- **Never commit** `.env` files to version control
- **Use HTTPS** in production
- **Enable rate limiting** for production deployment
- **Regularly rotate** JWT secrets
- **Implement** proper user management for directors

## Support

For issues or questions:
1. Check [PROJECT_README.md](./PROJECT_README.md)
2. Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
3. Run `./test-sprint1.sh` to diagnose issues
4. Check application logs in the terminal

## License

UNLICENSED - Private project
