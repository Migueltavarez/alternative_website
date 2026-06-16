'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Printer, ChevronRight, CheckCircle, AlertCircle, Droplet, Scissors } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { FILAMENT_COLORS, FILAMENT_TYPES, NOZZLE_SIZES, MACHINE_TYPES, LASER_TYPES } from '@/lib/print-constants';

type MachineType = (typeof MACHINE_TYPES)[number]['value'];

const TYPE_ICONS: Record<MachineType, any> = {
  printer_3d: Printer,
  resin: Droplet,
  laser: Scissors,
};

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

  const [machineType, setMachineType] = useState<MachineType>('printer_3d');
  const [machineName, setMachineName] = useState('');
  const [machineDescription, setMachineDescription] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [filaments, setFilaments] = useState<string[]>([]);
  const [nozzles, setNozzles] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState('');
  const [laserType, setLaserType] = useState<string>('');
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

    if (!machineName.trim()) { setError('Escribe el nombre de tu equipo'); return; }

    if (machineType === 'laser') {
      if (!dimensions.trim()) { setError('Indica las dimensiones de tu máquina láser'); return; }
      if (!laserType) { setError('Selecciona el tipo de láser'); return; }
    } else {
      if (colors.length === 0) { setError('Selecciona al menos un color'); return; }
      if (filaments.length === 0) { setError('Selecciona al menos un tipo de material'); return; }
      if (machineType === 'printer_3d' && nozzles.length === 0) { setError('Selecciona al menos un tamaño de nozzle'); return; }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/workers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineType,
          machineName: machineName.trim(),
          machineDescription: machineDescription || undefined,
          supportedColors: machineType === 'laser' ? [] : colors,
          supportedFilaments: machineType === 'laser' ? [] : filaments,
          supportedNozzles: machineType === 'printer_3d' ? nozzles : [],
          dimensions: machineType === 'laser' ? dimensions.trim() : undefined,
          laserType: machineType === 'laser' ? laserType : undefined,
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
          <p className="text-muted-foreground">Redirigiendo a tu panel...</p>
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
              Configura tu primer equipo para empezar a recibir trabajos. Podrás agregar más equipos desde tu panel.
            </p>

            <div className="glass rounded-2xl p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-sm font-medium mb-2">¿Qué tipo de equipo tienes? <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-3 gap-3">
                    {MACHINE_TYPES.map((t) => {
                      const Icon = TYPE_ICONS[t.value];
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setMachineType(t.value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                            machineType === t.value
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-card border-border hover:border-primary/50'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-medium text-center">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Tu primer equipo</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre del equipo <span className="text-red-400">*</span></label>
                    <input
                      value={machineName}
                      onChange={(e) => setMachineName(e.target.value)}
                      placeholder={machineType === 'laser' ? 'Ej: Cortadora Láser CO2 60W' : 'Ej: Ender 3 Pro, Bambu X1 Carbon, Prusa MK4...'}
                      className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                    <input
                      value={machineDescription}
                      onChange={(e) => setMachineDescription(e.target.value)}
                      placeholder="Características especiales..."
                      className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {machineType === 'laser' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Dimensiones del equipo <span className="text-red-400">*</span></label>
                      <input
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        placeholder="Ej: Área de trabajo 60x90cm"
                        className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo de láser <span className="text-red-400">*</span></label>
                      <div className="flex gap-2">
                        {LASER_TYPES.map((lt) => (
                          <button
                            key={lt}
                            type="button"
                            onClick={() => setLaserType(lt)}
                            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                              laserType === lt
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-card border-border hover:border-primary/50'
                            }`}
                          >
                            {lt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <MultiSelect
                      label="¿Qué colores tienes disponibles? *"
                      options={FILAMENT_COLORS}
                      selected={colors}
                      onChange={setColors}
                    />
                    <MultiSelect
                      label={machineType === 'resin' ? '¿Qué tipos de resina maneja tu máquina? *' : '¿Qué tipos de filamento maneja tu máquina? *'}
                      options={FILAMENT_TYPES}
                      selected={filaments}
                      onChange={setFilaments}
                    />
                    {machineType === 'printer_3d' && (
                      <MultiSelect
                        label="¿Qué tamaños de nozzle tienes? *"
                        options={NOZZLE_SIZES}
                        selected={nozzles}
                        onChange={setNozzles}
                      />
                    )}
                  </>
                )}

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
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">1.</span>Registras tu primer equipo con sus capacidades</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">2.</span>Desde tu panel puedes agregar más equipos o actualizar sus capacidades</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">3.</span>La plataforma asigna trabajos automáticamente al equipo adecuado con menos carga</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">4.</span>Tienes 10 minutos para aceptar cada trabajo; si no respondes, se reasigna</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
