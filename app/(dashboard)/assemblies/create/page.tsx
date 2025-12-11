"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, Save, X, Upload, File, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MaterialSelector from "@/components/material-selector";

interface Material {
  id: number;
  name: string;
  partNumber: string | null;
  manufacturer: string | null;
  unit: string;
  price: number;
}

interface SelectedMaterial {
  materialId: number;
  quantity: number;
  material: Material;
}

export default function CreateAssemblyPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isMaterialSelectorOpen, setIsMaterialSelectorOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    materials: [] as { materialId: number; quantity: number }[]
  });
  const [assemblyDocs, setAssemblyDocs] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    fetchMaterials();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      // First, create the assembly without documents
      const response = await fetch("/api/assemblies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          docs: null, // We'll add documents later
          materials: formData.materials
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create assembly",
          variant: "destructive",
        });
        return;
      }

      const createdAssembly = await response.json();

      // Now upload any temporary documents
      if (assemblyDocs.length > 0) {
        let uploadSuccess = true;

        for (const doc of assemblyDocs) {
          if (doc.url.startsWith('#temp-') && doc.file) {
            // This is a temporary file that needs to be uploaded
            const formDataUpload = new FormData();
            formDataUpload.append('file', doc.file);
            formDataUpload.append('assemblyId', createdAssembly.id.toString());

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
            description: "Assembly created but some documents failed to upload",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: "Assembly created successfully",
      });

      // Verify authentication before redirect to prevent token loss
      try {
        const authCheck = await fetch("/api/auth/me", {
          headers: { 'Cache-Control': 'no-cache' },
          credentials: 'include'
        });

        if (authCheck.ok) {
          // Authentication confirmed, safe to redirect
          router.replace("/assemblies");
        } else {
          // Authentication lost, redirect to login
          console.warn("Authentication lost after assembly creation");
          router.replace("/login?redirect=/assemblies");
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        // On error, try redirect anyway
        router.replace("/assemblies");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create assembly",
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
    return formData.materials.reduce((total, material) => {
      const materialInfo = materials.find(m => m.id === material.materialId);
      return total + ((materialInfo?.price || 0) * material.quantity);
    }, 0);
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Create New Assembly</h1>
            <p className="text-muted-foreground">
              Add a new assembly with material composition
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
                Enter basic information about the assembly
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
                  size="sm"
                  onClick={() => setIsCreateMaterialOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Material
                </Button>
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
                <div className="grid grid-cols-12 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
                  <div className="col-span-6">Material Name</div>
                  <div className="col-span-3 text-center">Quantity</div>
                  <div className="col-span-3 text-right">Price</div>
                </div>

                {/* Materials List */}
                <div className="space-y-2">
                  {(() => {
                    // Get full material data with search and sort
                    const materialsWithData = formData.materials.map(material => {
                      const materialInfo = materials.find(m => m.id === material.materialId);
                      return materialInfo ? { ...material, material: materialInfo } : null;
                    }).filter(Boolean) as Array<{ materialId: number; quantity: number; material: Material }>;

                    // Filter by search term
                    const filteredMaterials = materialsWithData.filter(item => {
                      const searchLower = materialSearchTerm.toLowerCase();
                      return item.material.name.toLowerCase().includes(searchLower) ||
                             (item.material.partNumber && item.material.partNumber.toLowerCase().includes(searchLower));
                    });

                    // Sort materials
                    const sortedMaterials = filteredMaterials.sort((a, b) => {
                      let aValue: any, bValue: any;

                      switch (materialSortBy) {
                        case "name":
                          aValue = a.material.name.toLowerCase();
                          bValue = b.material.name.toLowerCase();
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
                      <div key={item.materialId} className="grid grid-cols-12 gap-4 items-center p-3 bg-muted/50 rounded-lg border">
                        <div className="col-span-6">
                          <div className="flex flex-col">
                            <span className="font-medium">{item.material.name}</span>
                            {item.material.partNumber && (
                              <span className="text-xs text-muted-foreground">PN: {item.material.partNumber}</span>
                            )}
                          </div>
                        </div>
                        <div className="col-span-3 text-center">
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {item.material.unit}
                          </span>
                        </div>
                        <div className="col-span-3 text-right">
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(item.material.price * item.quantity)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(item.material.price)}/{item.material.unit}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Total Cost */}
                <div className="flex justify-end items-center font-semibold text-lg pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">Total Cost:</span>
                    <span className="text-green-600 dark:text-green-400 text-xl">
                      {formatCurrency(calculateTotalCost())}
                    </span>
                  </div>
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
            {isSubmitting ? "Creating..." : "Create Assembly"}
          </Button>
        </div>
      </form>

      {/* Material Selector Modal */}
      {isMaterialSelectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-7xl w-full max-h-[95vh] overflow-hidden">
            <MaterialSelector
              onSelectionChange={(selectedMaterials) => {
                setFormData({
                  ...formData,
                  materials: selectedMaterials.map(sm => ({
                    materialId: sm.materialId,
                    quantity: sm.quantity
                  }))
                });
              }}
              initialSelectedMaterials={formData.materials.map(material => {
                const materialInfo = materials.find(m => m.id === material.materialId);
                return materialInfo ? {
                  materialId: material.materialId,
                  quantity: material.quantity,
                  material: materialInfo
                } : null;
              }).filter(Boolean) as any[]}
              onClose={() => setIsMaterialSelectorOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Create Material Modal */}
      {isCreateMaterialOpen && (
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
                              quantity: 1
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
      )}
    </div>
  );
}
