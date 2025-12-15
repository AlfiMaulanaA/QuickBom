# QuickBom Docker Setup

Panduan lengkap untuk menjalankan aplikasi QuickBom menggunakan Docker di port 4000.

## 📋 Prasyarat

- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimal 2GB RAM untuk container
- Port 4000, 5432 harus tersedia

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd quickbom
```

### 2. Setup Supabase Database
1. Buat akun di [Supabase](https://supabase.com)
2. Buat project baru
3. Pergi ke **Settings > Database** untuk mendapatkan connection details
4. Copy database URL dan password

### 3. Setup Environment Variables
```bash
# File .env sudah ter-konfigurasi untuk Supabase
# Pastikan mengisi credentials Supabase yang benar:

# Database URLs (dari Supabase Dashboard > Settings > Database)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres"

# Supabase API Keys (dari Supabase Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_JWT_SECRET="your-jwt-secret"

# JWT Secret untuk aplikasi (generate random)
JWT_SECRET="your-secure-jwt-secret-here"
```

### 4. Jalankan Database Migration (Pertama Kali)
```bash
# Jalankan migration untuk setup database schema
docker-compose --profile migration up

# Tunggu sampai migration selesai, lalu stop
docker-compose --profile migration down
```

### 5. Jalankan Aplikasi
```bash
# Jalankan aplikasi utama
docker-compose up -d

# Jalankan seeding data (opsional)
docker-compose run --rm migration npm run db:seed
```

### 6. Akses Aplikasi
- **Aplikasi**: http://localhost:4000
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Logs**: `docker-compose logs -f quickbom`

## 🏗️ Arsitektur Docker

### Services

#### 1. **quickbom** (Aplikasi Utama)
- **Port**: 4000
- **Image**: Custom build dari Dockerfile
- **Dependencies**: Supabase database
- **Health Check**: Endpoint `/api/health`

#### 2. **migration** (Database Migration - Opsional)
- **Profile**: migration
- **Auto-run**: Prisma migrations + seeding ke Supabase
- **One-time**: Jalankan hanya saat pertama kali

### Volumes
- **./uploads**: File uploads dari aplikasi (persistent storage)
- **./data**: Static data untuk seeding (read-only)

### Networks
- **quickbom-network**: Isolated container network

## 🔧 Konfigurasi Environment

### File .env Utama
```bash
# Database
DATABASE_URL="postgresql://quickbom_user:quickbom_password@postgres:5432/quickbom_db?schema=public"
DIRECT_URL="postgresql://quickbom_user:quickbom_password@postgres:5432/quickbom_db?schema=public"

# JWT Secret (ubah di production!)
JWT_SECRET="your-secure-jwt-secret-here"

# Supabase (opsional)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Aplikasi
NODE_ENV=production
PORT=4000
NEXT_PUBLIC_APP_NAME="QuickBom - Construction Management"
```

### Database Credentials
```bash
POSTGRES_DB=quickbom_db
POSTGRES_USER=quickbom_user
POSTGRES_PASSWORD=quickbom_password
```

## 📊 Commands Docker

### Basic Operations
```bash
# Start semua services
docker-compose up -d

# Stop semua services
docker-compose down

# Restart aplikasi
docker-compose restart quickbom

# Lihat logs
docker-compose logs -f quickbom
docker-compose logs -f postgres
```

### Database Operations (Supabase)
```bash
# Jalankan migration manual ke Supabase
docker-compose run --rm migration

# Backup database (gunakan Supabase dashboard atau pg_dump)
# Supabase menyediakan automated backups, tapi untuk manual:
pg_dump "$DATABASE_URL" > backup.sql

# Restore database (hati-hati! gunakan Supabase dashboard)
# pg_restore -d "$DATABASE_URL" backup.sql

# Check migration status
docker-compose run --rm migration npx prisma migrate status

# Reset database (WARNING: data loss!)
docker-compose run --rm migration npx prisma migrate reset --force
```

### Maintenance
```bash
# Rebuild aplikasi (setelah code changes)
docker-compose build quickbom
docker-compose up -d quickbom

# Clean up
docker-compose down -v  # Remove volumes (WARNING: data loss!)
docker system prune -a  # Clean unused images
```

## 🔍 Troubleshooting

### Aplikasi Tidak Bisa Akses
```bash
# Check container status
docker-compose ps

# Check logs aplikasi
docker-compose logs quickbom

# Check health aplikasi
curl http://localhost:4000/api/health
```

### Database Connection Error (Supabase)
```bash
# Check aplikasi logs untuk database connection errors
docker-compose logs quickbom

# Test Supabase connection (dari container)
docker-compose exec quickbom npx prisma db push --preview-feature

# Verify Supabase credentials
# Check di Supabase Dashboard > Settings > Database
# Pastikan DATABASE_URL dan credentials benar

# Reset database schema (WARNING: data loss!)
docker-compose run --rm migration npx prisma migrate reset --force
```

### Port Conflict
```bash
# Check port usage
lsof -i :4000
lsof -i :5432

# Change port di docker-compose.yml
ports:
  - "4001:4000"  # Host:Container
```

### Memory Issues
```bash
# Check container resource usage
docker stats

# Increase Docker memory limit atau
# Kurangi PostgreSQL shared_buffers di docker/postgresql.conf
```

## 🔒 Security Considerations

### Production Setup
1. **Change Database Passwords**
   ```bash
   POSTGRES_PASSWORD="strong-production-password"
   ```

2. **Generate Secure JWT Secret**
   ```bash
   openssl rand -base64 32
   ```

3. **Enable SSL/HTTPS**
   - Setup reverse proxy (nginx/caddy)
   - Configure SSL certificates

4. **Database Backup**
   ```bash
   # Setup automated backup script
   0 2 * * * docker exec quickbom-postgres pg_dump -U quickbom_user quickbom_db > /backup/daily_$(date +\%Y\%m\%d).sql
   ```

### Environment Variables
- Jangan commit `.env` ke git
- Gunakan Docker secrets untuk sensitive data
- Rotate JWT secrets regularly

## 📈 Monitoring & Logs

### Application Logs
```bash
# Real-time logs
docker-compose logs -f quickbom

# Last 100 lines
docker-compose logs --tail=100 quickbom

# Filter by time
docker-compose logs --since="2024-01-01T00:00:00" quickbom
```

### Database Logs
```bash
# PostgreSQL logs
docker-compose logs -f postgres

# Query performance
docker exec quickbom-postgres psql -U quickbom_user -d quickbom_db -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Health Checks
```bash
# Manual health check
curl -f http://localhost:4000/api/health

# Database connectivity
docker exec quickbom-postgres pg_isready -U quickbom_user -d quickbom_db
```

## 🚀 Deployment Options

### Development
```bash
# Full development setup
docker-compose up -d

# With hot reload (mount source code)
# Edit docker-compose.yml untuk mount /app directory
```

### Production
```bash
# Production deployment
docker-compose -f docker-compose.yml up -d

# Dengan reverse proxy
# Setup nginx/caddy di depan container
```

### CI/CD
```bash
# Build untuk production
docker build -t quickbom:latest .

# Push ke registry
docker tag quickbom:latest registry.example.com/quickbom:latest
docker push registry.example.com/quickbom:latest
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🆘 Support

Jika mengalami masalah:

1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Check port availability
4. Ensure sufficient resources (RAM/CPU)
5. Review Docker and PostgreSQL versions

---

**QuickBom Docker Setup** - Version 1.0.0
