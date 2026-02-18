import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import prisma from "@/lib/db";

/**
 * NextAuth.js v5 configuration for Lab Price Comparator.
 *
 * - Uses CredentialsProvider for email/password login
 * - JWT strategy with 30-minute session expiry
 * - Failed login lockout: 5 attempts → 15-minute lock
 * - Custom callbacks to attach user role and id to the JWT / session
 */

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MIN = 15;

/**
 * Check if an email is currently locked out due to too many failed attempts.
 * Returns the number of minutes remaining if locked, or 0 if not locked.
 */
async function checkLockout(email: string): Promise<number> {
  const windowStart = new Date(Date.now() - LOCKOUT_DURATION_MIN * 60 * 1000);

  const recentAttempts = await prisma.loginAttempt.findMany({
    where: {
      email,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "desc" },
  });

  // Count consecutive failures (reset on any success)
  let failureCount = 0;
  for (const attempt of recentAttempts) {
    if (attempt.success) break;
    failureCount++;
  }

  if (failureCount >= MAX_LOGIN_ATTEMPTS) {
    const lastFailure = recentAttempts[0]?.createdAt;
    if (lastFailure) {
      const unlockAt = new Date(lastFailure.getTime() + LOCKOUT_DURATION_MIN * 60 * 1000);
      const remaining = Math.ceil((unlockAt.getTime() - Date.now()) / 60000);
      if (remaining > 0) return remaining;
    }
  }

  return 0;
}

/** Record a login attempt (success or failure). */
async function recordAttempt(email: string, success: boolean) {
  try {
    await prisma.loginAttempt.create({
      data: { email, success },
    });
  } catch {
    // Never let logging break authentication
    console.error("[Auth] Failed to record login attempt");
  }
}

function createAuthConfig(): NextAuthConfig {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
      "NEXTAUTH_SECRET environment variable is required. " +
      "Generate one with: npx auth secret"
    );
  }

  return {
    trustHost: true,
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Mot de passe", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email et mot de passe requis");
          }

          const email = (credentials.email as string).toLowerCase().trim();
          const password = credentials.password as string;

          // Check lockout before attempting authentication
          const lockoutMinutes = await checkLockout(email);
          if (lockoutMinutes > 0) {
            throw new Error(
              `Compte verrouillé suite à trop de tentatives. Réessayez dans ${lockoutMinutes} minute${lockoutMinutes > 1 ? "s" : ""}.`
            );
          }

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            await recordAttempt(email, false);
            throw new Error("Identifiants invalides");
          }

          if (!user.isActive) {
            throw new Error("Votre compte a été désactivé. Contactez un administrateur.");
          }

          const isPasswordValid = await bcryptjs.compare(password, user.password);

          if (!isPasswordValid) {
            await recordAttempt(email, false);
            throw new Error("Identifiants invalides");
          }

          // Successful login — record and return user
          await recordAttempt(email, true);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
          };
        },
      }),
    ],

    session: {
      strategy: "jwt",
      maxAge: 30 * 60,
    },

    pages: {
      signIn: "/login",
      error: "/login",
    },

    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.role = (user as { role?: string }).role;
          token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword;
        }
        return token;
      },

      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          (session.user as { role?: string }).role = token.role as string;
          (session.user as { mustChangePassword?: boolean }).mustChangePassword = token.mustChangePassword as boolean;
        }
        return session;
      },
    },

    secret: process.env.NEXTAUTH_SECRET,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth(createAuthConfig());
