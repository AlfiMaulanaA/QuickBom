-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'SITE_MANAGER', 'FOREMAN', 'WORKER', 'CLIENT', 'ACCOUNTANT', 'ESTIMATOR', 'ENGINEER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'COMPANY', 'GOVERNMENT', 'CONTRACTOR', 'PARTNERSHIP', 'NON_PROFIT');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED', 'PENDING_APPROVAL', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "ClientCategory" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INSTITUTIONAL', 'INFRASTRUCTURE', 'RENOVATION', 'LAND_DEVELOPMENT');

-- CreateEnum
CREATE TYPE "AssemblyGroupType" AS ENUM ('REQUIRED', 'CHOOSE_ONE', 'OPTIONAL', 'CONFLICT');

-- CreateEnum
CREATE TYPE "AssemblyModule" AS ENUM ('ELECTRONIC', 'ELECTRICAL', 'ASSEMBLY', 'INSTALLATION', 'MECHANICAL');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'DELAYED');

-- CreateEnum
CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'WORKER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "phone" TEXT,
    "avatar" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "employeeId" TEXT,
    "department" TEXT,
    "position" TEXT,
    "hireDate" TIMESTAMP(3),
    "salary" DECIMAL(65,30),
    "lastLogin" TIMESTAMP(3),
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "clientType" "ClientType" NOT NULL DEFAULT 'INDIVIDUAL',
    "category" "ClientCategory" NOT NULL DEFAULT 'RESIDENTIAL',
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "companyName" TEXT,
    "companyType" TEXT,
    "businessLicense" TEXT,
    "taxId" TEXT,
    "companyEmail" TEXT,
    "companyPhone" TEXT,
    "website" TEXT,
    "contactPerson" TEXT NOT NULL,
    "contactTitle" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactPhone2" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Indonesia',
    "industry" TEXT,
    "companySize" TEXT,
    "annualRevenue" DECIMAL(65,30),
    "creditLimit" DECIMAL(65,30),
    "paymentTerms" TEXT,
    "totalProjects" INTEGER NOT NULL DEFAULT 0,
    "activeProjects" INTEGER NOT NULL DEFAULT 0,
    "completedProjects" INTEGER NOT NULL DEFAULT 0,
    "totalContractValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "outstandingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lastPaymentDate" TIMESTAMP(3),
    "paymentHistory" JSONB,
    "preferences" JSONB,
    "specialNotes" TEXT,
    "contractTerms" TEXT,
    "source" TEXT,
    "referralSource" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "dataConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssemblyCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssemblyCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assembly" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" "AssemblyModule" NOT NULL DEFAULT 'ELECTRICAL',
    "categoryId" INTEGER NOT NULL,
    "docs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assembly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssemblyMaterial" (
    "id" TEXT NOT NULL,
    "assemblyId" INTEGER NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partNumber" TEXT,
    "partDesc" TEXT,
    "manufacturer" TEXT,
    "unit" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "quantity" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssemblyMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "docs" JSONB,
    "assemblySelections" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateAssemblyGroup" (
    "id" TEXT NOT NULL,
    "templateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "groupType" "AssemblyGroupType" NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateAssemblyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateAssemblyGroupItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "assemblyId" INTEGER NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "conflictsWith" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateAssemblyGroupItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateAssembly" (
    "templateId" INTEGER NOT NULL,
    "assemblyId" INTEGER NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "TemplateAssembly_pkey" PRIMARY KEY ("templateId","assemblyId")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientId" TEXT,
    "projectType" TEXT,
    "budget" DECIMAL(65,30),
    "totalPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "progress" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "priority" "ProjectPriority" NOT NULL DEFAULT 'MEDIUM',
    "schematicDocs" JSONB,
    "qualityCheckDocs" JSONB,
    "crmInquiryId" INTEGER,
    "crmInquiryTitle" TEXT,
    "fromTemplateId" INTEGER,
    "createdBy" TEXT NOT NULL,
    "assignedUsers" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssemblyGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "groupType" "AssemblyGroupType" NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssemblyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssemblyGroupItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "assemblyId" INTEGER NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "conflictsWith" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssemblyGroupItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductGroup" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSubGroup" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductSubGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "subGroupId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "specJson" JSONB,
    "basePrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dimensionsJson" JSONB,
    "inputSpecJson" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Component" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT,
    "itemCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "uom" TEXT NOT NULL,
    "manufacturer" TEXT,
    "categoryId" INTEGER NOT NULL,
    "specJson" JSONB,
    "isService" BOOLEAN NOT NULL DEFAULT false,
    "currentUnitCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currentListPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductComponentMapping" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "componentId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultSelected" BOOLEAN NOT NULL DEFAULT false,
    "defaultQty" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "qtyFormula" TEXT,
    "minQty" DECIMAL(65,30),
    "maxQty" DECIMAL(65,30),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,

    CONSTRAINT "ProductComponentMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentRule" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "sourceComponentId" INTEGER NOT NULL,
    "ruleType" TEXT NOT NULL,
    "targetComponentId" INTEGER NOT NULL,
    "condition" TEXT,

    CONSTRAINT "ComponentRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_employeeId_idx" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "Client_companyName_idx" ON "Client"("companyName");

-- CreateIndex
CREATE INDEX "Client_contactEmail_idx" ON "Client"("contactEmail");

-- CreateIndex
CREATE INDEX "Client_contactPhone_idx" ON "Client"("contactPhone");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_category_idx" ON "Client"("category");

-- CreateIndex
CREATE INDEX "Client_clientType_idx" ON "Client"("clientType");

-- CreateIndex
CREATE INDEX "Client_city_idx" ON "Client"("city");

-- CreateIndex
CREATE INDEX "Client_province_idx" ON "Client"("province");

-- CreateIndex
CREATE UNIQUE INDEX "AssemblyCategory_name_key" ON "AssemblyCategory"("name");

-- CreateIndex
CREATE INDEX "AssemblyCategory_name_idx" ON "AssemblyCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Assembly_name_key" ON "Assembly"("name");

-- CreateIndex
CREATE INDEX "Assembly_categoryId_idx" ON "Assembly"("categoryId");

-- CreateIndex
CREATE INDEX "Assembly_module_idx" ON "Assembly"("module");

-- CreateIndex
CREATE INDEX "AssemblyMaterial_externalId_idx" ON "AssemblyMaterial"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "AssemblyMaterial_assemblyId_externalId_key" ON "AssemblyMaterial"("assemblyId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_name_key" ON "Template"("name");

-- CreateIndex
CREATE INDEX "TemplateAssemblyGroup_templateId_idx" ON "TemplateAssemblyGroup"("templateId");

-- CreateIndex
CREATE INDEX "TemplateAssemblyGroup_categoryId_idx" ON "TemplateAssemblyGroup"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateAssemblyGroupItem_groupId_assemblyId_key" ON "TemplateAssemblyGroupItem"("groupId", "assemblyId");

-- CreateIndex
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_createdBy_idx" ON "Project"("createdBy");

-- CreateIndex
CREATE INDEX "Project_startDate_endDate_idx" ON "Project"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "AssemblyGroup_categoryId_idx" ON "AssemblyGroup"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "AssemblyGroupItem_groupId_assemblyId_key" ON "AssemblyGroupItem"("groupId", "assemblyId");

-- CreateIndex
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductGroup_code_key" ON "ProductGroup"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSubGroup_groupId_code_key" ON "ProductSubGroup"("groupId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_code_key" ON "ProductCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Component_itemCode_key" ON "Component"("itemCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductComponentMapping_productId_componentId_key" ON "ProductComponentMapping"("productId", "componentId");

-- AddForeignKey
ALTER TABLE "Assembly" ADD CONSTRAINT "Assembly_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssemblyCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssemblyMaterial" ADD CONSTRAINT "AssemblyMaterial_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateAssemblyGroup" ADD CONSTRAINT "TemplateAssemblyGroup_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateAssemblyGroup" ADD CONSTRAINT "TemplateAssemblyGroup_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssemblyCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateAssemblyGroupItem" ADD CONSTRAINT "TemplateAssemblyGroupItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TemplateAssemblyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateAssemblyGroupItem" ADD CONSTRAINT "TemplateAssemblyGroupItem_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateAssembly" ADD CONSTRAINT "TemplateAssembly_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateAssembly" ADD CONSTRAINT "TemplateAssembly_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_fromTemplateId_fkey" FOREIGN KEY ("fromTemplateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssemblyGroup" ADD CONSTRAINT "AssemblyGroup_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssemblyCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssemblyGroupItem" ADD CONSTRAINT "AssemblyGroupItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AssemblyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssemblyGroupItem" ADD CONSTRAINT "AssemblyGroupItem_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSubGroup" ADD CONSTRAINT "ProductSubGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProductGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_subGroupId_fkey" FOREIGN KEY ("subGroupId") REFERENCES "ProductSubGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Component" ADD CONSTRAINT "Component_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductComponentMapping" ADD CONSTRAINT "ProductComponentMapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductComponentMapping" ADD CONSTRAINT "ProductComponentMapping_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductComponentMapping" ADD CONSTRAINT "ProductComponentMapping_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentRule" ADD CONSTRAINT "ComponentRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentRule" ADD CONSTRAINT "ComponentRule_sourceComponentId_fkey" FOREIGN KEY ("sourceComponentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentRule" ADD CONSTRAINT "ComponentRule_targetComponentId_fkey" FOREIGN KEY ("targetComponentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
