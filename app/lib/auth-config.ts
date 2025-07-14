
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('User not found')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days session duration
  },

  callbacks: {
    async jwt({ token, user }) {
      // Add user role to token
      if (user) {
        token.role = user.role
        token.userId = user.id
      }

      return token
    },

    async session({ session, token }) {
      // Add user info to session
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.email = token.email!
        session.user.name = token.name!
        session.user.image = token.picture
      }

      return session
    },

    async signIn({ user, account, profile }) {
      // Allow credentials sign-ins
      return account?.type === 'credentials'
    },

    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful sign in
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    },
  },

  pages: {
    signIn: '/login',
    error: '/auth/error',
  },

  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        console.log(`New user signed up: ${user.email}`)
      }
    },

    async signOut({ session, token }) {
      console.log(`User signed out: ${token?.email || 'unknown'}`)
    },
  },

  debug: process.env.NODE_ENV === 'development',
}
