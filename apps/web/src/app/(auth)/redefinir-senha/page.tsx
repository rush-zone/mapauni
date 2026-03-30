'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('As senhas não coincidem.'); return }

    setStatus('loading')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Token inválido ou expirado.')
        setStatus('error')
        return
      }
      setStatus('success')
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setStatus('error')
    }
  }

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">Link inválido.</p>
        <Link href="/esqueci-senha" className="text-blue-600 hover:underline text-sm mt-4 block">Solicitar novo link</Link>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center py-4">
        <p className="text-2xl mb-3">✓</p>
        <p className="font-semibold text-gray-900">Senha redefinida!</p>
        <p className="text-sm text-gray-500 mt-2">Redirecionando para o login...</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Redefinir senha</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password" placeholder="Nova senha (mín. 8 caracteres)" required minLength={8}
          value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
        />
        <input
          type="password" placeholder="Confirmar nova senha" required
          value={confirm} onChange={e => setConfirm(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit" disabled={status === 'loading'}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {status === 'loading' ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>
    </>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">MapaUni</Link>
        </div>
        <div className="bg-white border rounded-2xl p-8 shadow-sm">
          <Suspense fallback={<div className="text-gray-400 text-sm">Carregando...</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
