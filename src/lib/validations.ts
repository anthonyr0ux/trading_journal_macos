import { z } from 'zod';

// Translation function type
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export const createPlannedTPSchema = (t: TranslateFn) => z.object({
  price: z.number().positive(t('validations.priceMustBePositive')),
  percent: z.number().min(0.01).max(1, t('validations.percentRange')),
  rr: z.number(),
});

export const createExitSchema = (t: TranslateFn) => z.object({
  type: z.enum(['TP1', 'TP2', 'TP3', 'TP4', 'BE', 'SL']),
  price: z.number().positive(t('validations.priceMustBePositive')),
  percent: z.number().min(0.01).max(1, t('validations.percentRange')),
  rr: z.number(),
  pnl: z.number(),
});

// Keep original exports for backward compatibility (uses English by default)
export const plannedTPSchema = z.object({
  price: z.number().positive('Price must be positive'),
  percent: z.number().min(0.01).max(1, 'Percent must be between 1% and 100%'),
  rr: z.number(),
});

export const exitSchema = z.object({
  type: z.enum(['TP1', 'TP2', 'TP3', 'TP4', 'BE', 'SL']),
  price: z.number().positive('Price must be positive'),
  percent: z.number().min(0.01).max(1, 'Percent must be between 1% and 100%'),
  rr: z.number(),
  pnl: z.number(),
});

export const createTradeFormSchema = (t: TranslateFn) => {
  const plannedTPSchema = createPlannedTPSchema(t);
  const exitSchema = createExitSchema(t);

  return z.object({
    pair: z
      .string()
      .min(1, t('validations.pairRequired'))
      .regex(/^[A-Z]+\/[A-Z]+$/, t('validations.pairFormat')),
    exchange: z.string().min(1, t('validations.exchangeRequired')),
    analysisDate: z.date(),
    tradeDate: z.date(),
    portfolioValue: z.number().positive(t('validations.portfolioMustBePositive')),
    rPercent: z
      .number()
      .min(0.001, t('validations.rPercentMin'))
      .max(1, t('validations.rPercentMax')),
    minRR: z.number().positive(t('validations.minRRMustBePositive')),
    plannedPE: z.number().positive(t('validations.entryMustBePositive')),
    plannedSL: z.number().positive(t('validations.priceMustBePositive')),
    leverage: z
      .number()
      .int()
      .min(1, t('validations.leverageMin'))
      .max(125, t('validations.leverageMax')),
    plannedTPs: z
      .array(plannedTPSchema)
      .min(1, t('validations.atLeastOneTP'))
      .max(4, t('validations.maxFourTPs')),
    notes: z.string().optional(),
    effectivePE: z.number().positive().optional().nullable(),
    closeDate: z.date().optional().nullable(),
    exits: z.array(exitSchema).optional(),
  }).refine((data) => data.plannedPE !== data.plannedSL, {
    message: t('validations.slMustDifferFromEntry'),
    path: ['plannedSL'],
  }).refine((data) => {
    // Check that all TP prices are different from PE
    return data.plannedTPs.every(tp => tp.price !== data.plannedPE);
  }, {
    message: t('validations.tpMustDifferFromEntry'),
    path: ['plannedTPs'],
  });
};

export const tradeFormSchema = z.object({
  pair: z
    .string()
    .min(1, 'Trading pair is required')
    .regex(/^[A-Z]+\/[A-Z]+$/, 'Must be in format BTC/USDT'),
  exchange: z.string().min(1, 'Exchange is required'),
  analysisDate: z.date(),
  tradeDate: z.date(),
  portfolioValue: z.number().positive('Portfolio value must be positive'),
  rPercent: z
    .number()
    .min(0.001, 'R% must be at least 0.1%')
    .max(1, 'R% cannot exceed 100%'),
  minRR: z.number().positive('Minimum RR must be positive'),
  plannedPE: z.number().positive('Entry price must be positive'),
  plannedSL: z.number().positive('Stop loss must be positive'),
  leverage: z
    .number()
    .int()
    .min(1, 'Leverage must be at least 1x')
    .max(125, 'Leverage cannot exceed 125x'),
  plannedTPs: z
    .array(plannedTPSchema)
    .min(1, 'At least one take profit is required')
    .max(4, 'Maximum 4 take profits allowed'),
  notes: z.string().optional(),
  effectivePE: z.number().positive().optional().nullable(),
  closeDate: z.date().optional().nullable(),
  exits: z.array(exitSchema).optional(),
}).refine((data) => data.plannedPE !== data.plannedSL, {
  message: 'Stop Loss must be different from Entry',
  path: ['plannedSL'],
}).refine((data) => {
  // Check that all TP prices are different from PE
  return data.plannedTPs.every(tp => tp.price !== data.plannedPE);
}, {
  message: 'Take Profit prices must not equal Entry Price',
  path: ['plannedTPs'],
});

export const createCalculatorFormSchema = (t: TranslateFn) => z.object({
  portfolio: z.number().positive(t('validations.portfolioMustBePositive')),
  rPercent: z
    .number()
    .min(0.001, t('validations.rPercentMin'))
    .max(1, t('validations.rPercentMax')),
  minRR: z.number().positive(t('validations.minRRMustBePositive')),
  pe: z.number().positive(t('validations.entryMustBePositive')),
  sl: z.number().positive(t('validations.priceMustBePositive')),
  tp: z.number().positive(t('validations.tpMustBePositive')),
  leverage: z
    .number()
    .int()
    .min(1, t('validations.leverageMin'))
    .max(125, t('validations.leverageMax')),
});

export const createSettingsSchema = (t: TranslateFn) => z.object({
  initialCapital: z.number().positive(t('validations.portfolioMustBePositive')),
  currentRPercent: z
    .number()
    .min(0.001, t('validations.rPercentMin'))
    .max(1, t('validations.rPercentMax')),
  defaultMinRR: z.number().positive(t('validations.minRRMustBePositive')),
  defaultLeverage: z
    .number()
    .int()
    .min(1, t('validations.leverageMin'))
    .max(125, t('validations.leverageMax')),
  currency: z.string().default('USD'),
});

export const calculatorFormSchema = z.object({
  portfolio: z.number().positive('Portfolio must be positive'),
  rPercent: z
    .number()
    .min(0.001, 'R% must be at least 0.1%')
    .max(1, 'R% cannot exceed 100%'),
  minRR: z.number().positive('Minimum RR must be positive'),
  pe: z.number().positive('Entry price must be positive'),
  sl: z.number().positive('Stop loss must be positive'),
  tp: z.number().positive('Take profit must be positive'),
  leverage: z
    .number()
    .int()
    .min(1, 'Leverage must be at least 1x')
    .max(125, 'Leverage cannot exceed 125x'),
});

export const settingsSchema = z.object({
  initialCapital: z.number().positive('Initial capital must be positive'),
  currentRPercent: z
    .number()
    .min(0.001, 'R% must be at least 0.1%')
    .max(1, 'R% cannot exceed 100%'),
  defaultMinRR: z.number().positive('Minimum RR must be positive'),
  defaultLeverage: z
    .number()
    .int()
    .min(1, 'Leverage must be at least 1x')
    .max(125, 'Leverage cannot exceed 125x'),
  currency: z.string().default('USD'),
});

export type TradeFormValues = z.infer<typeof tradeFormSchema>;
export type CalculatorFormValues = z.infer<typeof calculatorFormSchema>;
export type SettingsFormValues = z.infer<typeof settingsSchema>;

/**
 * Validate entry or TP allocations sum to 100%
 *
 * @param entries - Array of entries with price and percent fields
 * @param tolerancePercentagePoints - Tolerance in percentage points (default 0.1, meaning ±0.1%)
 *                                    Note: Percentages are stored as 0-100, so 0.1 = 0.1 percentage points = 0.1%
 * @returns Validation result with valid flag, total percentage, and error messages
 *
 * @example
 * // Entries sum to 99.95% - within 0.1% tolerance
 * validateAllocation([{price: 100, percent: 33.33}, {price: 101, percent: 33.33}, {price: 102, percent: 33.29}])
 * // Returns: { valid: true, total: 99.95, errors: [] }
 */
export function validateAllocation(
  entries: Array<{ price: number; percent: number }>,
  tolerancePercentagePoints = 0.1
): { valid: boolean; total: number; errors: string[] } {
  const validEntries = entries.filter(e => e.price > 0);
  const total = validEntries.reduce((sum, e) => sum + e.percent, 0);
  const valid = Math.abs(total - 100) <= tolerancePercentagePoints;

  const errors: string[] = [];
  if (!valid && validEntries.length > 0) {
    errors.push(`Allocation (${total.toFixed(1)}%) must equal 100%`);
  }

  return { valid, total, errors };
}

/**
 * Validate trade before submission
 */
export function validateTrade(trade: {
  plannedWeightedRR: number;
  minRR: number;
  leverage: number;
  maxLeverage: number;
  totalTPPercent: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // RR check
  if (trade.plannedWeightedRR < trade.minRR) {
    errors.push(
      `RR (${trade.plannedWeightedRR.toFixed(2)}) is below minimum (${trade.minRR})`
    );
  }

  // Leverage check
  if (trade.leverage > trade.maxLeverage) {
    errors.push(
      `Leverage (${trade.leverage}x) exceeds max safe leverage (${trade.maxLeverage}x)`
    );
  }

  // TP allocation check
  if (Math.abs(trade.totalTPPercent - 1.0) > 0.001) {
    errors.push(
      `TP allocation (${(trade.totalTPPercent * 100).toFixed(0)}%) must equal 100%`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
