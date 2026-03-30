'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function CadastroPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    universityName: '',
    universityType: 'PRIVADA',
    city: '',
    state: 'SP',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: form.userName,
          email: form.email,
          password: form.password,
          universityName: form.universityName,
          universityType: form.universityType,
          city: form.city,
          state: form.state,
          phone: form.phone || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta.')
        return
      }

      // Faz login automático após cadastro
      const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      if (result?.ok) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">MapaUni</Link>
          <p className="text-gray-500 mt-2">Cadastre sua universidade</p>
        </div>

        <div className="bg-white border rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dados da Universidade</p>
              <div className="space-y-3">
                <input
                  type="text" placeholder="Nome da universidade" required
                  value={form.universityName} onChange={e => set('universityName', e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={form.universityType} onChange={e => set('universityType', e.target.value)}
                    className="border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="PRIVADA">Privada</option>
                    <option value="FEDERAL">Federal</option>
                    <option value="ESTADUAL">Estadual</option>
                    <option value="MUNICIPAL">Municipal</option>
                  </select>
                  <select
                    value={form.state} onChange={e => set('state', e.target.value)}
                    className="border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text" placeholder="Cidade" required
                    value={form.city} onChange={e => set('city', e.target.value)}
                    className="border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="tel" placeholder="Telefone (opcional)"
                    value={form.phone} onChange={e => set('phone', e.target.value)}
                    className="border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dados de Acesso</p>
              <div className="space-y-3">
                <input
                  type="text" placeholder="Seu nome" required
                  value={form.userName} onChange={e => set('userName', e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
                <input
                  type="email" placeholder="Email corporativo" required
                  value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="password" placeholder="Senha (mín. 8 chars)" required minLength={8}
                    value={form.password} onChange={e => set('password', e.target.value)}
                    className="border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="password" placeholder="Confirmar senha" required
                    value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                    className="border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Entrar</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
