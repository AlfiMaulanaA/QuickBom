"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FolderOpen, Search, Download, ArrowUpDown, MoreHorizontal, Settings, Eye, Edit, Loader2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface AssemblyCategory {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  _count: {
    assemblies: number;
  };
  assemblies: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function AssemblyCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<AssemblyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assemblyCountFilter, setAssemblyCountFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<AssemblyCategory | null>(null);
  const [isAssembliesDialogOpen, setIsAssembliesDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<AssemblyCategory | null>(null);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    icon: "FolderOpen"
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    icon: "FolderOpen"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      console.log('[Page] Assembly Categories - Starting fetch');
      const response = await fetch("/api/assembly-categories");
      console.log(`[Page] Assembly Categories - Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`[Page] Assembly Categories - Received ${data?.length || 0} categories`);
        setCategories(data);
      } else {
        console.error(`[Page] Assembly Categories - Fetch failed with status ${response.status}`);
        const errorText = await response.text();
        console.error('[Page] Assembly Categories - Error response:', errorText);

        toast({
          title: "Error",
          description: "Failed to fetch assembly categories",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[Page] Assembly Categories - Network error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assembly categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = (id: number) => {
    setCategoryToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/assembly-categories/${categoryToDelete}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Assembly category deleted successfully",
        });
        fetchCategories();
      } else if (response.status === 409) {
        toast({
          title: "Cannot Delete Category",
          description: data.message || "This category contains assemblies and cannot be deleted.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete assembly category",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete assembly category",
        variant: "destructive",
      });
    } finally {
      setCategoryToDelete(null);
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
      for (const id of selectedCategories) {
        try {
          const response = await fetch(`/api/assembly-categories/${id}`, { method: "DELETE" });
          const data = await response.json();

          if (response.ok) {
            successCount++;
          } else if (response.status === 409) {
            // Constraint violation - category has assemblies
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
          description: `Successfully deleted ${successCount} out of ${selectedCategories.length} categories`,
        });
      }

      // Show constraint errors as warnings
      if (constraintErrors.length > 0) {
        toast({
          title: "Some Categories Could Not Be Deleted",
          description: `${constraintErrors.length} categories contain assemblies and cannot be deleted.`,
          variant: "destructive",
        });
        console.log('Constraint errors:', constraintErrors);
      }

      // Show other errors
      if (errorMessages.length > 0) {
        toast({
          title: "Some Deletions Failed",
          description: `${errorMessages.length} categories could not be deleted due to errors.`,
          variant: "destructive",
        });
        console.log('Delete errors:', errorMessages);
      }

      fetchCategories();
      setSelectedCategories([]);
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
    const headers = ["Name", "Description", "Color", "Icon", "Assembly Count", "Created"];
    const csvContent = [
      headers.join(","),
      ...processedCategories.map(category => [
        `"${category.name}"`,
        `"${category.description || ""}"`,
        `"${category.color || ""}"`,
        `"${category.icon || ""}"`,
        category._count.assemblies,
        new Date(category.createdAt).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assembly-categories.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const isNewItem = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return diffDays <= 3;
  };

  // Filter and sort categories
  const processedCategories = useMemo(() => {
    let filtered = categories.filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const assemblyCount = category._count.assemblies;
      const matchesAssemblyCount = assemblyCountFilter === "all" ||
                                   (assemblyCountFilter === "empty" && assemblyCount === 0) ||
                                   (assemblyCountFilter === "few" && assemblyCount >= 1 && assemblyCount <= 5) ||
                                   (assemblyCountFilter === "many" && assemblyCount >= 6);

      return matchesSearch && matchesAssemblyCount;
    });

    // Sort categories
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
  }, [categories, searchTerm, assemblyCountFilter, sortBy, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(processedCategories.map(c => c.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, id]);
    } else {
      setSelectedCategories(prev => prev.filter(categoryId => categoryId !== id));
    }
  };

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
            <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Assembly Categories</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage construction assembly categories for better organization</p>
          </div>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Add Category</span>
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
                    placeholder="Search categories by name or description..."
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
                    setAssemblyCountFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-48">
                <Select value={assemblyCountFilter} onValueChange={setAssemblyCountFilter}>
                  <SelectTrigger>
                    <Settings className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by assemblies count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assembly Counts</SelectItem>
                    <SelectItem value="empty">Empty (0 assemblies)</SelectItem>
                    <SelectItem value="few">Few (1-5 assemblies)</SelectItem>
                    <SelectItem value="many">Many (6+ assemblies)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                {selectedCategories.length > 0 && (
                  <Button variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedCategories.length})
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || assemblyCountFilter !== "all") && (
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
                {assemblyCountFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Assemblies: {(() => {
                      switch (assemblyCountFilter) {
                        case "empty": return "Empty";
                        case "few": return "1-5";
                        case "many": return "6+";
                        default: return assemblyCountFilter;
                      }
                    })()}
                    <button
                      onClick={() => setAssemblyCountFilter("all")}
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
              <FolderOpen className="h-5 w-5" />
              Categories List
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {processedCategories.length} of {categories.length} categories
            </div>
          </CardTitle>
          <CardDescription>
            All assembly categories and their assembly counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            {categories.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No categories</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first assembly category.
                </p>
              </div>
            ) : processedCategories.length === 0 ? (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No categories found</h3>
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
                        checked={selectedCategories.length === processedCategories.length && processedCategories.length > 0}
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
                    <TableHead>Assembly Count</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Icon</TableHead>
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
                  {processedCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={(checked) => handleSelectCategory(category.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{category.name}</span>
                          {isNewItem(category.createdAt) && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white text-xs px-1.5 py-0.5">
                              New
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {category.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {category._count.assemblies} assemblies
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {category.color ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-xs font-mono">{category.color}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {category.icon ? (
                          <span className="text-xs">{category.icon}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(category.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category);
                              setEditFormData({
                                name: category.name,
                                description: category.description || "",
                                color: category.color || "#3b82f6",
                                icon: category.icon || "FolderOpen"
                              });
                              setIsEditDialogOpen(true);
                            }}
                            title="Edit category"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCategory(category);
                              setIsAssembliesDialogOpen(true);
                            }}
                            title="View assemblies"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            title="Delete category"
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
            )}
          </div>

          {/* Mobile/Tablet Card Layout */}
          <div className="lg:hidden space-y-3">
            {processedCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((category) => (
              <Card key={category.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Checkbox
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) => handleSelectCategory(category.id, checked as boolean)}
                    />
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm truncate">{category.name}</div>
                        {isNewItem(category.createdAt) && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white text-xs px-1.5 py-0.5">
                            New
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {category.description || 'No description'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {category._count.assemblies} assemblies
                      </Badge>
                      {category.color && (
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-xs">{category.color}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <span className="ml-1">{new Date(category.createdAt).toLocaleDateString()}</span>
                      </div>
                      {category.icon && (
                        <div>
                          <span className="text-muted-foreground">Icon:</span>
                          <span className="ml-1">{category.icon}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/assembly-categories/edit/${category.id}`)} className="text-xs">
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsAssembliesDialogOpen(true);
                        }}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        View Assemblies
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(category.id)}
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

          {categories.length > 0 && processedCategories.length === 0 && (
            <div className="text-center py-8 lg:hidden">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No categories found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria.
              </p>
            </div>
          )}

          {categories.length === 0 && (
            <div className="text-center py-8 lg:hidden">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No categories</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first assembly category.
              </p>
            </div>
          )}

          {/* Pagination */}
          {processedCategories.length > 0 && (
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
                  Page {currentPage} of {Math.ceil(processedCategories.length / pageSize)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(processedCategories.length / pageSize)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assemblies Detail Dialog */}
      <Dialog open={isAssembliesDialogOpen} onOpenChange={setIsAssembliesDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Assemblies in "{selectedCategory?.name}"
            </DialogTitle>
            <DialogDescription>
              All assemblies belonging to this category
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Category Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {selectedCategory?.assemblies.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Assemblies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedCategory?.name || "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">Category Name</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {selectedCategory?.color || "Default"}
                </div>
                <div className="text-sm text-muted-foreground">Color</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {selectedCategory?.icon || "Default"}
                </div>
                <div className="text-sm text-muted-foreground">Icon</div>
              </div>
            </div>

            {/* Assemblies List */}
            {selectedCategory?.assemblies && selectedCategory.assemblies.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedCategory.assemblies.map((assembly, index) => (
                  <div key={assembly.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{assembly.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {assembly.description || 'No description'}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        router.push(`/assemblies/edit/${assembly.id}`);
                        setIsAssembliesDialogOpen(false);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No assemblies in this category yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create assemblies and assign them to this category</p>
              </div>
            )}

            {/* Summary Footer */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {selectedCategory?.assemblies?.length || 0} assemblies in this category
              </div>
              <Button onClick={() => setIsAssembliesDialogOpen(false)}>
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
        title="Delete Assembly Category"
        description="Are you sure you want to delete this assembly category? This action cannot be undone. All assemblies in this category must be removed first."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setCategoryToDelete(null);
        }}
        destructive
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        type="destructive"
        title="Delete Multiple Categories"
        description={`Are you sure you want to delete ${selectedCategories.length} selected categories? This action cannot be undone. Categories that contain assemblies will not be deleted.`}
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={confirmBulkDelete}
        onCancel={() => setIsBulkDeleteDialogOpen(false)}
        destructive
      />

      {/* Create Category Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Assembly Category
            </DialogTitle>
            <DialogDescription>
              Add a new assembly category for better organization
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!createFormData.name.trim()) {
              toast({
                title: "Validation Error",
                description: "Category name is required",
                variant: "destructive",
              });
              return;
            }

            setIsSubmitting(true);
            try {
              const response = await fetch("/api/assembly-categories", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(createFormData),
              });

              const data = await response.json();

              if (response.ok) {
                toast({
                  title: "Success",
                  description: "Assembly category created successfully",
                });
                setIsCreateDialogOpen(false);
                setCreateFormData({
                  name: "",
                  description: "",
                  color: "#3b82f6",
                  icon: "FolderOpen"
                });
                fetchCategories();
              } else {
                toast({
                  title: "Error",
                  description: data.error || "Failed to create assembly category",
                  variant: "destructive",
                });
              }
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to create assembly category",
                variant: "destructive",
              });
            } finally {
              setIsSubmitting(false);
            }
          }} className="space-y-6">
            <div className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="create-name">Category Name *</Label>
                <Input
                  id="create-name"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name (e.g., Structural Elements, Electrical Work)"
                  required
                />
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what types of assemblies belong to this category"
                  rows={3}
                />
              </div>

              {/* Color Selection */}
              <div className="space-y-3">
                <Label>Color Theme</Label>
                <div className="grid grid-cols-6 gap-3">
                  {["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#6366f1", "#14b8a6", "#f97316", "#a855f7"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCreateFormData(prev => ({ ...prev, color }))}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        createFormData.color === color
                          ? "border-primary scale-110"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select color ${color}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={createFormData.color}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={createFormData.color}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3b82f6"
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {/* Icon Selection */}
              <div className="space-y-3">
                <Label>Icon</Label>
                <div className="grid grid-cols-6 gap-3">
                  {["FolderOpen", "Building", "Home", "Wall", "Grid3X3", "Door", "Zap", "Droplets", "Palette", "Sprout", "Settings", "Package"].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCreateFormData(prev => ({ ...prev, icon }))}
                      className={`p-3 border rounded-lg transition-all ${
                        createFormData.icon === icon
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      title={`Select icon ${icon}`}
                    >
                      <span className="text-sm font-medium">{icon}</span>
                    </button>
                  ))}
                </div>
                <Input
                  value={createFormData.icon}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Enter icon name"
                  className="font-mono text-sm"
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: createFormData.color }}
                    >
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{createFormData.name || "Category Name"}</div>
                      <div className="text-sm text-muted-foreground">
                        {createFormData.description || "Category description"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setCreateFormData({
                    name: "",
                    description: "",
                    color: "#3b82f6",
                    icon: "FolderOpen"
                  });
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Create Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Assembly Category
            </DialogTitle>
            <DialogDescription>
              Update the assembly category information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!editFormData.name.trim()) {
              toast({
                title: "Validation Error",
                description: "Category name is required",
                variant: "destructive",
              });
              return;
            }

            if (!editingCategory) return;

            setIsSubmitting(true);
            try {
              const response = await fetch(`/api/assembly-categories/${editingCategory.id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(editFormData),
              });

              const data = await response.json();

              if (response.ok) {
                toast({
                  title: "Success",
                  description: "Assembly category updated successfully",
                });
                setIsEditDialogOpen(false);
                setEditingCategory(null);
                fetchCategories();
              } else {
                toast({
                  title: "Error",
                  description: data.error || "Failed to update assembly category",
                  variant: "destructive",
                });
              }
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to update assembly category",
                variant: "destructive",
              });
            } finally {
              setIsSubmitting(false);
            }
          }} className="space-y-6">
            <div className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name (e.g., Structural Elements, Electrical Work)"
                  required
                />
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what types of assemblies belong to this category"
                  rows={3}
                />
              </div>

              {/* Color Selection */}
              <div className="space-y-3">
                <Label>Color Theme</Label>
                <div className="grid grid-cols-6 gap-3">
                  {["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#6366f1", "#14b8a6", "#f97316", "#a855f7"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, color }))}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        editFormData.color === color
                          ? "border-primary scale-110"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select color ${color}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={editFormData.color}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={editFormData.color}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3b82f6"
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {/* Icon Selection */}
              <div className="space-y-3">
                <Label>Icon</Label>
                <div className="grid grid-cols-6 gap-3">
                  {["FolderOpen", "Building", "Home", "Wall", "Grid3X3", "Door", "Zap", "Droplets", "Palette", "Sprout", "Settings", "Package"].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, icon }))}
                      className={`p-3 border rounded-lg transition-all ${
                        editFormData.icon === icon
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      title={`Select icon ${icon}`}
                    >
                      <span className="text-sm font-medium">{icon}</span>
                    </button>
                  ))}
                </div>
                <Input
                  value={editFormData.icon}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Enter icon name"
                  className="font-mono text-sm"
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: editFormData.color }}
                    >
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{editFormData.name || "Category Name"}</div>
                      <div className="text-sm text-muted-foreground">
                        {editFormData.description || "Category description"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingCategory(null);
                  setEditFormData({
                    name: "",
                    description: "",
                    color: "#3b82f6",
                    icon: "FolderOpen"
                  });
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Update Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
