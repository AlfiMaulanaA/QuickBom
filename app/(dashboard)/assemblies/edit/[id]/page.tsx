"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MaterialSelector from "@/components/material-selector";

interface Material {
  id: number;
  name: string;
  unit: string;
  price: number;
}

interface SelectedMaterial {
  materialId: number;
  quantity: number;
  material: Material;
}

interface Assembly {
  id: number;
  name: string;
  description: string | null;
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
  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [isMaterialSelectorOpen, setIsMaterialSelectorOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    materials: [] as { materialId: number; quantity: number }[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssembly();
    fetchMaterials();
  }, [assemblyId]);

  const fetchAssembly = async () => {
    try {
      const response = await fetch(`/api/assemblies/${assemblyId}`);
      if (response.ok) {
        const data = await response.json();
        setAssembly(data);
        setFormData({
          name: data.name,
          description: data.description || "",
          materials: data.materials.map((am: any) => ({
            materialId: am.materialId,
            quantity: Number(am.quantity)
          }))
        });
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
      const response = await fetch(`/api/assemblies/${assemblyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          materials: formData.materials
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Assembly updated successfully",
        });
        router.push("/assemblies");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update assembly",
          variant: "destructive",
        });
      }
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
    return formData.materials.reduce((total, material) => {
      const materialInfo = materials.find(m => m.id === material.materialId);
      return total + ((materialInfo?.price || 0) * material.quantity);
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
          </CardContent>
        </Card>

        {/* Material Selection */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Material Selection</CardTitle>
                <CardDescription>
                  Update materials and quantities for this assembly
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(calculateTotalCost())}
                  </div>
                </div>
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
                  {formData.materials.map((material, index) => {
                    const materialInfo = materials.find(m => m.id === material.materialId);
                    return (
                      <div key={index} className="grid grid-cols-12 gap-4 items-center p-3 bg-muted/50 rounded-lg border">
                        <div className="col-span-6">
                          <span className="font-medium">{materialInfo?.name || 'Unknown Material'}</span>
                        </div>
                        <div className="col-span-3 text-center">
                          <span className="text-sm font-medium">{material.quantity}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {materialInfo?.unit || ''}
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency((materialInfo?.price || 0) * material.quantity)}
                          </div>
                        </div>
                        <div className="col-span-1 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                materials: formData.materials.filter((_, i) => i !== index)
                              });
                              toast({
                                title: "Material Removed",
                                description: `${materialInfo?.name || 'Material'} removed from assembly`,
                              });
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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
            {isSubmitting ? "Updating..." : "Update Assembly"}
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
    </div>
  );
}
