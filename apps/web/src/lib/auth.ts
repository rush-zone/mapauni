import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'

async function refreshAccessToken(token: any) {
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `refresh_token=${token.refreshToken}` },
    })
    if (!res.ok) return { ...token, error: 'RefreshAccessTokenError' }
    const data = await res.json()
    return {
      ...token,
      accessToken: data.token,
      accessTokenExpires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
      error: undefined,
    }
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          })
          if (!res.ok) return null
          const data = await res.json()
          const refreshToken = res.headers.get('set-cookie')?.match(/refresh_token=([^;]+)/)?.[1]
          return { id: data.user.id, email: data.user.email, name: data.user.name, ...data, refreshToken }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Login inicial
      if (user) {
        return {
          ...token,
          accessToken: (user as any).token,
          accessTokenExpires: Date.now() + 7 * 24 * 60 * 60 * 1000,
          refreshToken: (user as any).refreshToken,
          universityId: (user as any).user?.universityId,
          role: (user as any).user?.role,
        }
      }
      // Token ainda válido
      if (Date.now() < (token.accessTokenExpires as number)) return token
      // Token expirado — faz refresh
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken
      ;(session as any).universityId = token.universityId
      ;(session as any).role = token.role
      ;(session as any).error = token.error
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
}
