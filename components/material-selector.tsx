"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Minus, Package, X, Check } from "lucide-react";

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

interface MaterialSelectorProps {
  onSelectionChange: (selectedMaterials: SelectedMaterial[]) => void;
  initialSelectedMaterials?: SelectedMaterial[];
  onClose: () => void;
}

export default function MaterialSelector({
  onSelectionChange,
  initialSelectedMaterials = [],
  onClose
}: MaterialSelectorProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>(initialSelectedMaterials);

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
    } finally {
      setLoading(false);
    }
  };

  // Filter materials based on search term
  const filteredMaterials = useMemo(() => {
    if (!searchTerm) return materials;

    const term = searchTerm.toLowerCase();
    return materials.filter(material =>
      material.name.toLowerCase().includes(term) ||
      (material.partNumber && material.partNumber.toLowerCase().includes(term)) ||
      (material.manufacturer && material.manufacturer.toLowerCase().includes(term)) ||
      material.unit.toLowerCase().includes(term)
    );
  }, [materials, searchTerm]);

  const isMaterialSelected = (materialId: number) => {
    return selectedMaterials.some(sm => sm.materialId === materialId);
  };

  const getSelectedMaterial = (materialId: number) => {
    return selectedMaterials.find(sm => sm.materialId === materialId);
  };

  const handleMaterialToggle = (material: Material, checked: boolean) => {
    let newSelectedMaterials: SelectedMaterial[];

    if (checked) {
      // Add material with default quantity of 1
      const newSelectedMaterial: SelectedMaterial = {
        materialId: material.id,
        quantity: 1,
        material: material
      };
      newSelectedMaterials = [...selectedMaterials, newSelectedMaterial];
    } else {
      // Remove material
      newSelectedMaterials = selectedMaterials.filter(sm => sm.materialId !== material.id);
    }

    setSelectedMaterials(newSelectedMaterials);
    onSelectionChange(newSelectedMaterials);
  };

  const handleQuantityChange = (materialId: number, newQuantity: number) => {
    if (newQuantity < 0) return;

    const newSelectedMaterials = selectedMaterials.map(sm =>
      sm.materialId === materialId
        ? { ...sm, quantity: newQuantity }
        : sm
    );

    setSelectedMaterials(newSelectedMaterials);
    onSelectionChange(newSelectedMaterials);
  };

  const incrementQuantity = (materialId: number) => {
    const current = getSelectedMaterial(materialId);
    if (current) {
      handleQuantityChange(materialId, current.quantity + 1);
    }
  };

  const decrementQuantity = (materialId: number) => {
    const current = getSelectedMaterial(materialId);
    if (current && current.quantity > 0) {
      handleQuantityChange(materialId, current.quantity - 1);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const calculateTotalCost = () => {
    return selectedMaterials.reduce((total, sm) => {
      return total + (sm.material.price * sm.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading materials...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[90vh] max-h-[800px]">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Select Materials</h2>
            <p className="text-muted-foreground">Choose materials and set quantities for your assembly</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search materials by name, part number, manufacturer, or unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Materials List */}
        <div className="flex-1 border-r">
          <div className="p-4 border-b bg-muted/50">
            <h3 className="font-semibold">Available Materials ({filteredMaterials.length})</h3>
          </div>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {filteredMaterials.map((material) => {
                const isSelected = isMaterialSelected(material.id);
                const selectedMaterial = getSelectedMaterial(material.id);

                return (
                  <Card key={material.id} className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-muted/50'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        {/* Checkbox */}
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleMaterialToggle(material, checked as boolean)}
                        />

                        {/* Material Info */}
                        <div className="flex-1" onClick={() => handleMaterialToggle(material, !isSelected)}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{material.name}</h4>
                              <div className="text-xs text-muted-foreground">
                                {material.partNumber && (
                                  <span>Part: {material.partNumber}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Badge variant="outline" className="text-xs px-1 py-0">{material.unit}</Badge>
                              <span className="text-green-600 dark:text-green-400 font-medium text-xs">
                                {formatCurrency(material.price)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls - Only show when selected */}
                        {isSelected && selectedMaterial && (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => decrementQuantity(material.id)}
                              disabled={selectedMaterial.quantity <= 0}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={selectedMaterial.quantity}
                              onChange={(e) => handleQuantityChange(material.id, parseFloat(e.target.value) || 0)}
                              className="w-16 h-6 text-center text-xs"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => incrementQuantity(material.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Selected Materials Summary */}
        <div className="w-80">
          <div className="p-4 border-b bg-muted/50">
            <h3 className="font-semibold">Selected Materials ({selectedMaterials.length})</h3>
          </div>
          <ScrollArea className="h-full">
            <div className="p-4">
              {selectedMaterials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No materials selected yet</p>
                  <p className="text-sm">Click on materials to select them</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedMaterials.map((selectedMaterial) => (
                    <Card key={selectedMaterial.materialId} className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{selectedMaterial.material.name}</h4>
                            <div className="text-xs text-muted-foreground">
                              {selectedMaterial.quantity} × {formatCurrency(selectedMaterial.material.price)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(selectedMaterial.material.price * selectedMaterial.quantity)}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMaterialToggle(selectedMaterial.material, false)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {selectedMaterials.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total Cost:</span>
                        <span className="text-green-600 dark:text-green-400">
                          {formatCurrency(calculateTotalCost())}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/50">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedMaterials.length} material{selectedMaterials.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
              <Check className="h-4 w-4 mr-2" />
              Done ({selectedMaterials.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
