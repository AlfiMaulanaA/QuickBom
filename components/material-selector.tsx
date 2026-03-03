"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Minus, Package, X, Check, Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true); // Only for initial load
  const [isSearching, setIsSearching] = useState(false); // For search operations
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>(initialSelectedMaterials);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const pageSize = 100;

  const fetchMaterials = useCallback(async (page = 0, search = "", append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else if (page === 0 && search === "" && isInitialMount.current) {
        // Only show full loading on initial mount
        setLoading(true);
      } else {
        // For search, use isSearching instead
        setIsSearching(true);
      }

      // Use server-side search with larger page size
      const response = await fetch(`/api/materials?page=${page}&size=${pageSize}&search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        // Map CRM data to component interface
        const mappedMaterials: Material[] = (data.content || []).map((m: any) => ({
          id: m.id,
          name: m.partName,
          partNumber: m.partNumber,
          partDesc: m.partDesc,
          manufacturer: m.mfr,
          unit: m.unitMeasure,
          price: m.priceToIDR
        }));

        if (append) {
          setMaterials(prev => [...prev, ...mappedMaterials]);
        } else {
          setMaterials(mappedMaterials);
        }

        setTotalElements(data.totalElements || 0);
        setCurrentPage(page);
        setHasMore(!data.last && mappedMaterials.length > 0);
      }
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsSearching(false);
      isInitialMount.current = false;
    }
  }, []);

  // Initial load only
  useEffect(() => {
    fetchMaterials(0, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search - only triggered when searchTerm changes after initial mount
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchMaterials(0, searchTerm);
    }, 500); // Increased debounce time for better UX

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, fetchMaterials]);

  // Load more materials
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchMaterials(currentPage + 1, searchTerm, true);
    }
  }, [loadingMore, hasMore, currentPage, searchTerm, fetchMaterials]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;

    if (scrollPercentage > 0.8 && hasMore && !loadingMore) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadMore]);

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

  return (
    <div className="flex flex-col h-[90vh] max-h-[800px]">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 border-b">
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
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Materials List */}
        <div className="flex-1 border-r flex flex-col">
          <div className="flex-shrink-0 p-4 border-b bg-muted/50">
            <h3 className="font-semibold">Available Materials ({materials.length} of {totalElements.toLocaleString()})</h3>
          </div>
          <ScrollArea className="flex-1" onScrollCapture={handleScroll}>
            <div className="p-4 space-y-2">
              {/* Initial Loading State */}
              {loading && materials.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading materials...</span>
                </div>
              )}

              {materials.map((material) => {
                const isSelected = isMaterialSelected(material.id);
                const selectedMaterial = getSelectedMaterial(material.id);

                return (
                  <Card key={material.id} className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-primary bg-primary/5 shadow-sm border-primary/20' : 'hover:bg-muted/30 hover:border-muted-foreground/20'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className="pt-1">
                          <Checkbox
                            id={`material-${material.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleMaterialToggle(material, checked as boolean)}
                            className="h-5 w-5 rounded-md"
                          />
                        </div>

                        {/* Material Info */}
                        <div className="flex-1 cursor-pointer min-w-0" onClick={() => handleMaterialToggle(material, !isSelected)}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                              {/* Highlight Part Desc as primary title */}
                              <h4 className="font-semibold text-base text-foreground leading-tight truncate">
                                {material.partDesc || material.name}
                              </h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 bg-muted/50 border-none">{material.unit}</Badge>
                              </div>
                            </div>

                            {/* Part Name as secondary info */}
                            <p className="text-xs text-muted-foreground line-clamp-1 italic">
                              {material.name}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                              {material.partNumber && (
                                <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                  <span className="opacity-70">PN:</span>
                                  <span className="font-mono">{material.partNumber === "0" ? "N/A" : material.partNumber}</span>
                                </div>
                              )}
                              {material.manufacturer && (
                                <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  <span className="opacity-70">Mfr:</span>
                                  <span>{material.manufacturer}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls - Only show when selected */}
                        {isSelected && selectedMaterial && (
                          <div className="flex items-center gap-2 self-center bg-background rounded-lg border p-1 shadow-sm">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                decrementQuantity(material.id);
                              }}
                              disabled={selectedMaterial.quantity <= 0}
                              className="h-8 w-8 hover:bg-muted"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              step="any"
                              value={selectedMaterial.quantity === 0 && selectedMaterial.quantity.toString() !== "0." ? "" : selectedMaterial.quantity}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                handleQuantityChange(material.id, isNaN(val) ? 0 : Math.max(0, val));
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-14 h-8 text-center text-sm font-bold px-1 bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary shadow-none"
                              onClick={(e) => e.stopPropagation()}
                              min="0"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                incrementQuantity(material.id);
                              }}
                              className="h-8 w-8 hover:bg-muted"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Load More Indicator */}
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading more materials...</span>
                </div>
              )}

              {/* End of List Indicator */}
              {!hasMore && materials.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  All {totalElements.toLocaleString()} materials loaded
                </div>
              )}

              {/* No Results */}
              {materials.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No materials found</p>
                  {searchTerm && <p className="text-sm">Try a different search term</p>}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Selected Materials Summary */}
        <div className="w-80 flex flex-col">
          <div className="flex-shrink-0 p-4 border-b bg-muted/50">
            <h3 className="font-semibold">Selected Materials ({selectedMaterials.length})</h3>
          </div>
          <ScrollArea className="flex-1">
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
                    <div key={selectedMaterial.materialId} className="group relative bg-background border rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex flex-col gap-1 mb-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-xs text-foreground leading-snug line-clamp-2 pr-4">
                            {selectedMaterial.material.partDesc || selectedMaterial.material.name}
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMaterialToggle(selectedMaterial.material, false)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {selectedMaterial.material.partDesc && (
                          <div className="text-[10px] text-muted-foreground italic line-clamp-1">
                            {selectedMaterial.material.name}
                          </div>
                        )}
                        {selectedMaterial.material.partNumber && (
                          <div className="text-[10px] font-mono text-muted-foreground">
                            PN: {selectedMaterial.material.partNumber === "0" ? "N/A" : selectedMaterial.material.partNumber}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed">
                        <div className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase">
                          {selectedMaterial.material.unit}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-primary/10 text-primary px-1 py-0.5 rounded-lg border border-primary/20">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => decrementQuantity(selectedMaterial.materialId)}
                              disabled={selectedMaterial.quantity <= 0}
                              className="h-5 w-5 hover:bg-primary/20 text-primary"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              step="any"
                              value={selectedMaterial.quantity === 0 && selectedMaterial.quantity.toString() !== "0." ? "" : selectedMaterial.quantity}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                handleQuantityChange(selectedMaterial.materialId, isNaN(val) ? 0 : Math.max(0, val));
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-10 h-5 text-center text-[10px] font-bold p-0 bg-transparent border-none focus-visible:ring-0 shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min="0"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => incrementQuantity(selectedMaterial.materialId)}
                              className="h-5 w-5 hover:bg-primary/20 text-primary"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="flex-shrink-0 p-4 border-t bg-muted/50">
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
