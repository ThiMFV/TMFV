import { NextRequest } from 'next/server'
import { UserRole } from '@prisma/client'
import { JWTPayload } from './jwt'

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const userId = request.headers.get('x-user-id')
  const email = request.headers.get('x-user-email')
  const name = request.headers.get('x-user-name')
  const role = request.headers.get('x-user-role') as UserRole | null
  const groupId = request.headers.get('x-user-group-id') || null
  const brandId = request.headers.get('x-user-brand-id') || null
  const unitId = request.headers.get('x-user-unit-id') || null

  if (!userId || !email || !name || !role) return null

  return {
    userId,
    email,
    name,
    role,
    groupId: groupId || null,
    brandId: brandId || null,
    unitId: unitId || null,
  }
}
