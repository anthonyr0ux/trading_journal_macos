import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { api, type Trade } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { RotateCcw, Trash2 } from 'lucide-react';

interface TrashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTradeRestored?: () => void;
}

export function TrashDialog({ open, onOpenChange, onTradeRestored }: TrashDialogProps) {
  const { t } = useTranslation();
  const [deletedTrades, setDeletedTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ total: number; deleted: number; active: number } | null>(null);

  const loadDeletedTrades = async () => {
    setLoading(true);
    try {
      const trades = await api.getDeletedTrades();
      setDeletedTrades(trades);

      // Also load stats
      const statsData = await api.getAllTradesIncludingDeleted();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load deleted trades:', error);
      toast.error('Failed to load deleted trades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadDeletedTrades();
    }
  }, [open]);

  const handleRestore = async (id: string) => {
    try {
      await api.restoreTrade(id);
      toast.success('Trade restored successfully');
      setDeletedTrades(deletedTrades.filter(t => t.id !== id));
      onTradeRestored?.();
    } catch (error) {
      console.error('Failed to restore trade:', error);
      toast.error('Failed to restore trade');
    }
  };

  const handleRestoreAll = async () => {
    try {
      const count = await api.restoreAllTrades();
      toast.success(`${count} trade(s) restored successfully`);
      setDeletedTrades([]);
      onTradeRestored?.();
      loadDeletedTrades(); // Reload to update stats
    } catch (error) {
      console.error('Failed to restore all trades:', error);
      toast.error('Failed to restore all trades');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                {t('trash.title') || 'Trash'}
              </DialogTitle>
              <DialogDescription>
                {t('trash.description') || 'Deleted trades can be restored from here'}
              </DialogDescription>
            </div>
            {deletedTrades.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleRestoreAll}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore All
              </Button>
            )}
          </div>
          {stats && (
            <div className="text-xs text-muted-foreground mt-2">
              Total: {stats.total} | Active: {stats.active} | Deleted: {stats.deleted}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.loading') || 'Loading...'}
            </div>
          ) : deletedTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('trash.empty') || 'No deleted trades'}
            </div>
          ) : (
            <div className="space-y-2">
              {deletedTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{trade.pair}</span>
                        <Badge variant={trade.position_type === 'LONG' ? 'default' : 'destructive'} className="text-xs">
                          {trade.position_type}
                        </Badge>
                        <Badge
                          variant={
                            trade.status === 'WIN' ? 'default' :
                            trade.status === 'LOSS' ? 'destructive' :
                            trade.status === 'BE' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {trade.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {trade.exchange} • {formatDate(trade.trade_date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {trade.total_pnl != null && (
                      <span className={`font-semibold ${
                        trade.total_pnl > 0 ? 'text-success' :
                        trade.total_pnl < 0 ? 'text-destructive' :
                        'text-muted-foreground'
                      }`}>
                        {formatCurrency(trade.total_pnl)}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(trade.id)}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t('trash.restore') || 'Restore'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
