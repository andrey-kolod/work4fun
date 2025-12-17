// src/app/(auth)/layout.tsx

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Work4Fun</h1>
          <p className="text-text-secondary">Система управления проектами и задачами</p>
        </div>
        {children}
      </div>
    </div>
  );
}
