// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 🔧 Редирект на правильный путь /login
    const response = NextResponse.redirect(new URL('/login', request.url));

    // Очищаем cookies
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('next-auth.callback-url');

    return response;
  } catch (error) {
    console.error('Error in logout API:', error);
    return NextResponse.redirect(new URL('/login', request.url)); // 🔧 /login
  }
}
