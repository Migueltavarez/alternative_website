import { Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { LoginForm } from '@/components/auth/login-form';

function LoadingForm() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass rounded-2xl p-8 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/2 mx-auto mb-8" />
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-4">
        <Suspense fallback={<LoadingForm />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
