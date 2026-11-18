import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import NextAuth, { SessionStrategy, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    phone?: string | null;
    whatsapp?: string | null;
    bkashNumber?: string | null;
    nagadNumber?: string | null;
    bankAccountNumber?: string | null;
    branchName?: string | null;
    bankName?: string | null;
    swiftCode?: string | null;
    status?: string;
  }

  interface Session {
    user: User;
  }
}

const prisma = new PrismaClient();

export const authOptions = {
  session: {
    strategy: 'jwt' as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'hello@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(
        credentials: Record<'email' | 'password', string> | undefined,
      ): Promise<User | null> {
        if (!credentials) {
          throw new Error('Missing credentials');
        }

        const { email, password } = credentials;
        if (!email || !password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email, status: 'ACTIVE', isDeleted: false },
        });

        if (!user || !(await bcrypt.compare(password, user?.password ?? ''))) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          whatsapp: user.whatsapp,
          bkashNumber: user.bkashNumber,
          nagadNumber: user.nagadNumber,
          bankAccountNumber: user.bankAccountNumber,
          branchName: user.branchName,
          bankName: user.bankName,
          swiftCode: user.swiftCode,
          status: user.status,
        };
      },
    }),
  ],

  pages: {
    signIn: '/signin',
    error: '/signin',
  },

  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.NEXT_PUBLIC_AUTH_SECRET ||
    'taskbit_super_secret_auth_key_0012345',

  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: import('next-auth/jwt').JWT;
      user?: import('next-auth').User;
    }) {
      if (user) {
        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          whatsapp: user.whatsapp,
          bkashNumber: user.bkashNumber,
          nagadNumber: user.nagadNumber,
          bankAccountNumber: user.bankAccountNumber,
          branchName: user.branchName,
          bankName: user.bankName,
          swiftCode: user.swiftCode,
          status: user.status,
        };
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: import('next-auth').Session;
      token: import('next-auth/jwt').JWT;
    }) {
      if (token?.user) {
        session.user = token.user as import('next-auth').User;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
