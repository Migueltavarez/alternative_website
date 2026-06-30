export interface PricingConfigData {
  materialDensity: Record<string, number>;        // g/cm3 by material name
  materialPricePerGram: Record<string, number>;   // RD$/gram by material name (our cost)
  materialMarginPercent: Record<string, number>;  // % margin per material (e.g. 30 = 30%), overrides platformMargin
  machineRatePerHour: number;                     // RD$/hour
  platformMargin: number;                         // fallback margin (0.30 = 30%)
  makerSplit: number;                             // e.g. 0.70
  extrusionRateByQuality: Record<string, number>; // g/hour: { draft, standard, fine }
}

export interface QuoteInput {
  volumeCm3: number;
  bboxZ: number;       // model height in mm (used for setup overhead)
  material: string;
  infill: number;      // percentage: 15–100
  quality: 'draft' | 'standard' | 'fine';
}

export interface QuoteResult {
  weightG: number;           // estimated filament weight
  printTimeHours: number;    // estimated print time
  costMaterial: number;      // RD$
  costMachine: number;       // RD$
  costBase: number;          // costMaterial + costMachine
  priceClient: number;       // costBase * (1 + margin), rounded
  makerEarning: number;      // costBase * makerSplit, rounded
  platformEarning: number;   // priceClient - makerEarning
  breakdown: {
    weightG: number;
    density: number;
    pricePerGram: number;
    extrusionRateGH: number;
    machineRatePerHour: number;
    margin: number;
  };
}

export function calculateQuote(input: QuoteInput, config: PricingConfigData): QuoteResult {
  const density = config.materialDensity[input.material] ?? 1.24;
  const pricePerGram = config.materialPricePerGram[input.material] ?? 0.40;
  const extrusionRateGH = config.extrusionRateByQuality[input.quality] ?? 15;

  // Weight = volume × density × infill factor
  // Shells + top/bottom account for ~30% of material regardless of infill
  const infillFraction = input.infill / 100;
  const effectiveDensityFactor = 0.30 + 0.70 * infillFraction;
  const weightG = input.volumeCm3 * density * effectiveDensityFactor;

  // Print time = how long it takes to extrude that weight
  const printTimeHours = weightG / extrusionRateGH;

  const costMaterial = weightG * pricePerGram;
  const costMachine = printTimeHours * config.machineRatePerHour;
  const costBase = costMaterial + costMachine;

  const matMarginPct = config.materialMarginPercent?.[input.material];
  const effectiveMargin = matMarginPct != null ? matMarginPct / 100 : config.platformMargin;
  const priceClient = Math.ceil(costBase * (1 + effectiveMargin) / 10) * 10; // round up to nearest RD$10
  const makerEarning = Math.floor(costBase * config.makerSplit);
  const platformEarning = priceClient - makerEarning;

  return {
    weightG: Math.round(weightG * 10) / 10,
    printTimeHours: Math.round(printTimeHours * 10) / 10,
    costMaterial: Math.round(costMaterial),
    costMachine: Math.round(costMachine),
    costBase: Math.round(costBase),
    priceClient,
    makerEarning,
    platformEarning,
    breakdown: {
      weightG: Math.round(weightG * 10) / 10,
      density,
      pricePerGram,
      extrusionRateGH,
      machineRatePerHour: config.machineRatePerHour,
      margin: config.platformMargin,
    },
  };
}

export const DEFAULT_PRICING_CONFIG: PricingConfigData = {
  materialMarginPercent: {
    'PLA': 30, 'PLA+': 30, 'SILK PLA': 35, 'ABS': 30,
    'PETG': 30, 'TPU (Flexible)': 35, 'ASA': 35, 'Nylon': 35,
    'Resina (SLA)': 40, 'WOOD PLA': 30,
  },
  materialDensity: {
    'PLA': 1.24,
    'PLA+': 1.24,
    'SILK PLA': 1.24,
    'ABS': 1.05,
    'PETG': 1.27,
    'TPU (Flexible)': 1.21,
    'ASA': 1.07,
    'Nylon': 1.14,
    'Resina (SLA)': 1.18,
    'WOOD PLA': 1.15,
  },
  materialPricePerGram: {
    'PLA': 0.40,
    'PLA+': 0.45,
    'SILK PLA': 0.55,
    'ABS': 0.48,
    'PETG': 0.50,
    'TPU (Flexible)': 0.65,
    'ASA': 0.55,
    'Nylon': 0.70,
    'Resina (SLA)': 0.90,
    'WOOD PLA': 0.45,
  },
  machineRatePerHour: 100,
  platformMargin: 0.30,
  makerSplit: 0.70,
  extrusionRateByQuality: {
    draft: 25,
    standard: 15,
    fine: 8,
  },
};

export function parsePricingConfig(raw: {
  materialDensity: string;
  materialPricePerGram: string;
  materialMarginPercent?: string;
  machineRatePerHour: number;
  platformMargin: number;
  makerSplit: number;
  extrusionRateByQuality: string;
}): PricingConfigData {
  return {
    materialDensity: JSON.parse(raw.materialDensity),
    materialPricePerGram: JSON.parse(raw.materialPricePerGram),
    materialMarginPercent: raw.materialMarginPercent ? JSON.parse(raw.materialMarginPercent) : {},
    machineRatePerHour: raw.machineRatePerHour,
    platformMargin: raw.platformMargin,
    makerSplit: raw.makerSplit,
    extrusionRateByQuality: JSON.parse(raw.extrusionRateByQuality),
  };
}
