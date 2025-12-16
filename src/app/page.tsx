// src/app/page.tsx

'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { CheckCircle, Users, BarChart, Bell, Shield, Zap } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <CheckCircle className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Управление задачами',
      description: 'Kanban доски, приоритеты, дедлайны и полный контроль над рабочими процессами.',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      icon: <Users className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Командная работа',
      description: 'Делегирование, обсуждения, упоминания и эффективная коллаборация.',
      color: 'text-accent',
      bgColor: 'bg-primary-50',
    },
    {
      icon: <BarChart className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Аналитика проектов',
      description: 'Дашборды, отчеты и метрики для отслеживания прогресса и производительности.',
      color: 'text-success',
      bgColor: 'bg-green-50',
    },
    {
      icon: <Bell className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Умные уведомления',
      description: 'Email, Telegram и in-app уведомления с гибкими настройками.',
      color: 'text-warning',
      bgColor: 'bg-amber-50',
    },
    {
      icon: <Shield className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Безопасность и контроль',
      description: 'Ролевая модель доступа, аудит действий и защита данных.',
      color: 'text-error',
      bgColor: 'bg-red-50',
    },
    {
      icon: <Zap className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Интеграции',
      description: 'API для подключения внешних систем и автоматизации процессов.',
      color: 'text-primary-700',
      bgColor: 'bg-primary-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-12 md:pt-20 pb-10 md:pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-medium mb-6 md:mb-8">
            <span className="text-sm md:text-base">Современное решение для команд</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 md:mb-8">
            Управляйте проектами
            <span className="block text-primary-600 mt-2 md:mt-3">с удовольствием</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-12 max-w-2xl mx-auto px-2">
            Work4Fun — это современная система управления задачами, которая превращает сложные
            проекты в простые рабочие процессы.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 md:gap-4 justify-center items-center">
            <Link href="/login">
              <Button
                size="lg"
                variant="primary"
                className="w-full sm:w-[140px] md:w-[150px] shadow-lg hover:shadow-xl"
              >
                Вход
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="register"
                className="w-full sm:w-[140px] md:w-[150px] hover:bg-gradient-to-r hover:from-primary-100 hover:to-primary-200"
              >
                Регистрация
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="text-center mb-4 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
            Все для эффективной работы команды
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2 mb-3 md:mb-0">
            От простых задач до сложных проектов — все инструменты в одном месте
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-4 md:p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-200 hover:border-primary-200"
            >
              <div className="flex items-start md:flex-col md:items-center gap-4 md:gap-0">
                <div
                  className={`${feature.bgColor} flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center mb-0 md:mb-4`}
                >
                  <div className={feature.color}>{feature.icon}</div>
                </div>
                <div className="flex-1 md:text-center">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section*/}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 mt-6 md:mt-20">
        <div className="container mx-auto px-4 py-10 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6">
            Готовы оптимизировать рабочие процессы?
          </h2>
          <p className="text-base md:text-xl text-primary-100 mb-6 md:mb-8 max-w-2xl mx-auto px-2">
            Присоединяйтесь к тысячам команд, которые уже используют Work4Fun
          </p>
          <Link href="/demo-request">
            <Button size="lg" variant="cta-light" className="border hover:border-white">
              Запросить демо
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-5 md:py-8 text-center">
        <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-1 md:gap-2">
          <p className="text-gray-500 text-xs md:text-sm">Work4Fun © 2025</p>
          <span className="hidden md:inline mx-1">•</span>
          <p className="text-gray-500 text-xs md:text-sm mb-2 md:mb-0">
            Современное решение для управления проектами
          </p>
        </div>

        {/* Ссылки в футере */}
        <div className="text-xs text-gray-400 mt-2 md:mt-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors py-0.5 sm:py-0">
              Политика конфиденциальности
            </Link>
            <span className="hidden sm:inline mx-2">•</span>
            <Link href="/terms" className="hover:text-gray-600 transition-colors py-0.5 sm:py-0">
              Условия использования
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
