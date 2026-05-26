'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Printer } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { WorkerDashboard } from '@/components/worker-dashboard';
import { Button } from '@/components/ui/button';

export default function WorkerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      checkWorkerProfile();
    }
  }, [status]);

  const checkWorkerProfile = async () => {
    try {
      const res = await fetch('/api/workers/profile');
      const data = await res.json();
      setHasProfile(!!data.profile);
    } catch {
      setHasProfile(false);
    }
  };

  if (status === 'loading' || hasProfile === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-lg mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Printer className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Panel de Makers</h1>
              <p className="text-muted-foreground mb-8">
                Aún no estás registrado como maker. Regístrate para empezar a recibir
                trabajos de impresión 3D y poner tu máquina a trabajar.
              </p>
              <Button onClick={() => router.push('/worker/register')} className="px-8">
                Registrarme como Maker
              </Button>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Printer className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Panel del Maker</h1>
                <p className="text-muted-foreground text-sm">
                  {session?.user?.name ?? session?.user?.email}
                </p>
              </div>
            </div>
          </motion.div>

          <WorkerDashboard />
        </div>
      </main>
    </div>
  );
}
