"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function CreateAssemblyPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isMaterialSelectorOpen, setIsMaterialSelectorOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    materials: [] as { materialId: number; quantity: number }[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      const response = await fetch("/api/assemblies", {
        method: "POST",
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
          description: "Assembly created successfully",
        });
        router.push("/assemblies");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create assembly",
          variant: "destructive",
        });
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMaterialSelectorOpen(true)}
              >
                <Package className="mr-2 h-4 w-4" />
                Select Materials
              </Button>
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
                        <div className="col-span-3 text-right">
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency((materialInfo?.price || 0) * material.quantity)}
                          </div>
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
    </div>
  );
}
