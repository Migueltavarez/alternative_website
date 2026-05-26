'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Ruler, ArrowRightLeft, Calculator } from 'lucide-react';

const UNITS = [
  { value: 'mm', label: 'mm', toMm: 1 },
  { value: 'cm', label: 'cm', toMm: 10 },
  { value: 'm', label: 'm', toMm: 1000 },
  { value: 'km', label: 'km', toMm: 1000000 },
  { value: 'in', label: 'pulgadas', toMm: 25.4 },
  { value: 'ft', label: 'pies', toMm: 304.8 },
  { value: 'yd', label: 'yardas', toMm: 914.4 },
  { value: 'mi', label: 'millas', toMm: 1609344 },
];

export function ScaleConverter() {
  const [scaleRatio, setScaleRatio] = useState('1:35');
  const [realLength, setRealLength] = useState('');
  const [realUnit, setRealUnit] = useState('cm');
  const [scaledLength, setScaledLength] = useState('');
  const [scaledUnit, setScaledUnit] = useState('mm');
  const [activeInput, setActiveInput] = useState<'real' | 'scaled'>('real');

  const parseRatio = (ratio: string) => {
    const parts = ratio.split(':');
    if (parts.length === 2) {
      const [, scale] = parts;
      return parseFloat(scale) || 1;
    }
    return 1;
  };

  const getUnit = (value: string) => UNITS.find(u => u.value === value) || UNITS[0];

  const calculateRealToScaled = (value: number) => {
    const scale = parseRatio(scaleRatio);
    return value / scale;
  };

  const calculateScaledToReal = (value: number) => {
    const scale = parseRatio(scaleRatio);
    return value * scale;
  };

  const convertLength = (value: number, fromUnit: string, toUnit: string) => {
    const from = getUnit(fromUnit);
    const to = getUnit(toUnit);
    return (value * from.toMm) / to.toMm;
  };

  const handleRealLengthChange = (value: string) => {
    setActiveInput('real');
    setRealLength(value);
    
    if (value && !isNaN(parseFloat(value))) {
      const val = parseFloat(value);
      const inMm = convertLength(val, realUnit, 'mm');
      const scaledInMm = calculateRealToScaled(inMm);
      const finalVal = convertLength(scaledInMm, 'mm', scaledUnit);
      setScaledLength(finalVal.toFixed(2));
    } else {
      setScaledLength('');
    }
  };

  const handleScaledLengthChange = (value: string) => {
    setActiveInput('scaled');
    setScaledLength(value);
    
    if (value && !isNaN(parseFloat(value))) {
      const val = parseFloat(value);
      const inMm = convertLength(val, scaledUnit, 'mm');
      const realInMm = calculateScaledToReal(inMm);
      const finalVal = convertLength(realInMm, 'mm', realUnit);
      setRealLength(finalVal.toFixed(2));
    } else {
      setRealLength('');
    }
  };

  const handleUnitChange = (type: 'real' | 'scaled', unit: string) => {
    if (type === 'real') {
      setRealUnit(unit);
      if (realLength && activeInput === 'real') {
        handleRealLengthChange(realLength);
      }
    } else {
      setScaledUnit(unit);
      if (scaledLength && activeInput === 'scaled') {
        handleScaledLengthChange(scaledLength);
      }
    }
  };

  const swapUnits = () => {
    const tempUnit = realUnit;
    setRealUnit(scaledUnit);
    setScaledUnit(tempUnit);
    
    const tempLength = realLength;
    setRealLength(scaledLength);
    setScaledLength(tempLength);
  };

  const handleScaleChange = (value: string) => {
    if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      setScaleRatio(`1:${value}`);
      if (realLength && activeInput === 'real') {
        handleRealLengthChange(realLength);
      } else if (scaledLength && activeInput === 'scaled') {
        handleScaledLengthChange(scaledLength);
      }
    } else if (value === '' || value === '0') {
      setScaleRatio('');
    }
  };

  return (
    <section id="scale-converter" className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Calculator className="w-6 h-6 text-primary" />
            <span className="text-blue-500 font-semibold text-sm uppercase tracking-wider">Herramientas</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Convertidor de Escala</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Convierte fácilmente entre medidas reales y de escala. Ideal para modelismo, impresión 3D y proyectos de miniaturización.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <Ruler className="w-5 h-5 text-primary" />
            <span className="font-semibold">Relación de escala</span>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">1 :</span>
              <input
                type="number"
                value={scaleRatio.split(':')[1] || ''}
                onChange={(e) => handleScaleChange(e.target.value)}
                placeholder="35"
                min="1"
                className="w-24 px-4 py-2 rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none text-center font-medium"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium mb-2">Longitud Real</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={realLength}
                    onChange={(e) => handleRealLengthChange(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  <select
                    value={realUnit}
                    onChange={(e) => handleUnitChange('real', e.target.value)}
                    className="px-3 py-3 rounded-lg bg-background border border-input focus:border-primary outline-none cursor-pointer min-w-[110px]"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={swapUnits}
                className="p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors md:mt-6"
                title="Intercambiar"
              >
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="flex-1 w-full">
                <label className="block text-sm font-medium mb-2">Longitud en Escala</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={scaledLength}
                    onChange={(e) => handleScaledLengthChange(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  <select
                    value={scaledUnit}
                    onChange={(e) => handleUnitChange('scaled', e.target.value)}
                    className="px-3 py-3 rounded-lg bg-background border border-input focus:border-primary outline-none cursor-pointer min-w-[110px]"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {scaleRatio && realLength && scaledLength && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-lg bg-primary/10 border border-primary/20"
              >
                <p className="text-sm text-center">
                  <span className="font-semibold text-primary">{realLength} {getUnit(realUnit).label}</span>
                  {' en el mundo real = '}
                  <span className="font-semibold text-primary">{scaledLength} {getUnit(scaledUnit).label}</span>
                  {' a escala '}
                  <span className="font-semibold text-primary">{scaleRatio}</span>
                </p>
              </motion.div>
            )}

            <div className="pt-4 border-t border-border/50">
              <div className="text-sm text-muted-foreground">
                <p>Fórmula: Escala = Real ÷ {scaleRatio.split(':')[1] || '?'}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
