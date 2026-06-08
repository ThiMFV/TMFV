import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  const cookieToken = request.cookies.get('gastrocontrol_token')?.value

  if (cookieToken) {
    // Invalidate session
    await prisma.userSession.deleteMany({ where: { token: cookieToken } }).catch(() => {})
  }

  const response = NextResponse.json({ data: { success: true } })
  response.cookies.delete('gastrocontrol_token')
  return response
}
