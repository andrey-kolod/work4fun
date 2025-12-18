// work4fun/src/app/api/auth/refresh/route.ts
// API маршрут для обновления токенов доступа с использованием refresh token (JWT).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const isDev = process.env.NODE_ENV === 'development';

interface RefreshTokenPayload {
  sub: string;
  email: string;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// ГЛОБАЛЬНЫЙ КЭШ для rate limiting (1 инстанс)
declare global {
  var rateLimitCache: Map<string, number[]> | undefined;
}

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });
    }

    // RATE LIMITING (10 запросов/мин на IP)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const now = Date.now();
    const minuteKey = `refresh:${ip}:${Math.floor(now / 60000)}`;

    if (!globalThis.rateLimitCache) globalThis.rateLimitCache = new Map();
    const cache = globalThis.rateLimitCache as Map<string, number[]>;

    if (!cache.has(minuteKey)) cache.set(minuteKey, []);
    const requests = cache.get(minuteKey)!;
    requests.push(now);

    // Только последние 60 сек
    const recent = requests.filter((time) => now - time < 60000);
    cache.set(minuteKey, recent);

    const RATE_LIMIT = 10; // 10/мин
    if (recent.length > RATE_LIMIT) {
      if (isDev) console.log('🚫 [RATE LIMIT]', ip);
      return NextResponse.json(
        {
          error: 'Too many requests. Try again in 1 minute.',
          retry_after: 60,
        },
        { status: 429 }
      );
    }

    if (isDev) console.log('🔄 [API/REFRESH] Запрос');

    // 1. TYPE-SAFE JWT Verify
    const decoded = jwt.verify(
      refreshToken,
      process.env.NEXTAUTH_REFRESH_SECRET!
    ) as RefreshTokenPayload;

    // 2. Найти пользователя
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    // 3. ТОКЕНЫ (15m + 30d)
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.NEXTAUTH_REFRESH_SECRET!,
      { expiresIn: '30d' }
    );

    // 4. RESPONSE
    const response: RefreshResponse = {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: 15 * 60, // 900 секунд
    };

    if (isDev) console.log('✅ [API/REFRESH] OK:', user.email);

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    if (isDev) console.error('💥 [API/REFRESH ERROR]:', error.message);
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
}
