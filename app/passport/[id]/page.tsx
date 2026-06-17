import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import {
  QMS_STAGES, QMS_STAGE_LABELS, PHOTO_CATEGORIES,
  DEFECT_TYPES, getQcClassification,
  type QualityScoreData,
} from '@/lib/qms-constants';
import { SERVICE_TYPES } from '@/lib/print-constants';
import type { Metadata } from 'next';

function parseJson<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

function serviceLabel(id: string) {
  return SERVICE_TYPES.find(s => s.id === id)?.label ?? id;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await prisma.printJob.findUnique({ where: { id: params.id }, select: { fileName: true } });
  return { title: job ? `Pasaporte de Calidad — ${job.fileName}` : 'Pasaporte de Calidad', robots: 'noindex' };
}

export default async function PassportPage({ params }: { params: { id: string } }) {
  const job = await prisma.printJob.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      qualityInspection: true,
      qualityPhotos: { orderBy: { createdAt: 'asc' } },
      productionLogs: { orderBy: { createdAt: 'asc' } },
      assignedWorker: { select: { name: true } },
    },
  });

  if (!job || !job.qmsStage) notFound();

  const qcData = parseJson<Partial<QualityScoreData>>(job.qualityInspection?.qualityScore, {});
  const hasScore = qcData.total !== undefined;
  const { label: classLabel, color: classColor } = hasScore ? getQcClassification(qcData.total!) : { label: 'Pendiente', color: 'text-muted-foreground' };

  const stageInfo = QMS_STAGE_LABELS[job.qmsStage];
  const productionLog = job.productionLogs;
  const photos = job.qualityPhotos;

  // Guarantee period by service
  const guaranteeByService: Record<string, string> = {
    print_3d: '30 días contra defectos de impresión',
    resin: '30 días contra defectos de impresión',
    laser: '15 días contra defectos de grabado',
    design: 'Revisiones incluidas por 15 días',
    plans: 'Sin garantía (producto digital)',
  };
  const guarantee = guaranteeByService[job.serviceType ?? ''] ?? '30 días';

  const careByService: Record<string, string[]> = {
    print_3d: ['Evitar exposición directa al sol por períodos prolongados', 'No exponer a temperaturas superiores a 60°C', 'Limpiar con paño húmedo suave', 'Evitar golpes fuertes en zonas delgadas'],
    resin: ['Evitar exposición directa al sol — puede amarillear', 'No exponer a calor excesivo', 'Limpiar con alcohol isopropílico', 'Manipular con cuidado en piezas pequeñas'],
    laser: ['Limpiar con paño seco', 'Evitar humedad prolongada en madera', 'Aplicar aceite de limón en madera si se siente seco', 'Conservar lejos del calor directo'],
    design: ['Archivo digital — respalda en múltiples ubicaciones'],
    plans: ['Conservar en lugar seco y plano', 'Evitar luz solar directa por tiempo prolongado'],
  };
  const careInstructions = careByService[job.serviceType ?? ''] ?? [];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-foreground">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-primary">ALT 3D STUDIO</p>
              <p className="text-[10px] text-muted-foreground">Pasaporte de Calidad</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Pedido</p>
            <p className="text-xs font-mono font-bold text-primary/80">#{params.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Status banner */}
        {stageInfo && (
          <div className={`rounded-2xl border p-4 text-center ${stageInfo.color.includes('emerald') || stageInfo.color.includes('green') || stageInfo.color.includes('purple')
            ? 'border-green-500/20 bg-green-500/5' : 'border-primary/20 bg-primary/5'}`}>
            <p className={`text-sm font-bold ${stageInfo.color.split(' ')[1] ?? 'text-primary'}`}>{stageInfo.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Estado actual del pedido</p>
          </div>
        )}

        {/* Job info card */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Información del Pedido</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Archivo', value: job.fileName },
              { label: 'Servicio', value: serviceLabel(job.serviceType ?? '') },
              { label: 'Fecha de creación', value: new Date(job.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) },
              { label: 'Operador asignado', value: job.assignedWorker?.name ?? 'No asignado' },
              ...(job.deliveredAt ? [{ label: 'Fecha de entrega', value: new Date(job.deliveredAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) }] : []),
              { label: 'Cliente', value: job.user.name ?? job.user.email },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-sm font-medium truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Score */}
        {hasScore && (
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Puntuación de Calidad</h2>
            <div className="flex items-center gap-6 mb-5">
              <div className="text-center">
                <p className="text-5xl font-black">{qcData.total}</p>
                <p className="text-xs text-muted-foreground">/ 100 puntos</p>
              </div>
              <div>
                <p className={`text-xl font-bold ${classColor}`}>{classLabel}</p>
                {qcData.inspectedBy && <p className="text-xs text-muted-foreground mt-0.5">Inspeccionado por {qcData.inspectedBy}</p>}
                {qcData.inspectedAt && <p className="text-xs text-muted-foreground">{new Date(qcData.inspectedAt).toLocaleDateString('es-ES')}</p>}
              </div>
            </div>
            <div className="space-y-2.5">
              {([
                ['dimensions', 'Dimensiones'],
                ['finish', 'Acabado superficial'],
                ['color', 'Color / Apariencia'],
                ['resistance', 'Resistencia / Estructura'],
                ['packaging', 'Empaque'],
              ] as [keyof NonNullable<QualityScoreData['scores']>, string][]).map(([key, lbl]) => {
                const val = (qcData.scores as any)?.[key] ?? 0;
                const pct = (val / 20) * 100;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{lbl}</span>
                      <span className="font-semibold">{val}/20</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct >= 85 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Photos gallery */}
        {photos.length > 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Galería de Evidencias</h2>
            {PHOTO_CATEGORIES.map(cat => {
              const catPhotos = photos.filter(p => p.category === cat.key);
              if (!catPhotos.length) return null;
              return (
                <div key={cat.key} className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{cat.label}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {catPhotos.map(p => (
                      <a key={p.id} href={`/api/download${p.fileUrl}`} target="_blank" rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden border border-white/5 hover:border-primary/30 transition-all group">
                        <img src={`/api/download${p.fileUrl}`} alt={p.caption ?? cat.label}
                          className="w-full h-full object-cover group-hover:opacity-90 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Production timeline */}
        {productionLog.length > 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Historial de Producción</h2>
            <div className="relative">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-white/5" />
              <div className="space-y-3">
                {productionLog.map((log, i) => {
                  const si = QMS_STAGE_LABELS[log.toStage ?? log.stage];
                  return (
                    <div key={log.id} className="pl-8 relative">
                      <div className={`absolute left-0 w-6 h-6 rounded-full border flex items-center justify-center text-[9px] ${
                        i === productionLog.length - 1 ? 'border-primary/50 bg-primary/10' : 'border-white/10 bg-white/3'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium">{log.action}</p>
                          {si && <span className={`text-[9px] px-1.5 py-0.5 rounded-full border inline-block mt-0.5 ${si.color}`}>{si.label}</span>}
                          {log.comment && <p className="text-[10px] text-muted-foreground mt-1 italic">{log.comment}</p>}
                        </div>
                        <p className="text-[10px] text-muted-foreground shrink-0 text-right">
                          {new Date(log.createdAt).toLocaleDateString('es-ES')}<br />
                          {new Date(log.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Guarantee & Care */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Garantía</h2>
            <p className="text-sm font-medium text-green-400">{guarantee}</p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              La garantía cubre defectos originados durante el proceso de fabricación. No aplica para daños causados por mal uso, alteraciones o impactos físicos.
            </p>
          </div>
          {careInstructions.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Instrucciones de Cuidado</h2>
              <ul className="space-y-1.5">
                {careInstructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                    {inst}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-xs text-muted-foreground">ALT 3D Studio · República Dominicana</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">Pasaporte #{params.id.slice(-8).toUpperCase()} · Generado el {new Date().toLocaleDateString('es-ES')}</p>
        </div>
      </main>
    </div>
  );
}
