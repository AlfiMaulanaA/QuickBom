// lib/types/tenant.ts
export interface Tenant {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  status: string; // 'active', 'inactive', 'suspended'
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  notes?: string;

  // Relations included in API responses
  locations?: NodeTenantLocation[];
  locationCount?: number;
  activeLocations?: number;
  inactiveLocations?: number;
}

export interface NodeTenantDashboard {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isUse: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations included in API responses
  user?: {
    id: string;
    email: string;
  };
  locations?: NodeTenantLocation[];
}

export interface NodeTenantLocation {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  url?: string;
  topic?: string;
  description?: string;
  status: boolean;
  nodeType: string; // 'server' or 'node'
  tenantId?: string;
  dashboardId?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;

  // Relations included in API responses
  tenant?: {
    id: string;
    name: string;
    company?: string;
    email?: string;
  };
  dashboard?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface TenantFormData {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  notes?: string;
}

export interface NodeTenantLocationFormData {
  name: string;
  longitude: string;
  latitude: string;
  url?: string;
  topic?: string;
  description?: string;
  status: boolean;
  nodeType: string;
  tenantId?: string;
  dashboardId?: string;
  isActive?: boolean;
}
