import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface OutOfDeliveryZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeLocation?: () => void;
  reason?: string;
  isPreview?: boolean;
}

export default function OutOfDeliveryZoneModal({
  isOpen,
  onClose,
  onChangeLocation,
  reason = 'نأسف، موقع التوصيل الحالي يقع خارج نطاق التوصيل المعتمد لدينا.',
  isPreview = false
}: OutOfDeliveryZoneModalProps) {
  // Fetch system settings for customer support contact
  const { data: settings } = useQuery<any[]>({
    queryKey: ['/api/ui-settings'],
    staleTime: 60000,
  });

  const supportWhatsapp = settings?.find((s: any) => s.key === 'support_whatsapp')?.value || '967777146387';
  const cleanWhatsappNumber = supportWhatsapp.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent('مرحباً خدمة العملاء، أود الاستفسار بشأن إمكانية التوصيل إلى موقعي.')}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="out-of-zone-title"
        >
          {/* Backdrop click to close */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
            className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 text-center z-10 overflow-hidden"
          >
            {/* Top Close Icon Button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Circular Red Sad Face with Teardrop (Matches Reference Image) */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full border-[3px] border-[#EF4444] bg-red-50/50 dark:bg-red-950/30 flex items-center justify-center mb-5 shadow-sm">
              <svg 
                className="w-12 h-12 sm:w-14 sm:h-14 text-[#EF4444]" 
                viewBox="0 0 48 48" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                {/* Left Eye */}
                <circle cx="17" cy="19" r="2.2" fill="currentColor" stroke="none" />
                {/* Right Eye */}
                <circle cx="31" cy="19" r="2.2" fill="currentColor" stroke="none" />
                {/* Teardrop under right eye */}
                <path 
                  d="M33 24 C33 26 31 27.5 31 29 C31 30.5 32 31.5 33.5 31.5 C35 31.5 36 30.5 36 29 C36 27.5 34 26 33 24 Z" 
                  fill="currentColor" 
                  stroke="none" 
                />
                {/* Sad downturned mouth */}
                <path d="M16 34 C19 29.5 29 29.5 32 34" strokeWidth="2.8" />
              </svg>
            </div>

            {/* Main Title */}
            <h2 
              id="out-of-zone-title" 
              className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2.5"
            >
              خارج نطاق التوصيل
            </h2>

            {/* Description / Reason */}
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5 max-w-xs mx-auto">
              {reason || 'نعتذر منك، العنوان المحدد يقع حالياً خارج نطاق التوصيل المتاح لدينا.'}
            </p>

            {/* Support Pill Button: "تواصل معنا [24]" */}
            <div className="mb-6 flex justify-center">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-[#C73208] dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-2xl py-2.5 px-6 font-bold text-sm transition-all shadow-sm group"
              >
                <div className="flex items-center justify-center bg-[#C73208] text-white text-[10px] font-black rounded-md px-1.5 py-0.5 tracking-wider leading-none shadow-xs">
                  24
                </div>
                <span>تواصل معنا</span>
                <MessageCircle className="w-4 h-4 text-[#C73208] dark:text-rose-300 transition-transform group-hover:scale-110" />
              </a>
            </div>

            {/* Action Buttons: "تغيير الموقع" & "إغلاق" */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Change Location Button (Primary Theme Color) */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onChangeLocation) {
                    onChangeLocation();
                  }
                }}
                className="w-full h-12 bg-[#C73208] hover:bg-[#A92A06] active:scale-[0.98] text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                data-testid="button-change-delivery-location"
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>تغيير الموقع</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full h-12 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98] text-gray-700 dark:text-gray-200 font-bold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center cursor-pointer"
                data-testid="button-close-out-of-zone"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
