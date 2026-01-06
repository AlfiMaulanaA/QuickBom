"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Settings,
  Package,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  FolderOpen,
  Users,
  Layers,
  Zap,
  Minus,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AssemblyGroup, AssemblyCategory, Assembly } from "@/lib/types/assembly";

interface TemplateGroupManagerProps {
  onGroupsChange?: (groups: AssemblyGroup[]) => void;
}

export default function AssemblyGroupManager({ onGroupsChange }: TemplateGroupManagerProps) {
  const [groups, setGroups] = useState<AssemblyGroup[]>([]);
  const [categories, setCategories] = useState<AssemblyCategory[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AssemblyGroup | null>(null);
  const { toast } = useToast();

  // Form state for new group
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupType, setNewGroupType] = useState<'REQUIRED' | 'CHOOSE_ONE' | 'OPTIONAL' | 'CONFLICT'>('OPTIONAL');
  const [selectedAssemblies, setSelectedAssemblies] = useState<number[]>([]);
  const [selectedAssembliesQuantities, setSelectedAssembliesQuantities] = useState<Record<number, number>>({});

  // Group management state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch groups, categories, and assemblies
      const [groupsRes, categoriesRes, assembliesRes] = await Promise.all([
        fetch('/api/assembly-groups'),
        fetch('/api/assembly-categories'),
        fetch('/api/assemblies')
      ]);

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (assembliesRes.ok) {
        const assembliesData = await assembliesRes.json();
        setAssemblies(assembliesData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: "Error",
        description: "Failed to load template data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!selectedCategoryId || !newGroupName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a category and enter a group name",
        variant: "destructive",
      });
      return;
    }

    if (selectedAssemblies.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one assembly",
        variant: "destructive",
      });
      return;
    }

    try {
      const groupData = {
        categoryId: selectedCategoryId,
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || null,
        groupType: newGroupType,
        items: selectedAssemblies.map((assemblyId, index) => ({
          assemblyId,
          quantity: selectedAssembliesQuantities[assemblyId] || 1,
          conflictsWith: [],
          isDefault: newGroupType === 'CHOOSE_ONE' && index === 0,
          sortOrder: index
        }))
      };

      const response = await fetch('/api/assembly-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups(prev => [...prev, newGroup]);
        onGroupsChange?.([...groups, newGroup]);

        toast({
          title: "Success",
          description: `Group "${newGroupName}" created successfully`,
        });

        // Reset form
        setNewGroupName("");
        setNewGroupDescription("");
        setNewGroupType('OPTIONAL');
        setSelectedAssemblies([]);
        setSelectedAssembliesQuantities({});
        setIsCreateDialogOpen(false);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create group",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      const response = await fetch(`/api/assembly-groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        onGroupsChange?.(groups.filter(g => g.id !== groupId));

        toast({
          title: "Success",
          description: "Group deleted successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete group",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    }
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

  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case 'REQUIRED': return 'bg-green-50 border-green-200';
      case 'CHOOSE_ONE': return 'bg-blue-50 border-blue-200';
      case 'OPTIONAL': return 'bg-yellow-50 border-yellow-200';
      case 'CONFLICT': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Group assemblies by category for display
  const assembliesByCategory = assemblies.reduce((acc, assembly) => {
    if (!acc[assembly.category.id]) {
      acc[assembly.category.id] = [];
    }
    acc[assembly.category.id].push(assembly);
    return acc;
  }, {} as Record<number, Assembly[]>);

  // Group template groups by category
  const groupsByCategory = groups.reduce((acc, group) => {
    if (!acc[group.categoryId]) {
      acc[group.categoryId] = [];
    }
    acc[group.categoryId].push(group);
    return acc;
  }, {} as Record<number, AssemblyGroup[]>);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Assembly Groups</h2>
              <p className="text-muted-foreground dark:text-gray-400">
                Organize assemblies into groups with different selection rules
              </p>
            </div>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex-shrink-0 shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Create New Assembly Group</DialogTitle>
                  <DialogDescription className="text-base">
                    Create a group of assemblies with specific selection rules for better organization
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Select Category</Label>
                  <Select value={selectedCategoryId?.toString() || ""} onValueChange={(value) => setSelectedCategoryId(parseInt(value))}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Choose a category for your group" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                              <FolderOpen className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{category.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {category.assemblies?.length || 0} assemblies available
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Group Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="group-name" className="text-base font-medium">Group Name *</Label>
                    <Input
                      id="group-name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g., Closet Options, Door Types"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Selection Type</Label>
                    <Select value={newGroupType} onValueChange={(value: any) => setNewGroupType(value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REQUIRED">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <div className="font-medium">Required</div>
                              <div className="text-sm text-muted-foreground">All items must be selected</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="CHOOSE_ONE">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium">Choose One</div>
                              <div className="text-sm text-muted-foreground">Select exactly one item</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="OPTIONAL">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                              <div className="font-medium">Optional</div>
                              <div className="text-sm text-muted-foreground">Select any number of items</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="CONFLICT">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <div className="font-medium">Conflict</div>
                              <div className="text-sm text-muted-foreground">Cannot select conflicting items</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="group-description" className="text-base font-medium">Description</Label>
                  <Textarea
                    id="group-description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Describe this group and when to use it..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Assembly Selection */}
                {selectedCategoryId && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <Label className="text-base font-medium">Select Assemblies</Label>
                      <Badge variant="secondary" className="ml-2">
                        {selectedAssemblies.length} selected
                      </Badge>
                    </div>

                    <Card className="border-dashed">
                      <CardContent className="p-4">
                        <ScrollArea className="h-64">
                          <div className="space-y-3">
                            {assembliesByCategory[selectedCategoryId]?.map(assembly => {
                              const isSelected = selectedAssemblies.includes(assembly.id);
                              const quantity = selectedAssembliesQuantities[assembly.id] || 1;

                              return (
                                <div key={assembly.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors">
                                  <Checkbox
                                    id={`assembly-${assembly.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedAssemblies(prev => [...prev, assembly.id]);
                                        setSelectedAssembliesQuantities(prev => ({
                                          ...prev,
                                          [assembly.id]: 1
                                        }));
                                      } else {
                                        setSelectedAssemblies(prev => prev.filter(id => id !== assembly.id));
                                        setSelectedAssembliesQuantities(prev => {
                                          const newQuantities = { ...prev };
                                          delete newQuantities[assembly.id];
                                          return newQuantities;
                                        });
                                      }
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <Label
                                      htmlFor={`assembly-${assembly.id}`}
                                      className="font-medium cursor-pointer text-gray-900 dark:text-gray-100"
                                    >
                                      {assembly.name}
                                    </Label>
                                    {assembly.description && (
                                      <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1 line-clamp-1">
                                        {assembly.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Quantity Input - Only show when selected */}
                                  {isSelected && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Label className="text-sm font-medium">Qty:</Label>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => {
                                            const newQuantity = Math.max(1, quantity - 1);
                                            setSelectedAssembliesQuantities(prev => ({
                                              ...prev,
                                              [assembly.id]: newQuantity
                                            }));
                                          }}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={quantity}
                                          onChange={(e) => {
                                            const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                                            setSelectedAssembliesQuantities(prev => ({
                                              ...prev,
                                              [assembly.id]: newQuantity
                                            }));
                                          }}
                                          className="w-16 h-8 text-center"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => {
                                            const newQuantity = quantity + 1;
                                            setSelectedAssembliesQuantities(prev => ({
                                              ...prev,
                                              [assembly.id]: newQuantity
                                            }));
                                          }}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  <Badge variant="outline" className="flex-shrink-0">
                                    <Zap className="h-3 w-3 mr-1" />
                                    {assembly.materials?.length || 0} materials
                                  </Badge>
                                </div>
                              );
                            }) || (
                              <div className="text-center py-8 text-muted-foreground">
                                <Package className="mx-auto h-8 w-8 mb-2" />
                                <p>No assemblies available in this category</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={createGroup}
                disabled={!selectedCategoryId || !newGroupName.trim() || selectedAssemblies.length === 0}
                className="px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Groups Display - Vertical List with Quantity Management */}
      <div className="space-y-4">
        {groups.length > 0 ? (
          groups.map(group => {
            const category = categories.find(c => c.id === group.categoryId);
            const isExpanded = expandedGroups.has(group.id);

            return (
              <Card key={group.id} className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExpandedGroups(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(group.id)) {
                              newSet.delete(group.id);
                            } else {
                              newSet.add(group.id);
                            }
                            return newSet;
                          });
                        }}
                        className="p-1 h-8 w-8 flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ArrowRight className="h-4 w-4 rotate-90" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </Button>

                      <div className="flex items-center gap-2">
                        {getGroupTypeIcon(group.groupType)}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg text-gray-900 dark:text-gray-100 truncate">
                            {group.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {group.groupType.toLowerCase().replace('_', ' ')}
                            </Badge>
                            {category && (
                              <Badge variant="secondary" className="text-xs bg-primary/10 dark:bg-primary/20">
                                {category.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGroup(group.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {group.description && (
                    <CardDescription className="text-base text-muted-foreground dark:text-gray-400 mt-2">
                      {group.description}
                    </CardDescription>
                  )}
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm font-medium text-gray-900 dark:text-gray-100">
                        <span>Assembly Details ({group.items.length} items)</span>
                        <Badge variant="secondary" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                          {group.items.length} assemblies
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {group.items.map(item => {

                          return (
                            <div key={item.assemblyId} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {item.assembly.name}
                                    </div>
                                    {item.assembly.description && (
                                      <div className="text-sm text-muted-foreground dark:text-gray-400 line-clamp-1">
                                        {item.assembly.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0">
                                {item.isDefault && (
                                  <Badge variant="default" className="text-xs">
                                    Default
                                  </Badge>
                                )}

                                <div className="flex items-center gap-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Qty:</Label>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={async () => {
                                        const newQuantity = Math.max(1, item.quantity - 1);
                                        try {
                                          await fetch(`/api/assembly-groups/${group.id}/items/${item.assemblyId}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ quantity: newQuantity })
                                          });
                                          await fetchData();
                                          toast({
                                            title: "Success",
                                            description: `Quantity updated to ${newQuantity}`,
                                          });
                                        } catch (error) {
                                          toast({
                                            title: "Error",
                                            description: "Failed to update quantity",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={async (e) => {
                                        const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                                        try {
                                          await fetch(`/api/assembly-groups/${group.id}/items/${item.assemblyId}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ quantity: newQuantity })
                                          });
                                          await fetchData();
                                          toast({
                                            title: "Success",
                                            description: `Quantity updated to ${newQuantity}`,
                                          });
                                        } catch (error) {
                                          toast({
                                            title: "Error",
                                            description: "Failed to update quantity",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                      className="w-16 h-8 text-center"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={async () => {
                                        const newQuantity = item.quantity + 1;
                                        try {
                                          await fetch(`/api/assembly-groups/${group.id}/items/${item.assemblyId}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ quantity: newQuantity })
                                          });
                                          await fetchData();
                                          toast({
                                            title: "Success",
                                            description: `Quantity updated to ${newQuantity}`,
                                          });
                                        } catch (error) {
                                          toast({
                                            title: "Error",
                                            description: "Failed to update quantity",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <Badge variant="secondary" className="text-xs">
                                  <Zap className="h-3 w-3 mr-1" />
                                  {item.assembly.materials?.length || 0}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        ) : (
          <Card className="shadow-sm">
            <CardContent className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Welcome to Assembly Groups</h3>
              <p className="text-muted-foreground dark:text-gray-400 mb-6 max-w-md mx-auto">
                Start organizing your assemblies into smart groups with different selection rules.
                Create your first group to get started with advanced template management.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                size="lg"
                className="shadow-sm"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Group
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {groups.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg">
            <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Welcome to Assembly Groups</h3>
            <p className="text-muted-foreground dark:text-gray-400 mb-6 max-w-md mx-auto">
              Start organizing your assemblies into smart groups with different selection rules.
              Create your first group to get started with advanced template management.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="lg"
              className="shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
