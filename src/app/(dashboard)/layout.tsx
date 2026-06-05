'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Trash2,
  ClipboardList,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  Bell,
  LogOut,
  Boxes,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/estoque', label: 'Estoque', icon: Boxes },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/compras', label: 'Compras', icon: ShoppingCart },
  { href: '/perdas', label: 'Perdas', icon: Trash2 },
  { href: '/inventario', label: 'Inventário', icon: ClipboardList },
  { href: '/fichas-tecnicas', label: 'Fichas Técnicas', icon: FileText },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    document.cookie = 'gastrocontrol_token=; Max-Age=0; path=/'
    router.push('/login')
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={cn(
        'flex flex-col bg-gray-900 text-white transition-all duration-200',
        mobile ? 'w-64' : sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
        <div className={cn('flex items-center gap-2', !sidebarOpen && !mobile && 'justify-center')}>
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Boxes className="h-4 w-4 text-white" />
          </div>
          {(sidebarOpen || mobile) && (
            <div>
              <span className="font-bold text-sm leading-none">GastroControl</span>
              <span className="block text-xs text-gray-400 leading-none mt-0.5">
                Restaurant OS
              </span>
            </div>
          )}
        </div>
        {!mobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            <ChevronLeft
              className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')}
            />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => mobile && setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                    !sidebarOpen && !mobile && 'justify-center px-2'
                  )}
                  title={!sidebarOpen && !mobile ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {(sidebarOpen || mobile) && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-800 p-3">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors',
            !sidebarOpen && !mobile && 'justify-center px-2'
          )}
          title={!sidebarOpen && !mobile ? 'Sair' : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {(sidebarOpen || mobile) && <span>Sair</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 h-14 flex-shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-3">
            <button className="relative text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">A</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
