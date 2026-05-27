'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar el correo');

      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>

            <div className="glass rounded-2xl p-8">
              {sent ? (
                <div className="text-center">
                  <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Correo enviado</h2>
                  <p className="text-muted-foreground text-sm">
                    Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para
                    restablecer tu contraseña. Revisa también tu carpeta de spam.
                  </p>
                  <Link href="/login">
                    <Button className="mt-6 w-full">Volver al inicio de sesión</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-7 h-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">¿Olvidaste tu contraseña?</h1>
                    <p className="text-muted-foreground text-sm mt-2">
                      Ingresa tu email y te enviaremos un enlace para restablecerla.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-400 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" isLoading={loading}>
                      Enviar enlace de recuperación
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
