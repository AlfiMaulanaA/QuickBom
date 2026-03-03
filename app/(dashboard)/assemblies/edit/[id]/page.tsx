"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, Save, X, Upload, File, Plus, Search, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import MaterialSelector from "@/components/material-selector";

interface Material {
  id: number;
  name: string;
  partNumber: string | null;
  partDesc: string | null;
  manufacturer: string | null;
  unit: string;
  price: number;
}

interface SelectedMaterial {
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
  module: 'ELECTRONIC' | 'ELECTRICAL' | 'ASSEMBLY' | 'INSTALLATION' | 'MECHANICAL';
  categoryId: number;
  category: AssemblyCategory;
  docs: DocumentFile[] | null;
  materials: Array<{
    id?: number;
    materialId: number;
    quantity: number;
    material: Material;
  }>;
}

export default function EditAssemblyPage() {
  const router = useRouter();
  const params = useParams();
  const assemblyId = parseInt(params.id as string);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<AssemblyCategory[]>([]);
  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [isMaterialSelectorOpen, setIsMaterialSelectorOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    module: "ELECTRICAL" as 'ELECTRONIC' | 'ELECTRICAL' | 'ASSEMBLY' | 'INSTALLATION' | 'MECHANICAL',
    categoryId: "",
    materials: [] as SelectedMaterial[]
  });
  const [assemblyDocs, setAssemblyDocs] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateMaterialOpen, setIsCreateMaterialOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    partNumber: "",
    manufacturer: "",
    unit: "pcs",
    price: 0
  });
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [materialSortBy, setMaterialSortBy] = useState<"name" | "partNumber" | "price">("name");
  const [materialSortOrder, setMaterialSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  useEffect(() => {
    fetchAssembly();
    fetchMaterials();
    fetchCategories();
  }, [assemblyId]);

  const fetchAssembly = async () => {
    try {
      const response = await fetch(`/api/assemblies/${assemblyId}`);
      if (response.ok) {
        const data = await response.json();
        setAssembly(data);
        // Convert Snapshot materials to compatible format
        const currentMaterials: SelectedMaterial[] = data.materials.map((am: any) => ({
          materialId: Number(am.externalId),
          quantity: Number(am.quantity),
          material: {
            id: Number(am.externalId),
            name: am.name,
            partNumber: am.partNumber,
            partDesc: am.partDesc,
            manufacturer: am.manufacturer,
            unit: am.unit,
            price: Number(am.price)
          }
        }));

        setFormData({
          name: data.name,
          description: data.description || "",
          module: data.module || "ELECTRICAL",
          categoryId: data.categoryId.toString(),
          materials: currentMaterials
        });

        // Also populate 'materials' state with the snapshot data so they appear in list/calc
        const snapshotMaterials: Material[] = data.materials.map((am: any) => ({
          id: Number(am.externalId),
          name: am.name,
          partNumber: am.partNumber,
          partDesc: am.partDesc,
          manufacturer: am.manufacturer,
          unit: am.unit,
          price: Number(am.price)
        }));
        setMaterials(prev => {
          // Merge to avoid duplicates
          const existingIds = new Set(prev.map(m => m.id));
          const newMaterials = snapshotMaterials.filter(m => !existingIds.has(m.id));
          return [...prev, ...newMaterials];
        });

        // Load existing documents, filter out temporary ones
        const validDocs = (data.docs || []).filter((doc: any) => !doc.url.startsWith('#temp-'));
        setAssemblyDocs(validDocs);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch assembly",
          variant: "destructive",
        });
        router.push("/assemblies");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch assembly",
        variant: "destructive",
      });
      router.push("/assemblies");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      // Fetch with larger page size - MaterialSelector now handles pagination
      const response = await fetch("/api/materials?page=0&size=100");
      if (response.ok) {
        // Map CRM data to local interface
        const data = await response.json();
        const mappedMaterials: Material[] = (data.content || []).map((m: any) => ({
          id: m.id,
          name: m.partName,
          partNumber: m.partNumber,
          partDesc: m.partDesc,
          manufacturer: m.mfr,
          unit: m.unitMeasure,
          price: m.priceToIDR
        }));
        setMaterials(prev => {
          // Merge with existing materials (from assembly) to avoid losing them
          const existingIds = new Set(prev.map(m => m.id));
          const newMaterials = mappedMaterials.filter(m => !existingIds.has(m.id));
          return [...prev, ...newMaterials];
        });
      }
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/assembly-categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      toast({
        title: "Error",
        description: "Please select an assembly category",
        variant: "destructive",
      });
      return;
    }

    if (formData.materials.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one material",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, update the assembly without documents
      const response = await fetch(`/api/assemblies/${assemblyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          module: formData.module,
          categoryId: parseInt(formData.categoryId),
          docs: null, // We'll handle documents separately
          materials: formData.materials.map(m => ({
            externalId: m.materialId.toString(),
            quantity: m.quantity,
            name: m.material.name,
            partNumber: m.material.partNumber,
            partDesc: m.material.partDesc,
            manufacturer: m.material.manufacturer,
            unit: m.material.unit,
            price: m.material.price
          }))
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update assembly",
          variant: "destructive",
        });
        return;
      }

      // Now upload any temporary documents
      if (assemblyDocs.length > 0) {
        let uploadSuccess = true;

        for (const doc of assemblyDocs) {
          if (doc.url.startsWith('#temp-') && doc.file) {
            // This is a temporary file that needs to be uploaded
            const formDataUpload = new FormData();
            formDataUpload.append('file', doc.file);
            formDataUpload.append('assemblyId', assemblyId.toString());

            try {
              const uploadResponse = await fetch('/api/assemblies/upload', {
                method: 'POST',
                body: formDataUpload,
              });

              if (!uploadResponse.ok) {
                console.error('Failed to upload document:', doc.name);
                uploadSuccess = false;
              }
            } catch (uploadError) {
              console.error('Error uploading document:', doc.name, uploadError);
              uploadSuccess = false;
            }
          }
        }

        if (!uploadSuccess) {
          toast({
            title: "Warning",
            description: "Assembly updated but some documents failed to upload",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: "Assembly updated successfully",
      });
      router.push("/assemblies");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assembly",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const calculateTotalCost = () => {
    return formData.materials.reduce((total, sm) => {
      return total + (sm.material.price * sm.quantity);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!assembly) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Assembly not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/assemblies")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Assembly</h1>
            <p className="text-muted-foreground">
              Update assembly information and material composition
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information and Documents Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Assembly Information</CardTitle>
              <CardDescription>
                Update basic information about the assembly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Assembly Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pemasangan Dinding Bata Merah"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this assembly..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="module">Assembly Module *</Label>
                <Select value={formData.module} onValueChange={(value: any) => setFormData({ ...formData, module: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a module for this assembly" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ELECTRONIC">Electronic - Electronic components and systems</SelectItem>
                    <SelectItem value="ELECTRICAL">Electrical - Electrical wiring and installations</SelectItem>
                    <SelectItem value="ASSEMBLY">Assembly - General assembly components</SelectItem>
                    <SelectItem value="INSTALLATION">Installation - Installation and mounting components</SelectItem>
                    <SelectItem value="MECHANICAL">Mechanical - Mechanical parts and components</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose the module that best describes this assembly type
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Assembly Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category for this assembly" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: category.color || '#3b82f6' }}
                          />
                          <span>{category.name}</span>
                          {category.description && (
                            <span className="text-xs text-muted-foreground ml-2">
                              - {category.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose the category that best describes this assembly type
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Documents Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Documents
              </CardTitle>
              <CardDescription>
                Upload supporting documents for this assembly (PDF files only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* File Input */}
                <div>
                  <input
                    type="file"
                    id="document-upload"
                    className="hidden"
                    accept=".pdf"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;

                      // Process each file
                      files.forEach(file => {
                        const docObject = {
                          name: file.name,
                          url: `#temp-${Date.now()}-${file.name}`, // Temporary URL
                          size: file.size,
                          type: file.type || 'application/pdf',
                          uploadedAt: new Date().toISOString(),
                          file: file // Keep file reference for upload
                        };
                        setAssemblyDocs(prev => [...prev, docObject]);
                      });

                      // Reset input
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('document-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose PDF Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Select one or more PDF files to attach to this assembly
                  </p>
                </div>

                {/* Documents List */}
                {assemblyDocs.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selected Documents:</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {assemblyDocs.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(doc.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAssemblyDocs(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Material Selection */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Material Selection</CardTitle>
                <CardDescription>
                  Choose materials and set quantities for this assembly
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMaterialSelectorOpen(true)}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Select Materials
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Sort Controls */}
            {formData.materials.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search materials by name or part number..."
                      value={materialSearchTerm}
                      onChange={(e) => setMaterialSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={`${materialSortBy}-${materialSortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-') as [typeof materialSortBy, typeof materialSortOrder];
                      setMaterialSortBy(sortBy);
                      setMaterialSortOrder(sortOrder);
                    }}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm min-w-[140px]"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="partNumber-asc">Part Number (A-Z)</option>
                    <option value="partNumber-desc">Part Number (Z-A)</option>
                    <option value="price-asc">Price (Low-High)</option>
                    <option value="price-desc">Price (High-Low)</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMaterialSearchTerm("");
                      setMaterialSortBy("name");
                      setMaterialSortOrder("asc");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Selected Materials Display */}
            {formData.materials.length > 0 ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <div>Material Details</div>
                  <div className="w-32 text-center">Composition Qty</div>
                </div>

                {/* Materials List */}
                <div className="space-y-2">
                  {(() => {
                    const materialsWithData = formData.materials;

                    // Filter by search term
                    const filteredMaterials = materialsWithData.filter(item => {
                      const searchLower = materialSearchTerm.toLowerCase();
                      return item.material.name.toLowerCase().includes(searchLower) ||
                        (item.material.partDesc && item.material.partDesc.toLowerCase().includes(searchLower)) ||
                        (item.material.partNumber && item.material.partNumber.toLowerCase().includes(searchLower));
                    });

                    // Sort materials
                    const sortedMaterials = filteredMaterials.sort((a, b) => {
                      let aValue: any, bValue: any;

                      switch (materialSortBy) {
                        case "name":
                          aValue = (a.material.partDesc || a.material.name).toLowerCase();
                          bValue = (b.material.partDesc || b.material.name).toLowerCase();
                          break;
                        case "partNumber":
                          aValue = (a.material.partNumber || "").toLowerCase();
                          bValue = (b.material.partNumber || "").toLowerCase();
                          break;
                        case "price":
                          aValue = a.material.price;
                          bValue = b.material.price;
                          break;
                        default:
                          return 0;
                      }

                      if (materialSortOrder === "asc") {
                        return aValue > bValue ? 1 : -1;
                      } else {
                        return aValue < bValue ? 1 : -1;
                      }
                    });

                    return sortedMaterials.map((item, index) => (
                      <div key={item.materialId} className="group relative flex items-center justify-between p-4 bg-background hover:bg-muted/30 transition-all border rounded-xl shadow-sm">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm text-foreground truncate">
                              {item.material.partDesc || item.material.name}
                            </h4>
                            <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 bg-muted/30 uppercase border-none">{item.material.unit}</Badge>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2 italic">
                            {item.material.name}
                          </p>

                          <div className="flex flex-wrap items-center gap-3">
                            {item.material.partNumber && (
                              <div className="flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                <span>PN:</span>
                                <span className="font-mono">{item.material.partNumber === "0" ? "N/A" : item.material.partNumber}</span>
                              </div>
                            )}
                            {item.material.manufacturer && (
                              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-full">
                                <span>Mfr:</span>
                                <span>{item.material.manufacturer}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 flex-shrink-0">
                          <div className="w-32 flex flex-col items-center justify-center bg-muted/20 rounded-lg p-2 border border-dashed hover:border-primary/50 transition-colors">
                            <Input
                              type="number"
                              step="any"
                              value={item.quantity === 0 ? "" : item.quantity}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                const newMaterials = formData.materials.map(m =>
                                  m.materialId === item.materialId ? { ...m, quantity: isNaN(val) ? 0 : Math.max(0, val) } : m
                                );
                                setFormData({ ...formData, materials: newMaterials });
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-20 h-8 text-center text-lg font-black text-primary bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min="0"
                            />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.material.unit}</span>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                materials: formData.materials.filter(m => m.materialId !== item.materialId)
                              });
                            }}
                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No materials selected yet</p>
                <p className="text-sm mb-4">Click "Select Materials" to choose materials for this assembly</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMaterialSelectorOpen(true)}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Select Materials
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/assemblies")}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={formData.materials.length === 0 || isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Updating..." : "Update Assembly"}
          </Button>
        </div>
      </form>

      {/* Material Selector Modal */}
      {
        isMaterialSelectorOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg shadow-lg max-w-7xl w-full max-h-[95vh] overflow-hidden">
              <MaterialSelector
                onSelectionChange={(selectedMaterials) => {
                  setFormData({
                    ...formData,
                    materials: selectedMaterials
                  });
                }}
                initialSelectedMaterials={formData.materials}
                onClose={() => setIsMaterialSelectorOpen(false)}
              />
            </div>
          </div>
        )
      }

      {/* Create Material Modal */}
      {
        isCreateMaterialOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg shadow-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Create New Material</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreateMaterialOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="material-name">Material Name *</Label>
                    <Input
                      id="material-name"
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      placeholder="e.g., Kabel NYY 2.5mm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="material-part-number">Part Number</Label>
                    <Input
                      id="material-part-number"
                      value={newMaterial.partNumber}
                      onChange={(e) => setNewMaterial({ ...newMaterial, partNumber: e.target.value })}
                      placeholder="e.g., NYY-2.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="material-manufacturer">Manufacturer</Label>
                    <Input
                      id="material-manufacturer"
                      value={newMaterial.manufacturer}
                      onChange={(e) => setNewMaterial({ ...newMaterial, manufacturer: e.target.value })}
                      placeholder="e.g., PT. Sumber Listrik"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="material-unit">Unit</Label>
                      <select
                        id="material-unit"
                        value={newMaterial.unit}
                        onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                      >
                        <option value="pcs">pcs</option>
                        <option value="m">m</option>
                        <option value="m2">m²</option>
                        <option value="m3">m³</option>
                        <option value="kg">kg</option>
                        <option value="liter">liter</option>
                        <option value="set">set</option>
                        <option value="roll">roll</option>
                        <option value="box">box</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="material-price">Price (IDR)</Label>
                      <Input
                        id="material-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newMaterial.price}
                        onChange={(e) => setNewMaterial({ ...newMaterial, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateMaterialOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!newMaterial.name.trim()) {
                          toast({
                            title: "Error",
                            description: "Material name is required",
                            variant: "destructive",
                          });
                          return;
                        }

                        try {
                          const response = await fetch("/api/materials", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify(newMaterial),
                          });

                          if (response.ok) {
                            const createdMaterial = await response.json();
                            toast({
                              title: "Success",
                              description: `Material "${newMaterial.name}" created successfully`,
                            });

                            // Reset form
                            setNewMaterial({
                              name: "",
                              partNumber: "",
                              manufacturer: "",
                              unit: "pcs",
                              price: 0
                            });
                            setIsCreateMaterialOpen(false);

                            // Refresh materials list
                            fetchMaterials();

                            // Auto-add to assembly with quantity 1
                            setFormData({
                              ...formData,
                              materials: [...formData.materials, {
                                materialId: createdMaterial.id,
                                quantity: 1,
                                material: {
                                  id: createdMaterial.id,
                                  name: createdMaterial.name,
                                  partNumber: createdMaterial.partNumber,
                                  partDesc: null,
                                  manufacturer: createdMaterial.manufacturer,
                                  unit: createdMaterial.unit,
                                  price: createdMaterial.price
                                }
                              }]
                            });
                          } else {
                            const error = await response.json();
                            toast({
                              title: "Error",
                              description: error.error || "Failed to create material",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to create material",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Create & Add to Assembly
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
