# QuickBom Database Seeding System

This directory contains comprehensive seed files for populating the QuickBom database with sample data for development, testing, and production environments (including Supabase).

## 📁 File Structure

```
prisma/seeds/
├── index.js          # Main orchestrator - runs all seeders
├── users.js          # User accounts with different roles
├── clients.js        # Client data (individuals & companies)
├── materials.js      # Materials from BOQ + construction materials
├── assemblies.js     # Assemblies using materials
├── templates.js      # Project templates using assemblies
├── projects.js       # Sample projects using templates & clients
└── README.md         # This documentation
```

## 🚀 Usage

### Run All Seeders (Recommended)
```bash
npm run db:seed
```
This will run all seeders in the correct dependency order.

### Run Individual Seeders
```bash
# Seed only users
npm run db:seed:users

# Seed only clients
npm run db:seed:clients

# Seed only materials
npm run db:seed:materials

# Seed only assemblies
npm run db:seed:assemblies

# Seed only templates
npm run db:seed:templates

# Seed only projects
npm run db:seed:projects
```

### Seed to Supabase (Production)
```bash
# Seed all data to Supabase
NODE_ENV=production npm run db:seed

# Or seed individual components
NODE_ENV=production npm run db:seed:users
NODE_ENV=production npm run db:seed:clients
NODE_ENV=production npm run db:seed:materials
NODE_ENV=production npm run db:seed:assemblies
NODE_ENV=production npm run db:seed:templates
NODE_ENV=production npm run db:seed:projects
```

### Legacy Seeder (Original)
```bash
npm run db:seed:quickbom
```
This runs the original single-file seeder.

## 📊 Sample Data Overview

### 👥 Users (17 total)
- **Super Admin**: 1 (superadmin@quickbom.com)
- **Admins**: 1 (admin@quickbom.com)
- **Project Managers**: 1 (project.manager@quickbom.com)
- **Site Managers**: 1 (site.manager@quickbom.com)
- **Foremen**: 1 (foreman@quickbom.com)
- **Accountants**: 1 (accountant@quickbom.com)
- **Estimators**: 1 (estimator@quickbom.com)
- **Engineers**: 1 (engineer@quickbom.com)
- **Workers**: 3 (worker1@quickbom.com, etc.)
- **Clients**: 2 (client1@quickbom.com, etc.)
- **Pending/Inactive**: 2

### 🏢 Clients (8 total)
- **Individual Clients**: 2 (Ahmad Susanto, Siti Nurhaliza)
- **Company Clients**: 3 (PT Modern Office, CV Maju Jaya, PT Baru Mulia)
- **Government**: 1 (Dinas PU Jakarta)
- **Contractor**: 1 (PT Wijaya Karya)
- **Inactive/Blacklisted**: 1 each

### 🔧 Materials (74 total)
- **BOQ Electrical Materials**: 62 items (cables, switches, sensors, etc.)
- **Construction Materials**: 12 items (bata, semen, pasir, keramik, etc.)

### 🏗️ Assemblies (21 total)
- **Construction**: 5 (dinding, lantai, atap, rangka, seng)
- **Plumbing**: 2 (pipa PVC, kran stop)
- **Electrical**: 4 (kabel, terminal, saklar, lampu)
- **Lighting**: 2 (LED linear, buzzer)
- **Safety**: 2 (emergency stop, fingerprint)
- **Networking**: 2 (RJ45, switch)
- **Power**: 1 (power supply)
- **Sensors**: 1 (temperature/humidity)
- **Advanced**: 2 (beton, rangka baja)

### 📋 Templates (15 total)
- **Residential**: 3 (kamar mandi, dapur, kamar tidur)
- **Building Structure**: 2 (atap rumah, pondasi)
- **Electrical**: 2 (instalasi listrik, safety & security)
- **Office**: 2 (kantor open space, ruang meeting)
- **Industrial**: 2 (pabrik kecil, gudang)
- **Apartment**: 1 (apartemen 2BR)
- **Custom**: 3 (electrical, plumbing, finishing only)

### 🏢 Projects (14 total)
- **Active Projects**: 3 (in progress)
- **Completed**: 2 (finished projects)
- **On Hold**: 1 (delayed)
- **Cancelled**: 1 (terminated)
- **Delayed**: 1 (behind schedule)
- **Approved**: 2 (ready to start)
- **Planning**: 2 (in planning phase)
- **Maintenance**: 2 (ongoing maintenance)

## 🔐 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@quickbom.com | superadmin123 |
| Admin | admin@quickbom.com | admin123 |
| Project Manager | project.manager@quickbom.com | pm123 |
| Site Manager | site.manager@quickbom.com | sm123 |
| Foreman | foreman@quickbom.com | foreman123 |
| Accountant | accountant@quickbom.com | acc123 |
| Estimator | estimator@quickbom.com | est123 |
| Engineer | engineer@quickbom.com | eng123 |
| Worker | worker1@quickbom.com | worker123 |
| Client | client1@quickbom.com | client123 |

## ⚡ Quick Start

### For Development (Local PostgreSQL)
1. **Setup Database** (if not already done):
   ```bash
   # As postgres superuser
   sudo -u postgres psql
   CREATE DATABASE quickbom;
   CREATE USER quickbom WITH PASSWORD 'quickbom_password';
   GRANT ALL PRIVILEGES ON DATABASE quickbom TO quickbom;
   \q
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

3. **Push Schema**:
   ```bash
   npx prisma db push
   ```

4. **Run Seeders**:
   ```bash
   npm run db:seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

6. **Access Dashboard**:
   - Open http://localhost:3000
   - Login with any of the credentials above

### For Production (Supabase)

1. **Configure Supabase** (see SUPABASE_SETUP.md):
   ```bash
   # Update .env with Supabase credentials
   # Test connection
   npm run db:test:prod
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

3. **Push Schema to Supabase**:
   ```bash
   NODE_ENV=production npx prisma db push
   ```

4. **Seed Data to Supabase**:
   ```bash
   NODE_ENV=production npm run db:seed
   ```

5. **Deploy Application**:
   ```bash
   NODE_ENV=production npm run build
   NODE_ENV=production npm start
   ```

## 🔄 Seeding Order & Dependencies

The seeders run in this specific order to maintain data integrity:

1. **Users** - No dependencies
2. **Clients** - No dependencies
3. **Materials** - No dependencies
4. **Assemblies** - Depends on Materials
5. **Templates** - Depends on Assemblies
6. **Projects** - Depends on Clients, Templates, and Users

## 🛠️ Customization

Each seeder file can be modified independently to add/remove sample data. The seeders use `upsert` operations, so they can be run multiple times safely.

### Adding New Data

1. **Users**: Add to `users.js` array
2. **Clients**: Add to `clients.js` array
3. **Materials**: Add to `materials.js` arrays
4. **Assemblies**: Add to `assemblies.js` array (ensure materials exist)
5. **Templates**: Add to `templates.js` array (ensure assemblies exist)
6. **Projects**: Add to `projects.js` array (ensure clients/templates/users exist)

### Validation

Each seeder includes validation to ensure required related data exists before creating records. If dependencies are missing, the seeder will skip those records and log warnings.

## 📈 Data Relationships

```
Users (17)
├── Projects (14) - assigned to projects
└── Various roles for project management

Clients (8)
└── Projects (14) - own projects

Materials (74)
└── Assemblies (21) - used in assemblies

Assemblies (21)
└── Templates (15) - included in templates

Templates (15)
└── Projects (14) - used as project templates

Projects (14)
├── Clients (8) - owned by clients
├── Templates (15) - based on templates
├── Users (17) - assigned users
└── Various statuses and progress tracking
```

## 🎯 Use Cases

This comprehensive seed data supports:

- **Development**: Full dataset for testing all features
- **Demonstrations**: Rich examples for client presentations
- **Training**: Sample data for user training sessions
- **UI/UX Testing**: Various data states and edge cases
- **Performance Testing**: Large dataset for optimization testing

## 🚨 Important Notes

- All seeders use `upsert` operations - safe to run multiple times
- Passwords are hashed using bcrypt
- All monetary values are in Indonesian Rupiah (IDR)
- Geographic data focuses on Jakarta and surrounding areas
- Sample data represents realistic construction project scenarios

## 🟢 Supabase Seeding Guide

### Prerequisites
1. **Supabase project** sudah dibuat dan aktif
2. **Environment variables** sudah dikonfigurasi di `.env`
3. **Database connection** sudah ditest dengan `npm run db:test:prod`

### Step-by-Step Supabase Seeding

#### 1. **Test Connection First**
```bash
# Pastikan Supabase connection works
npm run db:test:prod

# Expected: "✅ Database connection successful!"
```

#### 2. **Push Schema to Supabase**
```bash
# Push database schema ke Supabase
NODE_ENV=production npx prisma db push

# Atau dengan force reset (untuk fresh install)
NODE_ENV=production npx prisma db push --force-reset
```

#### 3. **Run Seeders to Supabase**
```bash
# Seed semua data ke Supabase
NODE_ENV=production npm run db:seed

# Output yang diharapkan:
# 🌱 Starting QuickBom Comprehensive Database Seeding...
# ✅ Users seeded: 17
# ✅ Clients seeded: 8
# ✅ Materials seeded: 74
# ✅ Assemblies seeded: 21
# ✅ Templates seeded: 15
# ✅ Projects seeded: 14
# 🎉 ALL SEEDING COMPLETED SUCCESSFULLY!
```

#### 4. **Verify Seeding Results**
```bash
# Check data di Supabase dashboard
# Atau query via Prisma Studio
NODE_ENV=production npx prisma studio
```

### Individual Component Seeding

Jika ingin seed komponen tertentu saja:

```bash
# Seed only users
NODE_ENV=production npm run db:seed:users

# Seed only materials & assemblies
NODE_ENV=production npm run db:seed:materials
NODE_ENV=production npm run db:seed:assemblies

# Seed projects (butuh clients, templates, users)
NODE_ENV=production npm run db:seed:clients
NODE_ENV=production npm run db:seed:templates
NODE_ENV=production npm run db:seed:projects
```

### Troubleshooting Supabase Seeding

#### Error: "Can't reach database server"
```bash
# Check Supabase project status
# Visit: https://supabase.com/dashboard/project/[your-project-id]

# If paused: Click "Resume"
# If password wrong: Reset in Settings > Database
```

#### Error: "Connection timeout"
```bash
# Test basic connectivity
curl -I https://bficmvgkjygzoatrytvj.supabase.co

# If fails: Network issue, try VPN or different connection
```

#### Error: "Permission denied"
```bash
# Check SUPABASE_DATABASE_URL in .env
# Ensure password is correct
# Verify project is active
```

#### Schema Push Fails
```bash
# Force reset (WARNING: deletes all data)
NODE_ENV=production npx prisma db push --force-reset

# Or use migrate (for production)
NODE_ENV=production npx prisma migrate deploy
```

### Supabase-Specific Considerations

#### Connection Limits
- **Free tier**: Limited connections
- **Pro tier**: Higher limits
- **Connection pooling**: Automatically managed

#### Performance
- **Large datasets**: Seed in batches
- **Timeout issues**: Use connection pooling URL
- **Rate limits**: Supabase has API rate limits

#### Data Persistence
- **Free tier**: May pause after inactivity
- **Paid tier**: Always active
- **Backups**: Automatic daily backups

### Environment-Specific Commands

| Environment | Schema Push | Seeding | Testing |
|-------------|-------------|---------|---------|
| **Development** | `npx prisma db push` | `npm run db:seed` | `npm run db:test:dev` |
| **Production** | `NODE_ENV=production npx prisma db push` | `NODE_ENV=production npm run db:seed` | `npm run db:test:prod` |

### Post-Seeding Verification

Setelah seeding berhasil, verify dengan:

```bash
# Check user count
NODE_ENV=production npx prisma db execute --file <(echo "SELECT COUNT(*) as users FROM \"User\";")

# Check project count
NODE_ENV=production npx prisma db execute --file <(echo "SELECT COUNT(*) as projects FROM \"Project\";")

# Access via application
NODE_ENV=production npm run dev
# Login with: admin@quickbom.com / admin123
```

### Best Practices for Supabase Seeding

1. **Test locally first**: Seed development environment
2. **Backup production data**: Jika ada data penting
3. **Seed in order**: Respect dependency order
4. **Monitor performance**: Large seeds may timeout
5. **Verify results**: Check data integrity after seeding

---

## 🎉 Summary

**Supabase seeding** untuk QuickBom sekarang fully supported dengan:

- ✅ **Environment-specific commands**
- ✅ **Comprehensive error handling**
- ✅ **Step-by-step troubleshooting**
- ✅ **Performance considerations**
- ✅ **Data verification methods**

**Ready to seed your Supabase database! 🚀**

---

**Happy coding with QuickBom! 🏗️✨**
