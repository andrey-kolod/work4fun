// src/app/page.tsx

import Link from 'next/link';

export const metadata = {
  title: 'Work4Fun - Современная система управления задачами',
  description:
    'Эффективное делегирование, умные уведомления и полный контроль над проектами для команд любого размера.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-primary-600 mb-6">Work4Fun</h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Современная система управления задачами для команд любого размера. Эффективное
            делегирование, умные уведомления и полный контроль над проектами.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/login"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Перейти на страницу входа в систему"
            >
              Войти в систему
            </Link>

            <Link
              href="/auth/register"
              className="border border-primary-600 text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Перейти на страницу регистрации"
            >
              Зарегистрироваться
            </Link>
          </div>
        </div>

        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <article className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="text-3xl mb-4">🎯</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Управление задачами</h2>
            <p className="text-gray-600 leading-relaxed">
              Kanban доски, приоритеты, дедлайны и полный контроль над рабочими процессами.
              Назначайте, отслеживайте и завершайте задачи эффективно.
            </p>
          </article>

          <article className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="text-3xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Командная работа</h2>
            <p className="text-gray-600 leading-relaxed">
              Делегирование, обсуждения, упоминания и эффективная коллаборация. Работайте вместе над
              проектами в реальном времени.
            </p>
          </article>

          <article className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="text-3xl mb-4">🔔</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Умные уведомления</h2>
            <p className="text-gray-600 leading-relaxed">
              Email, Telegram и in-app уведомления с гибкими настройками получения. Оставайтесь в
              курсе важных событий.
            </p>
          </article>
        </section>

        <footer className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Work4Fun © 2025 • Современное решение для управления проектами
          </p>
        </footer>
      </div>
    </div>
  );
}
