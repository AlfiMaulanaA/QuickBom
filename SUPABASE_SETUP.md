# 🚀 QuickBom Supabase Setup Guide

Panduan lengkap untuk mengintegrasikan aplikasi QuickBom dengan Supabase untuk production, sambil tetap menggunakan PostgreSQL lokal untuk development.

## 📋 Prerequisites

- Akun [Supabase](https://supabase.com) (gratis)
- PostgreSQL lokal untuk development
- Node.js dan npm/yarn

## 🏗️ Step 1: Setup Supabase Project

### 1.1 Buat Supabase Project

1. Pergi ke [supabase.com](https://supabase.com) dan login
2. Klik **"New project"**
3. Isi informasi project:
   - **Name**: `QuickBom Production`
   - **Database Password**: Buat password yang kuat
   - **Region**: Pilih region terdekat (Asia Southeast untuk Indonesia)
4. Klik **"Create new project"**

### 1.2 Tunggu Setup Selesai

Supabase akan setup database PostgreSQL secara otomatis. Tunggu sampai status project menjadi **"Active"** (biasanya 2-5 menit).

## 🔧 Step 2: Configure Environment Variables

### 2.1 Update file `.env`

Ganti placeholder values dengan actual Supabase credentials:

```bash
# ==========================================================
#  DATABASE
# ==========================================================

# PostgreSQL database connection string (Development/Local)
DATABASE_URL="postgresql://quickbom:quickbom_password@localhost:5432/quickbom?schema=public"

# Supabase database connection string (Production)
# Get this from: Project Settings > Database > Connection string
SUPABASE_DATABASE_URL="postgresql://postgres.[your-project-ref]:[your-password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"

# ==========================================================
#  AUTHENTICATION
# ==========================================================

# JWT secret for token signing (generate a strong random string)
# Generate with: openssl rand -base64 32
JWT_SECRET="your-super-secret-key-that-is-very-long-and-random"

# SUPABASE SETTINGS
# Get these from: Project Settings > API
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_JWT_SECRET="your-super-secret-key-that-is-very-long-and-random"

# Supabase storage bucket name for file uploads
SUPABASE_STORAGE_BUCKET="quickbom-uploads"
SUPABASE_STORAGE_USER_FOLDER="user_files"
SUPABASE_STORAGE_PROJECT_FOLDER="project_files"
```

### 2.2 Cara Mendapatkan Supabase Credentials

#### Database URL:
1. Di Supabase Dashboard, klik **"Settings"** (ikon gear)
2. Klik **"Database"** di sidebar
3. Scroll ke bagian **"Connection string"**
4. Pilih **"Transaction pooler"** (untuk production)
5. Copy connection string dan replace `[YOUR-PASSWORD]` dengan database password yang Anda buat

#### API Keys:
1. Di Supabase Dashboard, klik **"Settings"**
2. Klik **"API"** di sidebar
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## 🗄️ Step 3: Setup Database Schema

### 3.1 Jalankan Prisma Migration

```bash
# Generate Prisma client dengan environment yang benar
npx prisma generate

# Push schema ke Supabase (production)
NODE_ENV=production npx prisma db push

# Atau jika ingin reset database Supabase:
NODE_ENV=production npx prisma migrate reset --force
```

### 3.2 Seed Data (Optional)

Jika ingin menambahkan data awal:

```bash
# Seed data ke Supabase
NODE_ENV=production npm run db:seed:quickbom
```

## 📁 Step 4: Setup Supabase Storage (untuk File Uploads)

### 4.1 Buat Storage Bucket

1. Di Supabase Dashboard, klik **"Storage"** di sidebar
2. Klik **"Create bucket"**
3. Buat bucket dengan nama `quickbom-uploads`
4. **Policy Settings**:
   - ✅ Enable RLS (Row Level Security)
   - ✅ Allow public access (untuk file yang bisa diakses publik)

### 4.2 Setup Storage Policies

Di SQL Editor Supabase, jalankan:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'quickbom-uploads'
);

-- Allow users to view their own files
CREATE POLICY "Users can view files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'quickbom-uploads' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   auth.role() = 'service_role')
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'quickbom-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 🚀 Step 5: Deploy ke Production

### 5.1 Environment Variables di Production

Pastikan environment variables berikut diset di hosting platform (Vercel, Netlify, dll):

```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
SUPABASE_DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_STORAGE_BUCKET=quickbom-uploads
SUPABASE_STORAGE_USER_FOLDER=user_files
SUPABASE_STORAGE_PROJECT_FOLDER=project_files
JWT_SECRET=your-jwt-secret
```

### 5.2 Build dan Deploy

```bash
# Build aplikasi
npm run build

# Deploy sesuai platform hosting Anda
# Vercel: npx vercel --prod
# Netlify: npx netlify deploy --prod
```

## 🔄 Step 6: Switching Between Environments

Aplikasi akan otomatis menggunakan database yang tepat berdasarkan `NODE_ENV`:

### Development (Local PostgreSQL):
```bash
NODE_ENV=development npm run dev
# Uses: DATABASE_URL (local PostgreSQL)
```

### Production (Supabase):
```bash
NODE_ENV=production npm run build
NODE_ENV=production npm start
# Uses: SUPABASE_DATABASE_URL (Supabase)
```

## 🧪 Step 7: Testing Setup

### Test Database Connection:

```bash
# Test local database
npm run dev
# Check logs for: [PRISMA] Connected to local PostgreSQL

# Test Supabase connection (production build)
NODE_ENV=production npm run build
NODE_ENV=production npm start
# Check logs for: [PRISMA] Connected to Supabase
```

### Test File Upload:

1. Login ke aplikasi
2. Coba upload file di project atau material
3. File harus tersimpan di Supabase Storage

## 🔧 Troubleshooting

### Error: "SUPABASE_DATABASE_URL environment variable is required in production"

**Solution**: Pastikan `.env` file memiliki `SUPABASE_DATABASE_URL` yang valid

### Error: "Connection pool exhausted"

**Solution**: Supabase memiliki limit koneksi. Kurangi `connection_limit` di `lib/prisma.ts`

### Error: "Storage bucket not found"

**Solution**:
1. Pastikan bucket `quickbom-uploads` sudah dibuat
2. Check storage policies sudah benar
3. Pastikan `SUPABASE_STORAGE_BUCKET` environment variable benar

### Error: "Migration failed"

**Solution**:
```bash
# Reset dan push ulang schema
NODE_ENV=production npx prisma migrate reset --force
NODE_ENV=production npx prisma db push
```

## 📊 Monitoring & Analytics

### Supabase Dashboard Features:

1. **Database**: Monitor queries, connections, dan performance
2. **Storage**: Track file uploads dan usage
3. **Logs**: View API logs dan error tracking
4. **Analytics**: User activity dan performance metrics

### Useful Supabase URLs:

- **Dashboard**: `https://supabase.com/dashboard/project/[your-project-ref]`
- **Database**: `https://supabase.com/dashboard/project/[your-project-ref]/database`
- **Storage**: `https://supabase.com/dashboard/project/[your-project-ref]/storage`
- **API Docs**: `https://supabase.com/dashboard/project/[your-project-ref]/api`

## 🎉 You're Done!

Aplikasi QuickBom sekarang sudah terintegrasi dengan Supabase untuk production dan tetap menggunakan PostgreSQL lokal untuk development. Sistem akan otomatis switch database berdasarkan environment.

---

**Need Help?**
- Check [Supabase Docs](https://supabase.com/docs)
- Check [Prisma Supabase Guide](https://supabase.com/docs/guides/integrations/prisma)
- Open issue di repository jika ada masalah
