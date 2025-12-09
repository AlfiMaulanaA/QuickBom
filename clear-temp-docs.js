const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearTempDocs() {
  console.log('🧹 Starting cleanup of temporary documents...');

  try {
    // Get all assemblies with docs
    const assemblies = await prisma.assembly.findMany({
      where: {
        docs: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        docs: true
      }
    });

    console.log(`📋 Found ${assemblies.length} assemblies to check`);

    let totalCleaned = 0;
    let assembliesAffected = 0;

    for (const assembly of assemblies) {
      if (!assembly.docs || !Array.isArray(assembly.docs)) continue;

      // Filter out temporary docs
      const validDocs = assembly.docs.filter(doc => !doc.url.startsWith('#temp-'));
      const tempDocs = assembly.docs.filter(doc => doc.url.startsWith('#temp-'));

      if (tempDocs.length > 0) {
        console.log(`🗑️  Cleaning assembly "${assembly.name}" (${assembly.id}):`);
        tempDocs.forEach(doc => {
          console.log(`   - Removing: ${doc.name} (${doc.url})`);
        });

        // Update assembly with cleaned docs
        await prisma.assembly.update({
          where: { id: assembly.id },
          data: {
            docs: validDocs.length > 0 ? validDocs : []
          }
        });

        totalCleaned += tempDocs.length;
        assembliesAffected++;
      }
    }

    console.log('\n✅ Cleanup completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Assemblies affected: ${assembliesAffected}`);
    console.log(`   - Temporary docs removed: ${totalCleaned}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearTempDocs();
