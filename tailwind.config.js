// tailwind.config.js
// Конфигурация Tailwind CSS для DirectWorkflow
// Должен использовать CommonJS синтаксис (module.exports)

/** @type {import('tailwindcss').Config} */
module.exports = {
  // content: пути к файлам где используются классы Tailwind
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // theme: настройки темы Tailwind
  theme: {
    extend: {
      // colors: кастомные цвета для DirectWorkflow
      colors: {
        // Primary colors - основная лиловая палитра
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          DEFAULT: '#a855f7', // Добавляем DEFAULT цвет
          dark: '#9333ea', // Добавляем темный вариант
        },
        // Secondary colors - серая палитра
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Акцентные цвета
        accent: '#c4b5fd',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        // Добавляем цвета для surface и text
        surface: '#ffffff',
        text: {
          primary: '#1f2937',
          secondary: '#6b7280',
        },
      },

      // Анимации
      animation: {
        'gentle-pulse': 'gentle-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'gentle-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },

  // plugins: дополнительные плагины Tailwind
  plugins: [require('@tailwindcss/typography')],
};
