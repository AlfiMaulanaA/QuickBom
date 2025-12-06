ubuntu@ubuntu-Alfi-Maulana:~/Alfi/RnD/GSPE_TECH/QuickBom$ NODE_ENV=production npx prisma generate
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.0) to ./node_modules/@prisma/client in 251ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate

ubuntu@ubuntu-Alfi-Maulana:~/Alfi/RnD/GSPE_TECH/QuickBom$ NODE_ENV=production npx prisma db push
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "quickbom", schema "public" at "localhost:5432"

The database is already in sync with the Prisma schema.

✔ Generated Prisma Client (v6.19.0) to ./node_modules/@prisma/client in 202ms

ubuntu@ubuntu-Alfi-Maulana:~/Alfi/RnD/GSPE_TECH/QuickBom$ NODE_ENV=production npx prisma migrate deploy
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "quickbom", schema "public" at "localhost:5432"

1 migration found in prisma/migrations

Error: P3005

The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline

ubuntu@ubuntu-Alfi-Maulana:~/Alfi/RnD/GSPE_TECH/QuickBom$ table tidak tergenrate di supabase