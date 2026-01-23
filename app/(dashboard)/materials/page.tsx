"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Package, Search, Filter, Download, Upload, ArrowUpDown, Eye, Copy, MoreHorizontal, Check, Building, DollarSign, ChevronLeft, ChevronRight, Loader2, File, FileSpreadsheet } from "lucide-react";
import { exportToExcel } from "@/lib/excel";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface Material {
  id: number;
  name: string;
  partNumber: string | null;
  manufacturer: string | null;
  unit: string;
  price: number;
  purchaseUrl: string | null;
  datasheetFile: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [manufacturerFilter, setManufacturerFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "price" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState<'pagination' | 'lazy'>('lazy');
  const [visibleItemsCount, setVisibleItemsCount] = useState(20);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    partNumber: "",
    manufacturer: "",
    unit: "",
    price: "",
    purchaseUrl: "",
    datasheetFile: null as File | null
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/materials");
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch materials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch materials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Reset visible items when filters change
  useEffect(() => {
    setVisibleItemsCount(20);
    setHasMoreData(true);
  }, [searchTerm, unitFilter, manufacturerFilter, priceFilter, sortBy, sortOrder]);

  const loadMoreItems = async () => {
    if (isLazyLoading) return;

    setIsLazyLoading(true);

    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const newCount = visibleItemsCount + 20;
    setVisibleItemsCount(newCount);

    // Check if we have more data
    if (newCount >= processedMaterials.length) {
      setHasMoreData(false);
    }

    setIsLazyLoading(false);
  };

  const loadMoreManually = () => {
    loadMoreItems();
  };

  // Filter and sort materials
  const processedMaterials = useMemo(() => {
    let filtered = materials.filter(material => {
      const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.partNumber && material.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (material.manufacturer && material.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesUnit = unitFilter === "all" || material.unit === unitFilter;
      const matchesManufacturer = manufacturerFilter === "all" || material.manufacturer === manufacturerFilter;
      const matchesPrice = priceFilter === "all" ||
        (priceFilter === "priced" && material.price > 0) ||
        (priceFilter === "unpriced" && material.price === 0) ||
        (priceFilter === "low" && material.price > 0 && material.price <= 50000) ||
        (priceFilter === "medium" && material.price > 50000 && material.price <= 200000) ||
        (priceFilter === "high" && material.price > 200000);

      return matchesSearch && matchesUnit && matchesManufacturer && matchesPrice;
    });

    // Sort materials
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
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
  }, [materials, searchTerm, unitFilter, manufacturerFilter, priceFilter, sortBy, sortOrder]);

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

    const sentinel = document.getElementById('lazy-load-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [displayMode, hasMoreData, isLazyLoading, visibleItemsCount, processedMaterials.length]);

  // Get unique units and manufacturers for filters
  const availableUnits = useMemo(() => {
    const units = [...new Set(materials.map(m => m.unit))];
    return units.sort();
  }, [materials]);

  const availableManufacturers = useMemo(() => {
    const manufacturers = [...new Set(materials.map(m => m.manufacturer).filter(Boolean))] as string[];
    return manufacturers.sort();
  }, [materials]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMaterials(processedMaterials.map(m => m.id));
    } else {
      setSelectedMaterials([]);
    }
  };

  const handleSelectMaterial = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedMaterials(prev => [...prev, id]);
    } else {
      setSelectedMaterials(prev => prev.filter(materialId => materialId !== id));
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
      for (const id of selectedMaterials) {
        try {
          const response = await fetch(`/api/materials/${id}`, { method: "DELETE" });
          const data = await response.json();

          if (response.ok) {
            successCount++;
          } else if (response.status === 409) {
            // Constraint violation - material is used in assemblies
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
          description: `Successfully deleted ${successCount} out of ${selectedMaterials.length} materials`,
        });
      }

      // Show constraint errors as warnings
      if (constraintErrors.length > 0) {
        toast({
          title: "Some Materials Could Not Be Deleted",
          description: `${constraintErrors.length} materials are used in assemblies and cannot be deleted.`,
          variant: "destructive",
        });
        console.log('Constraint errors:', constraintErrors);
      }

      // Show other errors
      if (errorMessages.length > 0) {
        toast({
          title: "Some Deletions Failed",
          description: `${errorMessages.length} materials could not be deleted due to errors.`,
          variant: "destructive",
        });
        console.log('Delete errors:', errorMessages);
      }

      fetchMaterials();
      setSelectedMaterials([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during bulk delete",
        variant: "destructive",
      });
      console.error('Bulk delete error:', error);
    }
  };

  const handleSort = (column: "name" | "price" | "createdAt") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const exportToExcelHandler = () => {
    const headers = ["Name", "Part Number", "Manufacturer", "Unit", "Price", "Created"];
    const data = [
      headers,
      ...processedMaterials.map(material => [
        material.name,
        material.partNumber || "",
        material.manufacturer || "",
        material.unit,
        material.price,
        new Date(material.createdAt).toLocaleDateString()
      ])
    ];

    exportToExcel(data, "materials", "Materials List");
  };

  const handleDuplicate = (material: Material) => {
    setFormData({
      name: `${material.name} (Copy)`,
      partNumber: material.partNumber || "",
      manufacturer: material.manufacturer || "",
      unit: material.unit,
      price: material.price.toString(),
      purchaseUrl: "",
      datasheetFile: null
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingMaterial ? `/api/materials/${editingMaterial.id}` : "/api/materials";
      const method = editingMaterial ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          partNumber: formData.partNumber || null,
          manufacturer: formData.manufacturer || null,
          unit: formData.unit,
          price: parseFloat(formData.price) || 0,
          purchaseUrl: formData.purchaseUrl || null,
          datasheetFile: formData.datasheetFile?.name || null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Material ${editingMaterial ? "updated" : "created"} successfully`,
        });
        fetchMaterials();
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingMaterial(null);
        setFormData({ name: "", partNumber: "", manufacturer: "", unit: "", price: "", purchaseUrl: "", datasheetFile: null });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save material",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save material",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      partNumber: material.partNumber || "",
      manufacturer: material.manufacturer || "",
      unit: material.unit,
      price: material.price.toString(),
      purchaseUrl: material.purchaseUrl || "",
      datasheetFile: null
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setMaterialToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;

    setIsDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/materials/${materialToDelete}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Material deleted successfully",
        });
        fetchMaterials();
      } else if (response.status === 409) {
        toast({
          title: "Cannot Delete Material",
          description: data.message || "This material is used in assemblies and cannot be deleted.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete material",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      });
    } finally {
      setMaterialToDelete(null);
    }
  };

  const copyToClipboard = async (text: string, label: string, itemType: 'name' | 'part number' = 'part number') => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${itemType === 'name' ? 'Material name' : 'Part number'} "${text}" has been copied successfully.`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const isNewMaterial = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return diffDays <= 3;
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
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Materials</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage construction materials and their pricing</p>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add New Material</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Add a new construction material to the database.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Row 1: Material Name (Full Width) */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">Material Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bata Merah"
                  required
                />
              </div>

              {/* Row 2: Part Number and Manufacturer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partNumber" className="text-sm">Part Number</Label>
                  <Input
                    id="partNumber"
                    value={formData.partNumber}
                    onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                    placeholder="e.g., BR-001-40x20x10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer" className="text-sm">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g., PT. Bata Indonesia"
                  />
                </div>
              </div>

              {/* Row 3: Unit and Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm">Unit *</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g., pcs, kg, m³"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm">Price per Unit</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g., 1500"
                  />
                </div>
              </div>

              {/* Row 4: Purchase URL (Full Width) */}
              <div className="space-y-2">
                <Label htmlFor="purchaseUrl" className="text-sm">Purchase URL</Label>
                <Input
                  id="purchaseUrl"
                  type="url"
                  value={formData.purchaseUrl}
                  onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
                  placeholder="https://example.com/buy"
                />
              </div>

              {/* Row 5: Datasheet File (Full Width) */}
              <div className="space-y-2">
                <Label htmlFor="datasheetFile" className="text-sm">Datasheet File</Label>
                <Input
                  id="datasheetFile"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData({ ...formData, datasheetFile: file });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Upload PDF, DOC, DOCX, XLS, or XLSX files only
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setFormData({ name: "", partNumber: "", manufacturer: "", unit: "", price: "", purchaseUrl: "", datasheetFile: null });
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">Add Material</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                    placeholder="Search materials by name, part number, or manufacturer..."
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
                    setUnitFilter("all");
                    setManufacturerFilter("all");
                    setPriceFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-48">
                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:w-48">
                <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                  <SelectTrigger>
                    <Building className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Manufacturers</SelectItem>
                    {availableManufacturers.map((manufacturer) => (
                      <SelectItem key={manufacturer} value={manufacturer}>
                        {manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:w-48">
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger>
                    <DollarSign className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="priced">Has Price</SelectItem>
                    <SelectItem value="unpriced">No Price</SelectItem>
                    <SelectItem value="low">Low (≤50K)</SelectItem>
                    <SelectItem value="medium">Medium (50K-200K)</SelectItem>
                    <SelectItem value="high">High (&gt;200K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToExcelHandler}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                {selectedMaterials.length > 0 && (
                  <Button variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedMaterials.length})
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || unitFilter !== "all" || manufacturerFilter !== "all" || priceFilter !== "all") && (
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
                {unitFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Unit: {unitFilter}
                    <button
                      onClick={() => setUnitFilter("all")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {manufacturerFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Manufacturer: {manufacturerFilter}
                    <button
                      onClick={() => setManufacturerFilter("all")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {priceFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Price: {(() => {
                      switch (priceFilter) {
                        case "priced": return "Has Price";
                        case "unpriced": return "No Price";
                        case "low": return "Low (≤50K)";
                        case "medium": return "Medium (50K-200K)";
                        case "high": return "High (>200K)";
                        default: return priceFilter;
                      }
                    })()}
                    <button
                      onClick={() => setPriceFilter("all")}
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
              <Package className="h-5 w-5" />
              Materials List
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {processedMaterials.length} of {materials.length} materials
            </div>
          </CardTitle>
          <CardDescription>
            All construction materials in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            {materials.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No materials</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first material.
                </p>
              </div>
            ) : processedMaterials.length === 0 ? (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No materials found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedMaterials.length === processedMaterials.length && processedMaterials.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                        Name & Details
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Links & Files</TableHead>
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
                  {processedMaterials.slice(0, displayMode === 'lazy' ? visibleItemsCount : (currentPage - 1) * pageSize + pageSize).map((material) => (
                    <TableRow key={material.id} className="group">
                      <TableCell>
                        <Checkbox
                          checked={selectedMaterials.includes(material.id)}
                          onCheckedChange={(checked) => handleSelectMaterial(material.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-64" title={material.name}>
                              {material.name}
                            </span>
                            {isNewMaterial(material.createdAt) && (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white text-xs px-1.5 py-0.5">
                                New
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {material.manufacturer && (
                              <>
                                <span className="truncate max-w-48">{material.manufacturer}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    const textToCopy = material.manufacturer
                                      ? `${material.name} - ${material.manufacturer}`
                                      : material.name;
                                    copyToClipboard(textToCopy, material.name, 'name');
                                  }}
                                  title="Copy material name with manufacturer"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {material.partNumber && material.partNumber !== "0" && material.partNumber !== "" ? (
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-32">
                              {material.partNumber}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-gray-100"
                              onClick={() => copyToClipboard(material.partNumber!, material.partNumber!, 'part number')}
                              title="Copy part number"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 font-medium text-xs">
                            No PN
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{material.unit}</Badge>
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(material.price)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 max-w-32">
                          {material.purchaseUrl && (
                            <div className="text-xs">
                              <a
                                href={material.purchaseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline truncate block"
                                title={material.purchaseUrl}
                              >
                                Link
                              </a>
                            </div>
                          )}
                          {material.datasheetFile && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <File className="h-3 w-3" />
                              <span className="truncate" title={material.datasheetFile}>
                                {material.datasheetFile}
                              </span>
                            </div>
                          )}
                          {!material.purchaseUrl && !material.datasheetFile && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(material.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(material)}
                            title="Edit material"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(material)}
                            title="Duplicate material"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(material.id)}
                            title="Delete material"
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
            {processedMaterials.slice(0, displayMode === 'lazy' ? visibleItemsCount : (currentPage - 1) * pageSize + pageSize).map((material) => (
              <Card key={material.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                    <Checkbox
                      checked={selectedMaterials.includes(material.id)}
                      onCheckedChange={(checked) => handleSelectMaterial(material.id, checked as boolean)}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Header with name and actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{material.name}</span>
                          {isNewMaterial(material.createdAt) && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white text-xs px-1.5 py-0.5 flex-shrink-0">
                              New
                            </Badge>
                          )}
                        </div>
                        {material.manufacturer && (
                          <div className="text-xs text-muted-foreground truncate pl-6">
                            {material.manufacturer}
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(material)} className="text-xs">
                            <Edit className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(material)} className="text-xs">
                            <Copy className="h-3 w-3 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(material.id)}
                            className="text-destructive text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      {/* Part Number */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Part Number</div>
                        <div className="text-xs">
                          {material.partNumber && material.partNumber !== "0" && material.partNumber !== "" ? (
                            <Badge variant="outline" className="text-xs font-mono">
                              {material.partNumber}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                              No PN
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Unit */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Unit</div>
                        <Badge variant="secondary" className="text-xs">{material.unit}</Badge>
                      </div>

                      {/* Price */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Price</div>
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(material.price)}
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Created</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(material.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Purchase URL and Datasheet */}
                    {(material.purchaseUrl || material.datasheetFile) && (
                      <div className="pl-6 pt-2 border-t space-y-2">
                        {material.purchaseUrl && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Purchase URL</div>
                            <a
                              href={material.purchaseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline truncate block"
                            >
                              {material.purchaseUrl}
                            </a>
                          </div>
                        )}
                        {material.datasheetFile && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Datasheet</div>
                            <div className="flex items-center gap-2">
                              <File className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground truncate">
                                {material.datasheetFile}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {materials.length > 0 && processedMaterials.length === 0 && (
            <div className="text-center py-8 lg:hidden">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No materials found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}

          {materials.length === 0 && (
            <div className="text-center py-8 lg:hidden">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No materials</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first material.
              </p>
            </div>
          )}

          {/* Lazy Loading Sentinel */}
          {displayMode === 'lazy' && hasMoreData && processedMaterials.length > 0 && (
            <div
              id="lazy-load-sentinel"
              className="flex justify-center py-8"
            >
              {isLazyLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading more materials...</span>
                </div>
              ) : (
                <Button variant="outline" onClick={loadMoreManually}>
                  Load More Materials
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {processedMaterials.length > 0 && (
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
                  Page {currentPage} of {Math.ceil(processedMaterials.length / pageSize)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(processedMaterials.length / pageSize)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Material</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Update material information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Row 1: Material Name (Full Width) */}
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm">Material Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Row 2: Part Number and Manufacturer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-partNumber" className="text-sm">Part Number</Label>
                <Input
                  id="edit-partNumber"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-manufacturer" className="text-sm">Manufacturer</Label>
                <Input
                  id="edit-manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3: Unit and Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-unit" className="text-sm">Unit *</Label>
                <Input
                  id="edit-unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price" className="text-sm">Price per Unit</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            {/* Row 4: Purchase URL (Full Width) */}
            <div className="space-y-2">
              <Label htmlFor="edit-purchaseUrl" className="text-sm">Purchase URL</Label>
              <Input
                id="edit-purchaseUrl"
                type="url"
                value={formData.purchaseUrl}
                onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
                placeholder="https://example.com/buy"
              />
            </div>

            {/* Row 5: Datasheet File (Full Width) */}
            <div className="space-y-2">
              <Label htmlFor="edit-datasheetFile" className="text-sm">Datasheet File</Label>
              <Input
                id="edit-datasheetFile"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setFormData({ ...formData, datasheetFile: file });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Upload PDF, DOC, DOCX, XLS, or XLSX files only
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingMaterial(null);
                  setFormData({ name: "", partNumber: "", manufacturer: "", unit: "", price: "", purchaseUrl: "", datasheetFile: null });
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">Update Material</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        type="destructive"
        title="Delete Material"
        description="Are you sure you want to delete this material? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setMaterialToDelete(null);
        }}
        destructive
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        type="destructive"
        title="Delete Multiple Materials"
        description={`Are you sure you want to delete ${selectedMaterials.length} selected materials? This action cannot be undone. Materials that are used in assemblies will not be deleted.`}
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={confirmBulkDelete}
        onCancel={() => setIsBulkDeleteDialogOpen(false)}
        destructive
      />
    </div>
  );
}
