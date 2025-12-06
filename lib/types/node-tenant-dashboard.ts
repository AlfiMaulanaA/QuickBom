export interface NodeTenantDashboard {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isUse: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  locations?: NodeTenantLocation[];
  _count?: {
    locations: number;
  };
}

export interface NodeTenantDashboardFormData {
  name: string;
  description?: string;
  isUse?: boolean;
  isActive?: boolean;
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
  nodeType: string;
  tenantId?: string;
  dashboardId?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;

  // Relations
  tenant?: {
    id: string;
    name: string;
    company?: string;
    email: string;
  };
  dashboard?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface NodeTenantLocationFormData {
  name: string;
  longitude: number;
  latitude: number;
  url?: string;
  topic?: string;
  description?: string;
  status: boolean;
  nodeType: string;
  tenantId?: string;
  dashboardId?: string;
}
