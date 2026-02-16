import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import prisma from "@/lib/db";

/**
 * NextAuth.js v5 configuration for Lab Price Comparator.
 *
 * - Uses CredentialsProvider for email/password login
 * - JWT strategy with 30-minute session expiry
 * - Custom callbacks to attach user role and id to the JWT / session
 * - Dynamic initialization to ensure environment variables are loaded
 */

/**
 * Creates the NextAuth configuration object.
 * This function is called lazily to ensure environment variables are loaded.
 */
function createAuthConfig(): NextAuthConfig {
  // Validate required environment variables
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
          console.log("🔐 NextAuth authorize called with:", {
            email: credentials?.email,
            passwordLength: credentials?.password ? (credentials.password as string).length : 0,
          });

          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing credentials");
            throw new Error("Email et mot de passe requis");
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          console.log("🔍 Looking up user:", email);

          // Look up the user by email
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log("❌ User not found in database:", email);
            throw new Error("Identifiants invalides");
          }

          console.log("✅ User found:", {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            hasPassword: !!user.password,
            passwordHashLength: user.password ? user.password.length : 0,
          });

          if (!user.isActive) {
            console.log("❌ User account is not active");
            throw new Error("Votre compte a été désactivé. Contactez un administrateur.");
          }

          // Compare the supplied password against the stored hash
          console.log("🔐 Comparing password with hash...");
          const isPasswordValid = await bcryptjs.compare(password, user.password);
          console.log("🔐 Password comparison result:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("❌ Password validation failed");
            throw new Error("Identifiants invalides");
          }

          console.log("✅ Authentication successful for:", user.email);

          // Return the user object (will be available in the jwt callback)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        },
      }),
    ],

    session: {
      strategy: "jwt",
      maxAge: 30 * 60, // 30 minutes in seconds
    },

    pages: {
      signIn: "/login",
      error: "/login",
    },

    callbacks: {
      /**
       * JWT callback – runs whenever a JWT is created or updated.
       * We attach the user id and role to the token so they are
       * available in the session callback.
       */
      async jwt({ token, user }) {
        console.log("🎫 JWT callback called:", {
          hasUser: !!user,
          userEmail: user?.email,
          tokenSub: token.sub,
        });
        
        if (user) {
          token.id = user.id;
          token.role = (user as { role?: string }).role;
          console.log("✅ JWT token updated with user data");
        }
        return token;
      },

      /**
       * Session callback – runs whenever the session is checked.
       * Copies the id and role from the JWT token into the session
       * object that is exposed to the client.
       */
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          (session.user as { role?: string }).role = token.role as string;
        }
        return session;
      },
    },

    secret: process.env.NEXTAUTH_SECRET,
  };
}

// Initialize NextAuth with the dynamically created configuration
export const { handlers, auth, signIn, signOut } = NextAuth(createAuthConfig());
