import React, { useState } from 'react';
import { useUiSettings } from '@/context/UiSettingsContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { getSetting, loading: settingsLoading } = useUiSettings();
  const [show, setShow] = useState(true);

  if (settingsLoading) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const splashImageUrl = getSetting('splash_image_url') || 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?q=80&w=800';
  const splashTitle = getSetting('splash_title') || 'السريع ون';
  const splashSubtitle = getSetting('splash_subtitle') || 'أفضل خدمة توصيل طلبات بسرعة وأمان';
  const buttonText = getSetting('splash_button_text') || 'ابدأ الآن';

  const handleStart = () => {
    setShow(false);
    setTimeout(onFinish, 500);
  };

  if (!show) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] transition-opacity duration-500 opacity-0 pointer-events-none" />
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col transition-opacity duration-500 overflow-hidden">
      {/* Top Image Section - بدون نص فوق الصورة */}
      <div className="h-[50vh] md:h-[55vh] relative overflow-hidden rounded-b-[3rem] md:rounded-b-[5rem] shadow-2xl">
        <img 
          src={splashImageUrl} 
          alt="Splash" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>
      
      {/* Content Section */}
      <div className="flex-1 flex flex-col items-center justify-between p-8 md:p-12 text-center relative z-10 bg-white">
        <div className="w-full max-w-md space-y-4 pt-4">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
            {splashTitle}
          </h1>
          
          <p className="text-lg md:text-xl font-medium text-gray-500 leading-relaxed max-w-[320px] md:max-w-md mx-auto">
            {splashSubtitle}
          </p>
        </div>

        <div className="w-full max-w-sm pb-10 md:pb-16">
          <Button 
            onClick={handleStart}
            className="w-full h-16 md:h-20 rounded-[2rem] text-xl md:text-2xl font-black bg-primary hover:bg-primary/90 text-white shadow-[0_20px_50px_rgba(236,72,20,0.3)] flex items-center justify-center gap-4 active:scale-95 transition-all group"
          >
            {buttonText}
            <ChevronLeft className="h-7 w-7 group-hover:-translate-x-2 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
