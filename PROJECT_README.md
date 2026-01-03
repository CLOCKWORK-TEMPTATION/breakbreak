# Break Break - Film Production Management System

A modern film production management system built with NestJS, Next.js, PostgreSQL, and PostGIS.

## 🏗️ Project Structure

```
breakapp/
├── apps/
│   ├── backend/          # NestJS backend API
│   └── frontend/         # Next.js frontend application
├── packages/             # Shared packages (future)
├── turbo.json            # Turborepo configuration
└── pnpm-workspace.yaml   # PNPM workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- PNPM 10.x or higher
- PostgreSQL 14+ with PostGIS extension

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CLOCKWORK-TEMPTATION/breakbreak.git
cd breakbreak
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up PostgreSQL database:
```bash
# Create database
createdb breakapp_db

# Enable PostGIS extension
psql breakapp_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql breakapp_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

4. Configure environment variables:
```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your database credentials

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
```

5. Run database migrations:
```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate
cd ../..
```

### Development

Run both frontend and backend simultaneously:
```bash
pnpm dev
```

Or run individually:
```bash
# Backend only (runs on port 3000)
cd apps/backend
pnpm dev

# Frontend only (runs on port 3001)
cd apps/frontend
pnpm dev
```

### Build

Build all applications:
```bash
pnpm build
```

## 🔐 Authentication System

The system uses QR code-based authentication without passwords:

1. **Director** generates a QR code for their project
2. **Crew members** scan the QR code using their device camera
3. System issues a JWT token for the session
4. All subsequent API requests use the JWT for authentication

### API Endpoints

#### Authentication
- `POST /api/auth/scan-qr` - Scan QR and get JWT
- `POST /api/auth/verify` - Verify JWT token validity
- `GET /api/auth/generate-qr/:projectId` - Generate QR for project (requires JWT)

#### Projects
- `POST /api/projects` - Create project (DIRECTOR only)
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project (DIRECTOR only)
- `POST /api/projects/:id/generate-qr` - Generate QR for project (DIRECTOR only)

## 🛠️ Technology Stack

### Backend
- **NestJS** - Node.js framework
- **Prisma** - ORM for PostgreSQL
- **PostgreSQL** - Database
- **PostGIS** - Geospatial extension
- **JWT** - Authentication
- **Passport** - Authentication middleware
- **QRCode** - QR code generation
- **Helmet** - Security headers

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Axios** - HTTP client
- **html5-qrcode** - QR code scanner

### DevOps
- **Turborepo** - Monorepo build system
- **PNPM** - Package manager

## 📁 Database Schema

### Projects
- `id` - UUID (primary key)
- `name` - Project name
- `active_location` - Current filming location (PostGIS point as JSON)
- `access_token_secret` - Secret for QR token signing
- `budget_config` - Budget configuration (JSON)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Users
- `id` - UUID (primary key)
- `project_id` - Reference to project
- `role` - User role (DIRECTOR, CREW, RUNNER)
- `user_hash` - Unique device+project hash
- `created_at` - Creation timestamp

## 🔒 Security Features

- **JWT Authentication** - Stateless authentication
- **Role-Based Access Control** - Different permissions for different roles
- **CORS Protection** - Configured for frontend origin
- **Helmet** - HTTP security headers
- **Input Validation** - Using class-validator
- **QR Token Expiration** - QR codes expire after 5 minutes
- **Project Isolation** - Row-level security ready

## 📝 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/breakapp_db
JWT_SECRET=your-super-secret-key
JWT_EXPIRATION=24h
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 🧪 Testing

Run tests:
```bash
# Backend tests
cd apps/backend
pnpm test

# Frontend tests (if configured)
cd apps/frontend
pnpm test
```

## 📦 Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build all applications
- `pnpm lint` - Lint all code
- `pnpm test` - Run all tests
- `pnpm clean` - Clean build artifacts

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

UNLICENSED - Private project

## 👥 Team

Developed by CLOCKWORK-TEMPTATION
