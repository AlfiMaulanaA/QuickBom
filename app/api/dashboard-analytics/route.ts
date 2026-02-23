import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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

    // Fetch from parallel sources
    // Note: materials now come from External CRM, not local DB
    const [
      assemblies,
      templates,
      projects,
      users,
      assemblyMaterials,
      templateAssemblies
    ] = await Promise.all([
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

    // Materials Analytics (Derived from AssemblyMaterial snapshots)
    // @ts-ignore
    const materialsTotal = assemblyMaterials.length > 0
      ? new Set(assemblyMaterials.map((am: any) => am.externalId)).size
      : 0;

    // @ts-ignore
    const materialsValue = assemblyMaterials.reduce((sum: number, am: any) => sum + (Number(am.price || 0) * Number(am.quantity || 0)), 0);

    // @ts-ignore
    const materialsWithPrices = assemblyMaterials.filter((am: any) => Number(am.price || 0) > 0).length;

    // @ts-ignore
    const topExpensive = assemblyMaterials
      .sort((a, b) => Number((b as any).price || 0) - Number((a as any).price || 0))
      .slice(0, 5)
      .map((am: any) => ({
        name: am.name || `Material ${am.externalId}`,
        price: Number(am.price || 0)
      }));

    // @ts-ignore
    const uniqueManufacturers = [...new Set(assemblyMaterials.map((am: any) => am.manufacturer).filter(Boolean))];
    // @ts-ignore
    const uniqueUnits = [...new Set(assemblyMaterials.map((am: any) => am.unit))];

    // Assemblies
    const assembliesTotal = assemblies.length;
    const assembliesValue = materialsValue; // Simple sum for dashboard
    const avgComplexity = assembliesTotal > 0 ? assemblyMaterials.length / assembliesTotal : 0;

    // Templates
    const templatesTotal = templates.length;
    const activeProjects = projects.length;
    const avgAssemblies = templatesTotal > 0 ? templateAssemblies.length / templatesTotal : 0;

    // Projects
    const projectsTotal = projects.length;
    const projectsValue = projects.reduce((sum, p) => sum + Number(p.totalPrice || 0), 0);
    const avgProjectValue = projectsTotal > 0 ? projectsValue / projectsTotal : 0;

    const statusBreakdown = {
      completed: projects.filter(p => p.status === 'COMPLETED').length,
      inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
      planning: projects.filter(p => p.status === 'PLANNING').length,
      cancelled: projects.filter(p => p.status === 'CANCELLED').length,
      delayed: projects.filter(p => p.status === 'DELAYED').length
    };

    // Monthly Growth
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

    // Users
    const usersTotal = users.length;
    const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
    const byRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLogins = users.filter(u => u.lastLogin && new Date(u.lastLogin) > sevenDaysAgo).length;

    // Activities
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
        type: 'create' as const,
        entity: 'template' as const,
        name: templates[0]?.name || 'New Template',
        timestamp: templates[0]?.createdAt.toISOString() || new Date().toISOString(),
        user: 'Manager',
        impact: 'high' as const
      },
      {
        id: '3',
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
        recentCount: 0,
        withPrices: materialsWithPrices,
        withoutPrices: materialsTotal - materialsWithPrices,
        manufacturersCount: uniqueManufacturers.length,
        unitTypesCount: uniqueUnits.length,
        categoriesCount: 0
      },
      assemblies: {
        total: assembliesTotal,
        totalValue: assembliesValue,
        avgComplexity,
        topUsed: []
      },
      templates: {
        total: templatesTotal,
        activeProjects,
        avgAssemblies,
        mostPopular: []
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
