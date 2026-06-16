'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserCircle } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { AddressForm, AddressFormValues } from '@/components/address-form';

export default function CompleteProfilePage() {
  const { update } = useSession();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [cedula, setCedula] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'data' | 'address'>('data');
  const [profileLoading, setProfileLoading] = useState(false);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || !cedula || !birthDate) {
      setError('Todos los campos son requeridos');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, cedula, birthDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar tus datos');

      setStep('address');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmitAddress = async (values: AddressFormValues) => {
    const res = await fetch('/api/user/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar la dirección');

    await update({ refreshProfile: true });
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-4">
        <div className="glass rounded-2xl p-8 max-w-lg mx-auto">
          <div className="flex justify-center mb-4">
            <UserCircle className="w-14 h-14 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Completa tu perfil</h1>
          <p className="text-muted-foreground text-center text-sm mb-8">
            Necesitamos algunos datos antes de continuar para poder gestionar tus envíos y pagos correctamente.
          </p>

          {step === 'data' ? (
            <form onSubmit={handleSubmitProfile} className="space-y-4">
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Número de teléfono <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="809-000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Cédula <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="000-0000000-0"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Fecha de nacimiento <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
                  required
                />
              </div>

              <Button type="submit" className="w-full" isLoading={profileLoading}>
                Continuar
              </Button>
            </form>
          ) : (
            <div>
              <p className="text-sm font-medium mb-4">Agrega tu dirección de envío</p>
              <AddressForm onSubmit={handleSubmitAddress} submitLabel="Finalizar" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
