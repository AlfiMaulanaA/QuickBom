import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ValidationError {
  type: 'required' | 'choose_one' | 'conflict' | 'category_required';
  groupId?: string;
  message: string;
  details?: any;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  totalCost: number;
  breakdown: {
    categoryId: number;
    categoryName: string;
    groups: {
      groupId: string;
      groupName: string;
      cost: number;
      assemblies: {
        assemblyId: number;
        name: string;
        quantity: number;
        cost: number;
      }[];
    }[];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { selections } = body; // selections: Record<categoryId, Record<groupId, assemblyIds[]>>

    if (!selections) {
      return NextResponse.json(
        { error: "selections are required" },
        { status: 400 }
      );
    }

    // Get all groups that are referenced in selections
    const groupIds: string[] = [];
    Object.values(selections as Record<string, Record<string, number[]>>).forEach((categorySelections) => {
      Object.keys(categorySelections).forEach(groupId => {
        if (!groupIds.includes(groupId)) {
          groupIds.push(groupId);
        }
      });
    });

    // Fetch groups with their items and assemblies
    const groups = await prisma.assemblyGroup.findMany({
      where: {
        id: { in: groupIds }
      },
      include: {
        category: true,
        items: {
          include: {
            assembly: {
              include: {
                materials: {
                  include: {
                    material: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const breakdown: ValidationResult['breakdown'] = [];
    let totalCost = 0;

    // Group by category for easier processing
    const groupsByCategory = groups.reduce((acc, group) => {
      if (!acc[group.categoryId]) {
        acc[group.categoryId] = [];
      }
      acc[group.categoryId].push(group);
      return acc;
    }, {} as Record<number, typeof groups>);

    // Validate each category
    for (const [categoryId, categoryGroups] of Object.entries(groupsByCategory)) {
      const categorySelections = selections[categoryId] || {};
      const categoryBreakdown = {
        categoryId: parseInt(categoryId),
        categoryName: categoryGroups[0].category.name,
        groups: [] as ValidationResult['breakdown'][0]['groups']
      };

      for (const group of categoryGroups) {
        const groupSelections = categorySelections[group.id] || [];
        const groupBreakdown = {
          groupId: group.id,
          groupName: group.name,
          cost: 0,
          assemblies: [] as ValidationResult['breakdown'][0]['groups'][0]['assemblies']
        };

        // Validate based on group type
        switch (group.groupType) {
          case 'REQUIRED':
            if (groupSelections.length !== group.items.length) {
              errors.push({
                type: 'required',
                groupId: group.id,
                message: `Group "${group.name}" requires all ${group.items.length} items to be selected`,
                details: {
                  required: group.items.length,
                  selected: groupSelections.length
                }
              });
            }
            break;

          case 'CHOOSE_ONE':
            if (groupSelections.length !== 1) {
              errors.push({
                type: 'choose_one',
                groupId: group.id,
                message: `Group "${group.name}" requires exactly one item to be selected`,
                details: {
                  selected: groupSelections.length,
                  available: group.items.length
                }
              });
            }
            break;

          case 'OPTIONAL':
            // No validation needed for optional
            break;

          case 'CONFLICT':
            // Check for conflicts within group
            const selectedItems = group.items.filter(item =>
              groupSelections.includes(item.assemblyId)
            );

            for (const item of selectedItems) {
              const conflicts = selectedItems.filter(other =>
                item.conflictsWith.includes(other.assemblyId.toString())
              );

              if (conflicts.length > 0) {
                errors.push({
                  type: 'conflict',
                  groupId: group.id,
                  message: `Conflicting items selected in group "${group.name}"`,
                  details: {
                    item: item.assembly.name,
                    conflicts: conflicts.map(c => c.assembly.name)
                  }
                });
              }
            }
            break;
        }

        // Calculate costs for selected items
        for (const selectedAssemblyId of groupSelections) {
          const item = group.items.find(i => i.assemblyId === selectedAssemblyId);
          if (item) {
            // Calculate cost from materials only (since price field is not included)
            const materialCost = item.assembly.materials?.reduce((total, am) => {
              return total + (Number(am.material?.price || 0) * Number(am.quantity || 1));
            }, 0) || 0;

            // Final assembly cost: material cost * quantity
            const assemblyCost = materialCost * Number(item.quantity || 1);

            groupBreakdown.cost += assemblyCost;
            groupBreakdown.assemblies.push({
              assemblyId: item.assemblyId,
              name: item.assembly.name,
              quantity: Number(item.quantity || 1),
              cost: assemblyCost
            });
          }
        }

        categoryBreakdown.groups.push(groupBreakdown);
        totalCost += groupBreakdown.cost;
      }

      breakdown.push(categoryBreakdown);
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalCost,
      breakdown
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error [POST /api/assembly-groups/validate-selection]:', error);
    return NextResponse.json(
      { error: "Failed to validate selection" },
      { status: 500 }
    );
  }
}
