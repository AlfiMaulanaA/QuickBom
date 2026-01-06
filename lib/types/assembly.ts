// Shared types for Assembly Groups system

export interface Assembly {
  id: number;
  name: string;
  description: string | null;
  partNumber: string | null;
  manufacturer: string | null;
  unit: string;
  price: number;
  category: AssemblyCategory;
  materials: Material[];
  module: 'ELECTRONIC' | 'ELECTRICAL' | 'ASSEMBLY' | 'INSTALLATION' | 'MECHANICAL';
  createdAt: string;
  updatedAt: string;
}

export interface AssemblyCategory {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  assemblies?: Assembly[];
}

export interface Material {
  id: number;
  name: string;
  partNumber: string | null;
  manufacturer: string | null;
  unit: string;
  price: number;
}

export interface AssemblyGroupItem {
  id: string;
  assemblyId: number;
  quantity: number;
  conflictsWith: number[];
  isDefault: boolean;
  sortOrder: number;
  assembly: Assembly;
}

export interface AssemblyGroup {
  id: string;
  name: string;
  description: string | null;
  groupType: 'REQUIRED' | 'CHOOSE_ONE' | 'OPTIONAL' | 'CONFLICT';
  categoryId: number;
  category: AssemblyCategory;
  items: AssemblyGroupItem[];
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    type: string;
    groupId?: string;
    message: string;
    details?: any;
  }>;
  warnings: string[];
  totalCost: number;
  breakdown: Array<{
    categoryId: number;
    categoryName: string;
    groups: Array<{
      groupId: string;
      groupName: string;
      cost: number;
      assemblies: Array<{
        assemblyId: number;
        name: string;
        quantity: number;
        cost: number;
      }>;
    }>;
  }>;
}
