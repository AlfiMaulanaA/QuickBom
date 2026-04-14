-- CreateTable
CREATE TABLE "Configuration" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "inputsJson" JSONB NOT NULL DEFAULT '{}',
    "selectionsJson" JSONB NOT NULL DEFAULT '[]',
    "adjustmentsJson" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "quotedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigurationLine" (
    "id" SERIAL NOT NULL,
    "configurationId" INTEGER NOT NULL,
    "componentId" INTEGER,
    "itemCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "uom" TEXT NOT NULL,
    "qty" DECIMAL(65,30) NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL,
    "unitListPrice" DECIMAL(65,30) NOT NULL,
    "lineTotal" DECIMAL(65,30) NOT NULL,
    "source" TEXT NOT NULL,
    "isService" BOOLEAN NOT NULL DEFAULT false,
    "formulaUsed" TEXT,
    "remarks" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConfigurationLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Configuration_userId_status_idx" ON "Configuration"("userId", "status");

-- CreateIndex
CREATE INDEX "Configuration_productId_idx" ON "Configuration"("productId");

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigurationLine" ADD CONSTRAINT "ConfigurationLine_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
