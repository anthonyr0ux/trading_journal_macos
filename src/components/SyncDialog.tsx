'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api, SyncResult } from '@/lib/api';

interface SyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentialId: string;
  exchangeName: string;
  historyLimit: string;
  onComplete: () => void;
}

export function SyncDialog({
  open,
  onOpenChange,
  credentialId,
  exchangeName,
  historyLimit,
  onComplete,
}: SyncDialogProps) {
  const { t } = useTranslation();
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleConfirm = async () => {
    setIsSyncing(true);
    try {
      const syncResult = await api.syncExchangeTrades({
        credential_id: credentialId,
        start_date: undefined,
        end_date: undefined,
        skip_duplicates: true,
      });
      setResult(syncResult);
      onComplete();
    } catch (error) {
      setResult({
        imported: 0,
        duplicates: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        total_pnl: 0,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

  const hasErrors = result && result.errors.length > 0;
  const isSuccess = result && result.errors.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle>Sync trades from {exchangeName.toUpperCase()}?</DialogTitle>
              <DialogDescription>
                This will import new trades from the available history (up to {historyLimit} as per{' '}
                {exchangeName.toUpperCase()} API limit).
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isSyncing}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleConfirm} disabled={isSyncing}>
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Sync Now'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Sync Completed Successfully!
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Sync Completed with Warnings
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Imported</p>
                  <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duplicates Skipped</p>
                  <p className="text-2xl font-bold text-yellow-600">{result.duplicates}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">Total PnL</p>
                <p
                  className={`text-2xl font-bold ${
                    (result.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ${result.total_pnl?.toFixed(2) || '0.00'}
                </p>
              </div>

              {hasErrors && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  <p className="font-medium text-sm mb-2">Errors:</p>
                  <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 5).map((error, i) => (
                      <li key={i} className="text-muted-foreground">
                        • {error}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-muted-foreground italic">
                        ...and {result.errors.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
