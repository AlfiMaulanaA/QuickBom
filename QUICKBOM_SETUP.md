# QuickBom - Construction Management System

QuickBom adalah sistem manajemen konstruksi dan material yang dibangun dengan Next.js, TypeScript, dan PostgreSQL. Sistem ini menyediakan hierarki manajemen material dari bahan baku hingga template project konstruksi.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ dan npm
- PostgreSQL 12+
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd quickbom
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

**Otomatis (Recommended):**
```bash
# Pastikan PostgreSQL sudah berjalan
sudo systemctl start postgresql  # Linux
# atau
brew services start postgresql  # macOS

# Jalankan script setup database (termasuk seeding data)
./setup-quickbom-db.sh
```

**Manual Setup:**
```sql
-- Buat database dan user PostgreSQL
CREATE DATABASE quickbom;
CREATE USER quickbom WITH PASSWORD 'quickbom_password';
GRANT ALL PRIVILEGES ON DATABASE quickbom TO quickbom;
```

```bash
# Copy dan edit environment file
cp .env.example .env
# Edit DATABASE_URL di .env

# Generate Prisma client dan migrate
npx prisma generate
npx prisma migrate dev --name init-quickbom-schema

# Seed database dengan data default
npm run db:seed:quickbom
```

### 4. Start Development Server

```bash
npm run dev
```

Kunjungi [http://localhost:3000](http://localhost:3000) untuk mengakses aplikasi.

## 📊 Database Schema

### Hierarki Material (3 Level)

```
LEVEL 1: Material (Bahan Baku)
├── Bata Merah (pcs, @ Rp 1,500)
├── Semen (kg, @ Rp 100,000)
└── Pasir (m³, @ Rp 250,000)

LEVEL 2: Assembly (Kelompok Pekerjaan)
├── Pemasangan Dinding Bata Merah per m²
│   ├── Bata Merah: 70 pcs
│   ├── Semen: 5 kg
│   └── Pasir: 0.03 m³
└── Pemasangan Lantai Keramik per m²

LEVEL 3: Template (Paket Lengkap)
├── Paket Renovasi Kamar Mandi A
│   ├── Dinding: 12 m²
│   └── Lantai: 4 m²
└── Paket Renovasi Dapur Modern

LEVEL 4: Project (Real Implementation)
└── Project Nyata: "Renovasi Rumah Bpk. Ahmad"
```

### Tabel Database

- **`User`**: Authentication dan authorization
- **`Material`**: Bahan baku dasar (bata, semen, pasir, dll)
- **`Assembly`**: Kelompok pekerjaan (pemasangan dinding, dll)
- **`AssemblyMaterial`**: Junction table Material ↔ Assembly
- **`Template`**: Paket template lengkap
- **`TemplateAssembly`**: Junction table Assembly ↔ Template
- **`Project`**: Implementasi project nyata (opsional)

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma studio    # Open Prisma Studio
npx prisma migrate dev  # Create and apply migration
npx prisma generate  # Generate Prisma client
```

### Environment Variables

```bash
# Copy dari .env.example
cp .env.example .env

# Edit variables berikut:
DATABASE_URL="postgresql://quickbom:quickbom_password@localhost:5432/quickbom?schema=public"
JWT_SECRET="your-secure-random-key-here"
NEXT_PUBLIC_APP_NAME="QuickBom - Construction Management"
```

## 📁 Project Structure

```
quickbom/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Shadcn/ui components
│   └── navigation-sidebar.tsx
├── contexts/             # React contexts
├── lib/                  # Utilities
├── prisma/               # Database schema & migrations
│   └── schema.prisma
├── setup-quickbom-db.sh  # Database setup script
└── .env.example         # Environment template
```

## 🔐 Authentication

Sistem menggunakan JWT untuk authentication dengan session management yang aman.

### Default Credentials (Development)
- **Admin**: admin@quickbom.com / admin123
- **User**: user@quickbom.com / user123

### Sample Data Included

Script seeding akan membuat data sample berikut:

**Materials (8 items):**
- Bata Merah (1,500 IDR/pcs)
- Semen Portland (100,000 IDR/kg)
- Pasir Halus (250,000 IDR/m³)
- Keramik Lantai 40x40 (45,000 IDR/pcs)
- Cat Tembok (75,000 IDR/liter)
- Kawat Beton (12,000 IDR/kg)
- Paku (25,000 IDR/kg)
- Kayu Balok 5x10 (85,000 IDR/meter)

**Assemblies (4 items):**
- Pemasangan Dinding Bata Merah per m²
- Pemasangan Lantai Keramik per m²
- Pengecatan Dinding per m²
- Pemasangan Rangka Atap per m²

**Templates (3 items):**
- Paket Renovasi Kamar Mandi Standard
- Paket Renovasi Dapur Sederhana
- Paket Atap Rumah Minimalis

**Projects (1 item):**
- Renovasi Rumah Pak Ahmad (sample project)

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Environment Setup

1. **Database**: Setup PostgreSQL production database
2. **Environment Variables**:
   ```bash
   NODE_ENV=production
   DATABASE_URL="your-production-db-url"
   JWT_SECRET="secure-random-production-key"
   ```

3. **Security**:
   - Ganti password default
   - Setup HTTPS
   - Configure CORS properly
   - Enable rate limiting

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Material Management

- `GET /api/materials` - List materials
- `POST /api/materials` - Create material
- `PUT /api/materials/[id]` - Update material
- `DELETE /api/materials/[id]` - Delete material

### Assembly Management

- `GET /api/assemblies` - List assemblies
- `POST /api/assemblies` - Create assembly
- `PUT /api/assemblies/[id]` - Update assembly

### Template Management

- `GET /api/templates` - List templates
- `POST /api/templates` - Create template

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/nama-fitur`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

Jika ada pertanyaan atau masalah:

1. Check [Issues](../../issues) untuk masalah yang sudah diketahui
2. Create new issue jika belum ada
3. Contact development team untuk support teknis

---

**QuickBom** - Simplifying Construction Material Management 🚀
