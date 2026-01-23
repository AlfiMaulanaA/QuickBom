const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL
});

async function fixProductionData() {
  console.log('🔍 Fixing production database data...');

  try {
    // Fix Templates with invalid docs
    console.log('📄 Fixing templates...');
    const templates = await prisma.template.findMany({
      select: { id: true, name: true, docs: true }
    });

    for (const template of templates) {
      if (template.docs && typeof template.docs === 'string') {
        console.log(`Fixing template ${template.id}: ${template.docs}`);
        await prisma.template.update({
          where: { id: template.id },
          data: { docs: [] }
        });
      }
    }

    // Fix Assemblies with invalid docs
    console.log('🏗️ Fixing assemblies...');
    const assemblies = await prisma.assembly.findMany({
      select: { id: true, name: true, docs: true }
    });

    for (const assembly of assemblies) {
      if (assembly.docs && typeof assembly.docs === 'string') {
        console.log(`Fixing assembly ${assembly.id}: ${assembly.docs}`);
        await prisma.assembly.update({
          where: { id: assembly.id },
          data: { docs: [] }
        });
      }
    }

    // Fix Projects with invalid docs
    console.log('🏗️ Fixing projects...');
    const projects = await prisma.project.findMany({
      select: { id: true, name: true, schematicDocs: true, qualityCheckDocs: true }
    });

    for (const project of projects) {
      const updates = {};

      if (project.schematicDocs && typeof project.schematicDocs === 'string') {
        console.log(`Fixing project ${project.id} schematicDocs`);
        updates.schematicDocs = null;
      }

      if (project.qualityCheckDocs && typeof project.qualityCheckDocs === 'string') {
        console.log(`Fixing project ${project.id} qualityCheckDocs`);
        updates.qualityCheckDocs = null;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.project.update({
          where: { id: project.id },
          data: updates
        });
      }
    }

    console.log('✅ Production data fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing production data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixProductionData();
}

module.exports = { fixProductionData };