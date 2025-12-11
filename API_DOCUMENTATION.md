# 📋 QuickBom API Documentation

## 🎯 Overview
This document provides comprehensive API documentation for the QuickBom construction management system. All APIs follow RESTful conventions and return JSON responses.

## 🔐 Authentication
All protected endpoints require authentication via JWT token in cookies or Authorization header.

### Authentication Methods:
- **Cookie**: `authToken` (HTTP-only cookie)
- **Header**: `Authorization: Bearer <token>`

---

## 📚 API Endpoints by Category

### 🔐 1. AUTHENTICATION APIs
Endpoints for user authentication and session management.

#### `POST /api/auth/login`
Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "ADMIN"
  },
  "token": "jwt_token_here"
}
```

**Response (401):**
```json
{
  "message": "Invalid credentials"
}
```

#### `POST /api/auth/register`
Register new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "role": "WORKER"
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "WORKER"
  }
}
```

#### `POST /api/auth/logout`
Destroy user session.

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

#### `GET /api/auth/me`
Get current authenticated user information.

**Response (200):**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "ADMIN",
  "status": "ACTIVE"
}
```

---

### 👥 2. USER MANAGEMENT APIs
CRUD operations for user accounts and profiles.

#### `GET /api/users`
Get all users with optional filtering.

**Query Parameters:**
- `role` (string): Filter by user role (WORKER, FOREMAN, etc.)
- `status` (string): Filter by user status (ACTIVE, INACTIVE, etc.)
- `search` (string): Search in name, email, or employee ID

**Response (200):**
```json
[
  {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "WORKER",
    "status": "ACTIVE",
    "phone": "+628123456789",
    "employeeId": "EMP001",
    "department": "Construction",
    "position": "Mason",
    "hireDate": "2024-01-15T00:00:00.000Z",
    "salary": 5000000,
    "lastLogin": "2024-12-09T08:30:00.000Z",
    "isEmailVerified": true,
    "avatar": "/uploads/avatars/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### `POST /api/users`
Create new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "name": "New User",
  "role": "WORKER",
  "status": "ACTIVE",
  "phone": "+628123456789",
  "employeeId": "EMP002",
  "department": "Construction",
  "position": "Laborer",
  "hireDate": "2024-12-09",
  "salary": 4000000
}
```

**Response (201):**
```json
{
  "id": "new_user_id",
  "email": "newuser@example.com",
  "name": "New User",
  "role": "WORKER",
  "status": "ACTIVE",
  "phone": "+628123456789",
  "employeeId": "EMP002",
  "department": "Construction",
  "position": "Laborer",
  "hireDate": "2024-12-09T00:00:00.000Z",
  "salary": 4000000,
  "createdAt": "2024-12-09T08:30:00.000Z"
}
```

#### `GET /api/users/[id]`
Get specific user by ID.

**Response (200):**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "WORKER",
  "status": "ACTIVE",
  "phone": "+628123456789",
  "employeeId": "EMP001",
  "department": "Construction",
  "position": "Mason",
  "hireDate": "2024-01-15T00:00:00.000Z",
  "salary": 5000000,
  "lastLogin": "2024-12-09T08:30:00.000Z",
  "isEmailVerified": true,
  "avatar": "/uploads/avatars/avatar.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-12-09T08:30:00.000Z"
}
```

#### `PUT /api/users/[id]`
Update user information.

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+628987654321",
  "department": "Updated Department",
  "salary": 5500000
}
```

**Response (200):**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "Updated Name",
  "role": "WORKER",
  "status": "ACTIVE",
  "phone": "+628987654321",
  "employeeId": "EMP001",
  "department": "Updated Department",
  "position": "Mason",
  "hireDate": "2024-01-15T00:00:00.000Z",
  "salary": 5500000,
  "updatedAt": "2024-12-09T08:35:00.000Z"
}
```

#### `DELETE /api/users/[id]`
Delete user account.

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

### 🏗️ 3. MATERIAL MANAGEMENT APIs
CRUD operations for construction materials and supplies.

#### `GET /api/materials`
Get all materials.

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Portland Cement",
    "partNumber": "PC-001",
    "manufacturer": "PT. Semen Indonesia",
    "unit": "sak",
    "price": 75000,
    "purchaseUrl": "https://example.com/cement",
    "datasheetFile": "/uploads/datasheets/cement.pdf",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-12-09T08:30:00.000Z"
  }
]
```

#### `POST /api/materials`
Create new material.

**Request Body:**
```json
{
  "name": "Steel Rebar 10mm",
  "partNumber": "SR-010",
  "manufacturer": "PT. Besi Indonesia",
  "unit": "batang",
  "price": 25000,
  "purchaseUrl": "https://example.com/rebar",
  "datasheetFile": "/uploads/datasheets/rebar.pdf"
}
```

**Response (201):**
```json
{
  "id": 2,
  "name": "Steel Rebar 10mm",
  "partNumber": "SR-010",
  "manufacturer": "PT. Besi Indonesia",
  "unit": "batang",
  "price": 25000,
  "purchaseUrl": "https://example.com/rebar",
  "datasheetFile": "/uploads/datasheets/rebar.pdf",
  "createdAt": "2024-12-09T08:35:00.000Z",
  "updatedAt": "2024-12-09T08:35:00.000Z"
}
```

#### `GET /api/materials/[id]`
Get specific material by ID.

**Response (200):**
```json
{
  "id": 1,
  "name": "Portland Cement",
  "partNumber": "PC-001",
  "manufacturer": "PT. Semen Indonesia",
  "unit": "sak",
  "price": 75000,
  "purchaseUrl": "https://example.com/cement",
  "datasheetFile": "/uploads/datasheets/cement.pdf",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-12-09T08:30:00.000Z"
}
```

#### `PUT /api/materials/[id]`
Update material information.

**Request Body:**
```json
{
  "name": "Portland Cement Type 1",
  "price": 80000
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Portland Cement Type 1",
  "partNumber": "PC-001",
  "manufacturer": "PT. Semen Indonesia",
  "unit": "sak",
  "price": 80000,
  "purchaseUrl": "https://example.com/cement",
  "datasheetFile": "/uploads/datasheets/cement.pdf",
  "updatedAt": "2024-12-09T08:40:00.000Z"
}
```

#### `DELETE /api/materials/[id]`
Delete material.

**Response (200):**
```json
{
  "message": "Material deleted successfully"
}
```

---

### 🏢 4. CLIENT MANAGEMENT APIs
CRUD operations for client/organization management.

#### `GET /api/clients`
Get all clients with optional filtering.

**Query Parameters:**
- `status` (string): Filter by client status
- `category` (string): Filter by client category
- `search` (string): Search in company name or contact person

**Response (200):**
```json
[
  {
    "id": "client_id",
    "clientType": "COMPANY",
    "category": "RESIDENTIAL",
    "status": "ACTIVE",
    "companyName": "PT. Maju Jaya",
    "contactPerson": "John Doe",
    "contactEmail": "john@majujaya.com",
    "contactPhone": "+628123456789",
    "address": "Jl. Sudirman No. 123",
    "city": "Jakarta",
    "province": "DKI Jakarta",
    "postalCode": "12345",
    "country": "Indonesia",
    "totalProjects": 5,
    "activeProjects": 2,
    "completedProjects": 3,
    "totalContractValue": 2500000000,
    "outstandingBalance": 500000000,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### `POST /api/clients`
Create new client.

**Request Body:**
```json
{
  "clientType": "COMPANY",
  "category": "COMMERCIAL",
  "status": "ACTIVE",
  "companyName": "PT. Gedung Modern",
  "contactPerson": "Jane Smith",
  "contactEmail": "jane@gedungmodern.com",
  "contactPhone": "+628987654321",
  "address": "Jl. Thamrin No. 456",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "54321",
  "country": "Indonesia",
  "industry": "Real Estate",
  "companySize": "Large",
  "annualRevenue": 50000000000,
  "creditLimit": 1000000000,
  "specialNotes": "Preferred client"
}
```

**Response (201):**
```json
{
  "id": "new_client_id",
  "clientType": "COMPANY",
  "category": "COMMERCIAL",
  "status": "ACTIVE",
  "companyName": "PT. Gedung Modern",
  "contactPerson": "Jane Smith",
  "contactEmail": "jane@gedungmodern.com",
  "contactPhone": "+628987654321",
  "address": "Jl. Thamrin No. 456",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "54321",
  "country": "Indonesia",
  "industry": "Real Estate",
  "companySize": "Large",
  "annualRevenue": 50000000000,
  "creditLimit": 1000000000,
  "specialNotes": "Preferred client",
  "totalProjects": 0,
  "activeProjects": 0,
  "completedProjects": 0,
  "totalContractValue": 0,
  "outstandingBalance": 0,
  "createdAt": "2024-12-09T08:40:00.000Z"
}
```

#### `GET /api/clients/[id]`
Get specific client by ID.

**Response (200):**
```json
{
  "id": "client_id",
  "clientType": "COMPANY",
  "category": "RESIDENTIAL",
  "status": "ACTIVE",
  "companyName": "PT. Maju Jaya",
  "contactPerson": "John Doe",
  "contactEmail": "john@majujaya.com",
  "contactPhone": "+628123456789",
  "address": "Jl. Sudirman No. 123",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "12345",
  "country": "Indonesia",
  "totalProjects": 5,
  "activeProjects": 2,
  "completedProjects": 3,
  "totalContractValue": 2500000000,
  "outstandingBalance": 500000000,
  "lastPaymentDate": "2024-12-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-12-09T08:30:00.000Z"
}
```

#### `PUT /api/clients/[id]`
Update client information.

**Request Body:**
```json
{
  "contactPhone": "+628111111111",
  "creditLimit": 2000000000,
  "specialNotes": "VIP client - fast track processing"
}
```

**Response (200):**
```json
{
  "id": "client_id",
  "clientType": "COMPANY",
  "category": "RESIDENTIAL",
  "status": "ACTIVE",
  "companyName": "PT. Maju Jaya",
  "contactPerson": "John Doe",
  "contactEmail": "john@majujaya.com",
  "contactPhone": "+628111111111",
  "address": "Jl. Sudirman No. 123",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "12345",
  "country": "Indonesia",
  "creditLimit": 2000000000,
  "specialNotes": "VIP client - fast track processing",
  "updatedAt": "2024-12-09T08:45:00.000Z"
}
```

#### `DELETE /api/clients/[id]`
Delete client.

**Response (200):**
```json
{
  "message": "Client deleted successfully"
}
```

---

### 📋 5. TEMPLATE MANAGEMENT APIs
CRUD operations for project templates.

#### `GET /api/templates`
Get all templates.

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Rumah Type 36",
    "description": "Template untuk rumah 2 lantai type 36",
    "docs": [
      {
        "name": "Blueprint.pdf",
        "url": "/uploads/templates/blueprint.pdf",
        "size": 2048576,
        "type": "application/pdf",
        "uploadedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-12-09T08:30:00.000Z"
  }
]
```

#### `POST /api/templates`
Create new template.

**Request Body:**
```json
{
  "name": "Apartemen Studio",
  "description": "Template untuk apartemen studio 30m²",
  "docs": [
    {
      "name": "Floor Plan.pdf",
      "url": "/uploads/templates/floorplan.pdf",
      "size": 1048576,
      "type": "application/pdf",
      "uploadedAt": "2024-12-09T08:45:00.000Z"
    }
  ]
}
```

**Response (201):**
```json
{
  "id": 2,
  "name": "Apartemen Studio",
  "description": "Template untuk apartemen studio 30m²",
  "docs": [
    {
      "name": "Floor Plan.pdf",
      "url": "/uploads/templates/floorplan.pdf",
      "size": 1048576,
      "type": "application/pdf",
      "uploadedAt": "2024-12-09T08:45:00.000Z"
    }
  ],
  "createdAt": "2024-12-09T08:45:00.000Z",
  "updatedAt": "2024-12-09T08:45:00.000Z"
}
```

#### `GET /api/templates/[id]`
Get specific template by ID.

**Response (200):**
```json
{
  "id": 1,
  "name": "Rumah Type 36",
  "description": "Template untuk rumah 2 lantai type 36",
  "docs": [
    {
      "name": "Blueprint.pdf",
      "url": "/uploads/templates/blueprint.pdf",
      "size": 2048576,
      "type": "application/pdf",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "assemblies": [
    {
      "id": 1,
      "quantity": 120,
      "assembly": {
        "id": 1,
        "name": "Pemasangan Dinding Bata",
        "description": "Pemasangan dinding bata merah per m²"
      }
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-12-09T08:30:00.000Z"
}
```

#### `PUT /api/templates/[id]`
Update template information.

**Request Body:**
```json
{
  "name": "Rumah Type 36 - Updated",
  "description": "Template rumah 2 lantai type 36 dengan desain terbaru"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Rumah Type 36 - Updated",
  "description": "Template rumah 2 lantai type 36 dengan desain terbaru",
  "docs": [...],
  "updatedAt": "2024-12-09T08:50:00.000Z"
}
```

#### `DELETE /api/templates/[id]`
Delete template.

**Response (200):**
```json
{
  "message": "Template deleted successfully"
}
```

#### `POST /api/templates/[id]/merge-pdfs`
Merge all PDF documents from template assemblies.

**Request Body:**
```json
{
  "templateName": "Custom Name",
  "pdfOrder": [1, 3, 2] // Optional: custom assembly order by ID
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "PDFs merged successfully using pdf-lib",
  "mergedFile": {
    "name": "Merged PDFs - Rumah Type 36",
    "url": "/uploads/templates/merged_rumah_type_36_1733736600000.pdf",
    "size": 5242880,
    "type": "application/pdf",
    "uploadedAt": "2024-12-09T08:50:00.000Z"
  },
  "totalFilesMerged": 3,
  "mergeMethod": "pdf-lib"
}
```

---

### 🏗️ 6. ASSEMBLY MANAGEMENT APIs
CRUD operations for work assemblies/tasks.

#### `GET /api/assemblies`
Get all assemblies.

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Pemasangan Dinding Bata",
    "description": "Pemasangan dinding bata merah per m²",
    "docs": [
      {
        "name": "Installation Guide.pdf",
        "url": "/uploads/assemblies/guide.pdf",
        "size": 1048576,
        "type": "application/pdf",
        "uploadedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "materials": [
      {
        "quantity": 70,
        "material": {
          "id": 1,
          "name": "Bata Merah",
          "unit": "biji",
          "price": 800
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-12-09T08:30:00.000Z"
  }
]
```

#### `POST /api/assemblies`
Create new assembly.

**Request Body:**
```json
{
  "name": "Pemasangan Atap Genteng",
  "description": "Pemasangan atap genteng beton per m²",
  "docs": [
    {
      "name": "Roofing Guide.pdf",
      "url": "/uploads/assemblies/roofing.pdf",
      "size": 2097152,
      "type": "application/pdf",
      "uploadedAt": "2024-12-09T08:50:00.000Z"
    }
  ]
}
```

**Response (201):**
```json
{
  "id": 2,
  "name": "Pemasangan Atap Genteng",
  "description": "Pemasangan atap genteng beton per m²",
  "docs": [...],
  "materials": [],
  "createdAt": "2024-12-09T08:50:00.000Z",
  "updatedAt": "2024-12-09T08:50:00.000Z"
}
```

#### `GET /api/assemblies/[id]`
Get specific assembly by ID.

**Response (200):**
```json
{
  "id": 1,
  "name": "Pemasangan Dinding Bata",
  "description": "Pemasangan dinding bata merah per m²",
  "docs": [...],
  "materials": [
    {
      "quantity": 70,
      "material": {
        "id": 1,
        "name": "Bata Merah",
        "unit": "biji",
        "price": 800
      }
    }
  ],
  "templates": [
    {
      "quantity": 120,
      "template": {
        "id": 1,
        "name": "Rumah Type 36"
      }
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-12-09T08:30:00.000Z"
}
```

#### `PUT /api/assemblies/[id]`
Update assembly information.

**Request Body:**
```json
{
  "name": "Pemasangan Dinding Bata Premium",
  "description": "Pemasangan dinding bata merah premium per m²"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Pemasangan Dinding Bata Premium",
  "description": "Pemasangan dinding bata merah premium per m²",
  "docs": [...],
  "materials": [...],
  "updatedAt": "2024-12-09T08:55:00.000Z"
}
```

#### `DELETE /api/assemblies/[id]`
Delete assembly.

**Response (200):**
```json
{
  "message": "Assembly deleted successfully"
}
```

#### `POST /api/assemblies/[id]/materials`
Add material to assembly.

**Request Body:**
```json
{
  "materialId": 1,
  "quantity": 80
}
```

**Response (201):**
```json
{
  "assemblyId": 1,
  "materialId": 1,
  "quantity": 80,
  "material": {
    "id": 1,
    "name": "Bata Merah",
    "unit": "biji",
    "price": 800
  }
}
```

#### `PUT /api/assemblies/[id]/materials/[materialId]`
Update material quantity in assembly.

**Request Body:**
```json
{
  "quantity": 85
}
```

**Response (200):**
```json
{
  "assemblyId": 1,
  "materialId": 1,
  "quantity": 85,
  "material": {
    "id": 1,
    "name": "Bata Merah",
    "unit": "biji",
    "price": 800
  }
}
```

#### `DELETE /api/assemblies/[id]/materials/[materialId]`
Remove material from assembly.

**Response (200):**
```json
{
  "message": "Material removed from assembly successfully"
}
```

---

### 📊 7. PROJECT MANAGEMENT APIs
CRUD operations for construction projects.

#### `GET /api/projects`
Get all projects with optional timeline inclusion.

**Query Parameters:**
- `include` (string): Set to "timeline" to include timeline data

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Perumahan Green Valley",
    "description": "Proyek perumahan 100 unit",
    "clientId": "client_id",
    "client": {
      "id": "client_id",
      "companyName": "PT. Green Valley",
      "contactPerson": "Ahmad Rahman"
    },
    "projectType": "RESIDENTIAL",
    "location": "Bogor, Jawa Barat",
    "area": 50000,
    "budget": 50000000000,
    "totalPrice": 45000000000,
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-12-15T00:00:00.000Z",
    "status": "IN_PROGRESS",
    "progress": 65,
    "priority": "HIGH",
    "createdBy": "user_id",
    "assignedUsers": ["user1", "user2"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### `POST /api/projects`
Create new project.

**Request Body:**
```json
{
  "name": "Mall Central Jakarta",
  "description": "Proyek mall modern di Jakarta Pusat",
  "clientId": "client_id",
  "projectType": "COMMERCIAL",
  "location": "Jakarta Pusat",
  "area": 25000,
  "budget": 150000000000,
  "startDate": "2024-06-01",
  "endDate": "2025-12-31",
  "status": "PLANNING",
  "priority": "HIGH",
  "fromTemplateId": 1,
  "assignedUsers": ["user1", "user2", "user3"]
}
```

**Response (201):**
```json
{
  "id": 2,
  "name": "Mall Central Jakarta",
  "description": "Proyek mall modern di Jakarta Pusat",
  "clientId": "client_id",
  "projectType": "COMMERCIAL",
  "location": "Jakarta Pusat",
  "area": 25000,
  "budget": 150000000000,
  "totalPrice": 0,
  "startDate": "2024-06-01T00:00:00.000Z",
  "endDate": "2025-12-31T00:00:00.000Z",
  "status": "PLANNING",
  "progress": 0,
  "priority": "HIGH",
  "createdBy": "user_id",
  "assignedUsers": ["user1", "user2", "user3"],
  "createdAt": "2024-12-09T09:00:00.000Z"
}
```

#### `GET /api/projects/[id]`
Get specific project by ID.

**Response (200):**
```json
{
  "id": 1,
  "name": "Perumahan Green Valley",
  "description": "Proyek perumahan 100 unit",
  "clientId": "client_id",
  "client": {...},
  "template": {
    "id": 1,
    "name": "Rumah Type 36",
    "assemblies": [...]
  },
  "totalPrice": 45000000000,
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-12-15T00:00:00.000Z",
  "status": "IN_PROGRESS",
  "progress": 65,
  "priority": "HIGH",
  "assignedUsers": ["user1", "user2"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-12-09T08:30:00.000Z"
}
```

#### `PUT /api/projects/[id]`
Update project information.

**Request Body:**
```json
{
  "name": "Perumahan Green Valley - Phase 2",
  "progress": 75,
  "status": "IN_PROGRESS",
  "assignedUsers": ["user1", "user2", "user3"]
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Perumahan Green Valley - Phase 2",
  "description": "Proyek perumahan 100 unit",
  "progress": 75,
  "status": "IN_PROGRESS",
  "assignedUsers": ["user1", "user2", "user3"],
  "updatedAt": "2024-12-09T09:05:00.000Z"
}
```

#### `DELETE /api/projects/[id]`
Delete project.

**Response (200):**
```json
{
  "message": "Project deleted successfully"
}
```

#### `GET /api/projects/[id]/timeline`
Get project timeline information.

**Response (200):**
```json
{
  "exists": true,
  "timeline": {
    "id": "timeline_id",
    "projectId": 1,
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-12-15T00:00:00.000Z",
    "duration": 335,
    "progress": 65,
    "status": "ACTIVE",
    "milestones": [
      {
        "id": "milestone_id",
        "name": "Foundation Complete",
        "dueDate": "2024-03-01T00:00:00.000Z",
        "status": "COMPLETED",
        "progress": 100,
        "tasks": [...]
      }
    ],
    "tasks": [
      {
        "id": "task_id",
        "name": "Site Preparation",
        "plannedStart": "2024-01-15T00:00:00.000Z",
        "plannedEnd": "2024-01-30T00:00:00.000Z",
        "progress": 100,
        "status": "COMPLETED",
        "priority": "HIGH",
        "taskType": "CONSTRUCTION",
        "duration": 15,
        "milestoneId": "milestone_id"
      }
    ]
  }
}
```

#### `POST /api/projects/[id]/timeline`
Create timeline for project.

**Request Body:**
```json
{
  "startDate": "2024-01-15",
  "endDate": "2024-12-15",
  "workingDays": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": false,
    "sunday": false
  },
  "holidays": ["2024-12-25", "2024-12-31"]
}
```

**Response (201):**
```json
{
  "message": "Timeline created successfully",
  "timeline": {
    "id": "timeline_id",
    "projectId": 1,
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-12-15T00:00:00.000Z",
    "duration": 335,
    "progress": 0,
    "status": "PLANNING"
  }
}
```

#### `PUT /api/projects/[id]/timeline`
Update project timeline.

**Request Body:**
```json
{
  "progress": 70,
  "status": "ACTIVE"
}
```

**Response (200):**
```json
{
  "message": "Timeline updated successfully",
  "timeline": {
    "id": "timeline_id",
    "progress": 70,
    "status": "ACTIVE",
    "updatedAt": "2024-12-09T09:10:00.000Z"
  }
}
```

---

### 📅 8. TIMELINE MANAGEMENT APIs
Advanced project timeline and scheduling management.

#### `GET /api/timeline/[timelineId]/tasks`
Get all tasks in a timeline.

**Response (200):**
```json
[
  {
    "id": "task_id",
    "timelineId": "timeline_id",
    "milestoneId": "milestone_id",
    "name": "Foundation Work",
    "description": "Excavation and foundation laying",
    "taskType": "CONSTRUCTION",
    "plannedStart": "2024-01-15T00:00:00.000Z",
    "plannedEnd": "2024-02-15T00:00:00.000Z",
    "actualStart": null,
    "actualEnd": null,
    "duration": 31,
    "effortHours": 480,
    "actualHours": null,
    "progress": 85,
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "estimatedCost": 50000000,
    "actualCost": 42000000,
    "assignedUsersJson": ["user1", "user2"],
    "resources": {
      "equipment": ["Excavator", "Concrete Mixer"],
      "materials": ["Cement", "Steel"]
    },
    "milestone": {
      "id": "milestone_id",
      "name": "Foundation Complete"
    }
  }
]
```

#### `POST /api/timeline/[timelineId]/tasks`
Create new task in timeline.

**Request Body:**
```json
{
  "name": "Steel Structure Installation",
  "description": "Installation of steel beams and columns",
  "taskType": "MECHANICAL",
  "plannedStart": "2024-03-01",
  "plannedEnd": "2024-03-31",
  "duration": 30,
  "effortHours": 600,
  "priority": "HIGH",
  "estimatedCost": 150000000,
  "assignedUsers": ["user1", "user3"],
  "resources": {
    "equipment": ["Crane", "Welding Machine"],
    "materials": ["Steel Beams", "Bolts"]
  }
}
```

**Response (201):**
```json
{
  "message": "Task created successfully",
  "task": {
    "id": "new_task_id",
    "timelineId": "timeline_id",
    "name": "Steel Structure Installation",
    "plannedStart": "2024-03-01T00:00:00.000Z",
    "plannedEnd": "2024-03-31T00:00:00.000Z",
    "duration": 30,
    "progress": 0,
    "status": "NOT_STARTED",
    "priority": "HIGH",
    "createdAt": "2024-12-09T09:15:00.000Z"
  }
}
```

#### `GET /api/timeline/[timelineId]/tasks/[taskId]`
Get specific task by ID.

**Response (200):**
```json
{
  "id": "task_id",
  "timelineId": "timeline_id",
  "milestoneId": "milestone_id",
  "name": "Foundation Work",
  "description": "Excavation and foundation laying",
  "taskType": "CONSTRUCTION",
  "plannedStart": "2024-01-15T00:00:00.000Z",
  "plannedEnd": "2024-02-15T00:00:00.000Z",
  "actualStart": "2024-01-16T00:00:00.000Z",
  "duration": 31,
  "progress": 85,
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "assignedUsers": [
    {
      "id": "user1",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "milestone": {
    "id": "milestone_id",
    "name": "Foundation Complete"
  },
  "dependencies": [
    {
      "id": "dep_id",
      "taskId": "task_id",
      "dependsOnTaskId": "prev_task_id",
      "dependencyType": "FS",
      "lagDays": 1,
      "dependsOnTask": {
        "id": "prev_task_id",
        "name": "Site Preparation"
      }
    }
  ]
}
```

#### `PUT /api/timeline/[timelineId]/tasks/[taskId]`
Update task information.

**Request Body:**
```json
{
  "progress": 90,
  "status": "IN_PROGRESS",
  "actualHours": 550,
  "actualCost": 140000000,
  "actualEnd": "2024-04-15"
}
```

**Response (200):**
```json
{
  "message": "Task updated successfully",
  "task": {
    "id": "task_id",
    "progress": 90,
    "status": "IN_PROGRESS",
    "actualHours": 550,
    "actualCost": 140000000,
    "actualEnd": "2024-04-15T00:00:00.000Z",
    "updatedAt": "2024-12-09T09:20:00.000Z"
  }
}
```

#### `DELETE /api/timeline/[timelineId]/tasks/[taskId]`
Delete task from timeline.

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

#### `GET /api/timeline/[timelineId]/milestones`
Get all milestones in a timeline.

**Response (200):**
```json
[
  {
    "id": "milestone_id",
    "timelineId": "timeline_id",
    "name": "Foundation Complete",
    "description": "All foundation work finished",
    "dueDate": "2024-03-01T00:00:00.000Z",
    "actualDate": "2024-02-28T00:00:00.000Z",
    "status": "COMPLETED",
    "progress": 100,
    "tasks": [
      {
        "id": "task_id",
        "name": "Foundation Work",
        "status": "COMPLETED"
      }
    ]
  }
]
```

#### `POST /api/timeline/[timelineId]/milestones`
Create new milestone in timeline.

**Request Body:**
```json
{
  "name": "Structural Frame Complete",
  "description": "All structural steel work finished",
  "dueDate": "2024-05-15"
}
```

**Response (201):**
```json
{
  "message": "Milestone created successfully",
  "milestone": {
    "id": "new_milestone_id",
    "timelineId": "timeline_id",
    "name": "Structural Frame Complete",
    "dueDate": "2024-05-15T00:00:00.000Z",
    "status": "PENDING",
    "progress": 0,
    "createdAt": "2024-12-09T09:25:00.000Z"
  }
}
```

---

### 📄 9. PDF TOOLS APIs
Document processing and PDF manipulation tools.

#### `POST /api/pdf`
Process PDF files (compress, split, rotate, protect, organize, merge).

**Request Body:**
```json
{
  "fileUrl": "/uploads/temp/document.pdf",
  "operation": "compress",
  "options": {
    // Operation-specific options
  }
}
```

**Operations:**
- `compress`: Reduce PDF file size
- `split`: Split PDF into multiple parts
- `rotate`: Rotate PDF pages
- `protect`: Add password protection (demo)
- `organize`: Reorder PDF pages
- `merge`: Combine multiple PDFs (separate endpoint)

**Response (200):**
```json
{
  "success": true,
  "operation": "compress",
  "inputFile": "/uploads/temp/document.pdf",
  "outputFile": {
    "url": "/uploads/pdf-tools/compress_1733736600000_document.pdf",
    "size": 1048576,
    "pages": 5
  }
}
```

#### `POST /api/pdf` (Merge Operation)
Merge multiple PDF files.

**Request Body:**
```json
{
  "fileUrls": [
    "/uploads/temp/doc1.pdf",
    "/uploads/temp/doc2.pdf",
    "/uploads/temp/doc3.pdf"
  ],
  "operation": "merge",
  "options": {}
}
```

**Response (200):**
```json
{
  "success": true,
  "operation": "merge",
  "inputFiles": ["/uploads/temp/doc1.pdf", "/uploads/temp/doc2.pdf", "/uploads/temp/doc3.pdf"],
  "outputFile": {
    "url": "/uploads/pdf-tools/merge_1733736600000_merged.pdf",
    "size": 3145728,
    "pages": 15
  }
}
```

#### `GET /api/pdf`
Get PDF processing preview information.

**Query Parameters:**
- `operation`: PDF operation type
- `fileUrl` or `fileUrls`: Input file(s)
- `options`: Processing options (JSON string)

**Response (200):**
```json
{
  "success": true,
  "operation": "merge",
  "preview": {
    "type": "merge",
    "files": [...],
    "summary": {
      "totalFiles": 3,
      "totalPages": 15,
      "totalSize": 5242880,
      "estimatedOutputSize": 4718592
    },
    "previewText": "Will merge 3 files into 1 PDF with 15 total pages"
  }
}
```

---

### 📤 10. FILE UPLOAD APIs
File upload and management endpoints.

#### `POST /api/upload`
Upload files to server for processing.

**Form Data:**
- `file`: File to upload (PDF, images, documents)

**Response (200):**
```json
{
  "success": true,
  "file": {
    "name": "document.pdf",
    "url": "/uploads/temp/550e8400-e29b-41d4-a716-446655440000.pdf",
    "size": 2097152,
    "type": "application/pdf"
  }
}
```

#### `POST /api/templates/upload`
Upload files for templates.

**Form Data:**
- `file`: File to upload
- `templateId`: Template ID (optional)

**Response (200):**
```json
{
  "success": true,
  "file": {
    "name": "blueprint.pdf",
    "url": "/uploads/templates/blueprint_1733736600000.pdf",
    "size": 4194304,
    "type": "application/pdf"
  }
}
```

---

### 💾 11. BACKUP MANAGEMENT APIs
System backup and restore operations.

#### `GET /api/backups`
Get list of available backups.

**Response (200):**
```json
[
  {
    "id": "backup_id",
    "filename": "backup_2024-12-09_09-30-00.sql",
    "size": 10485760,
    "createdAt": "2024-12-09T09:30:00.000Z",
    "type": "FULL"
  }
]
```

#### `POST /api/backups`
Create new system backup.

**Request Body:**
```json
{
  "type": "FULL",
  "description": "Weekly backup"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Backup created successfully",
  "backup": {
    "id": "backup_id",
    "filename": "backup_2024-12-09_09-35-00.sql",
    "size": 10485760,
    "type": "FULL"
  }
}
```

#### `POST /api/backups/[id]/restore`
Restore system from backup.

**Response (200):**
```json
{
  "success": true,
  "message": "System restored successfully from backup"
}
```

#### `DELETE /api/backups/[id]`
Delete backup file.

**Response (200):**
```json
{
  "message": "Backup deleted successfully"
}
```

---

### 📊 12. ANALYTICS & DASHBOARD APIs
System analytics and reporting endpoints.

#### `GET /api/dashboard-analytics`
Get dashboard analytics data.

**Response (200):**
```json
{
  "totalProjects": 25,
  "activeProjects": 8,
  "completedProjects": 17,
  "totalRevenue": 25000000000,
  "monthlyRevenue": [
    { "month": "2024-01", "revenue": 2000000000 },
    { "month": "2024-02", "revenue": 2200000000 }
  ],
  "projectStatus": {
    "PLANNING": 3,
    "IN_PROGRESS": 8,
    "COMPLETED": 17,
    "ON_HOLD": 2,
    "CANCELLED": 1
  },
  "topClients": [
    {
      "clientName": "PT. Maju Jaya",
      "totalValue": 5000000000,
      "projectCount": 3
    }
  ]
}
```

#### `GET /api/database-analysis`
Get database performance and health metrics.

**Response (200):**
```json
{
  "connectionStatus": "HEALTHY",
  "totalTables": 12,
  "totalRecords": 15432,
  "databaseSize": "45.2 MB",
  "lastBackup": "2024-12-09T09:30:00.000Z",
  "performanceMetrics": {
    "avgQueryTime": "45ms",
    "slowQueries": 2,
    "connectionPoolUsage": "65%"
  }
}
```

---

### 💬 13. WHATSAPP INTEGRATION APIs
WhatsApp business messaging integration.

#### `POST /api/whatsapp/send`
Send WhatsApp message.

**Request Body:**
```json
{
  "to": "+628123456789",
  "message": "Project update: Foundation work completed",
  "type": "text"
}
```

**Response (200):**
```json
{
  "success": true,
  "messageId": "msg_123456789",
  "status": "sent"
}
```

#### `GET /api/whatsapp/messages`
Get WhatsApp message history.

**Query Parameters:**
- `contact`: Phone number filter
- `limit`: Number of messages to retrieve

**Response (200):**
```json
{
  "messages": [
    {
      "id": "msg_123456789",
      "from": "+628123456789",
      "to": "+628987654321",
      "message": "Project update: Foundation work completed",
      "timestamp": "2024-12-09T09:40:00.000Z",
      "status": "delivered",
      "type": "text"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "cursor_123"
  }
}
```

---

## 📋 ERROR RESPONSE FORMAT

All APIs return errors in a consistent format:

```json
{
  "error": "Error message description",
  "details": "Additional error details (development only)"
}
```

### Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `500`: Internal Server Error

---

## 🔧 DEVELOPMENT NOTES

### Environment Variables Required:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="your_jwt_secret"
NEXT_PUBLIC_SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY="your_service_key"
```

### Database Setup:
- Uses Prisma ORM with PostgreSQL
- Run `npx prisma generate` after schema changes
- Run `npx prisma db push` to update database

### File Upload Directories:
- `/public/uploads/temp/` - Temporary files
- `/public/uploads/templates/` - Template documents
- `/public/uploads/assemblies/` - Assembly documents
- `/public/uploads/avatars/` - User avatars
- `/public/uploads/pdf-tools/` - PDF processing results

---

## 🚀 API VERSIONING

Current API version: **v1**

All endpoints are prefixed with `/api/` and are considered stable for production use. Future versions will use URL versioning (e.g., `/api/v2/`).

---

**📝 Last Updated:** December 9, 2024
**🔄 API Count:** 50+ endpoints across 13 categories
**✅ Status:** Production Ready
