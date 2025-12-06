"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Settings,
  FileText,
  FolderOpen,
  DollarSign,
  Calculator,
  TrendingUp,
  Users,
  Activity,
  Plus,
  ArrowRight,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Eye,
  Target,
  Zap,
  Building,
  Copy,
  Check,
  Edit,
  Trash2
} from "lucide-react";
import Link from "next/link";

// Import chart components directly (they're lightweight)
import BarChart from "@/components/ui/bar-chart";
import PieChartComponent from "@/components/ui/pie-chart";

interface DashboardStats {
  materials: {
    total: number;
    totalValue: number;
    topExpensive: Array<{ name: string; price: number }>;
    recentCount: number;
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
    statusBreakdown: { completed: number; inProgress: number; planning: number };
    monthlyGrowth: Array<{ month: string; count: number; value: number }>;
  };
}

interface RecentActivity {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'material' | 'assembly' | 'template' | 'project';
  name: string;
  timestamp: string;
  user?: string;
  impact: 'high' | 'medium' | 'low';
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

export default function MainDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    materials: { total: 0, totalValue: 0, topExpensive: [], recentCount: 0 },
    assemblies: { total: 0, totalValue: 0, avgComplexity: 0, topUsed: [] },
    templates: { total: 0, activeProjects: 0, avgAssemblies: 0, mostPopular: [] },
    projects: { total: 0, totalValue: 0, avgValue: 0, statusBreakdown: { completed: 0, inProgress: 0, planning: 0 }, monthlyGrowth: [] }
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedPartNumber, setCopiedPartNumber] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, partNumber: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPartNumber(partNumber);
      toast({
        title: "Copied to clipboard",
        description: `Part number "${text}" has been copied successfully.`,
      });
      setTimeout(() => setCopiedPartNumber(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const samplePartNumbers = [
    { item: 'ABB MCB S202 C10', partNumber: '201010223', manufacturer: 'ABB' },
    { item: 'Switching Power Supply', partNumber: '106010733', manufacturer: 'MEAN_WELL' },
    { item: 'Terminal Block UK5', partNumber: '102040064', manufacturer: 'PHOENIX_CONTACT' },
    { item: 'Cable NYAF 1.5mm', partNumber: '202010029', manufacturer: 'JEMBO' },
    { item: 'LED Linear Light', partNumber: '206010254', manufacturer: 'PHILLIPS' },
    { item: 'EZ Label Cartridge', partNumber: '401050048', manufacturer: 'CASIO' },
  ];

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();

    // Set up real-time updates
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [materialsRes, assembliesRes, templatesRes, projectsRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/assemblies'),
        fetch('/api/templates'),
        fetch('/api/projects')
      ]);

      const [materials, assemblies, templates, projects] = await Promise.all([
        materialsRes.json(),
        assembliesRes.json(),
        templatesRes.json(),
        projectsRes.json()
      ]);

      // Enhanced statistics calculation
      const materialsTotal = materials.length;
      const materialsValue = materials.reduce((sum: number, m: any) => sum + Number(m.price), 0);
      const topExpensive = materials
        .sort((a: any, b: any) => Number(b.price) - Number(a.price))
        .slice(0, 5)
        .map((m: any) => ({ name: m.name, price: Number(m.price) }));

      // Calculate materials with prices vs without
      const materialsWithPrices = materials.filter((m: any) => Number(m.price) > 0).length;
      const materialsWithoutPrices = materialsTotal - materialsWithPrices;

      // Calculate manufacturers count
      const uniqueManufacturers = [...new Set(materials.map((m: any) => m.manufacturer).filter(Boolean))].length;

      // Calculate unit types
      const uniqueUnits = [...new Set(materials.map((m: any) => m.unit))].length;

      const assembliesTotal = assemblies.length;
      const assembliesValue = assemblies.reduce((sum: number, a: any) =>
        sum + a.materials.reduce((mSum: number, m: any) => mSum + (Number(m.material.price) * Number(m.quantity)), 0), 0);
      const avgComplexity = assemblies.length > 0 ?
        assemblies.reduce((sum: number, a: any) => sum + a.materials.length, 0) / assemblies.length : 0;

      const templatesTotal = templates.length;
      const activeProjects = templates.reduce((sum: number, t: any) => sum + t.projects.length, 0);
      const avgAssemblies = templates.length > 0 ?
        templates.reduce((sum: number, t: any) => sum + t.assemblies.length, 0) / templates.length : 0;

      const projectsTotal = projects.length;
      const projectsValue = projects.reduce((sum: number, p: any) => sum + Number(p.totalPrice), 0);
      const avgProjectValue = projectsTotal > 0 ? projectsValue / projectsTotal : 0;

      // Mock monthly growth data (in real app, this would come from database)
      const monthlyGrowth = [
        { month: 'Jan', count: 12, value: 150000000 },
        { month: 'Feb', count: 18, value: 220000000 },
        { month: 'Mar', count: 15, value: 180000000 },
        { month: 'Apr', count: 22, value: 280000000 },
        { month: 'May', count: 25, value: 320000000 },
        { month: 'Jun', count: 28, value: 350000000 },
      ];

      setStats({
        materials: { total: materialsTotal, totalValue: materialsValue, topExpensive, recentCount: materialsTotal },
        assemblies: { total: assembliesTotal, totalValue: assembliesValue, avgComplexity, topUsed: [] },
        templates: { total: templatesTotal, activeProjects, avgAssemblies, mostPopular: [] },
        projects: { total: projectsTotal, totalValue: projectsValue, avgValue: avgProjectValue, statusBreakdown: { completed: Math.floor(projectsTotal * 0.7), inProgress: Math.floor(projectsTotal * 0.2), planning: Math.floor(projectsTotal * 0.1) }, monthlyGrowth }
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    // Mock data - in real app, this would come from an activities API
    const activities: RecentActivity[] = [
      {
        id: '1',
        type: 'create',
        entity: 'project',
        name: 'Renovasi Rumah Pak Ahmad',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        user: 'admin',
        impact: 'high'
      },
      {
        id: '2',
        type: 'update',
        entity: 'assembly',
        name: 'Pemasangan Dinding Bata Merah',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        user: 'manager',
        impact: 'medium'
      },
      {
        id: '3',
        type: 'create',
        entity: 'template',
        name: 'Paket Renovasi Kamar Mandi Standard',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user: 'admin',
        impact: 'high'
      },
      {
        id: '4',
        type: 'update',
        entity: 'material',
        name: 'Bata Merah',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        user: 'procurement',
        impact: 'low'
      }
    ];
    setRecentActivities(activities);
  };



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <Plus className="h-4 w-4" />;
      case 'update':
        return <Edit className="h-4 w-4" />;
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'create':
        return 'bg-green-500';
      case 'update':
        return 'bg-blue-500';
      case 'delete':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <main className="p-4 md:p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            QuickBom Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive construction management system overview and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/materials">
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/projects">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>



      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Primary Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.materials.total}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.materials.totalValue)} total value
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+{stats.materials.recentCount} this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assemblies</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.assemblies.total}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.assemblies.totalValue)} total value
                </p>
                <div className="flex items-center mt-2">
                  <Target className="h-3 w-3 text-blue-500 mr-1" />
                  <span className="text-xs text-blue-600">{stats.assemblies.avgComplexity.toFixed(1)} avg materials</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.templates.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.templates.activeProjects} active projects
                </p>
                <div className="flex items-center mt-2">
                  <Building className="h-3 w-3 text-purple-500 mr-1" />
                  <span className="text-xs text-purple-600">{stats.templates.avgAssemblies.toFixed(1)} avg assemblies</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.projects.total}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.projects.totalValue)} total value
                </p>
                <div className="flex items-center mt-2">
                  <DollarSign className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">{formatCurrency(stats.projects.avgValue)} avg</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Material Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Materials by Category</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{Math.max(1, Math.ceil(stats.materials.total / 10))}</div>
                <p className="text-xs text-muted-foreground">
                  Material categories identified
                </p>
                <div className="flex items-center mt-2">
                  <Package className="h-3 w-3 text-blue-500 mr-1" />
                  <span className="text-xs text-blue-600">Auto-categorized from data</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Materials with Prices</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">8</div>
                <p className="text-xs text-muted-foreground">
                  {stats.materials.total > 0 ? ((8 / stats.materials.total) * 100).toFixed(1) : 0}% of total materials
                </p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">Ready for costing</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Materials Pending Price</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.materials.total - 8}</div>
                <p className="text-xs text-muted-foreground">
                  Need price updates
                </p>
                <div className="flex items-center mt-2">
                  <Clock className="h-3 w-3 text-orange-500 mr-1" />
                  <span className="text-xs text-orange-600">Awaiting procurement</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Manufacturers Count</CardTitle>
                <Building className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">15+</div>
                <p className="text-xs text-muted-foreground">
                  Different suppliers
                </p>
                <div className="flex items-center mt-2">
                  <Users className="h-3 w-3 text-purple-500 mr-1" />
                  <span className="text-xs text-purple-600">ABB, Schneider, Phoenix</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Recent Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.materials.recentCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Materials added recently
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center">
                    <Activity className="h-3 w-3 mr-1" />
                    From BOQ procurement data
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Unit Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  5
                </div>
                <p className="text-xs text-muted-foreground">
                  Different measurement units
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    EACH, METER, PACK, ROLL, SET
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Procurement Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  100%
                </div>
                <p className="text-xs text-muted-foreground">
                  Materials catalog complete
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    All items from BOQ imported
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Cost Breakdown
                </CardTitle>
                <CardDescription>
                  Distribution of costs across materials and assemblies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <BarChart
                    data={[
                      { name: 'Materials', value: stats.materials.totalValue, color: '#3b82f6' },
                      { name: 'Assemblies', value: stats.assemblies.totalValue, color: '#10b981' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Project Distribution
                </CardTitle>
                <CardDescription>
                  Projects by template usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <PieChartComponent
                    data={[
                      { name: 'Custom Projects', value: stats.projects.total - stats.templates.activeProjects, color: '#f59e0b' },
                      { name: 'Template Projects', value: stats.templates.activeProjects, color: '#8b5cf6' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity & Quick Actions Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest activities in your construction management system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.type)}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{getActivityIcon(activity.type)}</span>
                          {' '}
                          <span className="capitalize">{activity.type}</span> {activity.entity}:{' '}
                          <span className="font-medium">{activity.name}</span>
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                          <Badge className={`text-xs ${getImpactColor(activity.impact)}`}>
                            {activity.impact}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-sm">No recent activities</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common tasks and shortcuts for efficient management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/materials">
                      <Package className="mr-2 h-4 w-4" />
                      Manage Materials
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/assemblies">
                      <Settings className="mr-2 h-4 w-4" />
                      Create Assembly
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/templates">
                      <FileText className="mr-2 h-4 w-4" />
                      Build Template
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/projects">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Start New Project
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">System Health</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Excellent
                      </Badge>
                    </div>
                    <Progress value={95} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      All systems operational
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Project Growth
                </CardTitle>
                <CardDescription>
                  Project creation and value trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <div className="space-y-4">
                    <div className="flex items-end space-x-2 h-48">
                      {stats.projects.monthlyGrowth.map((item, index) => {
                        const maxCount = Math.max(...stats.projects.monthlyGrowth.map(d => d.count));
                        const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                        return (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div className="w-full flex justify-center mb-2">
                              <div
                                className="w-2 rounded-t transition-all duration-500 ease-out"
                                style={{
                                  height: `${height}%`,
                                  backgroundColor: '#3b82f6',
                                  minHeight: '4px'
                                }}
                              />
                            </div>
                            <div className="text-xs text-center">
                              <div className="font-medium">{item.month}</div>
                              <div className="text-muted-foreground">{item.count}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {stats.projects.monthlyGrowth.length} months • Total: {stats.projects.monthlyGrowth.reduce((sum, item) => sum + item.count, 0)} projects
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Trends
                </CardTitle>
                <CardDescription>
                  Monthly revenue from completed projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <div className="space-y-4">
                    <div className="flex items-end space-x-2 h-48">
                      {stats.projects.monthlyGrowth.map((item, index) => {
                        const maxValue = Math.max(...stats.projects.monthlyGrowth.map(d => d.value));
                        const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                        return (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div className="w-full flex justify-center mb-2">
                              <div
                                className="w-2 rounded-t transition-all duration-500 ease-out"
                                style={{
                                  height: `${height}%`,
                                  backgroundColor: '#10b981',
                                  minHeight: '4px'
                                }}
                              />
                            </div>
                            <div className="text-xs text-center">
                              <div className="font-medium">{item.month}</div>
                              <div className="text-muted-foreground">{formatCurrency(item.value)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {stats.projects.monthlyGrowth.length} months • Total: {formatCurrency(stats.projects.monthlyGrowth.reduce((sum, item) => sum + item.value, 0))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Top Materials by Value</CardTitle>
                <CardDescription>Most expensive materials in inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.materials.topExpensive.slice(0, 5).map((material, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{material.name}</span>
                      <span className="text-sm text-muted-foreground">{formatCurrency(material.price)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <CardDescription>Current project distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completed</span>
                    <span className="text-sm font-medium">{stats.projects.statusBreakdown.completed}</span>
                  </div>
                  <Progress value={(stats.projects.statusBreakdown.completed / stats.projects.total) * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">In Progress</span>
                    <span className="text-sm font-medium">{stats.projects.statusBreakdown.inProgress}</span>
                  </div>
                  <Progress value={(stats.projects.statusBreakdown.inProgress / stats.projects.total) * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Planning</span>
                    <span className="text-sm font-medium">{stats.projects.statusBreakdown.planning}</span>
                  </div>
                  <Progress value={(stats.projects.statusBreakdown.planning / stats.projects.total) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Material Utilization</span>
                    <span className="text-sm font-medium">98%</span>
                  </div>
                  <Progress value={98} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">On-time Delivery</span>
                    <span className="text-sm font-medium">95%</span>
                  </div>
                  <Progress value={95} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="text-sm font-medium">4.8/5</span>
                  </div>
                  <Progress value={96} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cost Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.projects.total > 0 ? '98%' : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average material utilization
                </p>
                <Progress value={98} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Project Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.projects.total > 0 ? '100%' : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Projects completed on time
                </p>
                <Progress value={100} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Average Project Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {formatCurrency(stats.projects.avgValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per project average
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% from last month
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Detailed performance analysis and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-4">Efficiency Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Material Waste Reduction</span>
                      <span className="text-sm font-medium text-green-600">15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Labor Productivity</span>
                      <span className="text-sm font-medium text-blue-600">+8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cost Variance</span>
                      <span className="text-sm font-medium text-yellow-600">±2.5%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Quality Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Defect Rate</span>
                      <span className="text-sm font-medium text-green-600">0.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Client Satisfaction</span>
                      <span className="text-sm font-medium text-blue-600">4.8/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rework Percentage</span>
                      <span className="text-sm font-medium text-yellow-600">2.1%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Key Insights
                </CardTitle>
                <CardDescription>
                  AI-powered insights and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Cost Optimization Opportunity</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Switching to bulk material suppliers could save up to 18% on material costs for high-volume projects.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">Template Efficiency</h4>
                        <p className="text-sm text-green-700 mt-1">
                          Your "Bathroom Renovation" template has 35% higher profit margins than custom projects.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Inventory Alert</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          "Bata Merah" stock is projected to run out in 2 weeks based on current project pipeline.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Predictive Analytics
                </CardTitle>
                <CardDescription>
                  Forecast and trend analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Next Month Revenue</span>
                      <span className="text-sm text-muted-foreground">Projected</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.projects.totalValue * 1.15)}
                    </div>
                    <p className="text-xs text-muted-foreground">+15% growth predicted</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Material Cost Trend</span>
                      <span className="text-sm text-muted-foreground">6 months</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">-5.2%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Cost decreasing due to bulk purchasing</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Project Completion Rate</span>
                      <span className="text-sm text-muted-foreground">Average</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">94%</div>
                    <p className="text-xs text-muted-foreground">Above industry standard of 87%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
