-- CreateEnum
CREATE TYPE "BrandType" AS ENUM ('TRADITIONAL_RESTAURANT', 'BURGER', 'PIZZA', 'CAFE', 'BAR', 'ASIAN', 'FAST_FOOD', 'DARK_KITCHEN');
CREATE TYPE "UserRole" AS ENUM ('GROUP_ADMIN', 'BRAND_ADMIN', 'UNIT_MANAGER', 'STOCK_KEEPER', 'BUYER', 'FINANCIAL');
CREATE TYPE "UOM" AS ENUM ('KG', 'G', 'L', 'ML', 'UN', 'CX', 'PCT', 'SC', 'BD');
CREATE TYPE "MovementType" AS ENUM ('ENTRY', 'TRANSFER_IN', 'TRANSFER_OUT', 'CONSUMPTION', 'LOSS', 'WASTE', 'ADJUSTMENT', 'INVENTORY_ADJUSTMENT');
CREATE TYPE "LotStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'DEPLETED', 'QUARANTINE');
CREATE TYPE "LossType" AS ENUM ('EXPIRY', 'BREAKAGE', 'EXCESS_PRODUCTION', 'OPERATIONAL_ERROR', 'THEFT', 'SANITARY_DISCARD');
CREATE TYPE "PRStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED');
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED');
CREATE TYPE "CountType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL');
CREATE TYPE "CountStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'FINISHED', 'APPROVED');
CREATE TYPE "PDVProvider" AS ENUM ('LINX', 'COLIBRI', 'NCR', 'ORACLE_SIMPHONY', 'TOAST', 'MICROS', 'CUSTOM');
CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'EXPIRING_PRODUCT', 'INVENTORY_DIVERGENCE', 'HIGH_LOSSES', 'SUPPLIER_DELAYED', 'RUPTURE');
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "Group" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "logo" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Group_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");

CREATE TABLE "Brand" ("id" TEXT NOT NULL, "groupId" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "type" "BrandType" NOT NULL, "logo" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Brand_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Brand_groupId_slug_key" ON "Brand"("groupId", "slug");

CREATE TABLE "Unit" ("id" TEXT NOT NULL, "brandId" TEXT NOT NULL, "name" TEXT NOT NULL, "code" TEXT NOT NULL, "address" TEXT, "city" TEXT, "state" TEXT, "country" TEXT NOT NULL DEFAULT 'BR', "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo', "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Unit_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Unit_brandId_code_key" ON "Unit"("brandId", "code");

CREATE TABLE "User" ("id" TEXT NOT NULL, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "name" TEXT NOT NULL, "role" "UserRole" NOT NULL, "groupId" TEXT, "brandId" TEXT, "unitId" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "UserSession" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "token" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");

CREATE TABLE "Category" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "parentId" TEXT, "unitId" TEXT, "brandId" TEXT, "groupId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Category_pkey" PRIMARY KEY ("id"));

CREATE TABLE "Supplier" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "cnpj" TEXT, "email" TEXT, "phone" TEXT, "address" TEXT, "groupId" TEXT NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id"));

CREATE TABLE "Product" ("id" TEXT NOT NULL, "sku" TEXT NOT NULL, "internalCode" TEXT, "name" TEXT NOT NULL, "description" TEXT, "categoryId" TEXT NOT NULL, "unitOfMeasure" "UOM" NOT NULL, "groupId" TEXT NOT NULL, "brandId" TEXT, "weight" DOUBLE PRECISION, "volume" DOUBLE PRECISION, "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0, "idealStock" DOUBLE PRECISION NOT NULL DEFAULT 0, "shelfLifeDays" INTEGER, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Product_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Product_groupId_sku_key" ON "Product"("groupId", "sku");

CREATE TABLE "ProductCost" ("id" TEXT NOT NULL, "productId" TEXT NOT NULL, "unitId" TEXT NOT NULL, "averageCost" DOUBLE PRECISION NOT NULL DEFAULT 0, "lastCost" DOUBLE PRECISION NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ProductCost_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "ProductCost_productId_unitId_key" ON "ProductCost"("productId", "unitId");

CREATE TABLE "InventoryLot" ("id" TEXT NOT NULL, "productId" TEXT NOT NULL, "unitId" TEXT NOT NULL, "supplierId" TEXT NOT NULL, "lotNumber" TEXT NOT NULL, "manufacturingDate" TIMESTAMP(3), "expiryDate" TIMESTAMP(3), "invoiceNumber" TEXT, "quantity" DOUBLE PRECISION NOT NULL, "remainingQuantity" DOUBLE PRECISION NOT NULL, "unitCost" DOUBLE PRECISION NOT NULL, "status" "LotStatus" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "InventoryLot_pkey" PRIMARY KEY ("id"));

CREATE TABLE "StockMovement" ("id" TEXT NOT NULL, "productId" TEXT NOT NULL, "unitId" TEXT NOT NULL, "lotId" TEXT, "userId" TEXT NOT NULL, "type" "MovementType" NOT NULL, "quantity" DOUBLE PRECISION NOT NULL, "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0, "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0, "reason" TEXT, "notes" TEXT, "referenceId" TEXT, "referenceType" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id"));

CREATE TABLE "TechnicalSheet" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "unitId" TEXT NOT NULL, "yield" DOUBLE PRECISION NOT NULL DEFAULT 1, "yieldUnit" TEXT NOT NULL DEFAULT 'UN', "preparationTime" INTEGER, "cost" DOUBLE PRECISION NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "TechnicalSheet_pkey" PRIMARY KEY ("id"));

CREATE TABLE "TechnicalSheetIngredient" ("id" TEXT NOT NULL, "technicalSheetId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" DOUBLE PRECISION NOT NULL, "unitOfMeasure" "UOM" NOT NULL, "wasteFactor" DOUBLE PRECISION NOT NULL DEFAULT 0, "netQuantity" DOUBLE PRECISION NOT NULL, CONSTRAINT "TechnicalSheetIngredient_pkey" PRIMARY KEY ("id"));

CREATE TABLE "PurchaseRequest" ("id" TEXT NOT NULL, "unitId" TEXT NOT NULL, "requestedById" TEXT NOT NULL, "approvedById" TEXT, "status" "PRStatus" NOT NULL DEFAULT 'DRAFT', "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id"));

CREATE TABLE "PurchaseRequestItem" ("id" TEXT NOT NULL, "purchaseRequestId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" DOUBLE PRECISION NOT NULL, "unitOfMeasure" "UOM" NOT NULL, "estimatedCost" DOUBLE PRECISION, "supplierId" TEXT, CONSTRAINT "PurchaseRequestItem_pkey" PRIMARY KEY ("id"));

CREATE TABLE "PurchaseOrder" ("id" TEXT NOT NULL, "purchaseRequestId" TEXT, "unitId" TEXT NOT NULL, "supplierId" TEXT NOT NULL, "createdById" TEXT NOT NULL, "status" "POStatus" NOT NULL DEFAULT 'DRAFT', "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "expectedDelivery" TIMESTAMP(3), "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id"));

CREATE TABLE "PurchaseOrderItem" ("id" TEXT NOT NULL, "purchaseOrderId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" DOUBLE PRECISION NOT NULL, "unitCost" DOUBLE PRECISION NOT NULL, "totalCost" DOUBLE PRECISION NOT NULL, CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id"));

CREATE TABLE "GoodsReceipt" ("id" TEXT NOT NULL, "purchaseOrderId" TEXT NOT NULL, "unitId" TEXT NOT NULL, "receivedById" TEXT NOT NULL, "invoiceNumber" TEXT NOT NULL, "receiptDate" TIMESTAMP(3) NOT NULL, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id"));

CREATE TABLE "GoodsReceiptItem" ("id" TEXT NOT NULL, "goodsReceiptId" TEXT NOT NULL, "productId" TEXT NOT NULL, "lotId" TEXT NOT NULL, "quantityOrdered" DOUBLE PRECISION NOT NULL, "quantityReceived" DOUBLE PRECISION NOT NULL, "unitCost" DOUBLE PRECISION NOT NULL, CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id"));

CREATE TABLE "LossRecord" ("id" TEXT NOT NULL, "productId" TEXT NOT NULL, "unitId" TEXT NOT NULL, "lotId" TEXT, "userId" TEXT NOT NULL, "type" "LossType" NOT NULL, "quantity" DOUBLE PRECISION NOT NULL, "unitCost" DOUBLE PRECISION NOT NULL, "totalCost" DOUBLE PRECISION NOT NULL, "reason" TEXT NOT NULL, "notes" TEXT, "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "LossRecord_pkey" PRIMARY KEY ("id"));

CREATE TABLE "InventoryCount" ("id" TEXT NOT NULL, "unitId" TEXT NOT NULL, "type" "CountType" NOT NULL, "status" "CountStatus" NOT NULL DEFAULT 'DRAFT', "createdById" TEXT NOT NULL, "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "finishedAt" TIMESTAMP(3), "notes" TEXT, CONSTRAINT "InventoryCount_pkey" PRIMARY KEY ("id"));

CREATE TABLE "InventoryCountItem" ("id" TEXT NOT NULL, "inventoryCountId" TEXT NOT NULL, "productId" TEXT NOT NULL, "lotId" TEXT, "systemQuantity" DOUBLE PRECISION NOT NULL, "countedQuantity" DOUBLE PRECISION NOT NULL, "divergence" DOUBLE PRECISION NOT NULL, "unitCost" DOUBLE PRECISION NOT NULL, "divergenceValue" DOUBLE PRECISION NOT NULL, CONSTRAINT "InventoryCountItem_pkey" PRIMARY KEY ("id"));

CREATE TABLE "PDVIntegration" ("id" TEXT NOT NULL, "unitId" TEXT NOT NULL, "provider" "PDVProvider" NOT NULL, "config" JSONB NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PDVIntegration_pkey" PRIMARY KEY ("id"));

CREATE TABLE "SaleEvent" ("id" TEXT NOT NULL, "unitId" TEXT NOT NULL, "externalId" TEXT NOT NULL, "saleDate" TIMESTAMP(3) NOT NULL, "totalAmount" DOUBLE PRECISION NOT NULL, "items" JSONB NOT NULL, "processedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SaleEvent_pkey" PRIMARY KEY ("id"));

CREATE TABLE "Alert" ("id" TEXT NOT NULL, "type" "AlertType" NOT NULL, "unitId" TEXT NOT NULL, "productId" TEXT, "message" TEXT NOT NULL, "severity" "AlertSeverity" NOT NULL, "read" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Alert_pkey" PRIMARY KEY ("id"));

-- Foreign Keys
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductCost" ADD CONSTRAINT "ProductCost_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductCost" ADD CONSTRAINT "ProductCost_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "InventoryLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TechnicalSheet" ADD CONSTRAINT "TechnicalSheet_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TechnicalSheetIngredient" ADD CONSTRAINT "TechnicalSheetIngredient_technicalSheetId_fkey" FOREIGN KEY ("technicalSheetId") REFERENCES "TechnicalSheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TechnicalSheetIngredient" ADD CONSTRAINT "TechnicalSheetIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "InventoryLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LossRecord" ADD CONSTRAINT "LossRecord_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LossRecord" ADD CONSTRAINT "LossRecord_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LossRecord" ADD CONSTRAINT "LossRecord_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "InventoryLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LossRecord" ADD CONSTRAINT "LossRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryCount" ADD CONSTRAINT "InventoryCount_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryCount" ADD CONSTRAINT "InventoryCount_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryCountItem" ADD CONSTRAINT "InventoryCountItem_inventoryCountId_fkey" FOREIGN KEY ("inventoryCountId") REFERENCES "InventoryCount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryCountItem" ADD CONSTRAINT "InventoryCountItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryCountItem" ADD CONSTRAINT "InventoryCountItem_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "InventoryLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PDVIntegration" ADD CONSTRAINT "PDVIntegration_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleEvent" ADD CONSTRAINT "SaleEvent_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
