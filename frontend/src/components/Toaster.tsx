'use client';

import { useToast } from '@/hooks/use-toast';

export function Toaster() {
  const { ToastContainer } = useToast();
  return <ToastContainer />;
}
