"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Package,
  Search,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  Calculator,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from "lucide-react";
import { exportToExcel } from "@/lib/excel";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface AssemblyCategory {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
}

interface Assembly {
  id: number;
  name: string;
  description: string | null;
  partNumber: string | null;
  manufacturer: string | null;
  unit: string;
  price: number;
  category: AssemblyCategory;
  materials: any[];
}

interface AssemblyGroup {
  id: string;
  name: string;
  description: string | null;
  groupType: 'REQUIRED' | 'CHOOSE_ONE' | 'OPTIONAL' | 'CONFLICT';
  categoryId: number;
  category: AssemblyCategory;
  items: AssemblyGroupItem[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface AssemblyGroupItem {
  id: string;
  assemblyId: number;
  quantity: number;
  conflictsWith: string[];
  isDefault: boolean;
  sortOrder: number;
  assembly: Assembly;
}

export default function AssemblyGroupsPage() {
  const [groups, setGroups] = useState<AssemblyGroup[]>([]);
  const [categories, setCategories] = useState<AssemblyCategory[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [groupTypeFilter, setGroupTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "category">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Form states
  const [editingGroup, setEditingGroup] = useState<AssemblyGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupType, setNewGroupType] = useState<'REQUIRED' | 'CHOOSE_ONE' | 'OPTIONAL' | 'CONFLICT'>('OPTIONAL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedAssemblies, setSelectedAssemblies] = useState<number[]>([]);

  // Search states for dialogs
  const [assemblySearchTerm, setAssemblySearchTerm] = useState("");
  const [assemblySortBy, setAssemblySortBy] = useState<'name' | 'materials' | 'price'>('name');
  const [assemblySortOrder, setAssemblySortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtered assemblies for dialogs
  const filteredAssemblies = useMemo(() => {
    if (!selectedCategoryId) return [];

    let filtered = assemblies.filter(assembly => assembly.category.id === selectedCategoryId);

    // Apply search filter
    if (assemblySearchTerm.trim()) {
      const searchLower = assemblySearchTerm.toLowerCase();
      filtered = filtered.filter(assembly =>
        assembly.name.toLowerCase().includes(searchLower) ||
        (assembly.description && assembly.description.toLowerCase().includes(searchLower)) ||
        (assembly.partNumber && assembly.partNumber.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (assemblySortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "materials":
          aValue = a.materials?.length || 0;
          bValue = b.materials?.length || 0;
          break;
        case "price":
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        default:
          return 0;
      }

      if (assemblySortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [assemblies, selectedCategoryId, assemblySearchTerm, assemblySortBy, assemblySortOrder]);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [groupsRes, categoriesRes, assembliesRes] = await Promise.all([
        fetch('/api/assembly-groups'),
        fetch('/api/assembly-categories'),
        fetch('/api/assemblies')
      ]);

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (assembliesRes.ok) {
        const assembliesData = await assembliesRes.json();
        setAssemblies(assembliesData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: "Error",
        description: "Failed to load assembly groups data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort groups
  const processedGroups = useMemo(() => {
    let filtered = groups.filter(group => {
      const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = categoryFilter === "all" || group.categoryId.toString() === categoryFilter;
      const matchesType = groupTypeFilter === "all" || group.groupType === groupTypeFilter;

      return matchesSearch && matchesCategory && matchesType;
    });

    // Sort groups
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "category":
          aValue = a.category.name.toLowerCase();
          bValue = b.category.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [groups, searchTerm, categoryFilter, groupTypeFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(processedGroups.length / pageSize);
  const paginatedGroups = processedGroups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'REQUIRED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CHOOSE_ONE': return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case 'OPTIONAL': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'CONFLICT': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case 'REQUIRED': return 'bg-green-50 border-green-200';
      case 'CHOOSE_ONE': return 'bg-blue-50 border-blue-200';
      case 'OPTIONAL': return 'bg-yellow-50 border-yellow-200';
      case 'CONFLICT': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getGroupTypeLabel = (type: string) => {
    switch (type) {
      case 'REQUIRED': return 'Required';
      case 'CHOOSE_ONE': return 'Choose One';
      case 'OPTIONAL': return 'Optional';
      case 'CONFLICT': return 'Conflicts';
      default: return type;
    }
  };

  const resetForm = () => {
    setNewGroupName("");
    setNewGroupDescription("");
    setNewGroupType('OPTIONAL');
    setSelectedCategoryId(null);
    setSelectedAssemblies([]);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (group: AssemblyGroup) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || "");
    setNewGroupType(group.groupType);
    setSelectedCategoryId(group.categoryId);
    setSelectedAssemblies(group.items.map(item => item.assemblyId));
    // Reset search states when opening edit dialog
    setAssemblySearchTerm("");
    setAssemblySortBy('name');
    setAssemblySortOrder('asc');
    setIsEditDialogOpen(true);
  };

  const openDetailsDialog = (group: AssemblyGroup) => {
    setEditingGroup(group);
    setIsDetailsDialogOpen(true);
  };

  const handleDelete = (groupId: string) => {
    setGroupToDelete(groupId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;

    setIsDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/assembly-groups/${groupToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Assembly group deleted successfully",
        });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || error.error || "Failed to delete assembly group",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete assembly group",
        variant: "destructive",
      });
    } finally {
      setGroupToDelete(null);
    }
  };

  const createGroup = async () => {
    if (!selectedCategoryId || !newGroupName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a category and enter a group name",
        variant: "destructive",
      });
      return;
    }

    if (selectedAssemblies.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one assembly",
        variant: "destructive",
      });
      return;
    }

    try {
      const groupData = {
        categoryId: selectedCategoryId,
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || null,
        groupType: newGroupType,
        items: selectedAssemblies.map((assemblyId, index) => ({
          assemblyId,
          quantity: 1,
          conflictsWith: [],
          isDefault: newGroupType === 'CHOOSE_ONE' && index === 0,
          sortOrder: index
        }))
      };

      const response = await fetch('/api/assembly-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups(prev => [...prev, newGroup]);
        toast({
          title: "Success",
          description: `Group "${newGroupName}" created successfully`,
        });
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create group",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    }
  };

  const updateGroup = async () => {
    if (!editingGroup || !selectedCategoryId || !newGroupName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const groupData = {
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || null,
        groupType: newGroupType,
        items: selectedAssemblies.map((assemblyId, index) => ({
          assemblyId,
          quantity: 1,
          conflictsWith: [],
          isDefault: newGroupType === 'CHOOSE_ONE' && index === 0,
          sortOrder: index
        }))
      };

      const response = await fetch(`/api/assembly-groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        const updatedGroup = await response.json();
        setGroups(prev => prev.map(g => g.id === editingGroup.id ? updatedGroup : g));
        toast({
          title: "Success",
          description: `Group "${newGroupName}" updated successfully`,
        });
        setIsEditDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update group",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive",
      });
    }
  };

  const exportToExcelHandler = () => {
    const headers = ["Category", "Group Name", "Type", "Assemblies Count", "Created", "Description"];

    // Prepare Data
    const data: any[][] = [
      headers,
      ...processedGroups.map(group => [
        group.category.name,
        group.name,
        group.groupType,
        group.items.length,
        new Date(group.createdAt).toLocaleDateString(),
        group.description || ""
      ])
    ];

    exportToExcel(data, "assembly_groups", "Groups");
    setIsExportDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary" />
            <span className="truncate">Assembly Groups</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage assembly groups with different selection rules
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={openCreateDialog} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Add Group</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Groups</CardTitle>
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground truncate">
              Assembly groups created
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Categories Used</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">
              {new Set(groups.map(g => g.categoryId)).size}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Assembly categories
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Assemblies</CardTitle>
            <Calculator className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">
              {groups.reduce((sum, group) => sum + group.items.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Assemblies in groups
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Group Types</CardTitle>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">
              {new Set(groups.map(g => g.groupType)).size}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Different rule types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search groups by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setGroupTypeFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExportDialogOpen(true)}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-48">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <Package className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:w-48">
                <Select value={groupTypeFilter} onValueChange={setGroupTypeFilter}>
                  <SelectTrigger>
                    <Settings className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="REQUIRED">Required</SelectItem>
                    <SelectItem value="CHOOSE_ONE">Choose One</SelectItem>
                    <SelectItem value="OPTIONAL">Optional</SelectItem>
                    <SelectItem value="CONFLICT">Conflicts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || categoryFilter !== "all" || groupTypeFilter !== "all") && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {categoryFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Category: {categories.find(c => c.id.toString() === categoryFilter)?.name}
                    <button
                      onClick={() => setCategoryFilter("all")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {groupTypeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {getGroupTypeLabel(groupTypeFilter)}
                    <button
                      onClick={() => setGroupTypeFilter("all")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Assembly Groups
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {paginatedGroups.length} of {processedGroups.length} groups
            </div>
          </CardTitle>
          <CardDescription>
            All assembly groups with their selection rules and configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedGroups.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No groups found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {groups.length === 0
                  ? "Get started by creating your first assembly group."
                  : "Try adjusting your search criteria."
                }
              </p>
              {groups.length === 0 && (
                <Button onClick={openCreateDialog} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Group
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">
                        <Button variant="ghost" onClick={() => {
                          if (sortBy === "name") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("name");
                            setSortOrder("asc");
                          }
                        }} className="h-auto p-0 font-semibold">
                          Group Name
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="min-w-[150px]">Category</TableHead>
                      <TableHead className="min-w-[120px]">Type</TableHead>
                      <TableHead className="min-w-[100px]">Assemblies</TableHead>
                      <TableHead className="min-w-[120px]">
                        <Button variant="ghost" onClick={() => {
                          if (sortBy === "createdAt") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("createdAt");
                            setSortOrder("asc");
                          }
                        }} className="h-auto p-0 font-semibold">
                          Created
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getGroupTypeIcon(group.groupType)}
                            <div>
                              <div className="font-medium">{group.name}</div>
                              {group.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  {group.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{group.category.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getGroupTypeIcon(group.groupType)}
                            {getGroupTypeLabel(group.groupType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {group.items.length} assemblies
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(group.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailsDialog(group)}
                              title="View group details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(group)}
                              title="Edit group"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(group.id)}
                              title="Delete group"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Items per page:</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create New Assembly Group</DialogTitle>
            <DialogDescription>
              Create a group of assemblies with specific selection rules
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto pr-2">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-group-name">Group Name *</Label>
                <Input
                  id="create-group-name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Closet Options"
                />
              </div>

              <div className="space-y-2">
                <Label>Group Type</Label>
                <Select value={newGroupType} onValueChange={(value: any) => setNewGroupType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REQUIRED">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Required - All items must be selected
                      </div>
                    </SelectItem>
                    <SelectItem value="CHOOSE_ONE">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-blue-500" />
                        Choose One - Select exactly one item
                      </div>
                    </SelectItem>
                    <SelectItem value="OPTIONAL">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-yellow-500" />
                        Optional - Select any number of items
                      </div>
                    </SelectItem>
                    <SelectItem value="CONFLICT">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Conflict - Cannot select conflicting items
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-group-description">Description</Label>
              <Textarea
                id="create-group-description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Describe this group..."
                rows={3}
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Select Category</Label>
              <Select value={selectedCategoryId?.toString() || ""} onValueChange={(value) => setSelectedCategoryId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assembly Selection */}
            {selectedCategoryId && (
              <div className="space-y-4">
                <Label>Select Assemblies</Label>

                {/* Search and Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search assemblies by name, description, or part number..."
                        value={assemblySearchTerm}
                        onChange={(e) => setAssemblySearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={`${assemblySortBy}-${assemblySortOrder}`} onValueChange={(value) => {
                      const [sortBy, sortOrder] = value.split('-') as [typeof assemblySortBy, typeof assemblySortOrder];
                      setAssemblySortBy(sortBy);
                      setAssemblySortOrder(sortOrder);
                    }}>
                      <SelectTrigger className="w-40">
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="materials-asc">Materials (Low-High)</SelectItem>
                        <SelectItem value="materials-desc">Materials (High-Low)</SelectItem>
                        <SelectItem value="price-asc">Price (Low-High)</SelectItem>
                        <SelectItem value="price-desc">Price (High-Low)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAssemblySearchTerm("");
                        setAssemblySortBy('name');
                        setAssemblySortOrder('asc');
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Assembly Selection Grid */}
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-muted/20">
                  <div className="grid gap-3">
                    {filteredAssemblies.map(assembly => (
                      <div key={assembly.id} className="flex items-center space-x-3 p-3 bg-background rounded-lg border hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`assembly-create-${assembly.id}`}
                          checked={selectedAssemblies.includes(assembly.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAssemblies(prev => [...prev, assembly.id]);
                            } else {
                              setSelectedAssemblies(prev => prev.filter(id => id !== assembly.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`assembly-create-${assembly.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm leading-tight">{assembly.name}</div>
                              {assembly.description && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {assembly.description}
                                </div>
                              )}
                              {assembly.partNumber && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  PN: {assembly.partNumber}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 ml-3">
                              <Badge variant="outline" className="text-xs">
                                {assembly.materials?.length || 0} materials
                              </Badge>
                              {assembly.price && (
                                <Badge variant="secondary" className="text-xs">
                                  Rp {assembly.price.toLocaleString('id-ID')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  {filteredAssemblies.length === 0 && (
                    <div className="text-center py-8">
                      {assemblySearchTerm ? (
                        <div>
                          <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No assemblies match your search</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssemblySearchTerm("")}
                            className="mt-2"
                          >
                            Clear Search
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No assemblies in this category</p>
                      )}
                    </div>
                  )}

                  {/* Selection Summary */}
                  {selectedAssemblies.length > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {selectedAssemblies.length} assembly{selectedAssemblies.length !== 1 ? 's' : ''} selected
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAssemblies([])}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createGroup} disabled={!selectedCategoryId || !newGroupName.trim()}>
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Assembly Group</DialogTitle>
            <DialogDescription>
              Update the group configuration and assembly selection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto pr-2">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-group-name">Group Name *</Label>
                <Input
                  id="edit-group-name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Closet Options"
                />
              </div>

              <div className="space-y-2">
                <Label>Group Type</Label>
                <Select value={newGroupType} onValueChange={(value: any) => setNewGroupType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REQUIRED">Required - All items must be selected</SelectItem>
                    <SelectItem value="CHOOSE_ONE">Choose One - Select exactly one item</SelectItem>
                    <SelectItem value="OPTIONAL">Optional - Select any number of items</SelectItem>
                    <SelectItem value="CONFLICT">Conflict - Cannot select conflicting items</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-group-description">Description</Label>
              <Textarea
                id="edit-group-description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Describe this group..."
                rows={3}
              />
            </div>

            {/* Assembly Selection */}
            {selectedCategoryId && (
              <div className="space-y-4">
                <Label>Select Assemblies</Label>

                {/* Search and Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search assemblies by name, description, or part number..."
                        value={assemblySearchTerm}
                        onChange={(e) => setAssemblySearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={`${assemblySortBy}-${assemblySortOrder}`} onValueChange={(value) => {
                      const [sortBy, sortOrder] = value.split('-') as [typeof assemblySortBy, typeof assemblySortOrder];
                      setAssemblySortBy(sortBy);
                      setAssemblySortOrder(sortOrder);
                    }}>
                      <SelectTrigger className="w-40">
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="materials-asc">Materials (Low-High)</SelectItem>
                        <SelectItem value="materials-desc">Materials (High-Low)</SelectItem>
                        <SelectItem value="price-asc">Price (Low-High)</SelectItem>
                        <SelectItem value="price-desc">Price (High-Low)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAssemblySearchTerm("");
                        setAssemblySortBy('name');
                        setAssemblySortOrder('asc');
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Assembly Selection Grid */}
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-muted/20">
                  <div className="grid gap-3">
                    {filteredAssemblies.map(assembly => (
                      <div key={assembly.id} className="flex items-center space-x-3 p-3 bg-background rounded-lg border hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`assembly-edit-${assembly.id}`}
                          checked={selectedAssemblies.includes(assembly.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAssemblies(prev => [...prev, assembly.id]);
                            } else {
                              setSelectedAssemblies(prev => prev.filter(id => id !== assembly.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`assembly-edit-${assembly.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm leading-tight">{assembly.name}</div>
                              {assembly.description && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {assembly.description}
                                </div>
                              )}
                              {assembly.partNumber && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  PN: {assembly.partNumber}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 ml-3">
                              <Badge variant="outline" className="text-xs">
                                {assembly.materials?.length || 0} materials
                              </Badge>
                              {assembly.price && (
                                <Badge variant="secondary" className="text-xs">
                                  Rp {assembly.price.toLocaleString('id-ID')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  {filteredAssemblies.length === 0 && (
                    <div className="text-center py-8">
                      {assemblySearchTerm ? (
                        <div>
                          <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No assemblies match your search</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssemblySearchTerm("")}
                            className="mt-2"
                          >
                            Clear Search
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No assemblies in this category</p>
                      )}
                    </div>
                  )}

                  {/* Selection Summary */}
                  {selectedAssemblies.length > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {selectedAssemblies.length} assembly{selectedAssemblies.length !== 1 ? 's' : ''} selected
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAssemblies([])}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateGroup} disabled={!newGroupName.trim()}>
              Update Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Group Details: {editingGroup?.name}</DialogTitle>
            <DialogDescription>
              Complete information about this assembly group
            </DialogDescription>
          </DialogHeader>

          {editingGroup && (
            <div className="space-y-6 overflow-y-auto pr-2">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="text-base">
                      {editingGroup.category.name}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Group Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="text-base flex items-center gap-2">
                      {getGroupTypeIcon(editingGroup.groupType)}
                      {getGroupTypeLabel(editingGroup.groupType)}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Group Type Description */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getGroupTypeIcon(editingGroup.groupType)}
                    Selection Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`p-4 rounded-lg ${getGroupTypeColor(editingGroup.groupType)}`}>
                    <p className="text-sm">
                      {editingGroup.groupType === 'REQUIRED' && "All assemblies in this group must be selected by users."}
                      {editingGroup.groupType === 'CHOOSE_ONE' && "Users must select exactly one assembly from this group."}
                      {editingGroup.groupType === 'OPTIONAL' && "Users can select any number of assemblies from this group."}
                      {editingGroup.groupType === 'CONFLICT' && "Users cannot select conflicting assemblies from this group."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Assemblies List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assemblies ({editingGroup.items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {editingGroup.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{item.assembly.name}</div>
                            {item.assembly.description && (
                              <div className="text-sm text-muted-foreground">{item.assembly.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Qty: {item.quantity}</Badge>
                          {item.isDefault && <Badge variant="default">Default</Badge>}
                          <Badge variant="secondary">
                            {item.assembly.materials?.length || 0} materials
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Created:</span>
                      <div className="text-muted-foreground">{new Date(editingGroup.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <div className="text-muted-foreground">{new Date(editingGroup.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {editingGroup && (
              <Button onClick={() => {
                setIsDetailsDialogOpen(false);
                openEditDialog(editingGroup);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Group
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto sm:w-[90vw] md:w-[80vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" />
              Export Assembly Groups Excel
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Export all assembly groups data to Excel file
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3">
              <Button
                onClick={exportToExcelHandler}
                className="w-full justify-start h-auto p-3 sm:p-4 text-left"
                variant="outline"
              >
                <div>
                  <div className="font-medium text-sm sm:text-base">Export All Groups</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Export all {processedGroups.length} assembly groups
                  </div>
                </div>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsExportDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        type="destructive"
        title="Delete Assembly Group"
        description="Are you sure you want to delete this assembly group? This action cannot be undone."
        confirmText="Delete Group"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        destructive
      />
    </div>
  );
}
