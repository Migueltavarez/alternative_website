'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: 'El enlace de verificación no es válido.',
  invalid_token: 'El enlace de verificación no es válido o ya fue usado.',
  expired_token: 'El enlace de verificación expiró. Regístrate de nuevo para recibir uno nuevo.',
};

function VerifyEmailContent() {
  const params = useSearchParams();
  const error = params.get('error');

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center max-w-md mx-auto">
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-14 h-14 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Enlace inválido</h1>
        <p className="text-muted-foreground mb-6">
          {ERROR_MESSAGES[error] || 'Ocurrió un error al verificar tu correo.'}
        </p>
        <Button className="w-full" onClick={() => window.location.href = '/register'}>
          Crear cuenta de nuevo
        </Button>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 text-center max-w-md mx-auto">
      <div className="flex justify-center mb-4">
        <Mail className="w-14 h-14 text-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-3">Verifica tu correo</h1>
      <p className="text-muted-foreground mb-2">
        Te enviamos un correo de verificación. Haz clic en el enlace que te llegó para activar tu cuenta.
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        Si no lo ves, revisa tu carpeta de spam.
      </p>
      <div className="text-sm text-muted-foreground">
        ¿Ya verificaste?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-4">
        <Suspense>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
