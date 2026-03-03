import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Clearing database...');

    const tablenames = [
        'User',
        'Client',
        'AssemblyCategory',
        'Assembly',
        'AssemblyMaterial',
        'Template',
        'TemplateAssemblyGroup',
        'TemplateAssemblyGroupItem',
        'TemplateAssembly',
        'Project',
        'AssemblyGroup',
        'AssemblyGroupItem',
        'ChatSession',
        'ChatMessage',
    ];

    try {
        for (const tablename of tablenames) {
            console.log(`   - Truncating ${tablename}...`);
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
        }
        console.log('✅ Database cleared successfully!');
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
