import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setWasOffline(false);
        toast({
          title: 'تم استعادة الاتصال',
          description: 'أنت متصل بالإنترنت الآن',
          duration: 3000,
        });
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, toast]);

  const requireNetwork = useCallback(
    (action: () => void): boolean => {
      if (!navigator.onLine) {
        toast({
          title: 'لا يوجد اتصال بالإنترنت',
          description: 'يرجى فتح الإنترنت والمحاولة مرة أخرى',
          variant: 'destructive',
          duration: 4000,
        });
        return false;
      }
      action();
      return true;
    },
    [toast]
  );

  return { isOnline, wasOffline, requireNetwork };
}
