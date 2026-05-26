'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X, Clock, Printer, CheckCircle, Circle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUpload } from './file-upload';
import { FILAMENT_COLORS, FILAMENT_TYPES, DELIVERY_TIMES, JOB_STATUS_LABELS, MODEL_ISSUES } from '@/lib/print-constants';

interface PrintJob {
  id: string;
  fileName: string;
  fileUrl: string;
  creditsCost: number;
  status: string;
  notes?: string;
  color?: string;
  filamentType?: string;
  deliveryTime?: string;
  createdAt: string;
  assignedAt?: string;
  makerFeedback?: string | null;
}

interface MyModelsProps {
  printJobs: PrintJob[];
  onRefresh: () => void;
}

export function MyModels({ printJobs, onRefresh }: MyModelsProps) {
  const [showForm, setShowForm] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    fileUrl: string;
    fileSize?: number;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('');
  const [filamentType, setFilamentType] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('standard');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFileUploaded = (fileName: string, fileUrl: string, fileSize?: number) => {
    setUploadedFile({ fileName, fileUrl, fileSize });
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFile) {
      setError('Sube un archivo primero');
      return;
    }
    if (!color) {
      setError('Selecciona el color del filamento');
      return;
    }
    if (!filamentType) {
      setError('Selecciona el tipo de filamento');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/print-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadedFile.fileName,
          fileUrl: uploadedFile.fileUrl,
          fileSize: uploadedFile.fileSize,
          notes: notes || undefined,
          color,
          filamentType,
          deliveryTime,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al guardar el modelo');
      }

      setUploadedFile(null);
      setNotes('');
      setColor('');
      setFilamentType('');
      setDeliveryTime('standard');
      setShowForm(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelUpload = () => {
    setUploadedFile(null);
    setIsUploading(false);
  };

  const getDeliveryLabel = (value: string) => {
    return DELIVERY_TIMES.find((d) => d.value === value)?.label ?? value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Mis Trabajos de Impresión</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Upload className="w-4 h-4 mr-2" />
          Solicitar Impresión
        </Button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Nueva solicitud de impresión</h3>
            <button
              onClick={() => {
                setShowForm(false);
                setUploadedFile(null);
                setNotes('');
                setColor('');
                setFilamentType('');
                setDeliveryTime('standard');
              }}
              className="p-1 hover:bg-accent rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Archivo 3D</label>
              {!uploadedFile ? (
                <FileUpload onUploadComplete={handleFileUploaded} isUploading={isUploading} />
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <File className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-500">{uploadedFile.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {uploadedFile.fileSize && `${uploadedFile.fileSize.toFixed(2)} MB`}
                    </p>
                  </div>
                  <button type="button" onClick={cancelUpload} className="p-2 hover:bg-accent rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Color del filamento <span className="text-red-400">*</span>
                </label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecciona un color</option>
                  {FILAMENT_COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo de filamento <span className="text-red-400">*</span>
                </label>
                <select
                  value={filamentType}
                  onChange={(e) => setFilamentType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecciona el material</option>
                  {FILAMENT_TYPES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tiempo de entrega <span className="text-red-400">*</span>
              </label>
              <select
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {DELIVERY_TIMES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notas adicionales (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escala, detalles específicos, instrucciones especiales..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" disabled={!uploadedFile || isUploading || submitting} className="w-full">
              {submitting ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-pulse" />
                  Enviando solicitud...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 mr-2" />
                  Enviar a la Cola de Impresión
                </>
              )}
            </Button>
          </form>
        </motion.div>
      )}

      {printJobs.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <Printer className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No tienes trabajos de impresión</h3>
          <p className="text-sm text-muted-foreground">
            Sube tu modelo 3D y lo asignaremos a un maker disponible
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {printJobs.map((job) => {
            const statusInfo = JOB_STATUS_LABELS[job.status] ?? JOB_STATUS_LABELS.pending;
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                      <File className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{job.fileName}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span>{new Date(job.createdAt).toLocaleDateString('es-ES')}</span>
                        {job.color && <span className="text-foreground/70">{job.color}</span>}
                        {job.filamentType && <span className="text-foreground/70">{job.filamentType}</span>}
                        {job.deliveryTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getDeliveryLabel(job.deliveryTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {job.status === 'needs_revision' && job.makerFeedback && (() => {
                  let fb: { issues: string[]; notes: string; suggestion: string; submittedAt: string } | null = null;
                  try { fb = JSON.parse(job.makerFeedback); } catch { /* ignore */ }
                  if (!fb) return null;
                  const isOpen = expandedFeedback === job.id;
                  return (
                    <div className="mt-3 rounded-xl border border-orange-500/30 bg-orange-500/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedFeedback(isOpen ? null : job.id)}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-orange-400">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          El maker reportó problemas en tu modelo
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-orange-400 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 space-y-3 text-sm border-t border-orange-500/20">
                          <div className="pt-3 space-y-1.5">
                            {fb.issues.map((issueId) => {
                              const issue = MODEL_ISSUES.find((m) => m.id === issueId);
                              return issue ? (
                                <div key={issueId} className="flex items-start gap-2">
                                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                                  <div>
                                    <span className="font-medium">{issue.label}</span>
                                    <p className="text-xs text-muted-foreground">{issue.description}</p>
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                          {fb.notes && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Notas del maker:</span>
                              <p className="mt-0.5">{fb.notes}</p>
                            </div>
                          )}
                          {fb.suggestion && (
                            <div className="p-3 rounded-lg bg-background/60 border border-border">
                              <span className="text-xs font-medium text-muted-foreground">Sugerencia:</span>
                              <p className="mt-0.5">{fb.suggestion}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Corrige el modelo y vuelve a enviarlo para continuar con la impresión.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
