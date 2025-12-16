// ============================================================================
// ФАЙЛ: src/app/api/auth/recaptcha/route.ts
// НАЗНАЧЕНИЕ: Проверка reCAPTCHA токена на сервере
// ----------------------------------------------------------------------------
// Получаем токен от клиента → отправляем в Google → получаем score (0-1)
// Если score < 0.5 — считаем бота
// ============================================================================

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token) {
    return Response.json({ success: false, error: 'No token' });
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;

  const res = await fetch(verifyUrl, { method: 'POST' });
  const data = await res.json();

  return Response.json({
    success: data.success,
    score: data.score,
  });
}
