'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { loginSchema, LoginInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const verified = searchParams.get('verified');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      setResendDone(true);
    } finally {
      setResendLoading(false);
    }
  };

  const onSubmit = async (data: LoginInput) => {
    setError('');
    setUnverifiedEmail('');
    setResendDone(false);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!result?.ok) {
        const isNotVerified =
          result?.error === 'EMAIL_NOT_VERIFIED' ||
          result?.error?.includes('EMAIL_NOT_VERIFIED');

        if (isNotVerified) {
          setError('Debes verificar tu correo antes de iniciar sesión.');
          setUnverifiedEmail(data.email);
          return;
        }

        const res = await fetch('/api/auth/resend-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, checkOnly: true }),
        });
        const { unverified } = await res.json();
        if (unverified) {
          setError('Debes verificar tu correo antes de iniciar sesión.');
          setUnverifiedEmail(data.email);
          return;
        }

        setError('Email o contraseña incorrectos');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Algo salió mal. Intenta de nuevo.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold gradient-text">Bienvenido</h1>
          <p className="text-muted-foreground mt-2">Inicia sesión en tu cuenta</p>
        </div>

        {registered && (
          <div className="mb-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
            Cuenta creada. Revisa tu correo y verifica tu cuenta antes de iniciar sesión.
          </div>
        )}

        {verified && (
          <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
            ¡Correo verificado! Ya puedes iniciar sesión.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
              {unverifiedEmail && (
                <div className="mt-2">
                  {resendDone ? (
                    <p className="text-green-400 text-xs">Correo de verificación reenviado. Revisa tu inbox.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="text-xs underline text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      {resendLoading ? 'Enviando...' : 'Reenviar correo de verificación'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="pl-10"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10"
                error={errors.password?.message}
                {...register('password')}
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

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Iniciar sesión
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">¿No tienes cuenta? </span>
          <Link href="/register" className="text-primary hover:underline font-medium">
            Regístrate
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
