'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">MapaUni</Link>
          <p className="text-gray-500 mt-2">Recuperar senha</p>
        </div>
        <div className="bg-white border rounded-2xl p-8 shadow-sm">
          {status === 'success' ? (
            <div className="text-center py-4">
              <p className="text-2xl mb-3">✓</p>
              <p className="font-semibold text-gray-900">Email enviado!</p>
              <p className="text-sm text-gray-500 mt-2">Se esse email estiver cadastrado, você receberá um link para redefinir sua senha.</p>
              <Link href="/login" className="block mt-6 text-blue-600 hover:underline text-sm">Voltar ao login</Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Esqueci minha senha</h1>
              <p className="text-sm text-gray-500 mb-6">Informe seu email e enviaremos um link para redefinir sua senha.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email" placeholder="Seu email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                />
                {status === 'error' && <p className="text-sm text-red-500">Erro ao enviar. Tente novamente.</p>}
                <button
                  type="submit" disabled={status === 'loading'}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {status === 'loading' ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-6">
                <Link href="/login" className="text-blue-600 hover:underline">Voltar ao login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
