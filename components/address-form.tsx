'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DR_PROVINCES } from '@/lib/print-constants';

export interface AddressFormValues {
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  sector: string;
  city: string;
  province: string;
  notes: string;
}

const EMPTY_ADDRESS: AddressFormValues = {
  label: '',
  recipientName: '',
  phone: '',
  street: '',
  sector: '',
  city: '',
  province: '',
  notes: '',
};

interface AddressFormProps {
  initial?: Partial<AddressFormValues>;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function AddressForm({ initial, onSubmit, onCancel, submitLabel = 'Guardar dirección' }: AddressFormProps) {
  const [values, setValues] = useState<AddressFormValues>({ ...EMPTY_ADDRESS, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field: keyof AddressFormValues, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(values);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la dirección');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Etiqueta <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Casa, Oficina..."
            value={values.label}
            onChange={(e) => update('label', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Nombre del destinatario <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={values.recipientName}
            onChange={(e) => update('recipientName', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          Teléfono de contacto <span className="text-red-400">*</span>
        </label>
        <input
          type="tel"
          placeholder="809-000-0000"
          value={values.phone}
          onChange={(e) => update('phone', e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          Calle y número <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          placeholder="Calle, número, edificio/apto"
          value={values.street}
          onChange={(e) => update('street', e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
          required
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Sector <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={values.sector}
            onChange={(e) => update('sector', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Ciudad/Municipio <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={values.city}
            onChange={(e) => update('city', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Provincia <span className="text-red-400">*</span>
          </label>
          <select
            value={values.province}
            onChange={(e) => update('province', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
            required
          >
            <option value="">Selecciona...</option>
            {DR_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Notas adicionales (opcional)</label>
        <input
          type="text"
          placeholder="Referencia, color de la casa, etc."
          value={values.notes}
          onChange={(e) => update('notes', e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm"
        />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" className="flex-1" isLoading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
