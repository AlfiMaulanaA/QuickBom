import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Environment-aware database setup
const isProduction = process.env.NODE_ENV === 'production';
const url = isProduction
    ? (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
    : process.env.DATABASE_URL;

if (!url) {
    console.error(`❌ Error: DATABASE_URL (or SUPABASE_DATABASE_URL) is required for ${isProduction ? 'production' : 'development'}`);
    process.exit(1);
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: url,
        },
    },
});

// List of all models to dump
// We could dynamically get this from Prisma.dmmf, but a manual list is safer and simpler for a standalone script
const models = [
    'user',
    'client',
    'assemblyCategory',
    'material',
    'assembly',
    'assemblyMaterial',
    'template',
    'templateAssembly',
    'project',
    'projectTimeline',
    'projectMilestone',
    'projectTask',
    'taskDependency',
    'assemblyGroup',
    'assemblyGroupItem',
    'projectOverride',
    'projectOverrideHistory'
];

async function dumpData() {
    const dataDir = path.join(process.cwd(), 'data');

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`Created directory: ${dataDir}`);
    }

    console.log(`Starting database dump to ${dataDir}...`);
    console.log(`Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not Set'}`);

    for (const modelName of models) {
        try {
            console.log(`Fetching data for model: ${modelName}...`);

            // @ts-ignore - Dynamic access to prisma models
            const data = await prisma[modelName].findMany();

            const filePath = path.join(dataDir, `${modelName}.json`);

            // Custom replacer to handle BigInt and Decimal
            const jsonString = JSON.stringify(data, (key, value) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                if (value && typeof value === 'object' && value.constructor.name === 'Decimal') {
                    return value.toString();
                }
                return value;
            }, 2);

            fs.writeFileSync(filePath, jsonString);
            console.log(`✅ Saved ${data.length} records to ${modelName}.json`);
        } catch (error) {
            console.error(`❌ Failed to dump model ${modelName}:`, error);
        }
    }

    console.log('Database dump completed!');
}

dumpData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
