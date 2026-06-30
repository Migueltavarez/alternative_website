'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, File, X, Clock, Printer, AlertTriangle,
  ChevronDown, ChevronUp, Scissors, Layers, FileText, Wrench, RefreshCw,
  DollarSign, CheckCircle2, MessageSquare, History, ExternalLink, Copy, Check,
  PenTool, Car, Video, Thermometer, Activity, Timer, Camera, Star, Truck, MapPin,
  Plus, Coins, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUpload } from './file-upload';
import {
  FILAMENT_COLORS, FILAMENT_TYPES, FILAMENT_INFO, DELIVERY_TIMES, JOB_STATUS_LABELS, MODEL_ISSUES,
  SERVICE_TYPES, PRINT_SCALES, RESIN_COLORS, RESIN_USES, CORRECTION_COST_CREDITS,
  PRICE_STATUS_LABELS, BANK_ACCOUNTS, DESIGN_MATERIALS, DESIGN_USES,
} from '@/lib/print-constants';

// ── Types ────────────────────────────────────────────────────────────────────

interface PrintJob {
  id: string;
  fileName: string;
  fileUrl: string;
  creditsCost: number;
  status: string;
  notes?: string;
  serviceType?: string;
  color?: string;
  filamentType?: string;
  deliveryTime?: string;
  scale?: string;
  realSize?: string;
  laserCutColor?: string;
  laserEngravColor?: string;
  resinColor?: string;
  resinUse?: string;
  // Design
  designDescription?: string;
  designMeasures?: string;
  designReferenceUrls?: string;
  referenceImageUrls?: string | null;
  designMaterial?: string;
  designUse?: string;
  designIsVehicle?: boolean;
  designVehicleMake?: string;
  designVehicleModel?: string;
  designVehicleYear?: string;
  createdAt: string;
  assignedAt?: string;
  cameraUrl?: string | null;
  makerFeedback?: string | null;
  deliveryType?: string | null;
  deliveryAddress?: string | null;
  trackingUrl?: string | null;
  price?: number | null;
  priceStatus?: string;
  autoQuoted?: boolean;
  quotedPrice?: number | null;
  quoteVolumeCm3?: number | null;
  infill?: number | null;
  qualityLevel?: string | null;
  appealNote?: string | null;
  paymentProofUrl?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
  completionPhotoUrl?: string | null;
  completedAt?: string | null;
  rating?: number | null;
  ratingComment?: string | null;
  ratedAt?: string | null;
}

interface MyModelsProps {
  printJobs: PrintJob[];
  onRefresh: () => void;
  isStudent?: boolean;
  formOnly?: boolean;
  userCredits?: number;
  onCreditsUsed?: () => void;
}

// ── Service icons ─────────────────────────────────────────────────────────────

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  print_3d:       <Printer className="w-6 h-6" />,
  laser:          <Scissors className="w-6 h-6" />,
  resin:          <Layers className="w-6 h-6" />,
  plans:          <FileText className="w-6 h-6" />,
  design:         <PenTool className="w-6 h-6" />,
  armado_maqueta: <Wrench className="w-6 h-6" />,
  planimetria:    <FileText className="w-6 h-6" />,
  asesoria:       <MessageSquare className="w-6 h-6" />,
};

const SERVICE_COLORS: Record<string, string> = {
  print_3d:       'text-blue-400 bg-blue-500/10 border-blue-500/20',
  laser:          'text-orange-400 bg-orange-500/10 border-orange-500/20',
  resin:          'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  plans:          'text-blue-400 bg-blue-500/10 border-blue-500/20',
  design:         'text-pink-400 bg-pink-500/10 border-pink-500/20',
  armado_maqueta: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  planimetria:    'text-teal-400 bg-teal-500/10 border-teal-500/20',
  asesoria:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function getServiceLabel(id?: string) {
  return SERVICE_TYPES.find((s) => s.id === id)?.label ?? 'Impresión 3D';
}

function getDeliveryLabel(value?: string) {
  return DELIVERY_TIMES.find((d) => d.value === value)?.label ?? value ?? 'Estándar';
}

function formatDOP(amount: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(amount);
}

// ── Main component ────────────────────────────────────────────────────────────

interface OctoPrintStatus {
  streamUrl: string | null;
  snapshotUrl: string | null;
  webcamEnabled: boolean;
  state: string | null;
  temps: {
    bedActual: number | null;
    bedTarget: number | null;
    nozzleActual: number | null;
    nozzleTarget: number | null;
  };
  progress: {
    completion: number | null;
    printTime: number | null;
    printTimeLeft: number | null;
    fileName: string | null;
  };
}

function formatSeconds(s: number | null): string {
  if (s == null || s <= 0) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function MyModels({ printJobs, onRefresh, isStudent = false, formOnly = false, userCredits = 0, onCreditsUsed }: MyModelsProps) {
  const [showForm, setShowForm]           = useState(formOnly);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  // OctoPrint live data (polled every 10s for printing jobs)
  const [octoprintData, setOctoprintData] = useState<Record<string, OctoPrintStatus | null>>({});
  const octoprintIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    const printingJobs = printJobs.filter((j) => j.status === 'printing');

    // Start polling for new printing jobs
    printingJobs.forEach((job) => {
      if (octoprintIntervals.current[job.id]) return;
      const poll = async () => {
        try {
          const res = await fetch(`/api/octoprint/${job.id}`);
          if (res.ok) {
            const data = await res.json();
            setOctoprintData((prev) => ({ ...prev, [job.id]: data }));
          } else {
            setOctoprintData((prev) => ({ ...prev, [job.id]: null }));
          }
        } catch {
          setOctoprintData((prev) => ({ ...prev, [job.id]: null }));
        }
      };
      poll();
      octoprintIntervals.current[job.id] = setInterval(poll, 10_000);
    });

    // Clear intervals for jobs no longer printing
    const printingIds = new Set(printingJobs.map((j) => j.id));
    Object.keys(octoprintIntervals.current).forEach((id) => {
      if (!printingIds.has(id)) {
        clearInterval(octoprintIntervals.current[id]);
        delete octoprintIntervals.current[id];
      }
    });

    return () => {
      Object.values(octoprintIntervals.current).forEach(clearInterval);
      octoprintIntervals.current = {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printJobs.map((j) => `${j.id}:${j.status}`).join(',')]);

  // Resubmit corrected file
  const [resubmitJobId, setResubmitJobId]   = useState<string | null>(null);
  const [resubmitFile, setResubmitFile]     = useState<{ fileName: string; fileUrl: string; fileSize?: number } | null>(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [resubmitError, setResubmitError]   = useState('');

  // Request paid correction
  const [correctionJobId, setCorrectionJobId]   = useState<string | null>(null);
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [correctionError, setCorrectionError]   = useState('');

  // Price decision (accept / appeal)
  const [appealOpenJobId, setAppealOpenJobId] = useState<string | null>(null);
  const [appealNote, setAppealNote]           = useState('');
  const [priceDecisionLoading, setPriceDecisionLoading] = useState(false);
  const [priceDecisionError, setPriceDecisionError]     = useState('');

  // Payment proof upload
  const [paymentJobId, setPaymentJobId]   = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<{ fileName: string; fileUrl: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError]   = useState('');
  const [copiedBank, setCopiedBank]       = useState<string | null>(null);

  // Rating
  const [ratingJobId, setRatingJobId]   = useState<string | null>(null);
  const [ratingValue, setRatingValue]   = useState(0);
  const [ratingText, setRatingText]     = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError]   = useState('');

  // Form state
  const [serviceType, setServiceType]     = useState('');
  const [uploadedFile, setUploadedFile]   = useState<{ fileName: string; fileUrl: string; fileSize?: number } | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<{ fileName: string; fileUrl: string; fileSize?: number }[]>([]);
  const [addingFile, setAddingFile]           = useState(false);
  const [isUploading, setIsUploading]     = useState(false);
  const [notes, setNotes]                 = useState('');
  const [deliveryTime, setDeliveryTime]   = useState('standard');
  const [deliveryType, setDeliveryType]   = useState<'pickup' | 'delivery'>('pickup');
  const [userAddresses, setUserAddresses] = useState<{id:string;label:string;street:string;city:string;isDefault:boolean}[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  // 3D print
  const [color, setColor]                 = useState('');
  const [filamentType, setFilamentType]   = useState('');
  const [scale, setScale]                 = useState('');
  const [customScale, setCustomScale]     = useState('');
  const [realSize, setRealSize]           = useState('');
  // Laser
  const [laserCutColor, setLaserCutColor]         = useState('');
  const [laserEngravColor, setLaserEngravColor]   = useState('');
  // Resin
  const [resinColor, setResinColor]       = useState('');
  const [resinUse, setResinUse]           = useState('');
  // Design
  const [designDescription, setDesignDescription]     = useState('');
  const [designMeasures, setDesignMeasures]           = useState('');
  const [designReferenceUrls, setDesignReferenceUrls] = useState('');
  const [designMaterial, setDesignMaterial]           = useState('');
  const [designUse, setDesignUse]                     = useState('');
  const [designIsVehicle, setDesignIsVehicle]         = useState(false);
  const [designVehicleMake, setDesignVehicleMake]     = useState('');
  const [designVehicleModel, setDesignVehicleModel]   = useState('');
  const [designVehicleYear, setDesignVehicleYear]     = useState('');
  const [designColor, setDesignColor]                 = useState('');
  const [referenceImages, setReferenceImages]         = useState<{ url: string; name: string }[]>([]);
  const [uploadingRefImg, setUploadingRefImg]         = useState(false);
  const [showPhotoGuide, setShowPhotoGuide]           = useState(false);
  const refImgInputRef                               = useRef<HTMLInputElement>(null);
  const addFileInputRef                              = useRef<HTMLInputElement>(null);

  const [error, setError]       = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [stlAnalysis, setStlAnalysis] = useState<{
    dimensions: { x: number; y: number; z: number };
    estimatedWeightG: number;
    creditsMin: number;
    creditsMax: number;
    precise: boolean;
  } | null>(null);
  const [stlAnalyzing, setStlAnalyzing]     = useState(false);
  const [creditPayLoading, setCreditPayLoading] = useState(false);
  const [creditPayError, setCreditPayError]     = useState('');

  useEffect(() => {
    if (deliveryType === 'delivery' && userAddresses.length === 0) {
      fetch('/api/user/addresses')
        .then((r) => r.ok ? r.json() : [])
        .then((data) => {
          const list = Array.isArray(data) ? data : (data.addresses ?? []);
          setUserAddresses(list);
          const def = list.find((a: any) => a.isDefault);
          if (def) setSelectedAddressId(def.id);
        })
        .catch(() => {});
    }
  }, [deliveryType]);

  const selectedService = SERVICE_TYPES.find((s) => s.id === serviceType);

  const resetForm = () => {
    setServiceType('');
    setUploadedFile(null);
    setAdditionalFiles([]);
    setIsUploading(false);
    setNotes('');
    setDeliveryTime('standard');
    setDeliveryType('pickup');
    setSelectedAddressId('');
    setColor(''); setFilamentType(''); setScale(''); setCustomScale(''); setRealSize('');
    setLaserCutColor(''); setLaserEngravColor('');
    setResinColor(''); setResinUse('');
    setDesignDescription(''); setDesignMeasures(''); setDesignReferenceUrls('');
    setDesignMaterial(''); setDesignUse(''); setDesignIsVehicle(false);
    setDesignVehicleMake(''); setDesignVehicleModel(''); setDesignVehicleYear('');
    setDesignColor(''); setReferenceImages([]);
    setStlAnalysis(null);
    setSubmitSuccess(false);
    setCreditPayError('');
    setError('');
  };

  const handleServiceChange = (id: string) => {
    setServiceType(id);
    setUploadedFile(null);
    setAdditionalFiles([]);
    setStlAnalysis(null);
    setError('');
  };

  const handleFileUploaded = (fileName: string, fileUrl: string, fileSize?: number) => {
    setUploadedFile({ fileName, fileUrl, fileSize });
    setIsUploading(false);
    if (fileUrl.endsWith('.stl') && (serviceType === 'print_3d' || serviceType === 'resin')) {
      analyzeStl(fileUrl);
    }
  };

  const analyzeStl = async (fileUrl: string) => {
    setStlAnalyzing(true);
    setStlAnalysis(null);
    try {
      const res = await fetch('/api/analyze-stl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl }),
      });
      if (res.ok) setStlAnalysis(await res.json());
    } catch { /* non-fatal */ }
    setStlAnalyzing(false);
  };

  const handleAddAnotherFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || additionalFiles.length >= 9) return;
    setAddingFile(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        setAdditionalFiles((prev) => [...prev, { fileName: data.fileName, fileUrl: data.fileUrl, fileSize: data.fileSize }]);
      }
    } catch { /* ignore */ }
    setAddingFile(false);
    if (addFileInputRef.current) addFileInputRef.current.value = '';
  };

  const handleCreditPayment = async (jobId: string) => {
    setCreditPayLoading(true);
    setCreditPayError('');
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/pay-with-credits`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al pagar');
      if (onCreditsUsed) onCreditsUsed();
      onRefresh();
    } catch (err: any) {
      setCreditPayError(err.message);
    } finally {
      setCreditPayLoading(false);
    }
  };

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingRefImg(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const data = await res.json();
          setReferenceImages((prev) => [...prev, { url: data.fileUrl, name: file.name }]);
        }
      } catch { /* ignore individual failures */ }
    }
    setUploadingRefImg(false);
    if (refImgInputRef.current) refImgInputRef.current.value = '';
  };

  const NO_FILE_SERVICES = ['design', 'armado_maqueta', 'asesoria'];

  const validate = (): string | null => {
    if (!serviceType) return 'Selecciona un tipo de servicio';
    if (!NO_FILE_SERVICES.includes(serviceType) && !uploadedFile) return 'Sube un archivo primero';
    if (deliveryType === 'delivery' && !selectedAddressId) return 'Selecciona una dirección de envío';

    if (serviceType === 'print_3d') {
      if (!color)        return 'Selecciona el color del filamento';
      if (!filamentType) return 'Selecciona el tipo de filamento';
      if (!scale)        return 'Selecciona la escala del modelo';
      if (scale === 'Personalizada' && !customScale.trim()) return 'Escribe la escala personalizada';
      if (!realSize.trim()) return 'Indica el tamaño real máximo del modelo';
    }
    if (serviceType === 'laser') {
      if (!laserCutColor.trim()) return 'Indica el color de corte en tu archivo';
    }
    if (serviceType === 'resin') {
      if (!resinColor) return 'Selecciona el color de la resina';
      if (!resinUse)   return 'Indica el uso del modelo';
    }
    if (serviceType === 'design') {
      if (!designDescription.trim()) return 'Describe qué quieres diseñar';
      if (!designMaterial)           return 'Selecciona el material a usar';
      if (!designUse)                return 'Indica el uso de la pieza';
      if (designIsVehicle) {
        if (!designVehicleMake.trim())  return 'Indica la marca del vehículo';
        if (!designVehicleModel.trim()) return 'Indica el modelo del vehículo';
        if (!designVehicleYear.trim())  return 'Indica el año del vehículo';
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setError('');
    setSubmitting(true);

    const finalScale = scale === 'Personalizada' ? customScale.trim() : scale;

    let deliveryAddressJson: string | undefined;
    if (deliveryType === 'delivery' && selectedAddressId) {
      const addr = userAddresses.find((a) => a.id === selectedAddressId);
      if (addr) deliveryAddressJson = JSON.stringify(addr);
    }

    const basePayload = {
      notes: notes || undefined,
      deliveryTime,
      deliveryType,
      deliveryAddress: deliveryAddressJson,
      serviceType,
      color: serviceType === 'print_3d' ? color : (serviceType === 'design' && designColor ? designColor : undefined),
      filamentType: serviceType === 'print_3d' ? filamentType : undefined,
      scale: serviceType === 'print_3d' ? finalScale : undefined,
      realSize: serviceType === 'print_3d' ? realSize.trim() : undefined,
      laserCutColor: serviceType === 'laser' ? laserCutColor.trim() : undefined,
      laserEngravColor: serviceType === 'laser' && laserEngravColor.trim() ? laserEngravColor.trim() : undefined,
      resinColor: serviceType === 'resin' ? resinColor : undefined,
      resinUse: serviceType === 'resin' ? resinUse : undefined,
      designDescription: serviceType === 'design' ? designDescription.trim() : undefined,
      designMeasures: serviceType === 'design' && designMeasures.trim() ? designMeasures.trim() : undefined,
      designReferenceUrls: serviceType === 'design' && designReferenceUrls.trim() ? designReferenceUrls.trim() : undefined,
      referenceImageUrls: serviceType === 'design' && referenceImages.length > 0
        ? JSON.stringify(referenceImages.map((r) => r.url))
        : undefined,
      designMaterial: serviceType === 'design' ? designMaterial : undefined,
      designUse: serviceType === 'design' ? designUse : undefined,
      designIsVehicle: serviceType === 'design' ? designIsVehicle : undefined,
      designVehicleMake: serviceType === 'design' && designIsVehicle ? designVehicleMake.trim() : undefined,
      designVehicleModel: serviceType === 'design' && designIsVehicle ? designVehicleModel.trim() : undefined,
      designVehicleYear: serviceType === 'design' && designIsVehicle ? designVehicleYear.trim() : undefined,
    };

    const allFiles = uploadedFile
      ? [uploadedFile, ...additionalFiles]
      : [{ fileName: 'solicitud', fileUrl: '', fileSize: undefined as number | undefined }];

    try {
      for (let i = 0; i < allFiles.length; i++) {
        if (allFiles.length > 1) setBatchProgress({ current: i + 1, total: allFiles.length });
        const file = allFiles[i];
        const res = await fetch('/api/print-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...basePayload, fileName: file.fileName, fileUrl: file.fileUrl, fileSize: file.fileSize }),
        });
        if (!res.ok) throw new Error(allFiles.length > 1 ? `Error al enviar "${file.fileName}"` : 'Error al guardar el trabajo');
      }

      resetForm();
      setSubmitSuccess(true);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setBatchProgress(null);
    }
  };

  const handleResubmit = async (jobId: string) => {
    if (!resubmitFile) return;
    setResubmitLoading(true);
    setResubmitError('');
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/resubmit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resubmitFile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reenviar');
      setResubmitJobId(null);
      setResubmitFile(null);
      onRefresh();
    } catch (err: any) {
      setResubmitError(err.message);
    } finally {
      setResubmitLoading(false);
    }
  };

  const handleRequestCorrection = async (jobId: string) => {
    setCorrectionLoading(true);
    setCorrectionError('');
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/request-correction`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al solicitar corrección');
      setCorrectionJobId(null);
      onRefresh();
    } catch (err: any) {
      setCorrectionError(err.message);
    } finally {
      setCorrectionLoading(false);
    }
  };

  const handlePriceDecision = async (jobId: string, action: 'accept' | 'appeal') => {
    if (action === 'appeal' && !appealNote.trim()) {
      setPriceDecisionError('Debes indicar el motivo de la apelación');
      return;
    }
    setPriceDecisionLoading(true);
    setPriceDecisionError('');
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/price-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, appealNote: appealNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar decisión');
      setAppealOpenJobId(null);
      setAppealNote('');
      onRefresh();
    } catch (err: any) {
      setPriceDecisionError(err.message);
    } finally {
      setPriceDecisionLoading(false);
    }
  };

  const handleSubmitPaymentProof = async (jobId: string) => {
    if (!paymentProofFile) return;
    if (!paymentMethod) { setPaymentError('Selecciona el banco con el que realizaste el pago'); return; }
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/payment-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentProofUrl: paymentProofFile.fileUrl, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar comprobante');
      setPaymentJobId(null);
      setPaymentProofFile(null);
      setPaymentMethod('');
      onRefresh();
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(key);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  const handleRateJob = async () => {
    if (!ratingJobId || ratingValue < 1) return;
    setRatingLoading(true);
    setRatingError('');
    try {
      const res = await fetch(`/api/print-jobs/${ratingJobId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingValue, ratingComment: ratingText || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setRatingError(data.error || 'Error al calificar');
      } else {
        setRatingJobId(null);
        setRatingValue(0);
        setRatingText('');
        onRefresh();
      }
    } catch {
      setRatingError('Error al calificar');
    } finally {
      setRatingLoading(false);
    }
  };

  // Jobs with confirmed payment for history section
  const confirmedJobs = printJobs.filter((j) => j.priceStatus === 'confirmed');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
      {/* Header */}
      {!formOnly && (
        <div className="flex flex-wrap items-center justify-between gap-y-3 mb-6">
          <h2 className="text-2xl font-bold">Mis Trabajos de Impresión</h2>
          <Button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
            <Upload className="w-4 h-4 mr-2" />
            Solicitar servicio
          </Button>
        </div>
      )}

      {/* ── Request form ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl overflow-hidden mb-6"
          >
            <div className="p-6">
              {submitSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg">¡Trabajo enviado!</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-5">
                    Tu solicitud fue recibida. Te notificaremos cuando sea asignada a un maker.
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button onClick={() => setSubmitSuccess(false)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Enviar otro trabajo
                    </Button>
                    {!formOnly && (
                      <Button variant="outline" onClick={() => { setShowForm(false); setSubmitSuccess(false); }}>
                        Ver historial
                      </Button>
                    )}
                  </div>
                </div>
              ) : (<>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold">Nueva solicitud</h3>
                {!formOnly && (
                  <button
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="p-1 hover:bg-accent rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Step 1 — Service type */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    ¿Qué servicio necesitas? <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SERVICE_TYPES.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleServiceChange(st.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          serviceType === st.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/40 hover:bg-accent/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 border ${
                          serviceType === st.id
                            ? 'bg-primary/20 border-primary/30 text-primary'
                            : SERVICE_COLORS[st.id] ?? ''
                        }`}>
                          {SERVICE_ICONS[st.id]}
                        </div>
                        <p className="font-medium text-sm leading-tight">{st.label}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-tight">{st.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2 — File upload */}
                <AnimatePresence>
                  {serviceType && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-6"
                    >
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {serviceType === 'design' ? 'Imagen o archivo de referencia' : 'Archivo'}{' '}
                          <span className="text-muted-foreground font-normal">
                            ({selectedService?.acceptedExtensions.join(', ')})
                          </span>{' '}
                          {serviceType !== 'design' && <span className="text-red-400">*</span>}
                          {serviceType === 'design' && <span className="text-muted-foreground font-normal">(opcional)</span>}
                        </label>
                        {!uploadedFile ? (
                          <FileUpload
                            onUploadComplete={handleFileUploaded}
                            isUploading={isUploading}
                            acceptedExtensions={selectedService ? [...selectedService.acceptedExtensions] : undefined}
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                              <File className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-green-500 truncate">{uploadedFile.fileName}</p>
                              {uploadedFile.fileSize && (
                                <p className="text-xs text-muted-foreground">{uploadedFile.fileSize.toFixed(2)} MB</p>
                              )}
                            </div>
                            <button type="button" onClick={() => { setUploadedFile(null); setStlAnalysis(null); }} className="p-2 hover:bg-accent rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* STL analysis result */}
                      {(stlAnalyzing || stlAnalysis) && (serviceType === 'print_3d' || serviceType === 'resin') && (
                        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                          {stlAnalyzing ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Analizando dimensiones del modelo...
                            </p>
                          ) : stlAnalysis ? (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-primary">Análisis del modelo (STL)</p>
                              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                                <div><p className="text-muted-foreground">Ancho</p><p className="font-bold">{stlAnalysis.dimensions.x} mm</p></div>
                                <div><p className="text-muted-foreground">Prof.</p><p className="font-bold">{stlAnalysis.dimensions.y} mm</p></div>
                                <div><p className="text-muted-foreground">Alto</p><p className="font-bold">{stlAnalysis.dimensions.z} mm</p></div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Peso estimado (PLA): ~{stlAnalysis.estimatedWeightG}g
                                {' · '}Créditos aprox: {stlAnalysis.creditsMin}–{stlAnalysis.creditsMax}
                                {!stlAnalysis.precise && ' (estimado)'}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Additional files (print_3d / resin only) */}
                      {uploadedFile && (serviceType === 'print_3d' || serviceType === 'resin') && (
                        <div className="space-y-2">
                          {additionalFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-accent border border-border">
                              <File className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="text-sm flex-1 truncate">{f.fileName}</span>
                              <button type="button" onClick={() => setAdditionalFiles((prev) => prev.filter((_, idx) => idx !== i))} className="p-1 hover:bg-card rounded-lg">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {additionalFiles.length < 9 && (
                            <>
                              <input ref={addFileInputRef} type="file" accept={selectedService?.acceptStr} onChange={handleAddAnotherFile} className="hidden" />
                              <button
                                type="button"
                                onClick={() => addFileInputRef.current?.click()}
                                disabled={addingFile}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-sm text-muted-foreground disabled:opacity-50"
                              >
                                {addingFile
                                  ? <><Loader2 className="w-4 h-4 animate-spin" />Subiendo...</>
                                  : <><Plus className="w-4 h-4" />Agregar otro archivo ({1 + additionalFiles.length}/10 máx.)</>}
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* ── 3D Print ── */}
                      {serviceType === 'print_3d' && (
                        <div className="space-y-4">
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
                              {filamentType && FILAMENT_INFO[filamentType] && (
                                <p className="text-xs text-muted-foreground mt-1">{FILAMENT_INFO[filamentType]}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Escala del modelo <span className="text-red-400">*</span>
                              </label>
                              <select
                                value={scale}
                                onChange={(e) => setScale(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Selecciona una escala</option>
                                {PRINT_SCALES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              {scale === 'Personalizada' && (
                                <input
                                  type="text"
                                  value={customScale}
                                  onChange={(e) => setCustomScale(e.target.value)}
                                  placeholder="Ej: 1:75, 2:1, 3:500..."
                                  className="mt-2 w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Altura máxima real (metros) <span className="text-red-400">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={realSize}
                                  onChange={(e) => setRealSize(e.target.value)}
                                  placeholder="10"
                                  className="w-full pl-4 pr-14 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">metros</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Altura real del modelo terminado</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Laser ── */}
                      {serviceType === 'laser' && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                            <p className="text-xs text-amber-400 font-medium mb-1">¿Cómo indicar los colores?</p>
                            <p className="text-xs text-muted-foreground">
                              En tu archivo PDF los elementos tienen colores distintos. Indica qué color corresponde a corte y cuál a grabado (ej: Rojo = corte, Negro = grabado).
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Color para corte <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={laserCutColor}
                                onChange={(e) => setLaserCutColor(e.target.value)}
                                placeholder="Ej: Rojo, #FF0000, RGB(255,0,0)"
                                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Color para grabado <span className="text-muted-foreground font-normal">(opcional)</span>
                              </label>
                              <input
                                type="text"
                                value={laserEngravColor}
                                onChange={(e) => setLaserEngravColor(e.target.value)}
                                placeholder="Ej: Negro, #000000, RGB(0,0,0)"
                                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Resin ── */}
                      {serviceType === 'resin' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Color de la resina <span className="text-red-400">*</span>
                            </label>
                            <select
                              value={resinColor}
                              onChange={(e) => setResinColor(e.target.value)}
                              className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Selecciona un color</option>
                              {RESIN_COLORS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Uso del modelo <span className="text-red-400">*</span>
                            </label>
                            <div className="flex gap-3 mt-1">
                              {RESIN_USES.map((u) => (
                                <label
                                  key={u.value}
                                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                                    resinUse === u.value
                                      ? 'border-primary bg-primary/10 font-medium'
                                      : 'border-border hover:border-primary/40'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="resinUse"
                                    value={u.value}
                                    checked={resinUse === u.value}
                                    onChange={() => setResinUse(u.value)}
                                    className="sr-only"
                                  />
                                  {u.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Plans ── */}
                      {serviceType === 'plans' && (
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                          <p className="text-xs text-blue-400 font-medium mb-1">Impresión de planos</p>
                          <p className="text-xs text-muted-foreground">
                            Sube tu archivo PDF. Si necesitas un tamaño de papel específico (A0, A1, A2...) o alguna indicación especial, indícalo en las notas.
                          </p>
                        </div>
                      )}

                      {/* ── Armado de maquetas ── */}
                      {serviceType === 'armado_maqueta' && (
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                          <p className="text-xs text-amber-400 font-medium mb-1">Armado de maquetas</p>
                          <p className="text-xs text-muted-foreground">
                            Describe en las notas qué necesitas armar, el tamaño aproximado y los materiales disponibles. Puedes subir imágenes de referencia o planos de forma opcional.
                          </p>
                        </div>
                      )}

                      {/* ── Planimetría ── */}
                      {serviceType === 'planimetria' && (
                        <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
                          <p className="text-xs text-teal-400 font-medium mb-1">Planimetría técnica</p>
                          <p className="text-xs text-muted-foreground">
                            Sube tu archivo (PDF, DWG o DXF). Indica en las notas qué tipo de plano necesitas: elevaciones, secciones, planos técnicos o detalles constructivos.
                          </p>
                        </div>
                      )}

                      {/* ── Asesorías ── */}
                      {serviceType === 'asesoria' && (
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                          <p className="text-xs text-emerald-400 font-medium mb-1">Asesoría técnica</p>
                          <p className="text-xs text-muted-foreground">
                            Describe en las notas el tema sobre el que necesitas orientación: selección de materiales, optimización de modelos, viabilidad de impresión, costos, etc.
                          </p>
                        </div>
                      )}

                      {/* ── Design ── */}
                      {serviceType === 'design' && (
                        <div className="space-y-4">
                          {/* Description */}
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              ¿Qué se va a diseñar? <span className="text-red-400">*</span>
                            </label>
                            <textarea
                              value={designDescription}
                              onChange={(e) => setDesignDescription(e.target.value)}
                              placeholder="Describe detalladamente la pieza o modelo que necesitas diseñar..."
                              rows={3}
                              className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                            />
                          </div>

                          {/* Measures + Material */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Medidas <span className="text-muted-foreground font-normal">(opcional)</span>
                              </label>
                              <input
                                type="text"
                                value={designMeasures}
                                onChange={(e) => setDesignMeasures(e.target.value)}
                                placeholder="Ej: 10cm × 5cm × 3cm"
                                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Material a usar <span className="text-red-400">*</span>
                              </label>
                              <select
                                value={designMaterial}
                                onChange={(e) => setDesignMaterial(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              >
                                <option value="">Selecciona un material</option>
                                {DESIGN_MATERIALS.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Use + Color */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Uso de la pieza <span className="text-red-400">*</span>
                              </label>
                              <div className="flex gap-3 mt-1">
                                {DESIGN_USES.map((u) => (
                                  <label
                                    key={u.value}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                                      designUse === u.value
                                        ? 'border-primary bg-primary/10 font-medium'
                                        : 'border-border hover:border-primary/40'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="designUse"
                                      value={u.value}
                                      checked={designUse === u.value}
                                      onChange={() => setDesignUse(u.value)}
                                      className="sr-only"
                                    />
                                    {u.label}
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Color <span className="text-muted-foreground font-normal">(opcional)</span>
                              </label>
                              <select
                                value={designColor}
                                onChange={(e) => setDesignColor(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              >
                                <option value="">Selecciona un color</option>
                                {FILAMENT_COLORS.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Vehicle toggle */}
                          <div>
                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              designIsVehicle ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                            }`}>
                              <input
                                type="checkbox"
                                checked={designIsVehicle}
                                onChange={(e) => setDesignIsVehicle(e.target.checked)}
                                className="w-4 h-4 rounded border-border text-primary"
                              />
                              <Car className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Es para un vehículo</span>
                            </label>

                            {designIsVehicle && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                                <div>
                                  <label className="block text-xs font-medium mb-1">
                                    Marca <span className="text-red-400">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={designVehicleMake}
                                    onChange={(e) => setDesignVehicleMake(e.target.value)}
                                    placeholder="Toyota"
                                    className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">
                                    Modelo <span className="text-red-400">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={designVehicleModel}
                                    onChange={(e) => setDesignVehicleModel(e.target.value)}
                                    placeholder="Corolla"
                                    className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">
                                    Año <span className="text-red-400">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={designVehicleYear}
                                    onChange={(e) => setDesignVehicleYear(e.target.value)}
                                    placeholder="2019"
                                    className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Reference links */}
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Links de referencia <span className="text-muted-foreground font-normal">(opcional)</span>
                            </label>
                            <textarea
                              value={designReferenceUrls}
                              onChange={(e) => setDesignReferenceUrls(e.target.value)}
                              placeholder="Pega aquí los links de referencia, uno por línea&#10;https://ejemplo.com/imagen1&#10;https://ejemplo.com/imagen2"
                              rows={3}
                              className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                            />
                          </div>

                          {/* Reference photo upload */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium">
                                Fotos de referencia <span className="text-muted-foreground font-normal">(opcional — puedes subir varias)</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowPhotoGuide((v) => !v)}
                                className="text-xs text-primary underline underline-offset-2"
                              >
                                {showPhotoGuide ? 'Ocultar guía' : '¿Cómo tomar las fotos?'}
                              </button>
                            </div>

                            <AnimatePresence>
                              {showPhotoGuide && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden mb-3"
                                >
                                  <div className="rounded-xl overflow-hidden border border-border">
                                    <img
                                      src="/design-guide.jpg"
                                      alt="Guía: cómo tomar fotos para diseño 3D"
                                      className="w-full"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Uploaded images grid */}
                            {referenceImages.length > 0 && (
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                {referenceImages.map((img, i) => (
                                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-accent">
                                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setReferenceImages((prev) => prev.filter((_, idx) => idx !== i))}
                                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                                    >
                                      <X className="w-3 h-3 text-white" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <input
                              ref={refImgInputRef}
                              type="file"
                              multiple
                              accept=".jpg,.jpeg,.png,.webp"
                              onChange={handleReferenceImageUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => refImgInputRef.current?.click()}
                              disabled={uploadingRefImg}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-sm disabled:opacity-50"
                            >
                              {uploadingRefImg ? (
                                <>
                                  <Camera className="w-4 h-4 animate-pulse text-primary" />
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <Camera className="w-4 h-4 text-muted-foreground" />
                                  {referenceImages.length > 0 ? 'Agregar más fotos' : 'Subir fotos de referencia'}
                                </>
                              )}
                            </button>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              JPG, PNG o WEBP. Toma fotos desde múltiples ángulos para mejores resultados.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Common fields */}
                      <div className="space-y-4">
                        {/* Delivery time */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Tiempo de entrega <span className="text-red-400">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {DELIVERY_TIMES.map((d) => (
                              <label
                                key={d.value}
                                className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${
                                  deliveryTime === d.value
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/40'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="deliveryTime"
                                  value={d.value}
                                  checked={deliveryTime === d.value}
                                  onChange={() => setDeliveryTime(d.value)}
                                  className="sr-only"
                                />
                                <span className="text-xs font-semibold">{d.label.split(' (')[0]}</span>
                                <span className="text-[10px] text-muted-foreground">{d.label.match(/\(([^)]+)\)/)?.[1]}</span>
                                <span className={`text-xs font-bold mt-0.5 ${d.price === 0 ? 'text-green-400' : 'text-amber-400'}`}>
                                  {d.priceLabel}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Pickup / Delivery */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Forma de entrega <span className="text-red-400">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { value: 'pickup', label: 'Recoger en tienda', icon: <MapPin className="w-4 h-4" /> },
                              { value: 'delivery', label: 'Envío a domicilio', icon: <Truck className="w-4 h-4" /> },
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  deliveryType === opt.value
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/40'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="deliveryType"
                                  value={opt.value}
                                  checked={deliveryType === opt.value}
                                  onChange={() => setDeliveryType(opt.value as 'pickup' | 'delivery')}
                                  className="sr-only"
                                />
                                {opt.icon}
                                <span className="text-sm font-medium">{opt.label}</span>
                              </label>
                            ))}
                          </div>

                          {/* Address selector */}
                          {deliveryType === 'delivery' && (
                            <div className="mt-3">
                              {userAddresses.length === 0 ? (
                                <p className="text-xs text-amber-400 flex items-center gap-1.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  No tienes direcciones guardadas. <a href="/profile" className="underline">Agrega una en tu perfil</a>.
                                </p>
                              ) : (
                                <select
                                  value={selectedAddressId}
                                  onChange={(e) => setSelectedAddressId(e.target.value)}
                                  className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                >
                                  <option value="">Selecciona una dirección</option>
                                  {userAddresses.map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.label} — {a.street}, {a.city}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Notas adicionales</label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Instrucciones especiales, detalles del proyecto..."
                            rows={2}
                            className="w-full px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                          />
                        </div>
                      </div>

                      {error && (
                        <p className="text-sm text-red-400 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                        </p>
                      )}

                      <Button
                        type="submit"
                        disabled={(!NO_FILE_SERVICES.includes(serviceType) && !uploadedFile) || isUploading || submitting}
                        className="w-full"
                        isLoading={submitting && !batchProgress}
                      >
                        {!submitting && <Upload className="w-4 h-4 mr-2" />}
                        {batchProgress
                          ? `Enviando ${batchProgress.current}/${batchProgress.total}...`
                          : serviceType === 'design' ? 'Enviar Solicitud de Diseño'
                          : ['armado_maqueta', 'asesoria'].includes(serviceType) ? 'Enviar Solicitud'
                          : serviceType === 'planimetria' ? 'Enviar Planos'
                          : additionalFiles.length > 0
                          ? `Enviar ${1 + additionalFiles.length} archivos a la cola`
                          : 'Enviar a la Cola de Impresión'}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
              </>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Job list ─────────────────────────────────────────────────── */}
      {!formOnly && (<>
      {printJobs.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <Printer className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No tienes trabajos de impresión</h3>
          <p className="text-sm text-muted-foreground">
            Solicita un servicio y lo asignaremos a un maker disponible
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {printJobs.map((job) => {
            const statusInfo = JOB_STATUS_LABELS[job.status] ?? JOB_STATUS_LABELS.pending;
            const svcId = job.serviceType ?? 'print_3d';
            const svcColor = SERVICE_COLORS[svcId] ?? '';
            const isOpen = expandedFeedback === job.id;
            const ps = job.priceStatus ?? 'unpaid';
            const priceInfo = PRICE_STATUS_LABELS[ps];

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl p-4"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${svcColor}`}>
                      {SERVICE_ICONS[svcId] ?? <Printer className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{job.fileName}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span>{new Date(job.createdAt).toLocaleDateString('es-ES')}</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[11px] ${svcColor}`}>
                          {getServiceLabel(svcId)}
                        </span>
                        {job.deliveryTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getDeliveryLabel(job.deliveryTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {ps !== 'unpaid' && priceInfo && (
                      <span className={`px-2 py-1 rounded-full text-xs border ${priceInfo.color}`}>
                        {priceInfo.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Spec tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.autoQuoted && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      Auto-cotizado
                    </span>
                  )}
                  {job.infill != null && <Spec label={`Infill ${job.infill}%`} />}
                  {job.qualityLevel && <Spec label={{ draft: 'Borrador', standard: 'Estándar', fine: 'Fino' }[job.qualityLevel] ?? job.qualityLevel} />}
                  {job.color        && <Spec label={`🎨 ${job.color}`} />}
                  {job.filamentType && <Spec label={`🧵 ${job.filamentType}`} />}
                  {job.scale        && <Spec label={`📐 ${job.scale}`} />}
                  {job.realSize     && <Spec label={`📏 ${job.realSize} m`} />}
                  {job.laserCutColor   && <Spec label={`✂️ Corte: ${job.laserCutColor}`} />}
                  {job.laserEngravColor && <Spec label={`✏️ Grabado: ${job.laserEngravColor}`} />}
                  {job.resinColor && <Spec label={`💧 ${job.resinColor}`} />}
                  {job.resinUse   && <Spec label={RESIN_USES.find((u) => u.value === job.resinUse)?.label ?? job.resinUse} />}
                  {/* Design specs */}
                  {job.designMaterial && <Spec label={`🔧 ${job.designMaterial}`} />}
                  {job.designUse && <Spec label={DESIGN_USES.find((u) => u.value === job.designUse)?.label ?? job.designUse} />}
                  {job.designIsVehicle && job.designVehicleMake && (
                    <Spec label={`🚗 ${job.designVehicleMake} ${job.designVehicleModel ?? ''} ${job.designVehicleYear ?? ''}`.trim()} />
                  )}
                  {job.designMeasures && <Spec label={`📐 ${job.designMeasures}`} />}
                </div>

                {/* ── Live print panel (OctoPrint) ─────────────────── */}
                {job.status === 'printing' && (() => {
                  const op = octoprintData[job.id];
                  // No data yet (polling started but hasn't returned) — show loading
                  if (op === undefined) {
                    return (
                      <div className="mt-3 rounded-xl border border-green-500/30 bg-green-500/5 p-3 flex items-center gap-2 text-sm text-green-400">
                        <Activity className="w-4 h-4 animate-pulse" />
                        Conectando con OctoPrint...
                      </div>
                    );
                  }
                  // op === null means no OctoPrint or unreachable — fall back to raw cameraUrl
                  if (op === null) {
                    if (!job.cameraUrl) return null;
                    return (
                      <div className="mt-3 rounded-xl border border-green-500/30 bg-green-500/5 p-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm font-semibold text-green-400">
                            <Video className="w-4 h-4 animate-pulse" />Impresión en vivo
                          </span>
                          <a href={job.cameraUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-colors">
                            <ExternalLink className="w-3 h-3" />Abrir
                          </a>
                        </div>
                        <img src={job.cameraUrl} alt="Cámara" className="w-full mt-3 rounded-lg aspect-video object-cover bg-black" />
                      </div>
                    );
                  }
                  // Full OctoPrint panel
                  return (
                    <div className="mt-3 rounded-xl border border-green-500/30 bg-green-500/5 p-3 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold text-green-400">
                          <Activity className="w-4 h-4 animate-pulse" />
                          OctoPrint en vivo
                          {op.state && <span className="text-xs font-normal text-muted-foreground">· {op.state}</span>}
                        </span>
                      </div>

                      {/* Camera stream */}
                      {op.streamUrl && (
                        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                          <img
                            src={op.streamUrl}
                            alt="Cámara"
                            className="w-full h-full object-cover"
                          />
                          <a
                            href={op.streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
                            title="Abrir en nueva pestaña"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Nozzle temp */}
                        {op.temps.nozzleActual != null && (
                          <div className="rounded-lg bg-card border border-border px-3 py-2 text-center">
                            <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center justify-center gap-1">
                              <Thermometer className="w-3 h-3" />Nozzle
                            </p>
                            <p className="text-sm font-bold text-orange-400">
                              {op.temps.nozzleActual.toFixed(0)}°
                              <span className="text-xs font-normal text-muted-foreground">/{op.temps.nozzleTarget?.toFixed(0)}°</span>
                            </p>
                          </div>
                        )}
                        {/* Bed temp */}
                        {op.temps.bedActual != null && (
                          <div className="rounded-lg bg-card border border-border px-3 py-2 text-center">
                            <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center justify-center gap-1">
                              <Thermometer className="w-3 h-3" />Cama
                            </p>
                            <p className="text-sm font-bold text-blue-400">
                              {op.temps.bedActual.toFixed(0)}°
                              <span className="text-xs font-normal text-muted-foreground">/{op.temps.bedTarget?.toFixed(0)}°</span>
                            </p>
                          </div>
                        )}
                        {/* Progress */}
                        {op.progress.completion != null && (
                          <div className="rounded-lg bg-card border border-border px-3 py-2 text-center">
                            <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center justify-center gap-1">
                              <Activity className="w-3 h-3" />Progreso
                            </p>
                            <p className="text-sm font-bold text-green-400">{op.progress.completion.toFixed(1)}%</p>
                          </div>
                        )}
                        {/* ETA */}
                        {op.progress.printTimeLeft != null && (
                          <div className="rounded-lg bg-card border border-border px-3 py-2 text-center">
                            <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center justify-center gap-1">
                              <Timer className="w-3 h-3" />Restante
                            </p>
                            <p className="text-sm font-bold">{formatSeconds(op.progress.printTimeLeft)}</p>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      {op.progress.completion != null && (
                        <div className="w-full bg-card rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                            style={{ width: `${op.progress.completion}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Tracking link */}
                {job.deliveryType === 'delivery' && job.trackingUrl && (
                  <div className="mt-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 flex items-center gap-3">
                    <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-blue-400">Seguimiento del envío</p>
                      <a href={job.trackingUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-300 hover:underline truncate block">{job.trackingUrl}</a>
                    </div>
                    <a href={job.trackingUrl} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    </a>
                  </div>
                )}

                {/* Design description */}
                {job.serviceType === 'design' && job.designDescription && (
                  <div className="mt-2 p-3 rounded-lg bg-pink-500/5 border border-pink-500/20">
                    <p className="text-xs font-medium text-pink-400 mb-1">Descripción del diseño</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{job.designDescription}</p>
                    {job.designReferenceUrls && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Links de referencia:</p>
                        {job.designReferenceUrls.split('\n').filter(Boolean).map((url, i) => (
                          <a key={i} href={url.trim()} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:underline truncate">
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            {url.trim()}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Price / Payment section ───────────────────────── */}
                {ps === 'quoted' && job.price != null && (
                  <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                        <DollarSign className="w-4 h-4" />
                        Cotización recibida
                      </span>
                      <div className="text-right">
                        {isStudent ? (
                          <>
                            <span className="text-xs text-muted-foreground line-through block">{formatDOP(job.price)}</span>
                            <span className="text-xl font-bold text-green-400">{formatDOP(job.price * 0.9)}</span>
                          </>
                        ) : (
                          <span className="text-xl font-bold">{formatDOP(job.price)}</span>
                        )}
                      </div>
                    </div>
                    {isStudent && (
                      <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                        <span>Descuento estudiantil 10% aplicado</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Acepta el precio para proceder con el pago, o apela si crees que no es correcto.
                    </p>

                    {priceDecisionError && (
                      <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{priceDecisionError}
                      </p>
                    )}

                    <Button
                      className="w-full text-sm"
                      onClick={() => handlePriceDecision(job.id, 'accept')}
                      disabled={priceDecisionLoading}
                      isLoading={priceDecisionLoading}
                    >
                      {!priceDecisionLoading && <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Aceptar precio y continuar
                    </Button>
                  </div>
                )}

                {(ps === 'accepted' || ps === 'appealed') && job.price != null && (
                  <div className={`mt-3 rounded-xl border p-4 ${
                    ps === 'appealed'
                      ? 'border-orange-500/30 bg-orange-500/5'
                      : 'border-cyan-500/30 bg-cyan-500/5'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold flex items-center gap-2 ${ps === 'appealed' ? 'text-orange-400' : 'text-cyan-400'}`}>
                        <DollarSign className="w-4 h-4" />
                        {ps === 'accepted' ? 'Precio aceptado' : 'Apelación enviada'}
                      </span>
                      <span className="text-lg font-bold">{formatDOP(job.price)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ps === 'accepted'
                        ? 'Esperando validación del administrador para proceder con el pago.'
                        : 'El administrador revisará tu apelación. Te notificaremos cuando esté resuelta.'}
                    </p>
                    {ps === 'appealed' && job.appealNote && (
                      <p className="text-xs text-muted-foreground mt-1 italic">Tu nota: {job.appealNote}</p>
                    )}
                  </div>
                )}

                {ps === 'validated' && job.price != null && (
                  <div className="mt-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Listo para pagar
                      </span>
                      <span className="text-xl font-bold">{formatDOP(job.price)}</span>
                    </div>
                    {job.autoQuoted && (
                      <p className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
                        Precio calculado automáticamente a partir de tu modelo STL.
                      </p>
                    )}

                    {/* Bank accounts */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Realiza la transferencia a cualquiera de estas cuentas:</p>
                      {BANK_ACCOUNTS.map((bank) => (
                        <div key={bank.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{bank.name}</p>
                            <p className="text-xs text-muted-foreground">{bank.type} · {bank.holder}</p>
                            <p className="text-sm font-mono mt-0.5">{bank.number}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(bank.number, bank.id)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors shrink-0"
                            title="Copiar número"
                          >
                            {copiedBank === bank.id
                              ? <Check className="w-4 h-4 text-green-400" />
                              : <Copy className="w-4 h-4 text-muted-foreground" />}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Pay with credits option */}
                    {userCredits > 0 && job.price != null && (() => {
                      const needed = Math.ceil(job.price / 15);
                      const canPay = userCredits >= needed;
                      return (
                        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium flex items-center gap-1.5 text-amber-400">
                              <Coins className="w-3.5 h-3.5" />Pagar con créditos
                            </span>
                            <span className="text-muted-foreground">Tienes {userCredits} créd. · Necesitas {needed}</span>
                          </div>
                          {creditPayError && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />{creditPayError}
                            </p>
                          )}
                          <Button
                            className="w-full text-sm"
                            variant={canPay ? 'default' : 'outline'}
                            disabled={!canPay || creditPayLoading}
                            isLoading={creditPayLoading}
                            onClick={() => handleCreditPayment(job.id)}
                          >
                            {!creditPayLoading && <Coins className="w-4 h-4 mr-2" />}
                            {canPay ? `Pagar con ${needed} créditos` : `Créditos insuficientes (faltan ${needed - userCredits})`}
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">— o paga por transferencia bancaria abajo —</p>
                        </div>
                      );
                    })()}

                    {/* Upload proof */}
                    {paymentJobId !== job.id ? (
                      <Button
                        className="w-full text-sm"
                        onClick={() => { setPaymentJobId(job.id); setPaymentProofFile(null); setPaymentMethod(''); setPaymentError(''); }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Subir comprobante de pago
                      </Button>
                    ) : (
                      <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">Subir comprobante</p>
                          <button
                            onClick={() => { setPaymentJobId(null); setPaymentProofFile(null); setPaymentMethod(''); setPaymentError(''); }}
                            className="p-1 hover:bg-accent rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">Banco utilizado</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          >
                            <option value="">Selecciona el banco</option>
                            {BANK_ACCOUNTS.map((b) => (
                              <option key={b.id} value={b.name}>{b.name}</option>
                            ))}
                          </select>
                        </div>

                        {!paymentProofFile ? (
                          <FileUpload
                            onUploadComplete={(name, url) => setPaymentProofFile({ fileName: name, fileUrl: url })}
                            isUploading={false}
                            acceptedExtensions={['.jpg', '.jpeg', '.png', '.webp']}
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                            <File className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="text-sm text-green-500 flex-1 truncate">{paymentProofFile.fileName}</span>
                            <button onClick={() => setPaymentProofFile(null)} className="p-1 hover:bg-accent rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {paymentError && (
                          <p className="text-xs text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{paymentError}
                          </p>
                        )}

                        {paymentProofFile && (
                          <Button
                            className="w-full"
                            onClick={() => handleSubmitPaymentProof(job.id)}
                            disabled={paymentLoading}
                            isLoading={paymentLoading}
                          >
                            {!paymentLoading && <Upload className="w-4 h-4 mr-2" />}
                            Enviar comprobante
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {ps === 'payment_uploaded' && job.price != null && (
                  <div className="mt-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Comprobante enviado
                      </span>
                      <span className="text-lg font-bold">{formatDOP(job.price)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      El administrador está verificando tu pago. Te notificaremos cuando sea confirmado.
                    </p>
                    {job.paymentMethod && (
                      <p className="text-xs text-muted-foreground">Banco: {job.paymentMethod}</p>
                    )}
                    {job.paymentProofUrl && (
                      <a
                        href={job.paymentProofUrl.replace('/uploads/', '/api/download/uploads/')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver comprobante
                      </a>
                    )}
                  </div>
                )}

                {ps === 'confirmed' && job.price != null && (
                  <div className="mt-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Pago confirmado
                      </span>
                      <span className="text-lg font-bold text-green-400">{formatDOP(job.price)}</span>
                    </div>
                    {job.paidAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Confirmado el {new Date(job.paidAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}

                {/* Maker feedback alert (needs_revision) */}
                {job.status === 'needs_revision' && job.makerFeedback && (() => {
                  let fb: { issues: string[]; notes: string; suggestion: string } | null = null;
                  try { fb = JSON.parse(job.makerFeedback); } catch { return null; }
                  if (!fb) return null;
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
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" />
                          : <ChevronDown className="w-4 h-4 text-orange-400 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 space-y-3 text-sm border-t border-orange-500/20">
                          <div className="pt-3 space-y-1.5">
                            {fb.issues.map((issueId) => {
                              const issue = MODEL_ISSUES.find((m) => m.id === issueId);
                              return issue ? (
                                <div key={issueId} className="flex items-start gap-2">
                                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
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
                            Elige una opción abajo para continuar con tu pedido.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── Revision actions ─────────────────────────────────── */}
                {job.status === 'needs_revision' && (
                  <div className="mt-3 space-y-3">
                    {resubmitJobId !== job.id && correctionJobId !== job.id && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="text-sm"
                          onClick={() => {
                            setResubmitJobId(job.id);
                            setResubmitFile(null);
                            setResubmitError('');
                            setCorrectionJobId(null);
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Subir archivo corregido
                        </Button>
                        <Button
                          variant="outline"
                          className="text-sm text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                          onClick={() => {
                            setCorrectionJobId(job.id);
                            setCorrectionError('');
                            setResubmitJobId(null);
                            setResubmitFile(null);
                          }}
                        >
                          <Wrench className="w-4 h-4 mr-2" />
                          Solicitar corrección — {CORRECTION_COST_CREDITS} créditos
                        </Button>
                      </div>
                    )}

                    {/* Resubmit form */}
                    {resubmitJobId === job.id && (
                      <div className="p-4 rounded-xl border border-border bg-card/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-primary" />
                            Subir archivo corregido
                          </p>
                          <button
                            onClick={() => { setResubmitJobId(null); setResubmitFile(null); setResubmitError(''); }}
                            className="p-1 hover:bg-accent rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {!resubmitFile ? (
                          <FileUpload
                            onUploadComplete={(name, url, size) =>
                              setResubmitFile({ fileName: name, fileUrl: url, fileSize: size })
                            }
                            isUploading={false}
                            acceptedExtensions={(() => {
                              const svc = SERVICE_TYPES.find((s) => s.id === (job.serviceType ?? 'print_3d'));
                              return svc ? [...svc.acceptedExtensions] : undefined;
                            })()}
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                            <File className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="text-sm text-green-500 flex-1 truncate">{resubmitFile.fileName}</span>
                            <button onClick={() => setResubmitFile(null)} className="p-1 hover:bg-accent rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {resubmitError && (
                          <p className="text-xs text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{resubmitError}
                          </p>
                        )}
                        {resubmitFile && (
                          <Button
                            className="w-full"
                            onClick={() => handleResubmit(job.id)}
                            disabled={resubmitLoading}
                            isLoading={resubmitLoading}
                          >
                            {!resubmitLoading && <Upload className="w-4 h-4 mr-2" />}
                            Confirmar y reenviar a impresión
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Correction confirmation */}
                    {correctionJobId === job.id && (
                      <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Solicitar corrección del modelo
                          </p>
                          <button
                            onClick={() => { setCorrectionJobId(null); setCorrectionError(''); }}
                            className="p-1 hover:bg-accent rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Un maker corregirá los problemas de tu modelo 3D. Se descontarán{' '}
                          <strong className="text-foreground">{CORRECTION_COST_CREDITS} créditos</strong> de tu cuenta de forma inmediata.
                        </p>
                        {correctionError && (
                          <p className="text-xs text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{correctionError}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => handleRequestCorrection(job.id)}
                            disabled={correctionLoading}
                            isLoading={correctionLoading}
                          >
                            {!correctionLoading && <Wrench className="w-4 h-4 mr-2" />}
                            Confirmar — {CORRECTION_COST_CREDITS} créditos
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => { setCorrectionJobId(null); setCorrectionError(''); }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Completion photo */}
                {job.status === 'completed' && job.completionPhotoUrl && (
                  <div className="mt-3 p-3 rounded-xl border border-green-500/30 bg-green-500/5">
                    <p className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> Foto del trabajo terminado
                    </p>
                    <a href={`/api/download${job.completionPhotoUrl}`} target="_blank" rel="noopener noreferrer">
                      <img
                        src={`/api/download${job.completionPhotoUrl}`}
                        alt="Trabajo completado"
                        className="rounded-lg max-h-48 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </a>
                  </div>
                )}

                {/* Rating */}
                {job.status === 'completed' && (
                  <div className="mt-3">
                    {job.ratedAt ? (
                      <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                        <p className="text-xs text-muted-foreground mb-1.5">Tu calificación</p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-4 h-4 ${s <= (job.rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                          ))}
                          <span className="text-xs text-muted-foreground ml-2">{job.rating}/5</span>
                        </div>
                        {job.ratingComment && (
                          <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{job.ratingComment}&rdquo;</p>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full text-sm text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
                        onClick={() => { setRatingJobId(job.id); setRatingValue(0); setRatingText(''); setRatingError(''); }}
                      >
                        <Star className="w-4 h-4 mr-2" />Calificar este trabajo
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Payment History ───────────────────────────────────────────── */}
      {confirmedJobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-bold">Historial de Pagos</h3>
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Archivo</th>
                    <th className="text-left px-4 py-3 font-medium">Servicio</th>
                    <th className="text-left px-4 py-3 font-medium">Banco</th>
                    <th className="text-right px-4 py-3 font-medium">Monto</th>
                    <th className="text-left px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {confirmedJobs.map((job) => (
                    <tr key={job.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[200px]">{job.fileName}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {getServiceLabel(job.serviceType)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {job.paymentMethod ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-400">
                        {job.price != null ? formatDOP(job.price) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {job.paidAt
                          ? new Date(job.paidAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {job.paymentProofUrl && (
                          <a
                            href={job.paymentProofUrl.replace('/uploads/', '/api/download/uploads/')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Ver
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
      </>)}

      {/* ── Rating modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {ratingJobId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />Calificar trabajo
                </h3>
                <button onClick={() => setRatingJobId(null)} className="p-1 rounded-lg hover:bg-white/10 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">¿Cómo fue tu experiencia con este trabajo?</p>

              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRatingValue(s)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`w-8 h-8 ${s <= ratingValue ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/40'}`} />
                  </button>
                ))}
              </div>
              {ratingValue > 0 && (
                <p className="text-center text-xs text-muted-foreground mb-3">
                  {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][ratingValue]}
                </p>
              )}

              <textarea
                value={ratingText}
                onChange={(e) => setRatingText(e.target.value)}
                placeholder="Comentario opcional..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none mb-3"
              />

              {ratingError && <p className="text-xs text-red-400 mb-3">{ratingError}</p>}

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={handleRateJob}
                  isLoading={ratingLoading}
                  disabled={ratingValue < 1 || ratingLoading}
                >
                  Enviar calificación
                </Button>
                <Button variant="outline" onClick={() => setRatingJobId(null)} disabled={ratingLoading}>
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Spec({ label }: { label: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">{label}</span>
  );
}
