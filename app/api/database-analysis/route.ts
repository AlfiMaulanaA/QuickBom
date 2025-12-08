import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/database-analysis - Get comprehensive database analysis
export async function GET() {
  try {
    // Get counts for all main entities
    const [
      materialsCount,
      assembliesCount,
      templatesCount,
      usersCount,
      projectsCount,
      assemblyMaterialsCount,
      templateAssembliesCount
    ] = await Promise.all([
      prisma.material.count(),
      prisma.assembly.count(),
      prisma.template.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.assemblyMaterial.count(),
      prisma.templateAssembly.count()
    ]);

    // Get detailed material analysis
    const materialsByManufacturer = await prisma.material.groupBy({
      by: ['manufacturer'],
      _count: { manufacturer: true },
      orderBy: { _count: { manufacturer: 'desc' } },
      take: 10
    });

    const materialsByUnit = await prisma.material.groupBy({
      by: ['unit'],
      _count: { unit: true },
      orderBy: { _count: { unit: 'desc' } }
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMaterials = await prisma.material.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const recentAssemblies = await prisma.assembly.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const recentTemplates = await prisma.template.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const recentProjects = await prisma.project.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // Get average prices and value analysis
    const priceStats = await prisma.material.aggregate({
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: { price: true }
    });

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
      materialsCount * 1024 + // ~1KB per material
      assembliesCount * 512 +  // ~0.5KB per assembly
      templatesCount * 256 +   // ~0.25KB per template
      usersCount * 2048 +      // ~2KB per user
      projectsCount * 1024 +   // ~1KB per project
      assemblyMaterialsCount * 64 + // ~64B per relationship
      templateAssembliesCount * 64  // ~64B per relationship
    );

    const analysis = {
      summary: {
        totalEntities: materialsCount + assembliesCount + templatesCount + usersCount + projectsCount,
        totalRelationships: assemblyMaterialsCount + templateAssembliesCount,
        estimatedSize,
        lastUpdated: new Date().toISOString()
      },
      entities: {
        materials: {
          count: materialsCount,
          recent: recentMaterials,
          priceStats: {
            average: priceStats._avg.price || 0,
            min: priceStats._min.price || 0,
            max: priceStats._max.price || 0,
            withPrices: priceStats._count.price || 0
          },
          byManufacturer: materialsByManufacturer.slice(0, 5),
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
        materialsAdded: recentMaterials,
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
