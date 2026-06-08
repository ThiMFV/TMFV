import {
  Group,
  Brand,
  Unit,
  User,
  Category,
  Supplier,
  Product,
  ProductCost,
  InventoryLot,
  StockMovement,
  TechnicalSheet,
  TechnicalSheetIngredient,
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptItem,
  LossRecord,
  InventoryCount,
  InventoryCountItem,
  Alert,
  BrandType,
  UserRole,
  UOM,
  MovementType,
  LotStatus,
  LossType,
  PRStatus,
  POStatus,
  CountType,
  CountStatus,
  AlertType,
  AlertSeverity,
} from '@prisma/client'

export {
  BrandType,
  UserRole,
  UOM,
  MovementType,
  LotStatus,
  LossType,
  PRStatus,
  POStatus,
  CountType,
  CountStatus,
  AlertType,
  AlertSeverity,
}

export type {
  Group,
  Brand,
  Unit,
  User,
  Category,
  Supplier,
  Product,
  ProductCost,
  InventoryLot,
  StockMovement,
  TechnicalSheet,
  TechnicalSheetIngredient,
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptItem,
  LossRecord,
  InventoryCount,
  InventoryCountItem,
  Alert,
}

// DTOs
export type LoginDTO = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: UserRole
    groupId: string | null
    brandId: string | null
    unitId: string | null
  }
}

export type CreateProductDTO = {
  sku: string
  internalCode?: string
  name: string
  description?: string
  categoryId: string
  unitOfMeasure: UOM
  groupId: string
  brandId?: string
  weight?: number
  volume?: number
  minStock?: number
  idealStock?: number
  shelfLifeDays?: number
}

export type UpdateProductDTO = Partial<CreateProductDTO> & { active?: boolean }

export type CreateMovementDTO = {
  productId: string
  unitId: string
  lotId?: string
  type: MovementType
  quantity: number
  unitCost: number
  reason?: string
  notes?: string
  referenceId?: string
  referenceType?: string
}

export type CreateLossDTO = {
  productId: string
  unitId: string
  lotId?: string
  type: LossType
  quantity: number
  unitCost: number
  reason: string
  notes?: string
}

export type CreatePurchaseRequestDTO = {
  unitId: string
  notes?: string
  items: {
    productId: string
    quantity: number
    unitOfMeasure: UOM
    estimatedCost?: number
    supplierId?: string
  }[]
}

export type CreatePurchaseOrderDTO = {
  purchaseRequestId?: string
  unitId: string
  supplierId: string
  totalAmount: number
  expectedDelivery?: string
  notes?: string
  items: {
    productId: string
    quantity: number
    unitCost: number
    totalCost: number
  }[]
}

export type CreateInventoryCountDTO = {
  unitId: string
  type: CountType
  notes?: string
  items: {
    productId: string
    lotId?: string
    systemQuantity: number
    countedQuantity: number
    unitCost: number
  }[]
}

export type StockLevel = {
  productId: string
  productName: string
  sku: string
  unitId: string
  unitName: string
  currentStock: number
  unitOfMeasure: UOM
  minStock: number
  idealStock: number
  averageCost: number
  totalValue: number
  status: 'OK' | 'LOW' | 'CRITICAL' | 'RUPTURE'
}

export type DashboardSummary = {
  totalStockValue: number
  cmvPercent: number
  lossesThisMonth: number
  ruptureCount: number
  lowStockCount: number
  recentAlerts: Alert[]
  topLosses: { productName: string; totalLoss: number; type: LossType }[]
  stockChartData: { date: string; value: number }[]
}

export type ApiResponse<T> = {
  data: T
  error?: never
} | {
  data?: never
  error: string
}
