# 🚀 QuickBom Vercel Deployment Guide

Panduan lengkap untuk deploy QuickBom ke Vercel dengan Supabase.

## 📋 Prerequisites

- ✅ Akun Vercel (https://vercel.com)
- ✅ Project Supabase dengan database PostgreSQL
- ✅ Data sudah di-seed ke Supabase

## 🔧 Langkah 1: Setup Environment Variables di Vercel

### Akses Vercel Dashboard
1. Login ke https://vercel.com/dashboard
2. Pilih project QuickBom Anda
3. Klik **Settings** → **Environment Variables**

### Tambahkan Environment Variables

Copy-paste semua environment variables berikut:

```
# Database Configuration (WAJIB)
DATABASE_URL=postgresql://postgres.[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Supabase Configuration (WAJIB)
NEXT_PUBLIC_SUPABASE_URL=https://bficmvgkjygzoatrytvj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmaWNtdmdranlnem9hdHJ5dHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzk3OTYsImV4cCI6MjA4MDYxNTc5Nn0.A4hkebx-B3BEzor1hOuALYpklzXOc3hosE1dqxpFuro
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=quickbom-production-jwt-secret-2025-supabase-integration

# JWT Configuration (WAJIB)
JWT_SECRET=quickbom-production-jwt-secret-2025-supabase-integration

# Application Configuration (WAJIB)
NEXT_PUBLIC_APP_NAME=QuickBom - Construction Management
NODE_ENV=production
```

### Environment Variable Settings
- **DATABASE_URL**: Pastikan menggunakan connection pooling URL dari Supabase
- **Environment**: Set ke **Production** untuk semua variables
- **NEXT_PUBLIC_***: Variables yang dimulai dengan ini akan accessible dari browser

## 🚀 Langkah 2: Deploy ke Vercel

### Opsi 1: Deploy via Git (Recommended)

1. **Push code ke Git repository**:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import project di Vercel**:
   - Vercel akan auto-detect Next.js project
   - Pilih **Framework Preset**: Next.js
   - Klik **Deploy**

### Opsi 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy project
vercel --prod

# Set environment variables
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add JWT_SECRET production
```

## 🔍 Langkah 3: Verifikasi Deployment

### Cek Build Logs
1. Akses Vercel Dashboard → Project → **Functions** tab
2. Cek apakah build berhasil tanpa error

### Test API Endpoints
Kunjungi URL production dan test endpoints:

```bash
# Test materials endpoint
curl https://your-app.vercel.app/api/materials

# Expected response: [] or array of materials
```

### Cek Database Connection
```bash
# Via Vercel function logs
# Check if you see: "Database connection successful"
```

## 🐛 Troubleshooting Common Issues

### Issue: 500 Internal Server Error

**Penyebab**: Database connection failed

**Solusi**:
1. Cek `DATABASE_URL` di Vercel environment variables
2. Pastikan Supabase project aktif
3. Verify database credentials benar
4. Cek Supabase connection pooling URL

### Issue: TypeError: c.reduce is not a function

**Penyebab**: Frontend expecting array tapi mendapat `null`/`undefined`

**Solusi**: API routes sudah diperbaiki untuk return array kosong jika database kosong

### Issue: 401 Unauthorized

**Penyebab**: Authentication failed

**Solusi**:
1. Cek `JWT_SECRET` environment variable
2. Verify Supabase keys benar
3. Pastikan user sudah di-seed ke database

### Issue: Connection Timeout

**Penyebab**: Vercel function timeout atau database slow

**Solusi**:
1. Tambahkan `connection_limit=1` ke DATABASE_URL
2. Gunakan connection pooling URL dari Supabase
3. Cek `vercel.json` untuk `maxDuration: 30`

## 📊 Monitoring & Logs

### Cek Function Logs
1. Vercel Dashboard → Project → **Functions**
2. Klik function name untuk lihat logs
3. Cari error messages atau connection issues

### Database Monitoring
1. Supabase Dashboard → **Reports** → **API Usage**
2. Cek connection limits dan query performance
3. Monitor untuk connection pool exhaustion

## 🔧 Post-Deployment Configuration

### Custom Domain (Opsional)
1. Vercel Dashboard → Project → **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS sesuai instruksi Vercel

### Environment-Specific Builds
Jika butuh different configuration per environment:

```javascript
// vercel.json
{
  "buildCommand": "npm run build",
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["sin1"]
}
```

## 🎯 Performance Optimization

### Database Connection Pooling
- ✅ Sudah dikonfigurasi di `DATABASE_URL` dengan `pgbouncer=true`
- ✅ Connection limit sudah diset ke 1 untuk Vercel

### API Response Caching
Tambahkan caching headers jika perlu:

```javascript
// Di API routes
export async function GET() {
  // ... existing code ...
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300', // Cache 5 minutes
    },
  });
}
```

### Image Optimization
Next.js image optimization sudah aktif by default di Vercel.

## 🔐 Security Best Practices

### Environment Variables
- ✅ Jangan commit sensitive data ke Git
- ✅ Gunakan Vercel environment variables, bukan .env
- ✅ Rotate keys secara berkala

### Database Security
- ✅ Gunakan connection pooling URL
- ✅ Enable SSL connections (sudah aktif)
- ✅ Monitor untuk suspicious activity

## 📞 Support & Help

### Jika Tetap Error:
1. **Cek Vercel function logs** untuk error details
2. **Test database connection** secara lokal dengan same credentials
3. **Verify Supabase project status** - pastikan tidak paused
4. **Check environment variables** - pastikan semua sudah diset

### Useful Commands:
```bash
# Redeploy
vercel --prod

# Check environment variables
vercel env ls

# View build logs
vercel logs --follow
```

---

## ✅ Quick Checklist

- [ ] Environment variables sudah diset di Vercel
- [ ] DATABASE_URL menggunakan connection pooling
- [ ] Supabase project aktif dan accessible
- [ ] Database sudah di-seed dengan data
- [ ] Build berhasil tanpa error
- [ ] API endpoints merespon dengan benar
- [ ] Frontend bisa load data tanpa error

**🎉 Selamat! QuickBom sudah berhasil di-deploy ke Vercel! 🚀**
