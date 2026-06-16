'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: 'El enlace de verificación no es válido.',
  invalid_token: 'El enlace de verificación no es válido o ya fue usado.',
  expired_token: 'El enlace de verificación expiró. Regístrate de nuevo para recibir uno nuevo.',
};

function ResendButton({ email }: { email?: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [inputEmail, setInputEmail] = useState(email || '');

  const handleResend = async () => {
    if (!inputEmail) return;
    setLoading(true);
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputEmail }),
      });
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <p className="text-sm text-green-400">
        Correo de verificación enviado. Revisa tu inbox y carpeta de spam.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!email && (
        <input
          type="email"
          placeholder="tu@email.com"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
        />
      )}
      <Button
        className="w-full"
        onClick={handleResend}
        isLoading={loading}
        disabled={!inputEmail}
      >
        Reenviar correo de verificación
      </Button>
    </div>
  );
}

function VerifyEmailContent() {
  const params = useSearchParams();
  const error = params.get('error');
  const email = params.get('email') || undefined;

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
        <ResendButton email={email} />
        <div className="mt-4">
          <Link href="/register" className="text-sm text-primary hover:underline">
            Crear una cuenta nueva
          </Link>
        </div>
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
        Te enviamos un correo de verificación. Haz clic en el enlace para activar tu cuenta.
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        Si no lo ves, revisa tu carpeta de spam.
      </p>
      <ResendButton email={email} />
      <div className="mt-4 text-sm text-muted-foreground">
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
