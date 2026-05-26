'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Printer, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { FILAMENT_COLORS, FILAMENT_TYPES, NOZZLE_SIZES } from '@/lib/print-constants';

function MultiSelect({
  label, options, selected, onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              selected.includes(opt)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1">{selected.length} seleccionado(s)</p>
      )}
    </div>
  );
}

export default function WorkerRegisterPage() {
  const { status, update } = useSession();
  const router = useRouter();

  const [machineName, setMachineName] = useState('');
  const [machineDescription, setMachineDescription] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [filaments, setFilaments] = useState<string[]>([]);
  const [nozzles, setNozzles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!machineName.trim()) { setError('Escribe el nombre de tu máquina'); return; }
    if (colors.length === 0) { setError('Selecciona al menos un color'); return; }
    if (filaments.length === 0) { setError('Selecciona al menos un tipo de filamento'); return; }
    if (nozzles.length === 0) { setError('Selecciona al menos un tamaño de nozzle'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/workers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineName: machineName.trim(),
          machineDescription: machineDescription || undefined,
          supportedColors: colors,
          supportedFilaments: filaments,
          supportedNozzles: nozzles,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar');

      await update({ refreshRole: true });
      setSuccess(true);
      setTimeout(() => { window.location.href = '/worker'; }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">¡Bienvenido al equipo!</h2>
          <p className="text-muted-foreground">Redirigiendo a tu panel de maker...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Printer className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Regístrate como Maker</h1>
            </div>
            <p className="text-muted-foreground mb-8 ml-[52px]">
              Configura tu primera máquina para empezar a recibir trabajos. Podrás agregar más máquinas desde tu panel.
            </p>

            <div className="glass rounded-2xl p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Tu primera máquina</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre de la máquina <span className="text-red-400">*</span></label>
                    <input
                      value={machineName}
                      onChange={(e) => setMachineName(e.target.value)}
                      placeholder="Ej: Ender 3 Pro, Bambu X1 Carbon, Prusa MK4..."
                      className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                    <input
                      value={machineDescription}
                      onChange={(e) => setMachineDescription(e.target.value)}
                      placeholder="Volumen de impresión, características especiales..."
                      className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <MultiSelect
                  label="¿Qué colores de filamento tienes disponibles? *"
                  options={FILAMENT_COLORS}
                  selected={colors}
                  onChange={setColors}
                />
                <MultiSelect
                  label="¿Qué tipos de filamento maneja tu máquina? *"
                  options={FILAMENT_TYPES}
                  selected={filaments}
                  onChange={setFilaments}
                />
                <MultiSelect
                  label="¿Qué tamaños de nozzle tienes? *"
                  options={NOZZLE_SIZES}
                  selected={nozzles}
                  onChange={setNozzles}
                />

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading} isLoading={loading}>
                  {!loading && <ChevronRight className="w-4 h-4 mr-2" />}
                  Completar registro
                </Button>
              </form>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-card border border-border">
              <h3 className="font-medium mb-2 text-sm">¿Cómo funciona?</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">1.</span>Registras tu primera máquina con sus capacidades de materiales</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">2.</span>Desde tu panel puedes agregar más máquinas o actualizar sus materiales disponibles</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">3.</span>La plataforma asigna trabajos automáticamente a la máquina con menos carga</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">4.</span>Tienes 10 minutos para aceptar cada trabajo; si no respondes, se reasigna</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
