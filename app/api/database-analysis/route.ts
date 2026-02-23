import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/database-analysis - Get comprehensive database analysis
export async function GET() {
  try {
    // Get counts for all main entities
    const [
      assembliesCount,
      templatesCount,
      usersCount,
      projectsCount,
      assemblyMaterialsCount,
      templateAssembliesCount
    ] = await Promise.all([
      prisma.assembly.count(),
      prisma.template.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.assemblyMaterial.count(),
      prisma.templateAssembly.count()
    ]);

    // Get recently created entities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAssemblies = await prisma.assembly.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const recentTemplates = await prisma.template.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const recentProjects = await prisma.project.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // Materials analysis (derived from AssemblyMaterial snapshots)
    const assemblyMaterials = await prisma.assemblyMaterial.findMany({
      select: {
        externalId: true,
        price: true,
        manufacturer: true,
        unit: true,
        createdAt: true
      }
    });

    const uniqueMaterialsCount = new Set(assemblyMaterials.map(am => am.externalId)).size;
    const recentMaterialsCount = assemblyMaterials.filter(am => am.createdAt >= thirtyDaysAgo).length;

    // Price statistics from snapshots
    const prices = assemblyMaterials.map(am => Number(am.price)).filter(p => p > 0);
    const priceStats = {
      average: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
      count: prices.length
    };

    const manufacturerCounts = assemblyMaterials.reduce((acc: any, am) => {
      if (am.manufacturer) {
        acc[am.manufacturer] = (acc[am.manufacturer] || 0) + 1;
      }
      return acc;
    }, {});

    const materialsByManufacturer = Object.entries(manufacturerCounts)
      .map(([manufacturer, count]) => ({ manufacturer, _count: { manufacturer: count } }))
      .sort((a, b) => (b._count.manufacturer as number) - (a._count.manufacturer as number))
      .slice(0, 10);

    const unitCounts = assemblyMaterials.reduce((acc: any, am) => {
      acc[am.unit] = (acc[am.unit] || 0) + 1;
      return acc;
    }, {});

    const materialsByUnit = Object.entries(unitCounts)
      .map(([unit, count]) => ({ unit, _count: { unit: count } }));

    // Get assembly complexity analysis (materials per assembly)
    const assemblyComplexity = await prisma.assembly.findMany({
      include: {
        _count: {
          select: { materials: true }
        }
      }
    });

    const complexityStats = assemblyComplexity.reduce((acc, assembly) => {
      const count = assembly._count.materials;
      acc.totalMaterials += count;
      acc.assembliesWithMaterials += count > 0 ? 1 : 0;
      acc.maxMaterials = Math.max(acc.maxMaterials, count);
      acc.minMaterials = count < acc.minMaterials && count > 0 ? count : acc.minMaterials;
      return acc;
    }, {
      totalMaterials: 0,
      assembliesWithMaterials: 0,
      maxMaterials: 0,
      minMaterials: Infinity
    });

    const avgMaterialsPerAssembly = complexityStats.assembliesWithMaterials > 0
      ? (complexityStats.totalMaterials / complexityStats.assembliesWithMaterials).toFixed(1)
      : '0';

    // Calculate estimated database size (rough estimate)
    const estimatedSize = (
      uniqueMaterialsCount * 1024 + // ~1KB per material
      assembliesCount * 512 +  // ~0.5KB per assembly
      templatesCount * 256 +   // ~0.25KB per template
      usersCount * 2048 +      // ~2KB per user
      projectsCount * 1024 +   // ~1KB per project
      assemblyMaterialsCount * 64 + // ~64B per relationship
      templateAssembliesCount * 64  // ~64B per relationship
    );

    const analysis = {
      summary: {
        totalEntities: uniqueMaterialsCount + assembliesCount + templatesCount + usersCount + projectsCount,
        totalRelationships: assemblyMaterialsCount + templateAssembliesCount,
        estimatedSize,
        lastUpdated: new Date().toISOString()
      },
      entities: {
        materials: {
          count: uniqueMaterialsCount,
          recent: recentMaterialsCount,
          priceStats: {
            average: priceStats.average || 0,
            min: priceStats.min || 0,
            max: priceStats.max || 0,
            withPrices: priceStats.count || 0
          },
          byManufacturer: materialsByManufacturer,
          byUnit: materialsByUnit
        },
        assemblies: {
          count: assembliesCount,
          recent: recentAssemblies,
          complexity: {
            averageMaterialsPerAssembly: avgMaterialsPerAssembly,
            maxMaterials: complexityStats.maxMaterials,
            minMaterials: complexityStats.minMaterials === Infinity ? 0 : complexityStats.minMaterials,
            totalMaterialRelationships: complexityStats.totalMaterials
          }
        },
        templates: {
          count: templatesCount,
          recent: recentTemplates
        },
        users: {
          count: usersCount
        },
        projects: {
          count: projectsCount,
          recent: recentProjects
        }
      },
      relationships: {
        assemblyMaterials: assemblyMaterialsCount,
        templateAssemblies: templateAssembliesCount
      },
      activity: {
        period: 'last_30_days',
        materialsAdded: recentMaterialsCount,
        assembliesCreated: recentAssemblies,
        templatesCreated: recentTemplates,
        projectsCreated: recentProjects
      }
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Database analysis error:', error);
    return NextResponse.json(
      { error: "Failed to analyze database" },
      { status: 500 }
    );
  }
}
