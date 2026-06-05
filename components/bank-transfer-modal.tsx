'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Upload, Loader2, CheckCircle2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BANK_ACCOUNTS = [
  { bank: 'Banco Popular', account: '845305069' },
  { bank: 'BanReservas', account: '9602115241' },
  { bank: 'BHD León', account: '28045670024' },
  { bank: 'Qik (Banreservas)', account: '1004202038' },
];

const BANKS = BANK_ACCOUNTS.map(b => b.bank);

interface BankTransferModalProps {
  open: boolean;
  onClose: () => void;
  type: 'credits' | 'subscription';
  purchaseId: string;
  itemName: string;
  priceDOP: number;
  onSuccess: () => void;
}

export function BankTransferModal({
  open,
  onClose,
  type,
  purchaseId,
  itemName,
  priceDOP,
  onSuccess,
}: BankTransferModalProps) {
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyAccount = (account: string) => {
    navigator.clipboard.writeText(account);
    setCopiedAccount(account);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProofFile(file);
  };

  const handleSubmit = async () => {
    if (!proofFile) {
      setError('Debes subir el comprobante de pago');
      return;
    }
    if (!selectedBank) {
      setError('Selecciona el banco desde el que realizaste la transferencia');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', proofFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json();
        throw new Error(uploadData.error || 'Error al subir el comprobante');
      }

      const { fileUrl } = await uploadRes.json();

      const proofEndpoint =
        type === 'credits'
          ? `/api/credits/${purchaseId}/payment-proof`
          : `/api/subscriptions/${purchaseId}/payment-proof`;

      const proofRes = await fetch(proofEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentProofUrl: fileUrl,
          paymentMethod: selectedBank,
        }),
      });

      if (!proofRes.ok) {
        const proofData = await proofRes.json();
        throw new Error(proofData.error || 'Error al enviar el comprobante');
      }

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    setProofFile(null);
    setSelectedBank('');
    setError(null);
    setSubmitted(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold">Comprobante enviado</h3>
                <p className="text-muted-foreground text-sm">
                  Tu comprobante fue recibido. Lo revisaremos y confirmaremos tu pago en breve.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Transferencia Bancaria</h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 mb-5">
                  <p className="text-sm text-muted-foreground">Compra</p>
                  <p className="font-semibold">{itemName}</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    RD${priceDOP.toLocaleString()}
                  </p>
                </div>

                <div className="mb-5">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Realiza la transferencia a cualquiera de estas cuentas:
                  </p>
                  <div className="space-y-2">
                    {BANK_ACCOUNTS.map(({ bank, account }) => (
                      <div
                        key={account}
                        className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                      >
                        <div>
                          <p className="text-sm font-medium">{bank}</p>
                          <p className="text-sm font-mono text-muted-foreground">{account}</p>
                        </div>
                        <button
                          onClick={() => copyAccount(account)}
                          className="p-2 rounded-lg hover:bg-accent transition-colors shrink-0"
                        >
                          {copiedAccount === account ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Titular: <span className="font-medium text-foreground">Miguel Tavarez</span>
                  </p>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">
                    Banco desde el que transferiste *
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Selecciona un banco...</option>
                    {BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="Otro">Otro banco</option>
                  </select>
                </div>

                <div className="mb-5">
                  <label className="text-sm font-medium mb-2 block">
                    Comprobante de pago *
                  </label>
                  <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-card">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    {proofFile ? (
                      <span className="text-sm font-medium text-primary">{proofFile.name}</span>
                    ) : (
                      <>
                        <span className="text-sm text-muted-foreground">
                          Sube foto o PDF del comprobante
                        </span>
                        <span className="text-xs text-muted-foreground">JPG, PNG, PDF — Max 10MB</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,.webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                {error && (
                  <p className="text-sm text-red-400 mb-4 px-1">{error}</p>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar comprobante'
                  )}
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
