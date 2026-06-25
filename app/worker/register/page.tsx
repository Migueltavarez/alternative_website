'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer, ChevronRight, CheckCircle, AlertCircle, Droplet, Scissors,
  Shield, Clock, Globe, FileCheck,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { FILAMENT_COLORS, FILAMENT_TYPES, NOZZLE_SIZES, MACHINE_TYPES, LASER_TYPES } from '@/lib/print-constants';

type MachineType = (typeof MACHINE_TYPES)[number]['value'];

const TYPE_ICONS: Record<MachineType, any> = {
  printer_3d: Printer,
  resin: Droplet,
  laser: Scissors,
};

const CONTRACT_CLAUSES = [
  {
    num: '01', title: 'Objeto del contrato',
    body: 'Este acuerdo establece los términos bajo los cuales el Maker se integra a la red de colaboradores de Alternative 3D Studio para recibir y ejecutar trabajos de fabricación digital asignados por la plataforma.',
  },
  {
    num: '02', title: 'Naturaleza de la relación',
    body: 'La relación es comercial independiente. No constituye relación laboral, societaria ni de agencia. El Maker opera con sus propios medios y responde por sus propias obligaciones fiscales.',
  },
  {
    num: '03', title: 'Obligaciones del Maker',
    bullets: [
      'Ejecutar los trabajos conforme a las especificaciones técnicas entregadas.',
      'Responder la asignación dentro de los 10 minutos establecidos.',
      'Mantener equipos operativos y perfil actualizado en la plataforma.',
      'No contactar clientes finales con fines comerciales propios.',
      'No subcontratar trabajos sin autorización previa de Alt3D.',
    ],
  },
  {
    num: '04', title: 'Confidencialidad',
    body: 'El Maker se compromete a mantener estricta confidencialidad sobre datos de clientes, archivos de diseño, tarifas y procesos internos de Alt3D — tanto durante la vigencia del contrato como por dos (2) años posteriores a su terminación.',
  },
  {
    num: '05', title: 'Propiedad intelectual',
    body: 'Los archivos y diseños entregados son propiedad de Alt3D y/o sus clientes. El Maker recibe una licencia de uso limitada únicamente para ejecutar el trabajo asignado. No podrá reproducir, distribuir ni utilizar los diseños para fines propios.',
  },
  {
    num: '06', title: 'Compensación económica',
    body: 'Alt3D abonará al Maker la compensación acordada por cada trabajo completado satisfactoriamente, en los ciclos de pago establecidos. El Maker es responsable de sus propias obligaciones fiscales.',
  },
  {
    num: '07', title: 'Calidad y garantías',
    body: 'El Maker garantiza que las piezas cumplirán las especificaciones de cada orden. En caso de defecto, deberá rehacerlas sin costo adicional. Un desempeño persistentemente bajo puede resultar en suspensión de cuenta.',
  },
  {
    num: '08', title: 'Vigencia y terminación',
    body: 'Vigencia indefinida desde el registro. Cualquiera de las partes puede terminar con 15 días de aviso. Alt3D puede terminar de inmediato por incumplimiento grave de confidencialidad, fraude o tres incumplimientos consecutivos.',
  },
  {
    num: '09–12', title: 'Datos personales, responsabilidad y legislación',
    body: 'Los datos del Maker se tratarán conforme a la Política de Privacidad de Alt3D. El contrato se rige por las leyes de la República Dominicana. Controversias se resolverán por mediación amistosa; de no resolverse, ante los tribunales del Distrito Nacional.',
  },
];

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

// ─── Contract step ─────────────────────────────────────────────────────────
function ContractStep({ onAccepted }: { onAccepted: () => void }) {
  const contractRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [checks, setChecks] = useState({ confidential: false, ip: false, age: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allChecked = hasScrolled && Object.values(checks).every(Boolean);
  const checkedCount = Object.values(checks).filter(Boolean).length;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) setHasScrolled(true);
  };

  const handleAccept = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/workers/contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted: true }),
      });
      if (!res.ok) throw new Error('Error al registrar la aceptación');
      onAccepted();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20 px-6 py-5">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Paso final del registro — Maker</span>
        </div>
        <h2 className="text-lg font-bold mb-1">Contrato de Confidencialidad y Colaboración</h2>
        <p className="text-sm text-muted-foreground">Lee el contrato completo y confirma cada punto para activar tu cuenta.</p>
        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(checkedCount / 3) * 100}%` }}
          />
        </div>
        {checkedCount > 0 && (
          <p className="text-xs text-primary mt-1.5">{checkedCount} de 3 confirmaciones</p>
        )}
      </div>

      {/* Info bar */}
      <div className="flex flex-wrap gap-4 px-6 py-3 bg-card border-b border-border text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Alternative 3D Studio</span>
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />República Dominicana</span>
      </div>

      {/* Contract text */}
      <div className="px-6 pt-4 pb-2">
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider">Contrato Maker v1.0 — 2025</span>
            {!hasScrolled
              ? <span className="text-xs text-muted-foreground italic">↓ Desplázate para leer todo</span>
              : <span className="text-xs text-green-400 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" />Leído</span>
            }
          </div>
          <div
            ref={contractRef}
            onScroll={handleScroll}
            className="max-h-64 overflow-y-auto p-4 space-y-4 text-sm leading-relaxed text-foreground/80"
          >
            {CONTRACT_CLAUSES.map((c) => (
              <div key={c.num}>
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1.5">
                  Cláusula {c.num} — {c.title}
                </p>
                {c.body && <p>{c.body}</p>}
                {c.bullets && (
                  <ul className="mt-1 space-y-1 pl-2">
                    {c.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary shrink-0 mt-0.5">›</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <p className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
              Versión completa disponible en /legal/confidencialidad
            </p>
          </div>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="px-6 py-4 space-y-3 border-t border-border bg-card/50">
        {[
          {
            key: 'confidential' as const,
            text: <>He leído y acepto las cláusulas de <strong>confidencialidad</strong> y me comprometo a no divulgar información de Alt3D ni de sus clientes.</>,
          },
          {
            key: 'ip' as const,
            text: <>Entiendo que los <strong>archivos de diseño</strong> son propiedad de Alt3D y/o sus clientes, y los usaré únicamente para ejecutar los trabajos asignados.</>,
          },
          {
            key: 'age' as const,
            text: <>Confirmo que soy <strong>mayor de edad</strong>, que mi información es verídica y acepto en su totalidad los términos del contrato.</>,
          },
        ].map(({ key, text }) => (
          <label
            key={key}
            className={`flex items-start gap-3 cursor-pointer select-none transition-opacity ${!hasScrolled ? 'opacity-40 pointer-events-none' : ''}`}
          >
            <div
              onClick={() => setChecks((prev) => ({ ...prev, [key]: !prev[key] }))}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all ${
                checks[key] ? 'bg-primary border-primary' : 'border-border bg-card'
              }`}
            >
              {checks[key] && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm leading-snug text-foreground/80">{text}</span>
          </label>
        ))}

        {!hasScrolled && (
          <p className="text-center text-xs text-muted-foreground italic pt-1">
            Lee el contrato completo para habilitar las confirmaciones
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border flex gap-3 justify-end bg-card">
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1 mr-auto">
            <AlertCircle className="w-3.5 h-3.5" />{error}
          </p>
        )}
        <Button
          disabled={!allChecked || loading}
          isLoading={loading}
          onClick={handleAccept}
          className="gap-2"
        >
          {!loading && <FileCheck className="w-4 h-4" />}
          {allChecked ? 'Firmar y continuar' : 'Completa todos los pasos'}
        </Button>
      </div>
    </div>
  );
}

// ─── Machine registration step ─────────────────────────────────────────────
export default function WorkerRegisterPage() {
  const { status, update } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<'contract' | 'machine'>('contract');

  // Machine form state
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
            {/* Step indicators */}
            <div className="flex items-center gap-3 mb-8">
              {(['contract', 'machine'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 text-sm font-medium ${step === s || (s === 'contract' && step === 'machine') ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      (s === 'contract' && step === 'machine') ? 'bg-primary border-primary text-primary-foreground'
                        : step === s ? 'border-primary text-primary'
                        : 'border-border text-muted-foreground'
                    }`}>
                      {s === 'contract' && step === 'machine' ? '✓' : i + 1}
                    </div>
                    {s === 'contract' ? 'Contrato' : 'Tu equipo'}
                  </div>
                  {i === 0 && <div className={`flex-1 h-px w-10 ${step === 'machine' ? 'bg-primary' : 'bg-border'}`} />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 'contract' ? (
                <motion.div key="contract" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <ContractStep onAccepted={() => setStep('machine')} />
                </motion.div>
              ) : (
                <motion.div key="machine" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Printer className="w-5 h-5 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Registra tu primer equipo</h1>
                  </div>
                  <p className="text-muted-foreground mb-6 ml-[52px]">
                    Podrás agregar más equipos desde tu panel en cualquier momento.
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
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Detalles del equipo</h3>
                        <div>
                          <label className="block text-sm font-medium mb-1">Nombre del equipo <span className="text-red-400">*</span></label>
                          <input
                            value={machineName}
                            onChange={(e) => setMachineName(e.target.value)}
                            placeholder={machineType === 'laser' ? 'Ej: Cortadora Láser CO2 60W' : 'Ej: Ender 3 Pro, Bambu X1 Carbon...'}
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
                            label="Colores disponibles *"
                            options={FILAMENT_COLORS}
                            selected={colors}
                            onChange={setColors}
                          />
                          <MultiSelect
                            label={machineType === 'resin' ? 'Tipos de resina *' : 'Tipos de filamento *'}
                            options={FILAMENT_TYPES}
                            selected={filaments}
                            onChange={setFilaments}
                          />
                          {machineType === 'printer_3d' && (
                            <MultiSelect
                              label="Tamaños de nozzle disponibles *"
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
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
