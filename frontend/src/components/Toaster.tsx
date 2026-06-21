'use client';
import { ToastProvider, ToastViewport } from '@/components/ui/Toast';
export function Toaster() {
  return <ToastProvider><ToastViewport /></ToastProvider>;
}