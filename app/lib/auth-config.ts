
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
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

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),

    // GitHub OAuth Provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour session duration
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Add user role to token
      if (user) {
        token.role = user.role
        token.userId = user.id
      }

      // Handle OAuth sign-in
      if (account && account.type === 'oauth') {
        // Check if user exists in our database
        const existingUser = await prisma.user.findUnique({
          where: { email: token.email! },
        })

        if (!existingUser) {
          // Create new user for OAuth
          const newUser = await prisma.user.create({
            data: {
              email: token.email!,
              name: token.name!,
              password: '', // OAuth users don't have password
              role: 'CLIENT', // Default role
              image: token.picture,
              isActive: true,
            },
          })

          token.role = newUser.role
          token.userId = newUser.id

          // Create welcome notification
          await prisma.notification.create({
            data: {
              userId: newUser.id,
              type: 'WELCOME',
              title: 'Welcome to Harmonized Fitness! 💪',
              message: 'We\'re excited to help you achieve your fitness goals. Complete your profile to get started.',
              isRead: false,
            },
          })
        } else {
          token.role = existingUser.role
          token.userId = existingUser.id
        }
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
      // Allow all credential sign-ins
      if (account?.type === 'credentials') {
        return true
      }

      // Allow OAuth sign-ins
      if (account?.type === 'oauth') {
        return true
      }

      return false
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
