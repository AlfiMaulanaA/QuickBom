const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixInvalidDocs() {
  console.log('🔍 Checking for invalid docs data...');

  // Check Templates with invalid docs
  const templates = await prisma.template.findMany({
    select: { id: true, name: true, docs: true }
  });

  let fixedTemplates = 0;
  for (const template of templates) {
    if (template.docs && typeof template.docs === 'string') {
      console.log(`📄 Fixing template ${template.id} (${template.name}): ${template.docs}`);

      // Convert string path to proper array format or set to empty array
      const fixedDocs = template.docs.startsWith('/docs/') || template.docs.startsWith('/uploads/')
        ? [{
            name: template.docs.split('/').pop(),
            url: template.docs,
            size: 0,
            type: 'application/octet-stream',
            uploadedAt: new Date().toISOString()
          }]
        : [];

      await prisma.template.update({
        where: { id: template.id },
        data: { docs: fixedDocs }
      });

      fixedTemplates++;
    }
  }

  // Check Assemblies with invalid docs
  const assemblies = await prisma.assembly.findMany({
    select: { id: true, name: true, docs: true }
  });

  let fixedAssemblies = 0;
  for (const assembly of assemblies) {
    if (assembly.docs && typeof assembly.docs === 'string') {
      console.log(`🏗️ Fixing assembly ${assembly.id} (${assembly.name}): ${assembly.docs}`);

      const fixedDocs = assembly.docs.startsWith('/docs/') || assembly.docs.startsWith('/uploads/')
        ? [{
            name: assembly.docs.split('/').pop(),
            url: assembly.docs,
            size: 0,
            type: 'application/octet-stream',
            uploadedAt: new Date().toISOString()
          }]
        : [];

      await prisma.assembly.update({
        where: { id: assembly.id },
        data: { docs: fixedDocs }
      });

      fixedAssemblies++;
    }
  }

  // Check Projects with invalid docs
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, schematicDocs: true, qualityCheckDocs: true }
  });

  let fixedProjects = 0;
  for (const project of projects) {
    let updated = false;

    if (project.schematicDocs && typeof project.schematicDocs === 'string') {
      console.log(`🏗️ Fixing project ${project.id} schematicDocs: ${project.schematicDocs}`);
      const fixedDocs = project.schematicDocs.startsWith('/docs/') || project.schematicDocs.startsWith('/uploads/')
        ? [{
            name: project.schematicDocs.split('/').pop(),
            url: project.schematicDocs,
            size: 0,
            type: 'application/octet-stream',
            uploadedAt: new Date().toISOString()
          }]
        : [];

      await prisma.project.update({
        where: { id: project.id },
        data: { schematicDocs: fixedDocs }
      });
      updated = true;
    }

    if (project.qualityCheckDocs && typeof project.qualityCheckDocs === 'string') {
      console.log(`🏗️ Fixing project ${project.id} qualityCheckDocs: ${project.qualityCheckDocs}`);
      const fixedDocs = project.qualityCheckDocs.startsWith('/docs/') || project.qualityCheckDocs.startsWith('/uploads/')
        ? [{
            name: project.qualityCheckDocs.split('/').pop(),
            url: project.qualityCheckDocs,
            size: 0,
            type: 'application/octet-stream',
            uploadedAt: new Date().toISOString()
          }]
        : [];

      await prisma.project.update({
        where: { id: project.id },
        data: { qualityCheckDocs: fixedDocs }
      });
      updated = true;
    }

    if (updated) fixedProjects++;
  }

  console.log(`✅ Fixed ${fixedTemplates} templates, ${fixedAssemblies} assemblies, ${fixedProjects} projects`);

  await prisma.$disconnect();
}

fixInvalidDocs().catch(console.error);