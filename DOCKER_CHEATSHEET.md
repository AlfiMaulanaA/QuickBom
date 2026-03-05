# 🐳 QuickBom Docker Cheat Sheet

Panduan praktis untuk manajemen deployment dan database (seeding/migration) menggunakan Docker.

## 🚀 Deployment Utama

| Perintah | Deskripsi |
| :--- | :--- |
| `docker-compose up -d` | Menjalankan aplikasi di background. |
| `docker-compose down` | Menghentikan dan menghapus container. |
| `docker-compose logs -f` | Melihat log aplikasi secara real-time. |
| `docker-compose ps` | Mengecek status kesehatan (Healthy/Unhealthy) container. |
| `docker-compose build --no-cache` | Membangun ulang image (Gunakan ini jika ada perubahan kode). |

---

## 🏗️ Database, Migration & Seeding

Project ini menggunakan layanan khusus bernama `migration` untuk mengelola skema dan data awal. Layanan ini hanya berjalan jika dipanggil secara manual.

### 1. Inisialisasi Database (Pertama Kali)
Gunakan profil `migration` untuk sinkronisasi skema Prisma dan memasukkan semua data seed.
```bash
docker-compose --profile migration up migration
```

### 2. Seeding Data Spesifik
Jika Anda ingin melakukan seed hanya untuk modul tertentu:
```bash
# Seed User saja
docker-compose --profile migration run --rm migration sh -c "npm run db:seed:users"

# Seed Client saja
docker-compose --profile migration run --rm migration sh -c "npm run db:seed:clients"
```

### 3. Reset Database (Hati-hati!)
Untuk menghapus semua data dan memulai dari awal:
```bash
docker-compose --profile migration run --rm migration sh -c "npm run db:clear && npm run db:seed"
```

---

## 🛠️ Pemeliharaan (Maintenance)

### Masuk ke Shell Database
Jika ingin menjalankan query SQL secara manual:
```bash
docker exec -it product-configurator-db psql -U quickbom -d quickbom
```

### Mengecek Koneksi Prisma
Untuk melihat status koneksi database dari sisi aplikasi secara langsung (menggunakan endpoint yang baru dibuat):
```bash
curl http://localhost:3200/api/health
```

### Update Environment Variable
Jika ada perubahan di file `.env`, Anda harus merestart container:
```bash
docker-compose up -d --force-recreate
```

---

## 📁 Lokasi Data Penting
*   **Uploads**: `./uploads` (Host) -> `/app/uploads` (Container)
*   **Backups**: `./backups` (Host) -> `/app/backups` (Container)
*   **Database**: Volume `postgres_data` (Managed by Docker)
