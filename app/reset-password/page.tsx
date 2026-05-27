'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Enlace inválido. Solicita uno nuevo.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al restablecer la contraseña');

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
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
            <div className="glass rounded-2xl p-8">
              {success ? (
                <div className="text-center">
                  <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Contraseña restablecida</h2>
                  <p className="text-muted-foreground text-sm">
                    Tu contraseña fue actualizada. Redirigiendo al inicio de sesión...
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-7 h-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Nueva contraseña</h1>
                    <p className="text-muted-foreground text-sm mt-2">
                      Crea una contraseña segura para tu cuenta.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-400 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                        {!token && (
                          <Link href="/forgot-password" className="underline ml-1">
                            Solicitar nuevo enlace
                          </Link>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          required
                          disabled={!token}
                          className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Confirmar contraseña</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          placeholder="Repite tu contraseña"
                          required
                          disabled={!token}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" isLoading={loading} disabled={!token}>
                      Restablecer contraseña
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
