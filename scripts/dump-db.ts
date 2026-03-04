import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportTable(modelName: string, fileName: string) {
    console.log(`📦 Exporting ${modelName}...`);
    try {
        // @ts-ignore
        const data = await prisma[modelName].findMany();

        // Handle Decimal and Date types for JSON stringification
        // Prisma's decimal objects stringify to their numeric value string

        const filePath = path.join(process.cwd(), 'data', fileName);

        // Ensure data directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ Exported ${data.length} records to ${fileName}`);
        return data.length;
    } catch (error) {
        console.error(`❌ Failed to export ${modelName}:`, error);
        return 0;
    }
}

async function main() {
    console.log('🚀 Starting Database Export...');

    const tables = [
        { model: 'user', file: 'user.json' },
        { model: 'client', file: 'client.json' },
        { model: 'assemblyCategory', file: 'assemblyCategory.json' },
        { model: 'assembly', file: 'assembly.json' },
        { model: 'assemblyMaterial', file: 'assemblyMaterial.json' },
        { model: 'assemblyGroup', file: 'assemblyGroup.json' },
        { model: 'assemblyGroupItem', file: 'assemblyGroupItem.json' },
        { model: 'template', file: 'template.json' },
        { model: 'templateAssembly', file: 'templateAssembly.json' },
        { model: 'templateAssemblyGroup', file: 'templateAssemblyGroup.json' },
        { model: 'templateAssemblyGroupItem', file: 'templateAssemblyGroupItem.json' },
        { model: 'project', file: 'project.json' },
    ];

    let totalRecords = 0;
    for (const table of tables) {
        const count = await exportTable(table.model, table.file);
        totalRecords += count;
    }

    console.log(`\n🎉 Export Complete! Total records exported: ${totalRecords}`);
    console.log(`📂 Files are stored in the /data directory.`);

    await prisma.$disconnect();
}

main().catch(err => {
    console.error('Fatal error during export:', err);
    process.exit(1);
});
