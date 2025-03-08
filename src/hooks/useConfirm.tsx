import { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({ isOpen, title = "Confirm Action", message, onConfirm, onCancel }: ConfirmDialogProps) => (
  <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{message}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

interface ConfirmOptions {
  title?: string;
}

export const useConfirm = () => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    message: '',
    title: undefined,
    resolve: null,
  });

  const confirm = useCallback((message: string, options: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        isOpen: true,
        message,
        title: options.title,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [dialogState]);

  const handleCancel = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [dialogState]);

  const ConfirmationDialog = useCallback(() => (
    <ConfirmDialog
      isOpen={dialogState.isOpen}
      title={dialogState.title}
      message={dialogState.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ), [dialogState.isOpen, dialogState.title, dialogState.message, handleConfirm, handleCancel]);

  return {
    confirm,
    ConfirmationDialog,
  };
}; 