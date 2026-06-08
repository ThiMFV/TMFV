import { UserRole } from '@prisma/client'
import { JWTPayload } from './jwt'

export function canAccessGroup(user: JWTPayload, groupId: string): boolean {
  if (user.role === UserRole.GROUP_ADMIN && user.groupId === groupId) return true
  if (user.role === UserRole.BRAND_ADMIN && user.groupId === groupId) return true
  if (user.role === UserRole.UNIT_MANAGER && user.groupId === groupId) return true
  if (user.role === UserRole.STOCK_KEEPER && user.groupId === groupId) return true
  if (user.role === UserRole.BUYER && user.groupId === groupId) return true
  if (user.role === UserRole.FINANCIAL && user.groupId === groupId) return true
  return false
}

export function canAccessBrand(user: JWTPayload, brandId: string): boolean {
  if (user.role === UserRole.GROUP_ADMIN) return true
  if (user.role === UserRole.BRAND_ADMIN && user.brandId === brandId) return true
  if (user.role === UserRole.UNIT_MANAGER && user.brandId === brandId) return true
  if (user.role === UserRole.STOCK_KEEPER && user.brandId === brandId) return true
  if (user.role === UserRole.BUYER && user.brandId === brandId) return true
  if (user.role === UserRole.FINANCIAL && user.brandId === brandId) return true
  return false
}

export function canAccessUnit(user: JWTPayload, unitId: string): boolean {
  if (user.role === UserRole.GROUP_ADMIN) return true
  if (user.role === UserRole.BRAND_ADMIN) return true
  if (user.unitId === unitId) return true
  return false
}

export function isGroupAdmin(user: JWTPayload): boolean {
  return user.role === UserRole.GROUP_ADMIN
}

export function isBrandAdmin(user: JWTPayload): boolean {
  return user.role === UserRole.BRAND_ADMIN || user.role === UserRole.GROUP_ADMIN
}

export function canManageStock(user: JWTPayload): boolean {
  const roles: UserRole[] = [UserRole.GROUP_ADMIN, UserRole.BRAND_ADMIN, UserRole.UNIT_MANAGER, UserRole.STOCK_KEEPER]
  return roles.includes(user.role)
}

export function canManagePurchases(user: JWTPayload): boolean {
  const roles: UserRole[] = [UserRole.GROUP_ADMIN, UserRole.BRAND_ADMIN, UserRole.UNIT_MANAGER, UserRole.BUYER]
  return roles.includes(user.role)
}

export function canApprovePurchases(user: JWTPayload): boolean {
  const roles: UserRole[] = [UserRole.GROUP_ADMIN, UserRole.BRAND_ADMIN, UserRole.UNIT_MANAGER]
  return roles.includes(user.role)
}

export function buildTenantFilter(user: JWTPayload): {
  groupId?: string
  brandId?: string
  unitId?: string
} {
  if (user.role === UserRole.GROUP_ADMIN) {
    return { groupId: user.groupId ?? undefined }
  }
  if (user.role === UserRole.BRAND_ADMIN) {
    return { brandId: user.brandId ?? undefined }
  }
  return { unitId: user.unitId ?? undefined }
}
