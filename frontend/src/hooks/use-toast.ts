import { useToast as useSonner } from '@/components/ui/toast'; // если используешь Radix Toast

// Простая версия
export function useToast() {
  return {
    toast: ({ title, description, variant = "default" }: any) => {
      // Пока используем alert как fallback, позже заменим
      console.log(`[Toast] ${title}: ${description}`);
      alert(`${title}\n${description}`); // временно
    }
  };
}
