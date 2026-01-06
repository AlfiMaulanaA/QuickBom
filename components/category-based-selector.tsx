"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  DollarSign,
  ShoppingCart,
  Calculator,
  Save,
  RefreshCw,
  Cpu,
  Zap,
  Wrench,
  Truck,
  Cog
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AssemblyGroup, ValidationResult, Assembly } from "@/lib/types/assembly";

interface CategoryBasedSelectorProps {
  groups: AssemblyGroup[];
  onSelectionChange?: (selections: Record<number, Record<string, number[]>>) => void;
  onValidationChange?: (result: ValidationResult | null) => void;
}

export default function CategoryBasedSelector({
  groups,
  onSelectionChange,
  onValidationChange
}: CategoryBasedSelectorProps) {
  const [selections, setSelections] = useState<Record<number, Record<string, number[]>>>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Group by module for display (get module from assemblies in the group)
  const groupsByModule = useMemo(() => {
    return groups.reduce((acc, group) => {
      // Get the primary module from the first assembly in the group
      // In a real scenario, you might want to ensure all assemblies have the same module
      const primaryAssembly = group.items[0]?.assembly;
      const module = primaryAssembly?.module || 'ELECTRICAL'; // fallback

      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(group);
      return acc;
    }, {} as Record<string, AssemblyGroup[]>);
  }, [groups]);

  // Get module info
  const getModuleInfo = (module: string) => {
    const moduleMap: Record<string, { label: string; description: string; color: string; icon: React.ReactNode }> = {
      'ELECTRONIC': {
        label: 'Electronic',
        description: 'Electronic components and systems',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        icon: <Cpu className="h-5 w-5" />
      },
      'ELECTRICAL': {
        label: 'Electrical',
        description: 'Electrical wiring and installations',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: <Zap className="h-5 w-5" />
      },
      'ASSEMBLY': {
        label: 'Assembly',
        description: 'General assembly components',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        icon: <Wrench className="h-5 w-5" />
      },
      'INSTALLATION': {
        label: 'Installation',
        description: 'Installation and mounting components',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: <Truck className="h-5 w-5" />
      },
      'MECHANICAL': {
        label: 'Mechanical',
        description: 'Mechanical parts and components',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: <Cog className="h-5 w-5" />
      }
    };
    return moduleMap[module] || moduleMap['ELECTRICAL'];
  };

  // Initialize selections with defaults
  useEffect(() => {
    const initialSelections: Record<number, Record<string, number[]>> = {};

    groups.forEach(group => {
      if (!initialSelections[group.categoryId]) {
        initialSelections[group.categoryId] = {};
      }

      // Set defaults based on group type
      if (group.groupType === 'REQUIRED') {
        // For REQUIRED groups, select all assemblies by default
        initialSelections[group.categoryId][group.id] = group.items.map(item => item.assemblyId);
      } else if (group.groupType === 'CHOOSE_ONE') {
        // For CHOOSE_ONE groups, select default item or first item
        const defaultItem = group.items.find(item => item.isDefault);
        if (defaultItem) {
          initialSelections[group.categoryId][group.id] = [defaultItem.assemblyId];
        } else if (group.items.length > 0) {
          // Select first item if no default
          initialSelections[group.categoryId][group.id] = [group.items[0].assemblyId];
        }
      } else {
        // For OPTIONAL and CONFLICT groups, start with no selection
        initialSelections[group.categoryId][group.id] = [];
      }
    });

    setSelections(initialSelections);
  }, [groups]);

  // Validate selections whenever they change
  useEffect(() => {
    validateSelections();
  }, [selections]);

  const validateSelections = async () => {
    if (Object.keys(selections).length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/assembly-groups/validate-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selections
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setValidationResult(result);
        onValidationChange?.(result);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (categoryId: number, groupId: string, assemblyId: number) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const currentSelections = selections[categoryId]?.[groupId] || [];
    let newSelections: number[];

    switch (group.groupType) {
      case 'REQUIRED':
        // For required, just toggle (though validation will enforce all must be selected)
        newSelections = currentSelections.includes(assemblyId)
          ? currentSelections.filter(id => id !== assemblyId)
          : [...currentSelections, assemblyId];
        break;

      case 'CHOOSE_ONE':
        // Only one selection allowed
        newSelections = [assemblyId];
        break;

      case 'OPTIONAL':
        // Toggle freely
        newSelections = currentSelections.includes(assemblyId)
          ? currentSelections.filter(id => id !== assemblyId)
          : [...currentSelections, assemblyId];
        break;

      case 'CONFLICT':
        // Check for conflicts
        const selectedItem = group.items.find(item => item.assemblyId === assemblyId);
        if (!selectedItem) return;

        if (currentSelections.includes(assemblyId)) {
          // Remove this item
          newSelections = currentSelections.filter(id => id !== assemblyId);
        } else {
          // Add this item, remove conflicts
          const conflicts = selectedItem.conflictsWith;
          newSelections = [
            ...currentSelections.filter(id => !conflicts.includes(id)),
            assemblyId
          ];
        }
        break;

      default:
        newSelections = currentSelections;
    }

    const newCategorySelections = {
      ...selections[categoryId],
      [groupId]: newSelections
    };

    const newSelectionsState = {
      ...selections,
      [categoryId]: newCategorySelections
    };

    setSelections(newSelectionsState);
    onSelectionChange?.(newSelectionsState);
  };

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'REQUIRED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CHOOSE_ONE': return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case 'OPTIONAL': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'CONFLICT': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getGroupTypeLabel = (type: string) => {
    switch (type) {
      case 'REQUIRED': return 'All Required';
      case 'CHOOSE_ONE': return 'Choose One';
      case 'OPTIONAL': return 'Optional';
      case 'CONFLICT': return 'Conflicts';
      default: return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const isItemSelected = (categoryId: number, groupId: string, assemblyId: number) => {
    return selections[categoryId]?.[groupId]?.includes(assemblyId) || false;
  };

  const isItemDisabled = (categoryId: number, groupId: string, assemblyId: number) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || group.groupType !== 'CONFLICT') return false;

    const item = group.items.find(i => i.assemblyId === assemblyId);
    if (!item) return false;

    const currentSelections = selections[categoryId]?.[groupId] || [];
    const selectedConflicts = currentSelections.filter(id => {
      const selectedItem = group.items.find(i => i.assemblyId === id);
      return selectedItem && item.conflictsWith.includes(selectedItem.assemblyId);
    });

    return selectedConflicts.length > 0 && !currentSelections.includes(assemblyId);
  };

  if (groups.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">No Assembly Groups</h3>
          <p className="text-muted-foreground dark:text-gray-400">
            Create assembly groups first to enable selection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Assembly Selection</h2>
          <p className="text-muted-foreground dark:text-gray-400">
            Choose assemblies from each category following the selection rules
          </p>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
          <Button
            variant="outline"
            size="sm"
            onClick={validateSelections}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Validate
          </Button>
        </div>
      </div>

      {/* Validation Status */}
      {validationResult && (
        <Alert className={validationResult.isValid
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
          : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"}>
          <div className="flex items-start gap-3">
            {validationResult.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <div className={`font-medium ${validationResult.isValid
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'}`}>
                {validationResult.isValid ? 'Selection Valid' : 'Selection Invalid'}
              </div>
              <div className={`text-sm mt-1 ${validationResult.isValid
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'}`}>
                {validationResult.isValid ? (
                  `Ready to create template with ${formatCurrency(validationResult.totalCost)} total cost`
                ) : (
                  `${validationResult.errors.length} error(s) need to be fixed`
                )}
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Modules */}
      {Object.entries(groupsByModule).map(([module, moduleGroups]) => {
        const moduleInfo = getModuleInfo(module);

        return (
          <Card key={module}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${moduleInfo.color}`}>
                  {moduleInfo.icon}
                </div>
                <div>
                  <CardTitle className="text-xl">{moduleInfo.label} Module</CardTitle>
                  <CardDescription>{moduleInfo.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {moduleGroups.map(group => {
                const groupBreakdown = validationResult?.breakdown
                  .find(b => b.categoryId === group.categoryId)?.groups
                  .find(g => g.groupId === group.id);

                return (
                  <div key={group.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      {getGroupTypeIcon(group.groupType)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{group.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {group.category.name}
                          </Badge>
                        </div>
                        {group.description && (
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {getGroupTypeLabel(group.groupType)}
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {group.items.map(item => {
                        const isSelected = isItemSelected(group.categoryId, group.id, item.assemblyId);
                        const isDisabled = isItemDisabled(group.categoryId, group.id, item.assemblyId);
                        // Always calculate cost - not just for selected items
                        const validatedCost = groupBreakdown?.assemblies
                          .find(a => a.assemblyId === item.assemblyId)?.cost;

                        // Use validated cost if available, otherwise use base assembly price
                        const itemCost = (validatedCost !== undefined && validatedCost > 0)
                          ? validatedCost
                          : (Number(item.assembly.price || 0) * Number(item.quantity || 1));

                        return (
                          <div
                            key={item.assemblyId}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : isDisabled
                                ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800/50'
                                : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary/50 dark:hover:bg-primary/5'
                            }`}
                            onClick={() => !isDisabled && handleItemToggle(group.categoryId, group.id, item.assemblyId)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                  {isSelected && <CheckCircle className="h-3 w-3" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.assembly.name}</h4>
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                      {item.assembly.module}
                                    </Badge>
                                  </div>
                                  {item.assembly.description && (
                                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1 line-clamp-2">{item.assembly.description}</p>
                                  )}
                                  {item.isDefault && (
                                    <Badge variant="secondary" className="text-xs mt-2">
                                      Default
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                  {formatCurrency(itemCost)}
                                </div>
                                <div className="text-sm text-muted-foreground dark:text-gray-400">
                                  Qty: {item.quantity}
                                </div>
                              </div>
                            </div>

                            {isDisabled && (
                              <div className="mt-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                <span>Disabled due to conflicts</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Group Cost Summary */}
                    {groupBreakdown && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Group Total:</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(groupBreakdown.cost)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Simple Selection Summary */}
      {validationResult && (
        <Card className="border-primary/20 dark:border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Selection Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">
                  {validationResult.breakdown.reduce((sum, cat) =>
                    sum + cat.groups.reduce((gSum, g) => gSum + g.assemblies.length, 0), 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Assemblies</div>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {formatCurrency(validationResult.totalCost)}
                </div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className={`text-2xl font-bold mb-1 ${
                  validationResult.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResult.isValid ? 'Valid' : 'Invalid'}
                </div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
            </div>

            {!validationResult.isValid && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Please fix these issues:</div>
                  <ul className="space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index} className="text-sm">• {error.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationResult.isValid && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  All selections are valid. Ready to create template.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
