import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { formatCurrency, formatPercent } from '../lib/utils';
import { useTranslation } from 'react-i18next';

interface Entry {
  price: number;
  percent: number;
}

interface TradeSetupVisualizerProps {
  entries: Entry[];
  stopLoss: number;
  takeProfits: Entry[];
  positionType: 'LONG' | 'SHORT';
  metrics?: {
    weightedEntry?: number;
    distances?: {
      distanceSL_PCT: number;
    };
    plannedWeightedRR?: number;
    margin?: number;
    oneR?: number;
  };
}

export function TradeSetupVisualizer({
  entries,
  stopLoss,
  takeProfits,
  positionType,
  metrics,
}: TradeSetupVisualizerProps) {
  const { t } = useTranslation();

  // Calculate weighted entry price
  const validEntries = entries.filter(e => e.price > 0 && e.percent > 0);
  const totalEntryPercent = validEntries.reduce((sum, e) => sum + e.percent, 0);
  const weightedEntry = validEntries.length > 0
    ? validEntries.reduce((sum, e) => sum + (e.price * e.percent / totalEntryPercent), 0)
    : 0;

  // Calculate weighted TP price
  const validTps = takeProfits.filter(tp => tp.price > 0 && tp.percent > 0);
  const totalTpPercent = validTps.reduce((sum, tp) => sum + tp.percent, 0);
  const weightedTp = validTps.length > 0
    ? validTps.reduce((sum, tp) => sum + (tp.price * tp.percent / totalTpPercent), 0)
    : 0;

  if (!weightedEntry || !stopLoss || !weightedTp) {
    return null;
  }

  // Calculate distances
  const isLong = positionType === 'LONG';

  const slDistance = Math.abs(weightedEntry - stopLoss);
  const tpDistance = Math.abs(weightedTp - weightedEntry);
  const totalDistance = slDistance + tpDistance;

  // Calculate percentages for sizing (actual pixel heights will be proportional)
  const slHeightPercent = (slDistance / totalDistance) * 100;
  const tpHeightPercent = (tpDistance / totalDistance) * 100;

  // Base height for visualization (total height for both bars combined)
  const baseHeight = 280;
  const slPixelHeight = (slHeightPercent / 100) * baseHeight;
  const tpPixelHeight = (tpHeightPercent / 100) * baseHeight;

  // Calculate price distance percentages (as decimals for formatPercent)
  const slDistancePct = metrics?.distances?.distanceSL_PCT || (slDistance / weightedEntry);
  const tpDistancePct = (tpDistance / weightedEntry);
  const rrRatio = metrics?.plannedWeightedRR || (tpDistance / slDistance);

  // Determine visual layout based on position type
  const topPrice = isLong ? weightedTp : stopLoss;
  const bottomPrice = isLong ? stopLoss : weightedTp;
  const topLabel = isLong ? 'TP' : 'SL';
  const bottomLabel = isLong ? 'SL' : 'TP';
  const topColor = isLong ? 'bg-success/30 border-success' : 'bg-destructive/30 border-destructive';
  const bottomColor = isLong ? 'bg-destructive/30 border-destructive' : 'bg-success/30 border-success';
  const topPixelHeight = isLong ? tpPixelHeight : slPixelHeight;
  const bottomPixelHeight = isLong ? slPixelHeight : tpPixelHeight;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {t('calculator.visualSetup') || 'Visual Setup'}
          <Badge variant={positionType === 'LONG' ? 'default' : 'destructive'}>
            {positionType}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-6">
          {/* Risk/Reward Bars */}
          <div className="flex flex-col items-center">
            {/* Top section (TP for LONG, SL for SHORT) */}
            <div className="relative flex flex-col items-center">
              <div
                className={`border-2 rounded-t-lg transition-all ${topColor}`}
                style={{
                  width: '200px',
                  height: `${Math.max(topPixelHeight, 40)}px`,
                }}
              />
              {/* Top label with price */}
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 whitespace-nowrap">
                <div className={`font-mono font-semibold ${
                  isLong ? 'text-success' : 'text-destructive'
                }`}>
                  <span className="text-sm">{topLabel}{isLong && validTps.length > 1 ? ' (avg)' : (!isLong && validEntries.length > 1 ? ' (avg)' : '')}: </span>
                  <span className="text-xs">{topPrice.toFixed(8)}</span>
                </div>
              </div>
            </div>

            {/* Entry line */}
            <div className="relative w-full my-1">
              <div className="h-0.5 bg-primary" style={{ width: '200px' }} />
              <div className="absolute left-0 top-1/2 -translate-y-1/2">
                <div className="w-3 h-3 rounded-full bg-primary border-2 border-background" />
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="w-3 h-3 rounded-full bg-primary border-2 border-background" />
              </div>
              {/* Entry label with price */}
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 whitespace-nowrap">
                <div className="font-mono font-semibold text-primary">
                  <span className="text-sm">Entry{validEntries.length > 1 ? ' (avg)' : ''}: </span>
                  <span className="text-xs">{weightedEntry.toFixed(8)}</span>
                </div>
              </div>
            </div>

            {/* Bottom section (SL for LONG, TP for SHORT) */}
            <div className="relative flex flex-col items-center">
              <div
                className={`border-2 rounded-b-lg transition-all ${bottomColor}`}
                style={{
                  width: '200px',
                  height: `${Math.max(bottomPixelHeight, 40)}px`,
                }}
              />
              {/* Bottom label with price */}
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 whitespace-nowrap">
                <div className={`font-mono font-semibold ${
                  isLong ? 'text-destructive' : 'text-success'
                }`}>
                  <span className="text-sm">{bottomLabel}{!isLong && validTps.length > 1 ? ' (avg)' : (isLong && validEntries.length > 1 ? ' (avg)' : '')}: </span>
                  <span className="text-xs">{bottomPrice.toFixed(8)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
