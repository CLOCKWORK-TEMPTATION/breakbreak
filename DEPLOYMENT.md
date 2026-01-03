# 🚀 Deployment Guide - Break Break

This guide covers deploying Break Break to production environments.

## Prerequisites

- PostgreSQL database (managed service recommended)
- Node.js hosting (Vercel, Railway, Render, etc.)
- SSL certificate for HTTPS

## Production Checklist

### Security

- [ ] Change `JWT_SECRET` to a strong random string (32+ characters)
- [ ] Use environment-specific `.env` files
- [ ] Enable HTTPS on all services
- [ ] Set up rate limiting
- [ ] Configure secure CORS origins
- [ ] Review and update security headers
- [ ] Enable database SSL connections
- [ ] Set up monitoring and logging
- [ ] Implement backup strategy
- [ ] Review and minimize exposed API endpoints

### Database

- [ ] Use managed PostgreSQL service (AWS RDS, Heroku Postgres, etc.)
- [ ] Enable PostGIS extension
- [ ] Set up connection pooling
- [ ] Configure automated backups
- [ ] Enable SSL for database connections
- [ ] Set up read replicas (if needed)
- [ ] Implement Row Level Security policies

### Environment Variables

- [ ] Set all required environment variables
- [ ] Use secrets management service
- [ ] Never commit production credentials
- [ ] Use different secrets per environment

## Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Backend on Railway

1. **Create new Railway project**
   ```bash
   railway login
   railway init
   ```

2. **Add PostgreSQL database**
   - Add PostgreSQL plugin in Railway dashboard
   - Note the DATABASE_URL

3. **Set environment variables**
   ```bash
   railway variables set JWT_SECRET=your-production-secret
   railway variables set NODE_ENV=production
   railway variables set FRONTEND_URL=https://your-frontend.vercel.app
   ```

4. **Deploy**
   ```bash
   cd apps/backend
   railway up
   ```

#### Frontend on Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd apps/frontend
   vercel --prod
   ```

3. **Set environment variables in Vercel dashboard**
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL

### Option 2: Docker Deployment

#### Create Dockerfiles

**Backend Dockerfile** (`apps/backend/Dockerfile`):
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm
RUN pnpm prisma generate
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
```

**Frontend Dockerfile** (`apps/frontend/Dockerfile`):
```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm install -g pnpm
RUN pnpm build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

CMD ["node", "server.js"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: breakapp_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/breakapp_db
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION: 24h
      PORT: 3000
      FRONTEND_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    command: sh -c "npx prisma migrate deploy && node dist/main"

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3000/api
    ports:
      - "3001:3001"
    depends_on:
      - backend

volumes:
  postgres_data:
```

**Deploy with Docker Compose**:
```bash
# Set environment variables
export DB_PASSWORD=your-secure-password
export JWT_SECRET=your-super-secret-jwt-key

# Build and run
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

### Option 3: AWS Deployment

#### Architecture
- **Frontend**: AWS Amplify or S3 + CloudFront
- **Backend**: ECS Fargate or EC2
- **Database**: RDS PostgreSQL with PostGIS

#### Steps

1. **Set up RDS PostgreSQL**
   - Enable PostGIS extension
   - Configure security groups
   - Enable SSL

2. **Deploy Backend to ECS**
   - Create ECR repository
   - Push Docker image
   - Create ECS task definition
   - Configure environment variables
   - Set up Application Load Balancer

3. **Deploy Frontend to Amplify**
   ```bash
   amplify init
   amplify add hosting
   amplify publish
   ```

## Environment Configuration

### Production Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/breakapp_db?sslmode=require

# JWT
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRATION=24h

# Application
PORT=3000
NODE_ENV=production

# CORS
FRONTEND_URL=https://your-production-frontend.com
```

### Production Frontend (.env.production.local)

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

## Database Migrations

### Run migrations in production

```bash
# Using Railway CLI
railway run npx prisma migrate deploy

# Using Docker
docker exec -it backend npx prisma migrate deploy

# Direct connection
cd apps/backend
npx prisma migrate deploy
```

## Monitoring

### Backend Monitoring

Add logging service (e.g., Winston):

```typescript
// main.ts
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');
logger.log(`Application is running on port ${port}`);
```

### Frontend Monitoring

Use Vercel Analytics or add:

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Performance Optimization

### Backend

1. **Enable caching**
   ```typescript
   import { CacheModule } from '@nestjs/cache-manager';
   ```

2. **Connection pooling**
   ```typescript
   // In datasource config
   connection_limit: 10
   ```

3. **Rate limiting**
   ```typescript
   import { ThrottlerModule } from '@nestjs/throttler';
   ```

### Frontend

1. **Image optimization**
   - Use Next.js Image component
   - Enable image optimization in next.config.js

2. **Code splitting**
   - Already handled by Next.js

3. **CDN for static assets**
   - Use Vercel Edge Network or CloudFront

## Security Best Practices

### Database

```sql
-- Create read-only user for reporting
CREATE USER readonly WITH PASSWORD 'secure-password';
GRANT CONNECT ON DATABASE breakapp_db TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_project_policy ON users
  FOR ALL
  USING (project_id = current_setting('app.current_project')::uuid);
```

### Backend

```typescript
// Enable helmet with strict policies
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// Rate limiting
import { ThrottlerGuard } from '@nestjs/throttler';
app.useGlobalGuards(new ThrottlerGuard());
```

## SSL/TLS Configuration

### Backend (if self-hosting)

```typescript
// main.ts
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/certificate.pem'),
};

const app = await NestFactory.create(AppModule, {
  httpsOptions,
});
```

### Database SSL

```env
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require&sslcert=./client-cert.pem&sslkey=./client-key.pem&sslrootcert=./ca-cert.pem
```

## Backup Strategy

### Automated Database Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"

# Retain last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

### Media/Assets Backup

- Use S3 or similar object storage
- Enable versioning
- Set lifecycle policies

## Health Checks

### Backend Health Endpoint

```typescript
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

### Database Health

```typescript
@Get('health/db')
async dbHealth() {
  try {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy' };
  } catch {
    return { status: 'unhealthy' };
  }
}
```

## Rollback Plan

1. **Keep previous deployment**
   - Tag Docker images
   - Keep previous Vercel deployment

2. **Database migrations**
   - Test migrations on staging first
   - Keep rollback migrations ready

3. **Quick rollback**
   ```bash
   # Railway
   railway rollback
   
   # Vercel
   vercel rollback
   
   # Docker
   docker-compose down
   docker-compose up -d --build
   ```

## Post-Deployment Checklist

- [ ] Verify all services are running
- [ ] Test authentication flow
- [ ] Verify QR code generation
- [ ] Test database connectivity
- [ ] Check CORS configuration
- [ ] Verify SSL certificates
- [ ] Test API endpoints
- [ ] Monitor error logs
- [ ] Set up alerts
- [ ] Document any issues
- [ ] Update DNS records
- [ ] Enable monitoring

## Troubleshooting Production Issues

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check SSL
psql "$DATABASE_URL?sslmode=require" -c "SELECT version();"
```

### Backend Not Starting
```bash
# Check logs
docker logs backend
railway logs

# Verify environment variables
railway variables
```

### Frontend Build Failures
```bash
# Check build logs in Vercel dashboard
# Verify environment variables
# Test build locally
pnpm build
```

## Support

For production support:
- Monitor application logs
- Set up error tracking (Sentry, etc.)
- Configure alerts for critical errors
- Keep documentation updated
