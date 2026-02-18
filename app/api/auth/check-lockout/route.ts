import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MIN = 15;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ locked: false });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const windowStart = new Date(Date.now() - LOCKOUT_DURATION_MIN * 60 * 1000);

    const recentAttempts = await prisma.loginAttempt.findMany({
      where: {
        email: normalizedEmail,
        createdAt: { gte: windowStart },
      },
      orderBy: { createdAt: "desc" },
    });

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
        if (remaining > 0) {
          return NextResponse.json({ locked: true, remainingMinutes: remaining });
        }
      }
    }

    return NextResponse.json({
      locked: false,
      attemptsRemaining: MAX_LOGIN_ATTEMPTS - failureCount,
    });
  } catch {
    return NextResponse.json({ locked: false });
  }
}
