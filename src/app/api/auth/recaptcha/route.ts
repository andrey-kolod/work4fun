// src/app/api/auth/recaptcha/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchApi } from '@/lib/api-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token } = body as { token?: string };

    if (!token || typeof token !== 'string' || token.trim() === '') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚨 [API /auth/recaptcha] Отсутствует или пустой токен reCAPTCHA');
      }
      return NextResponse.json(
        { success: false, error: 'Токен reCAPTCHA обязателен' },
        { status: 400 }
      );
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
    if (!secret) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 [API /auth/recaptcha] RECAPTCHA_SECRET_KEY не задан или пустой в .env');
      }
      return NextResponse.json(
        { success: false, error: 'Серверная ошибка конфигурации' },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [API /auth/recaptcha] Проверка токена (длина: ${token.length} символов)`);
    }

    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const verifyBody = new URLSearchParams({
      secret,
      response: token.trim(),
    });

    const res = await fetchApi(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyBody,
    });

    if (!res.ok) {
      if (process.env.NODE_ENV === 'development') {
        const text = await res.text().catch(() => '');
        console.error(
          `🚨 [API /auth/recaptcha] Google вернул ошибку: ${res.status} ${res.statusText}`,
          text
        );
      }
      return NextResponse.json(
        { success: false, error: 'Ошибка связи с сервисом reCAPTCHA' },
        { status: 502 }
      );
    }

    let data: any;
    try {
      data = await res.json();
    } catch (parseError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 [API /auth/recaptcha] Не удалось распарсить JSON от Google:', parseError);
      }
      return NextResponse.json(
        { success: false, error: 'Некорректный ответ от reCAPTCHA' },
        { status: 502 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ [API /auth/recaptcha] Ответ Google: success=${data.success}, score=${data.score}`
      );
      if (data['error-codes']?.length > 0) {
        console.warn('⚠️ [API /auth/recaptcha] Ошибки от Google:', data['error-codes']);
      }
    }

    return NextResponse.json({
      success: !!data.success,
      score: typeof data.score === 'number' ? data.score : 0,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('💥 [API /auth/recaptcha] Неожиданная ошибка:', error);
    }
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
