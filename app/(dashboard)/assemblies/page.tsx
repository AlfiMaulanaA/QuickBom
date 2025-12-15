"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Settings, Search, Download, ArrowUpDown, MoreHorizontal, DollarSign, Clock, ChevronLeft, ChevronRight, Loader2, Package, Eye, Edit, Minus, Copy, File, FileText, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface Material {
  id: number;
  name: string;
  partNumber: string | null;
  manufacturer: string | null;
  unit: string;
  price: number;
}

interface AssemblyMaterial {
  id?: number;
  materialId: number;
  quantity: number;
  material: Material;
}

interface DocumentFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

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
  categoryId: number;
  category: AssemblyCategory;
  docs: DocumentFile[] | null;
  materials: AssemblyMaterial[];
  createdAt: string;
  updatedAt: string;
}

export default function AssembliesPage() {
  const router = useRouter();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssemblies, setSelectedAssemblies] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [materialsCountFilter, setMaterialsCountFilter] = useState("all");
  const [costFilter, setCostFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState<'pagination' | 'lazy'>('lazy');
  const [visibleItemsCount, setVisibleItemsCount] = useState(20);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  const [isMaterialsDialogOpen, setIsMaterialsDialogOpen] = useState(false);
  const [isDocumentsDialogOpen, setIsDocumentsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [assemblyToDelete, setAssemblyToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchAssemblies = async () => {
    try {
      console.log('[Page] Assemblies - Starting fetch');
      const response = await fetch("/api/assemblies");
      console.log(`[Page] Assemblies - Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`[Page] Assemblies - Received ${data?.length || 0} assemblies`);
        setAssemblies(data);
      } else {
        console.error(`[Page] Assemblies - Fetch failed with status ${response.status}`);
        const errorText = await response.text();
        console.error('[Page] Assemblies - Error response:', errorText);

        toast({
          title: "Error",
          description: "Failed to fetch assemblies",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[Page] Assemblies - Network error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assemblies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/materials");
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    }
  };

  useEffect(() => {
    fetchAssemblies();
    fetchMaterials();
  }, []);

  // Reset visible items when filters change
  useEffect(() => {
    setVisibleItemsCount(20);
    setHasMoreData(true);
  }, [searchTerm, materialsCountFilter, costFilter, dateFilter, sortBy, sortOrder]);



  const handleDelete = (id: number) => {
    setAssemblyToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!assemblyToDelete) return;

    setIsDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/assemblies/${assemblyToDelete}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Assembly deleted successfully",
        });
        fetchAssemblies();
      } else if (response.status === 409) {
        toast({
          title: "Cannot Delete Assembly",
          description: data.message || "This assembly is used in templates and cannot be deleted.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete assembly",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete assembly",
        variant: "destructive",
      });
    } finally {
      setAssemblyToDelete(null);
    }
  };

  const calculateTotalCost = (assembly: Assembly) => {
    return assembly.materials.reduce((total, am) => {
      return total + (Number(am.material.price) * Number(am.quantity));
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const isNewItem = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return diffDays <= 3;
  };

  // Filter and sort assemblies
  const processedAssemblies = useMemo(() => {
    let filtered = assemblies.filter(assembly => {
      const matchesSearch = assembly.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (assembly.description && assembly.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const materialsCount = assembly.materials.length;
      const matchesMaterialsCount = materialsCountFilter === "all" ||
                                   (materialsCountFilter === "low" && materialsCount >= 1 && materialsCount <= 2) ||
                                   (materialsCountFilter === "medium" && materialsCount >= 3 && materialsCount <= 5) ||
                                   (materialsCountFilter === "high" && materialsCount >= 6);

      const totalCost = calculateTotalCost(assembly);
      const matchesCost = costFilter === "all" ||
                         (costFilter === "low" && totalCost >= 0 && totalCost <= 50000) ||
                         (costFilter === "medium" && totalCost > 50000 && totalCost <= 200000) ||
                         (costFilter === "high" && totalCost > 200000);

      const createdDate = new Date(assembly.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const matchesDate = dateFilter === "all" ||
                         (dateFilter === "recent" && daysDiff <= 7) ||
                         (dateFilter === "normal" && daysDiff > 7 && daysDiff <= 30) ||
                         (dateFilter === "old" && daysDiff > 30);

      return matchesSearch && matchesMaterialsCount && matchesCost && matchesDate;
    });

    // Sort assemblies
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
  }, [assemblies, searchTerm, materialsCountFilter, costFilter, dateFilter, sortBy, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssemblies(processedAssemblies.map(a => a.id));
    } else {
      setSelectedAssemblies([]);
    }
  };

  const handleSelectAssembly = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedAssemblies(prev => [...prev, id]);
    } else {
      setSelectedAssemblies(prev => prev.filter(assemblyId => assemblyId !== id));
    }
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleteDialogOpen(false);

    let successCount = 0;
    let errorMessages: string[] = [];
    let constraintErrors: string[] = [];

    try {
      // Process deletions sequentially to avoid overwhelming the server
      for (const id of selectedAssemblies) {
        try {
          const response = await fetch(`/api/assemblies/${id}`, { method: "DELETE" });
          const data = await response.json();

          if (response.ok) {
            successCount++;
          } else if (response.status === 409) {
            // Constraint violation - assembly is used in templates
            constraintErrors.push(`${id}: ${data.message}`);
          } else {
            // Other error
            errorMessages.push(`${id}: ${data.error || 'Unknown error'}`);
          }
        } catch (error) {
          errorMessages.push(`${id}: Network error`);
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "Bulk Delete Completed",
          description: `Successfully deleted ${successCount} out of ${selectedAssemblies.length} assemblies`,
        });
      }

      // Show constraint errors as warnings
      if (constraintErrors.length > 0) {
        toast({
          title: "Some Assemblies Could Not Be Deleted",
          description: `${constraintErrors.length} assemblies are used in templates and cannot be deleted.`,
          variant: "destructive",
        });
        console.log('Constraint errors:', constraintErrors);
      }

      // Show other errors
      if (errorMessages.length > 0) {
        toast({
          title: "Some Deletions Failed",
          description: `${errorMessages.length} assemblies could not be deleted due to errors.`,
          variant: "destructive",
        });
        console.log('Delete errors:', errorMessages);
      }

      fetchAssemblies();
      setSelectedAssemblies([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during bulk delete",
        variant: "destructive",
      });
      console.error('Bulk delete error:', error);
    }
  };

  const handleSort = (column: "name" | "createdAt") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Description", "Materials Count", "Total Cost", "Created"];
    const csvContent = [
      headers.join(","),
      ...processedAssemblies.map(assembly => [
        `"${assembly.name}"`,
        `"${assembly.description || ""}"`,
        assembly.materials.length,
        calculateTotalCost(assembly),
        new Date(assembly.createdAt).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assemblies.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDuplicate = async (assembly: Assembly) => {
    try {
      // Create duplicate data with new name
      const duplicateData = {
        name: `${assembly.name} (Copy)`,
        description: assembly.description,
        materials: assembly.materials.map(am => ({
          materialId: am.materialId,
          quantity: am.quantity
        }))
      };

      const response = await fetch("/api/assemblies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(duplicateData),
      });

      if (response.ok) {
        toast({
          title: "Assembly Duplicated",
          description: `"${duplicateData.name}" has been created successfully`,
        });
        fetchAssemblies();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to duplicate assembly",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate assembly",
        variant: "destructive",
      });
    }
  };

  const exportMaterialsToCSV = () => {
    if (!selectedAssembly) return;

    const headers = ["#", "Material Name", "Part Number", "Manufacturer", "Unit", "Quantity", "Unit Price", "Total Cost", "Percentage"];
    const csvContent = [
      headers.join(","),
      ...selectedAssembly.materials.map((assemblyMaterial, index) => {
        const totalCost = Number(assemblyMaterial.material.price) * Number(assemblyMaterial.quantity);
        const assemblyTotalCost = calculateTotalCost(selectedAssembly);
        const percentage = assemblyTotalCost > 0 ? (totalCost / assemblyTotalCost) * 100 : 0;

        return [
          index + 1,
          `"${assemblyMaterial.material.name}"`,
          `"${assemblyMaterial.material.partNumber || ""}"`,
          `"${assemblyMaterial.material.manufacturer || ""}"`,
          assemblyMaterial.material.unit,
          Number(assemblyMaterial.quantity),
          assemblyMaterial.material.price,
          totalCost,
          `${percentage.toFixed(1)}%`
        ].join(",");
      }),
      "", // Empty row
      `"Assembly: ${selectedAssembly.name}"`,
      `"Total Materials: ${selectedAssembly.materials.length}"`,
      `"Total Cost: ${calculateTotalCost(selectedAssembly)}"`,
      `"Description: ${selectedAssembly.description || "No description"}"`
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedAssembly.name.replace(/[^a-zA-Z0-9]/g, '_')}_materials.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadMoreItems = async () => {
    if (isLazyLoading) return;

    setIsLazyLoading(true);

    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const newCount = visibleItemsCount + 20;
    setVisibleItemsCount(newCount);

    // Check if we have more data
    if (newCount >= processedAssemblies.length) {
      setHasMoreData(false);
    }

    setIsLazyLoading(false);
  };

  const loadMoreManually = () => {
    loadMoreItems();
  };



  // Intersection Observer for lazy loading
  useEffect(() => {
    if (displayMode !== 'lazy') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreData && !isLazyLoading) {
          loadMoreItems();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const sentinel = document.getElementById('lazy-load-sentinel-assemblies');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [displayMode, hasMoreData, isLazyLoading, visibleItemsCount, processedAssemblies.length]);



  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-64"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-64 sm:w-96"></div>
          <div className="h-48 sm:h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Assemblies</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage construction assemblies and their material compositions</p>
          </div>
        </div>

        <Button onClick={() => router.push("/assemblies/create")} size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Add Assembly</span>
          <span className="xs:hidden">Add</span>
        </Button>
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
                    placeholder="Search assemblies by name or description..."
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
                    setMaterialsCountFilter("all");
                    setCostFilter("all");
                    setDateFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-48">
                <Select value={materialsCountFilter} onValueChange={setMaterialsCountFilter}>
                  <SelectTrigger>
                    <Package className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by materials count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Materials Count</SelectItem>
                    <SelectItem value="low">Low (1-2 materials)</SelectItem>
                    <SelectItem value="medium">Medium (3-5 materials)</SelectItem>
                    <SelectItem value="high">High (6+ materials)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:w-48">
                <Select value={costFilter} onValueChange={setCostFilter}>
                  <SelectTrigger>
                    <DollarSign className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by total cost" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Costs</SelectItem>
                    <SelectItem value="low">Low (≤50K)</SelectItem>
                    <SelectItem value="medium">Medium (50K-200K)</SelectItem>
                    <SelectItem value="high">High (&gt;200K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:w-48">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by creation date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="recent">Recent (≤7 days)</SelectItem>
                    <SelectItem value="normal">Normal (8-30 days)</SelectItem>
                    <SelectItem value="old">Old (&gt;30 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                {selectedAssemblies.length > 0 && (
                  <Button variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedAssemblies.length})
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || materialsCountFilter !== "all" || costFilter !== "all" || dateFilter !== "all") && (
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
                {materialsCountFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Materials: {(() => {
                      switch (materialsCountFilter) {
                        case "low": return "1-2";
                        case "medium": return "3-5";
                        case "high": return "6+";
                        default: return materialsCountFilter;
                      }
                    })()}
                    <button
                      onClick={() => setMaterialsCountFilter("all")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {costFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Cost: {(() => {
                      switch (costFilter) {
                        case "low": return "≤50K";
                        case "medium": return "50K-200K";
                        case "high": return ">200K";
                        default: return costFilter;
                      }
                    })()}
                    <button
                      onClick={() => setCostFilter("all")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {dateFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Date: {dateFilter === "recent" ? "≤7 days" :
                          dateFilter === "normal" ? "8-30 days" :
                          dateFilter === "old" ? ">30 days" : dateFilter}
                    <button
                      onClick={() => setDateFilter("all")}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Assemblies List
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {processedAssemblies.length} of {assemblies.length} assemblies
            </div>
          </CardTitle>
          <CardDescription>
            All construction assemblies and their material compositions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            {assemblies.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No assemblies</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first assembly.
                </p>
              </div>
            ) : processedAssemblies.length === 0 ? (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No assemblies found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAssemblies.length === processedAssemblies.length && processedAssemblies.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Materials Count</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("createdAt")} className="h-auto p-0 font-semibold">
                        Created
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedAssemblies.slice(0, displayMode === 'lazy' ? visibleItemsCount : processedAssemblies.length).map((assembly) => (
                    <TableRow key={assembly.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAssemblies.includes(assembly.id)}
                          onCheckedChange={(checked) => handleSelectAssembly(assembly.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{assembly.name}</span>
                          {isNewItem(assembly.createdAt) && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white text-xs px-1.5 py-0.5">
                              New
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {assembly.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: assembly.category.color || '#3b82f6' }}
                          />
                          <span className="text-sm font-medium">{assembly.category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {assembly.materials.length} materials
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assembly.docs && assembly.docs.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAssembly(assembly);
                              setIsDocumentsDialogOpen(true);
                            }}
                            className="h-auto p-2 rounded-full border border-gray-500 text-xs hover:bg-muted"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {assembly.docs.length} docs
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            0 docs
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(calculateTotalCost(assembly))}
                      </TableCell>
                      <TableCell>
                        {new Date(assembly.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="left" align="start">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => router.push(`/assemblies/edit/${assembly.id}`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(assembly)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAssembly(assembly);
                                setIsMaterialsDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Materials
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(assembly.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Mobile/Tablet Card Layout */}
          <div className="lg:hidden space-y-3">
            {processedAssemblies.slice(0, displayMode === 'lazy' ? visibleItemsCount : processedAssemblies.length).map((assembly) => (
              <Card key={assembly.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Checkbox
                      checked={selectedAssemblies.includes(assembly.id)}
                      onCheckedChange={(checked) => handleSelectAssembly(assembly.id, checked as boolean)}
                    />
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm truncate">{assembly.name}</div>
                        {isNewItem(assembly.createdAt) && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white text-xs px-1.5 py-0.5">
                            New
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {assembly.description || 'No description'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {assembly.materials.length} materials
                      </Badge>
                      {assembly.docs && assembly.docs.length > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          {assembly.docs.length} docs
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                          0 docs
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium text-green-600">{formatCurrency(calculateTotalCost(assembly))}</span>
                        <span className="text-muted-foreground ml-1">total</span>
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(assembly.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/assemblies/edit/${assembly.id}`)} className="text-xs">
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(assembly)} className="text-xs">
                        <Copy className="h-3 w-3 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedAssembly(assembly);
                          setIsMaterialsDialogOpen(true);
                        }}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        View Materials
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(assembly.id)}
                        className="text-destructive text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>

          {assemblies.length > 0 && processedAssemblies.length === 0 && (
            <div className="text-center py-8 lg:hidden">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No assemblies found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria.
              </p>
            </div>
          )}

          {assemblies.length === 0 && (
            <div className="text-center py-8 lg:hidden">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No assemblies</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first assembly.
              </p>
            </div>
          )}

          {/* Lazy Loading Sentinel */}
          {displayMode === 'lazy' && hasMoreData && processedAssemblies.length > 0 && (
            <div
              id="lazy-load-sentinel-assemblies"
              className="flex justify-center py-8"
            >
              {isLazyLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading more assemblies...</span>
                </div>
              ) : (
                <Button variant="outline" onClick={loadMoreManually}>
                  Load More Assemblies
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {processedAssemblies.length > 0 && (
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
                  Page {currentPage} of {Math.ceil(processedAssemblies.length / pageSize)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(processedAssemblies.length / pageSize)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materials Detail Dialog */}
      <Dialog open={isMaterialsDialogOpen} onOpenChange={setIsMaterialsDialogOpen}>
        <DialogContent className="max-w-7xl w-full max-h-[100vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Materials in "{selectedAssembly?.name}"
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>Detailed breakdown of materials and quantities for this assembly</span>
              <Button variant="outline" size="sm" onClick={exportMaterialsToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Assembly Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {selectedAssembly?.materials.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Materials</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {selectedAssembly ? formatCurrency(calculateTotalCost(selectedAssembly)) : formatCurrency(0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedAssembly ? Math.round(calculateTotalCost(selectedAssembly) / (selectedAssembly.materials.length || 1)) : 0}
                </div>
                <div className="text-sm text-muted-foreground">Avg per Material</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {selectedAssembly?.description || "No description"}
                </div>
                <div className="text-sm text-muted-foreground">Description</div>
              </div>
            </div>

            {/* Materials Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-8 text-xs font-medium">#</TableHead>
                      <TableHead className="text-xs font-medium">Material Name</TableHead>
                      <TableHead className="text-xs font-medium">Part Number</TableHead>
                      <TableHead className="text-xs font-medium">Manufacturer</TableHead>
                      <TableHead className="text-xs font-medium">Unit</TableHead>
                      <TableHead className="text-xs font-medium text-right">Quantity</TableHead>
                      <TableHead className="text-xs font-medium text-right">Unit Price</TableHead>
                      <TableHead className="text-xs font-medium text-right">Total Cost</TableHead>
                      <TableHead className="text-xs font-medium text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedAssembly?.materials.map((assemblyMaterial, index) => {
                      const totalCost = Number(assemblyMaterial.material.price) * Number(assemblyMaterial.quantity);
                      const assemblyTotalCost = selectedAssembly ? calculateTotalCost(selectedAssembly) : 1;
                      const percentage = assemblyTotalCost > 0 ? (totalCost / assemblyTotalCost) * 100 : 0;

                      return (
                        <TableRow key={assemblyMaterial.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-sm">
                            {assemblyMaterial.material.name}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {assemblyMaterial.material.partNumber || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {assemblyMaterial.material.manufacturer || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {assemblyMaterial.material.unit}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            {Number(assemblyMaterial.quantity).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-right text-blue-600">
                            {formatCurrency(assemblyMaterial.material.price)}
                          </TableCell>
                          <TableCell className="text-sm text-right font-medium text-green-600">
                            {formatCurrency(totalCost)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs font-medium">
                                {percentage.toFixed(1)}%
                              </span>
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Documents Section */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-muted/50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    <span className="font-medium">Documents</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedAssembly?.docs?.length || 0} files
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id={`file-upload-${selectedAssembly?.id}`}
                      className="hidden"
                      accept=".pdf"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!selectedAssembly || files.length === 0) return;

                        for (const file of files) {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('assemblyId', selectedAssembly.id.toString());

                          try {
                            const response = await fetch('/api/assemblies/upload', {
                              method: 'POST',
                              body: formData,
                            });

                            if (response.ok) {
                              toast({
                                title: "Document uploaded",
                                description: `"${file.name}" has been uploaded successfully`,
                              });
                              fetchAssemblies();
                            } else {
                              const error = await response.json();
                              toast({
                                title: "Upload failed",
                                description: error.error || "Failed to upload document",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Upload failed",
                              description: "Network error occurred",
                              variant: "destructive",
                            });
                          }
                        }
                        // Reset input
                        e.target.value = '';
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`file-upload-${selectedAssembly?.id}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>

              {selectedAssembly?.docs && selectedAssembly.docs.length > 0 ? (
                <div className="divide-y">
                  {selectedAssembly.docs.map((doc: DocumentFile, index: number) => (
                    <div key={doc.url} className="p-3 flex items-center justify-between hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <File className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{doc.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(doc.size / 1024).toFixed(1)} KB • {doc.type} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc.url;
                            link.download = doc.name;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

                            try {
                              const response = await fetch('/api/assemblies/upload', {
                                method: 'DELETE',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  assemblyId: selectedAssembly.id,
                                  fileUrl: doc.url,
                                }),
                              });

                              if (response.ok) {
                                toast({
                                  title: "Document deleted",
                                  description: `"${doc.name}" has been removed`,
                                });
                                fetchAssemblies();
                              } else {
                                const error = await response.json();
                                toast({
                                  title: "Delete failed",
                                  description: error.error || "Failed to delete document",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              toast({
                                title: "Delete failed",
                                description: "Network error occurred",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Upload" to add documents to this assembly</p>
                </div>
              )}
            </div>

            {/* Summary Footer */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {selectedAssembly?.materials.length || 0} materials for this assembly
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Total Cost:</span>
                <span className="text-lg font-bold text-green-600">
                  {selectedAssembly ? formatCurrency(calculateTotalCost(selectedAssembly)) : formatCurrency(0)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Documents Detail Dialog */}
      <Dialog open={isDocumentsDialogOpen} onOpenChange={setIsDocumentsDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents for "{selectedAssembly?.name}"
            </DialogTitle>
            <DialogDescription>
              All documents attached to this assembly
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedAssembly?.docs && selectedAssembly.docs.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedAssembly.docs.map((doc: DocumentFile, index: number) => (
                  <div key={doc.url} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <File className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{doc.name}</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Size: {(doc.size / 1024).toFixed(1)} KB</div>
                          <div>Type: {doc.type}</div>
                          <div>Uploaded: {new Date(doc.uploadedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.url;
                          link.download = doc.name;
                          link.click();
                        }}
                        title="Download document"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

                          try {
                            const response = await fetch('/api/assemblies/upload', {
                              method: 'DELETE',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                assemblyId: selectedAssembly.id,
                                fileUrl: doc.url,
                              }),
                            });

                            if (response.ok) {
                              toast({
                                title: "Document deleted",
                                description: `"${doc.name}" has been removed`,
                              });
                              fetchAssemblies();
                              setIsDocumentsDialogOpen(false);
                            } else {
                              const error = await response.json();
                              toast({
                                title: "Delete failed",
                                description: error.error || "Failed to delete document",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Delete failed",
                              description: "Network error occurred",
                              variant: "destructive",
                            });
                          }
                        }}
                        title="Delete document"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No documents attached to this assembly</p>
              </div>
            )}

            {/* Summary */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Total documents: {selectedAssembly?.docs?.length || 0}
              </div>
              <Button onClick={() => setIsDocumentsDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        type="destructive"
        title="Delete Assembly"
        description="Are you sure you want to delete this assembly? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setAssemblyToDelete(null);
        }}
        destructive
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        type="destructive"
        title="Delete Multiple Assemblies"
        description={`Are you sure you want to delete ${selectedAssemblies.length} selected assemblies? This action cannot be undone. Assemblies that are used in templates will not be deleted.`}
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={confirmBulkDelete}
        onCancel={() => setIsBulkDeleteDialogOpen(false)}
        destructive
      />
    </div>
  );
}
