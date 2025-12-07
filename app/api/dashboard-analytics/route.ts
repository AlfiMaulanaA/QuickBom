import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface DashboardAnalytics {
  materials: {
    total: number;
    totalValue: number;
    topExpensive: Array<{ name: string; price: number }>;
    recentCount: number;
    withPrices: number;
    withoutPrices: number;
    manufacturersCount: number;
    unitTypesCount: number;
    categoriesCount: number;
  };
  assemblies: {
    total: number;
    totalValue: number;
    avgComplexity: number;
    topUsed: Array<{ name: string; usageCount: number }>;
  };
  templates: {
    total: number;
    activeProjects: number;
    avgAssemblies: number;
    mostPopular: Array<{ name: string; projectCount: number }>;
  };
  projects: {
    total: number;
    totalValue: number;
    avgValue: number;
    statusBreakdown: { completed: number; inProgress: number; planning: number; cancelled: number; delayed: number };
    monthlyGrowth: Array<{ month: string; count: number; value: number }>;
    recentProjects: Array<{
      id: number;
      name: string;
      status: string;
      totalPrice: number;
      createdAt: string;
    }>;
  };
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
    recentLogins: number;
  };
  activities: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: 'material' | 'assembly' | 'template' | 'project' | 'user';
    name: string;
    timestamp: string;
    user?: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export async function GET() {
  try {
    console.log('[DASHBOARD-ANALYTICS] Starting analytics calculation');

    // Fetch all data in parallel for better performance
    const [
      materials,
      assemblies,
      templates,
      projects,
      users,
      assemblyMaterials,
      templateAssemblies
    ] = await Promise.all([
      prisma.material.findMany({
        select: { id: true, name: true, price: true, manufacturer: true, unit: true, createdAt: true }
      }),
      prisma.assembly.findMany({
        select: { id: true, name: true, createdAt: true }
      }),
      prisma.template.findMany({
        select: { id: true, name: true, createdAt: true }
      }),
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          totalPrice: true,
          createdAt: true,
          createdBy: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          role: true,
          status: true,
          lastLogin: true,
          createdAt: true
        }
      }),
      prisma.assemblyMaterial.findMany(),
      prisma.templateAssembly.findMany()
    ]);

    console.log('[DASHBOARD-ANALYTICS] Data fetched successfully');

    // Calculate materials analytics
    const materialsTotal = materials.length;
    const materialsValue = materials.reduce((sum, m) => sum + Number(m.price || 0), 0);
    const materialsWithPrices = materials.filter(m => Number(m.price || 0) > 0).length;
    const materialsWithoutPrices = materialsTotal - materialsWithPrices;

    const topExpensive = materials
      .filter(m => Number(m.price || 0) > 0)
      .sort((a, b) => Number(b.price) - Number(a.price))
      .slice(0, 5)
      .map(m => ({ name: m.name, price: Number(m.price) }));

    const uniqueManufacturers = [...new Set(materials.map(m => m.manufacturer).filter(Boolean))];
    const uniqueUnits = [...new Set(materials.map(m => m.unit))];

    // Calculate recent materials (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentMaterials = materials.filter(m => new Date(m.createdAt) > thirtyDaysAgo);

    // Calculate assemblies analytics
    const assembliesTotal = assemblies.length;

    // Calculate assembly values (sum of material costs * quantities)
    const assembliesValue = assemblyMaterials.reduce((sum, am) => {
      const material = materials.find(m => m.id === am.materialId);
      if (material) {
        return sum + (Number(material.price || 0) * Number(am.quantity || 0));
      }
      return sum;
    }, 0);

    // Calculate average complexity (materials per assembly)
    const avgComplexity = assembliesTotal > 0 ?
      assemblyMaterials.length / assembliesTotal : 0;

    // Calculate templates analytics
    const templatesTotal = templates.length;
    const activeProjects = projects.length; // All projects are considered active for now
    const avgAssemblies = templatesTotal > 0 ?
      templateAssemblies.length / templatesTotal : 0;

    // Calculate projects analytics
    const projectsTotal = projects.length;
    const projectsValue = projects.reduce((sum, p) => sum + Number(p.totalPrice || 0), 0);
    const avgProjectValue = projectsTotal > 0 ? projectsValue / projectsTotal : 0;

    // Calculate project status breakdown
    const statusBreakdown = {
      completed: projects.filter(p => p.status === 'COMPLETED').length,
      inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
      planning: projects.filter(p => p.status === 'PLANNING').length,
      cancelled: projects.filter(p => p.status === 'CANCELLED').length,
      delayed: projects.filter(p => p.status === 'DELAYED').length
    };

    // Calculate monthly growth (last 6 months)
    const monthlyGrowth = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthProjects = projects.filter(p => {
        const created = new Date(p.createdAt);
        return created >= monthStart && created <= monthEnd;
      });

      const monthValue = monthProjects.reduce((sum, p) => sum + Number(p.totalPrice || 0), 0);

      monthlyGrowth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        count: monthProjects.length,
        value: monthValue
      });
    }

    // Calculate users analytics
    const usersTotal = users.length;
    const activeUsers = users.filter(u => u.status === 'ACTIVE').length;

    const byRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent logins (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLogins = users.filter(u =>
      u.lastLogin && new Date(u.lastLogin) > sevenDaysAgo
    ).length;

    // Generate recent activities (mock for now - in real app, this would come from audit logs)
    const activities = [
      {
        id: '1',
        type: 'create' as const,
        entity: 'project' as const,
        name: projects[0]?.name || 'New Project',
        timestamp: projects[0]?.createdAt.toISOString() || new Date().toISOString(),
        user: 'System',
        impact: 'high' as const
      },
      {
        id: '2',
        type: 'update' as const,
        entity: 'material' as const,
        name: materials[0]?.name || 'Updated Material',
        timestamp: materials[0]?.createdAt.toISOString() || new Date().toISOString(),
        user: 'Admin',
        impact: 'medium' as const
      },
      {
        id: '3',
        type: 'create' as const,
        entity: 'template' as const,
        name: templates[0]?.name || 'New Template',
        timestamp: templates[0]?.createdAt.toISOString() || new Date().toISOString(),
        user: 'Manager',
        impact: 'high' as const
      },
      {
        id: '4',
        type: 'update' as const,
        entity: 'assembly' as const,
        name: assemblies[0]?.name || 'Updated Assembly',
        timestamp: assemblies[0]?.createdAt.toISOString() || new Date().toISOString(),
        user: 'Engineer',
        impact: 'low' as const
      }
    ];

    const analytics: DashboardAnalytics = {
      materials: {
        total: materialsTotal,
        totalValue: materialsValue,
        topExpensive,
        recentCount: recentMaterials.length,
        withPrices: materialsWithPrices,
        withoutPrices: materialsWithoutPrices,
        manufacturersCount: uniqueManufacturers.length,
        unitTypesCount: uniqueUnits.length,
        categoriesCount: Math.max(1, Math.ceil(materialsTotal / 10)) // Rough estimate
      },
      assemblies: {
        total: assembliesTotal,
        totalValue: assembliesValue,
        avgComplexity,
        topUsed: [] // Would need more complex query to calculate usage
      },
      templates: {
        total: templatesTotal,
        activeProjects,
        avgAssemblies,
        mostPopular: [] // Would need more complex query
      },
      projects: {
        total: projectsTotal,
        totalValue: projectsValue,
        avgValue: avgProjectValue,
        statusBreakdown,
        monthlyGrowth,
        recentProjects: projects.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          totalPrice: Number(p.totalPrice),
          createdAt: p.createdAt.toISOString()
        }))
      },
      users: {
        total: usersTotal,
        active: activeUsers,
        byRole,
        recentLogins
      },
      activities
    };

    console.log('[DASHBOARD-ANALYTICS] Analytics calculated successfully');

    return NextResponse.json(analytics);

  } catch (error: any) {
    console.error('[DASHBOARD-ANALYTICS] Error calculating analytics:', error);

    return NextResponse.json({
      error: "Failed to calculate dashboard analytics",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
