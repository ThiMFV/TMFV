'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Boxes, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertUI } from '@/components/ui/alert'
import axios from 'axios'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    try {
      const response = await axios.post('/api/auth/login', data)
      const token = response.data?.data?.token
      if (token) {
        localStorage.setItem('gastrocontrol_token', token)
      }
      router.refresh()
      router.push('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Erro ao realizar login. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-500/30">
            <Boxes className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">GastroControl</h1>
          <p className="text-sm text-gray-400 mt-1">
            Sistema de Gestão para Redes de Restaurantes
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Entrar na sua conta</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Utilize suas credenciais de acesso
            </p>
          </div>

          {error && (
            <AlertUI variant="error" className="mb-4">
              {error}
            </AlertUI>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />

            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={errors.password?.message}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              loading={isSubmitting}
            >
              Entrar
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            Problemas de acesso? Entre em contato com o administrador.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          GastroControl &copy; {new Date().getFullYear()} &mdash; Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
