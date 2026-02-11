'use client';

import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

interface ErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  error: string | null;
}

export function ErrorDialog({
  open,
  onOpenChange,
  title,
  error,
}: ErrorDialogProps) {
  const { t } = useTranslation();

  if (!error) return null;

  const dialogTitle = title || t('dialogs.error.title');

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-destructive">
            {error}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button onClick={handleClose}>{t('dialogs.error.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
