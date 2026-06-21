'use client';

import { ToastProvider, ToastViewport } from "./ui/Toast";

export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
}
