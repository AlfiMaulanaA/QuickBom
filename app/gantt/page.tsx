"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ZoomIn,
  ZoomOut,
  Calendar,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Target,
  Download,
  RefreshCw,
  BarChart3,
  Clock,
  TrendingUp,
  Layers,
  Building,
  FolderOpen,
  Search,
  Filter,
  X,
  ExternalLink,
  Maximize2,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Eye,
  Edit3,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Client {
  id: string;
  companyName: string | null;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
  clientType: string;
}

interface Project {
  id: number;
  name: string;
  clientId: string | null;
  client: Client | null;
  totalPrice: number;
  timeline?: {
    id: string;
    startDate: string;
    endDate: string | null;
    duration: number | null;
    progress: number;
    status: string;
    milestones: Milestone[];
    tasks: Task[];
  } | null;
}

interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  progress: number;
  tasks: Task[];
}

interface Task {
  id: string;
  name: string;
  plannedStart: string;
  plannedEnd: string;
  progress: number;
  status: string;
  priority: string;
  taskType: string;
  duration: number;
  milestone?: {
    id: string;
    name: string;
  };
}

interface GanttItem {
  id: string;
  name: string;
  type: 'task' | 'milestone';
  status: string;
  progress: number;
  projectId: number;
  projectName: string;
  // Union properties
  plannedStart?: string;
  plannedEnd?: string;
  dueDate?: string;
  taskType?: string;
  duration?: number;
  priority?: string;
  tasks?: Task[];
}

export default function GlobalGanttChartPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0); // Continuous zoom from 0.1 to 5.0
  const [viewStartDate, setViewStartDate] = useState<Date | null>(null);
  const [viewEndDate, setViewEndDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<{start: string, end: string} | null>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, item: GanttItem | null} | null>(null);
  const [selectedItem, setSelectedItem] = useState<GanttItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchAllProjectsAndTimelines();
  }, []);

  const fetchAllProjectsAndTimelines = async () => {
    try {
      // Fetch all projects with their timelines
      const projectsRes = await fetch('/api/projects?include=timeline');
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);

        // Calculate global date range from all project timelines
        const allTimelines = projectsData
          .filter((p: Project) => p.timeline)
          .map((p: Project) => p.timeline!);

        if (allTimelines.length > 0) {
          const earliestStart = new Date(Math.min(...allTimelines.map((t: any) => new Date(t.startDate).getTime())));
          const latestEnd = new Date(Math.max(...allTimelines.flatMap((t: any) =>
            t.tasks.map((task: any) => new Date(task.plannedEnd).getTime())
          )));

          // Add buffer days
          const bufferStart = new Date(earliestStart);
          bufferStart.setDate(bufferStart.getDate() - 14);

          const bufferEnd = new Date(latestEnd);
          bufferEnd.setDate(bufferEnd.getDate() + 14);

          setViewStartDate(bufferStart);
          setViewEndDate(bufferEnd);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load project timelines",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTaskBarColor = (taskType: string) => {
    const baseColors = {
      CONSTRUCTION: '#3b82f6', // blue
      ELECTRICAL: '#eab308',   // yellow
      PLUMBING: '#06b6d4',     // cyan
      MECHANICAL: '#8b5cf6',   // violet
      DESIGN: '#10b981',       // emerald
      PERMIT: '#f59e0b',       // amber
      SUPERVISION: '#ef4444',  // red
      OTHER: '#6b7280'         // gray
    };

    return baseColors[taskType as keyof typeof baseColors] || baseColors.OTHER;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#ca8a04';
      case 'LOW': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const calculateTaskPosition = useCallback((item: GanttItem) => {
    if (!viewStartDate || !viewEndDate || !item.plannedStart || !item.plannedEnd) return { left: 0, width: 0 };

    const taskStart = new Date(item.plannedStart);
    const taskEnd = new Date(item.plannedEnd);
    const totalViewDuration = viewEndDate.getTime() - viewStartDate.getTime();

    const left = ((taskStart.getTime() - viewStartDate.getTime()) / totalViewDuration) * 100;
    const duration = taskEnd.getTime() - taskStart.getTime();

    // Adjust width based on zoom level to prevent bars from being too wide in detailed views
    const zoomAdjustment = Math.max(0.3, 1 / zoomLevel); // Higher zoom level = narrower bars
    const width = Math.min(((duration / totalViewDuration) * 100 * zoomAdjustment), 95); // Cap at 95% max width

    return { left: Math.max(0, left), width: Math.max(2, width) }; // Minimum 2% width
  }, [viewStartDate, viewEndDate, zoomLevel]);

  const calculateMilestonePosition = useCallback((item: GanttItem) => {
    if (!viewStartDate || !viewEndDate || !item.dueDate) return 0;

    const milestoneDate = new Date(item.dueDate);
    const totalViewDuration = viewEndDate.getTime() - viewStartDate.getTime();

    return ((milestoneDate.getTime() - viewStartDate.getTime()) / totalViewDuration) * 100;
  }, [viewStartDate, viewEndDate]);

  const generateTimeLabels = () => {
    if (!viewStartDate || !viewEndDate) return [];

    const labels = [];
    const current = new Date(viewStartDate);

    while (current <= viewEndDate) {
      labels.push({
        date: new Date(current),
        label: current.toLocaleDateString('id-ID', {
          month: zoomLevel >= 1 ? 'short' : 'long',
          day: 'numeric',
          ...(zoomLevel >= 1.5 && { year: '2-digit' })
        })
      });

      // Increment based on zoom level
      if (zoomLevel >= 2) {
        current.setDate(current.getDate() + 1);
      } else if (zoomLevel >= 1.5) {
        current.setDate(current.getDate() + 3);
      } else if (zoomLevel >= 1) {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return labels;
  };

  const handleZoomChange = useCallback((value: number) => {
    setZoomLevel(value);
  }, []);

  const handleAutoFit = useCallback(() => {
    // Calculate optimal zoom level based on data
    if (viewStartDate && viewEndDate) {
      const totalDays = (viewEndDate.getTime() - viewStartDate.getTime()) / (1000 * 60 * 60 * 24);
      const optimalZoom = Math.max(0.1, Math.min(5.0, 1200 / (totalDays * 80)));
      setZoomLevel(optimalZoom);
    }
  }, [viewStartDate, viewEndDate]);

  const resetZoom = useCallback(() => {
    setZoomLevel(1.0);
  }, []);

  const handleExport = useCallback(() => {
    // Placeholder for export functionality
    toast({
      title: "Export Feature",
      description: "Global Gantt chart export coming soon",
    });
  }, [toast]);

  // Memoized expensive calculations to prevent recalculation on every render
  const timeLabels = useMemo(() => generateTimeLabels(), [viewStartDate, viewEndDate, zoomLevel]);

  const allItems = useMemo((): GanttItem[] => {
    const items: GanttItem[] = [];

    // Collect all items from all projects
    projects.forEach(project => {
      if (project.timeline) {
        // Add tasks
        project.timeline.tasks.forEach(task => {
          items.push({
            id: task.id,
            name: task.name,
            type: 'task' as const,
            status: task.status,
            progress: task.progress,
            projectId: project.id,
            projectName: project.name,
            plannedStart: task.plannedStart,
            plannedEnd: task.plannedEnd,
            taskType: task.taskType,
            duration: task.duration,
            priority: task.priority
          });
        });

        // Add milestones
        project.timeline.milestones.forEach(milestone => {
          items.push({
            id: milestone.id,
            name: milestone.name,
            type: 'milestone' as const,
            status: milestone.status,
            progress: milestone.progress,
            projectId: project.id,
            projectName: project.name,
            dueDate: milestone.dueDate,
            tasks: milestone.tasks
          });
        });
      }
    });

    // Apply filters
    const filteredItems = items.filter(item => {
      // Search filter
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.projectName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Task type filter (only for tasks)
      if (item.type === 'task' && taskTypeFilter !== 'all' && item.taskType !== taskTypeFilter) {
        return false;
      }

      // Priority filter (only for tasks)
      if (item.type === 'task' && priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false;
      }

      // Date range filter
      if (dateRangeFilter) {
        const itemDate = item.type === 'task' ? item.plannedStart : item.dueDate;
        if (itemDate) {
          const itemDateTime = new Date(itemDate).getTime();
          const startDate = dateRangeFilter.start ? new Date(dateRangeFilter.start).getTime() : null;
          const endDate = dateRangeFilter.end ? new Date(dateRangeFilter.end).getTime() : null;

          if (startDate && itemDateTime < startDate) return false;
          if (endDate && itemDateTime > endDate) return false;
        }
      }

      return true;
    });

    // Sort items by project, then by date
    filteredItems.sort((a, b) => {
      if (a.projectId !== b.projectId) return a.projectId - b.projectId;
      if (a.type === 'milestone' && b.type === 'task') return -1;
      if (a.type === 'task' && b.type === 'milestone') return 1;
      const aDate = a.type === 'task' ? a.plannedStart : a.dueDate;
      const bDate = b.type === 'task' ? b.plannedStart : b.dueDate;
      return new Date(aDate!).getTime() - new Date(bDate!).getTime();
    });

    return filteredItems;
  }, [projects, searchTerm, statusFilter, taskTypeFilter, priorityFilter]);

  // Group items by project for display
  const itemsByProject = useMemo(() => {
    return allItems.reduce((acc, item) => {
      if (!acc[item.projectId]) {
        acc[item.projectId] = [];
      }
      acc[item.projectId].push(item);
      return acc;
    }, {} as Record<number, GanttItem[]>);
  }, [allItems]);

  // Filtered projects based on search
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (searchTerm && !project.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all' && project.timeline?.status !== statusFilter) {
        return false;
      }
      return project.timeline !== null;
    });
  }, [projects, searchTerm, statusFilter]);

  const handleProjectClick = useCallback((projectId: number) => {
    router.push(`/dashboard/projects/${projectId}`);
  }, [router]);

  const handleTaskClick = useCallback((projectId: number, taskId: string) => {
    // Instead of navigating, show detail modal
    const item = allItems.find(i => i.id === taskId && i.projectId === projectId);
    if (item) {
      setSelectedItem(item);
      setShowDetailModal(true);
    }
  }, [allItems]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setTaskTypeFilter('all');
    setPriorityFilter('all');
    setDateRangeFilter(null);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, item: GanttItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextAction = useCallback((action: string, item: GanttItem) => {
    switch (action) {
      case 'view':
        if (item.type === 'task') {
          router.push(`/dashboard/projects/${item.projectId}/timeline`);
        } else {
          router.push(`/dashboard/projects/${item.projectId}`);
        }
        break;
      case 'edit':
        // Placeholder for edit functionality
        toast({
          title: "Edit Feature",
          description: "Edit functionality coming soon",
        });
        break;
      case 'duplicate':
        // Placeholder for duplicate functionality
        toast({
          title: "Duplicate Feature",
          description: "Duplicate functionality coming soon",
        });
        break;
      case 'delete':
        // Placeholder for delete functionality
        toast({
          title: "Delete Feature",
          description: "Delete functionality coming soon",
        });
        break;
    }
    closeContextMenu();
  }, [router, toast, closeContextMenu]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Global Gantt Chart</h1>
            <p className="text-sm text-muted-foreground">All Projects Timeline Overview</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className="h-7 px-3 text-xs"
            >
              Timeline
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="h-7 px-3 text-xs"
            >
              Calendar
            </Button>
          </div>

          {/* Zoom Controls - Only show in timeline mode */}
          {viewMode === 'timeline' && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="h-7 w-7 p-0"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                title={`Zoom: ${zoomLevel.toFixed(1)}x`}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAutoFit}
                className="h-7 w-7 p-0"
                title="Auto Fit"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <div className="px-2 py-0.5 text-xs font-medium min-w-[4rem] text-center">
                {zoomLevel.toFixed(1)}x
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-8 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllProjectsAndTimelines}
            className="h-8 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects, tasks, or milestones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(statusFilter !== 'all' || taskTypeFilter !== 'all' || priorityFilter !== 'all' || dateRangeFilter) && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                  {(statusFilter !== 'all' ? 1 : 0) + (taskTypeFilter !== 'all' ? 1 : 0) + (priorityFilter !== 'all' ? 1 : 0) + (dateRangeFilter ? 1 : 0)}
                </Badge>
              )}
            </Button>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || taskTypeFilter !== 'all' || priorityFilter !== 'all' || dateRangeFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Task Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Task Type</label>
                  <select
                    value={taskTypeFilter}
                    onChange={(e) => setTaskTypeFilter(e.target.value)}
                    className="w-full p-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="CONSTRUCTION">Construction</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="PLUMBING">Plumbing</option>
                    <option value="MECHANICAL">Mechanical</option>
                    <option value="DESIGN">Design</option>
                    <option value="PERMIT">Permit</option>
                    <option value="SUPERVISION">Supervision</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full p-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateRangeFilter?.start || ''}
                      onChange={(e) => setDateRangeFilter(prev => ({ start: e.target.value, end: prev?.end || '' }))}
                      className="flex-1 p-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Start date"
                    />
                    <input
                      type="date"
                      value={dateRangeFilter?.end || ''}
                      onChange={(e) => setDateRangeFilter(prev => ({ start: prev?.start || '', end: e.target.value }))}
                      className="flex-1 p-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="End date"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProjects.map(project => (
          <Card
            key={project.id}
            className="hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => handleProjectClick(project.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm truncate">{project.name}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {project.timeline!.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{project.timeline!.progress}%</span>
                </div>
                <Progress value={project.timeline!.progress} className="h-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{project.timeline!.tasks.length} tasks</span>
                  <span>{project.timeline!.milestones.length} milestones</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Layers className="h-5 w-5" />
            Global Project Timeline
          </CardTitle>
          <CardDescription>
            Unified view of all project timelines and milestones
          </CardDescription>
        </CardHeader>

        <CardContent>
          {viewMode === 'timeline' ? (
            /* Timeline View */
            <div className="flex">
              {/* Fixed left column for project/task names */}
              <div className="w-96 flex-shrink-0 border-r bg-muted/30">
                {/* Header for fixed column */}
                <div className="p-4 border-b bg-muted/50">
                  <h3 className="font-semibold text-sm">Project / Task / Milestone</h3>
                </div>

                {/* Scrollable content for project/task rows */}
                <div className="max-h-[600px] overflow-y-auto">
                  {Object.entries(itemsByProject).map(([projectId, items]) => {
                    const project = projects.find(p => p.id === parseInt(projectId));
                    return (
                      <div key={projectId} className="border-b">
                        {/* Project Header */}
                        <div className="p-4 bg-primary/5 border-b-2 border-primary/20">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-primary">{project?.name}</span>
                          </div>
                        </div>

                        {/* Project Items */}
                        {items.map((item, index) => (
                          <div key={item.id} className="p-4 border-b bg-card">
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded flex items-center justify-center ${
                                item.type === 'milestone'
                                  ? 'bg-purple-100 dark:bg-purple-900/50'
                                  : 'bg-blue-100 dark:bg-blue-900/50'
                              }`}>
                                {item.type === 'milestone' ? (
                                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.type === 'milestone'
                                    ? `Milestone • Due: ${item.dueDate ? formatDate(item.dueDate) : 'N/A'}`
                                    : `${item.taskType || 'Task'} • ${item.duration || 0} days • ${item.progress}% complete`
                                  }
                                </p>
                                {item.type === 'task' && item.priority && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs mt-1"
                                    style={{
                                      backgroundColor: `${getPriorityColor(item.priority)}15`,
                                      color: getPriorityColor(item.priority)
                                    }}
                                  >
                                    {item.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable timeline area */}
              <div className="flex-1 overflow-x-auto">
                <div style={{ width: `${Math.max(800, timeLabels.length * 80 * zoomLevel)}px` }}>
                  {/* Time Header */}
                  <div className="border-b mb-4">
                    <div className="flex">
                      {timeLabels.map((label, index) => (
                        <div
                          key={index}
                          className="text-center p-3 border-r text-xs font-medium bg-muted/30"
                          style={{ width: `${80 * zoomLevel}px`, minWidth: '80px' }}
                        >
                          {label.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chart Rows - Timeline visualization only */}
                  {Object.entries(itemsByProject).map(([projectId, items]) => (
                    <div key={projectId} className="border-b">
                      {/* Project spacer */}
                      <div className="h-[72px] border-b-2 border-primary/20"></div>

                      {/* Timeline bars for each item */}
                      {items.map((item, index) => (
                        <div key={item.id} className="relative h-20 border-b">
                          {/* Background Grid */}
                          <div className="absolute inset-0 flex">
                            {timeLabels.map((_, idx) => (
                              <div
                                key={idx}
                                className="border-r border-muted/20"
                                style={{ width: `${80 * zoomLevel}px`, minWidth: '80px' }}
                              />
                            ))}
                          </div>

                          {/* Task/Milestone Bars */}
                          {item.type === 'task' ? (
                            <div
                              className="absolute top-6 h-8 rounded cursor-pointer hover:shadow-lg transition-shadow border-2 group"
                              style={{
                                left: `${calculateTaskPosition(item).left}%`,
                                width: `${calculateTaskPosition(item).width}%`,
                                backgroundColor: getTaskBarColor(item.taskType || 'OTHER'),
                                borderColor: getTaskBarColor(item.taskType || 'OTHER'),
                                opacity: item.progress === 100 ? 1 : 0.85
                              }}
                              title={`${item.name} (${item.progress}% complete) - ${item.taskType || 'Task'}`}
                              onClick={() => handleTaskClick(item.projectId, item.id)}
                              onContextMenu={(e) => handleContextMenu(e, item)}
                            >
                              {/* Progress Fill */}
                              <div
                                className="h-full bg-white/40 rounded"
                                style={{ width: `${item.progress}%` }}
                              />
                              {/* Task Label */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white text-xs font-semibold drop-shadow truncate px-2">
                                  {item.name}
                                </span>
                              </div>
                              {/* Click indicator */}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                <ExternalLink className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          ) : (
                            /* Milestone Diamond */
                            <div
                              className="absolute top-8 transform -translate-x-1/2 cursor-pointer hover:scale-110 transition-transform group"
                              style={{ left: `${calculateMilestonePosition(item)}%` }}
                              title={`${item.name} - Milestone`}
                              onClick={() => handleTaskClick(item.projectId, item.id)}
                              onContextMenu={(e) => handleContextMenu(e, item)}
                            >
                              <div
                                className="w-4 h-4 rotate-45 border-2"
                                style={{
                                  backgroundColor: '#8b5cf6',
                                  borderColor: '#7c3aed'
                                }}
                              />
                              {/* Click indicator */}
                              <div className="absolute -top-1 -left-1 w-6 h-6 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                                <ExternalLink className="h-2 w-2 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Calendar View */
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCurrentDate(newDate);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <h3 className="text-lg font-semibold">
                    {currentDate.toLocaleDateString('id-ID', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h3>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCurrentDate(newDate);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center font-semibold text-sm bg-muted/50">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {(() => {
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();

                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const startDate = new Date(firstDay);
                  startDate.setDate(startDate.getDate() - firstDay.getDay());

                  const days = [];
                  const current = new Date(startDate);

                  for (let i = 0; i < 42; i++) {
                    const dayEvents = allItems.filter(item => {
                      const itemDate = item.type === 'task' ? item.plannedStart : item.dueDate;
                      if (!itemDate) return false;

                      const eventDate = new Date(itemDate);
                      return eventDate.toDateString() === current.toDateString();
                    });

                    const isCurrentMonth = current.getMonth() === month;
                    const isToday = current.toDateString() === new Date().toDateString();

                    days.push(
                      <div
                        key={i}
                        className={`min-h-[100px] p-2 border border-border/50 ${
                          isCurrentMonth ? 'bg-background' : 'bg-muted/20'
                        } ${isToday ? 'ring-2 ring-primary' : ''}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? '' : 'text-muted-foreground'}`}>
                          {current.getDate()}
                        </div>

                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded cursor-pointer truncate ${
                                event.type === 'milestone'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                              title={event.name}
                              onClick={() => handleTaskClick(event.projectId, event.id)}
                            >
                              {event.type === 'milestone' ? '🏁' : '📋'} {event.name}
                            </div>
                          ))}

                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );

                    current.setDate(current.getDate() + 1);
                  }

                  return days;
                })()}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-semibold text-sm mb-3">Chart Legend</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                <span className="text-sm">Project</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Milestones</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm">Construction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-yellow-500 rounded"></div>
                <span className="text-sm">Electrical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-green-500 rounded"></div>
                <span className="text-sm">Design</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-purple-500 rounded"></div>
                <span className="text-sm">Mechanical</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Timelines</p>
                <p className="text-2xl font-bold">{projects.filter(p => p.timeline).length}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{allItems.filter(i => i.type === 'task').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Milestones</p>
                <p className="text-2xl font-bold">{allItems.filter(i => i.type === 'milestone').length}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-background border border-border rounded-md shadow-lg py-1 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
            onClick={() => contextMenu.item && handleContextAction('view', contextMenu.item)}
          >
            <Eye className="h-4 w-4" />
            View Details
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
            onClick={() => contextMenu.item && handleContextAction('edit', contextMenu.item)}
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
            onClick={() => contextMenu.item && handleContextAction('duplicate', contextMenu.item)}
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
          <div className="border-t my-1"></div>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
            onClick={() => contextMenu.item && handleContextAction('delete', contextMenu.item)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}

      {/* Overlay to close context menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeContextMenu}
        />
      )}

      {/* Item Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedItem?.type === 'milestone' ? (
                <Target className="h-6 w-6 text-purple-600" />
              ) : (
                <CheckCircle className="h-6 w-6 text-blue-600" />
              )}
              {selectedItem?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed information about this {selectedItem?.type}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm font-medium capitalize">{selectedItem.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Project</label>
                  <p className="text-sm font-medium">{selectedItem.projectName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant="secondary" className="text-xs">
                    {selectedItem.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Progress</label>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedItem.progress} className="flex-1 h-2" />
                    <span className="text-sm font-medium">{selectedItem.progress}%</span>
                  </div>
                </div>
              </div>

              {/* Task-specific information */}
              {selectedItem.type === 'task' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Task Type</label>
                      <p className="text-sm font-medium">{selectedItem.taskType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Priority</label>
                      {selectedItem.priority && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${getPriorityColor(selectedItem.priority)}15`,
                            color: getPriorityColor(selectedItem.priority)
                          }}
                        >
                          {selectedItem.priority}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Duration</label>
                      <p className="text-sm font-medium">{selectedItem.duration || 0} days</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Planned Start</label>
                      <p className="text-sm font-medium">
                        {selectedItem.plannedStart ? formatDate(selectedItem.plannedStart) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Planned End</label>
                      <p className="text-sm font-medium">
                        {selectedItem.plannedEnd ? formatDate(selectedItem.plannedEnd) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Task Progress Visualization */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Progress Visualization</label>
                    <div className="relative h-6 bg-muted rounded overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full transition-all duration-300"
                        style={{
                          width: `${selectedItem.progress}%`,
                          backgroundColor: getTaskBarColor(selectedItem.taskType || 'OTHER')
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold drop-shadow">
                          {selectedItem.progress}% Complete
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Milestone-specific information */}
              {selectedItem.type === 'milestone' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                    <p className="text-sm font-medium">
                      {selectedItem.dueDate ? formatDate(selectedItem.dueDate) : 'N/A'}
                    </p>
                  </div>

                  {/* Related Tasks */}
                  {selectedItem.tasks && selectedItem.tasks.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Related Tasks ({selectedItem.tasks.length})
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedItem.tasks.map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                            <span>{task.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Information */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Timeline Context</label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="ml-2 font-medium">
                      {selectedItem.type === 'task'
                        ? (selectedItem.plannedStart ? formatDate(selectedItem.plannedStart) : 'N/A')
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End/Due Date:</span>
                    <span className="ml-2 font-medium">
                      {selectedItem.type === 'task'
                        ? (selectedItem.plannedEnd ? formatDate(selectedItem.plannedEnd) : 'N/A')
                        : (selectedItem.dueDate ? formatDate(selectedItem.dueDate) : 'N/A')
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (selectedItem.type === 'task') {
                      router.push(`/dashboard/projects/${selectedItem.projectId}/timeline`);
                    } else {
                      router.push(`/dashboard/projects/${selectedItem.projectId}`);
                    }
                    setShowDetailModal(false);
                  }}
                >
                  Go to {selectedItem.type === 'task' ? 'Timeline' : 'Project'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
