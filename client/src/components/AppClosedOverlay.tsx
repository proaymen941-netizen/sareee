import { useState } from 'react';
import { Clock, Store, Calendar, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AppClosedOverlayProps {
  openingTime: string;
  closingTime: string;
  message: string;
  onScheduleOrder?: (scheduledDate: string, scheduledTimeSlot: string) => void;
  onClose?: () => void;
}

export default function AppClosedOverlay({ openingTime, message, onScheduleOrder, onClose }: AppClosedOverlayProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState(openingTime || '08:00');

  const today = new Date().toISOString().split('T')[0];

  const handleScheduleSubmit = () => {
    if (!scheduledDate || !scheduledTime) return;
    if (onScheduleOrder) {
      onScheduleOrder(scheduledDate, scheduledTime);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-red-500 to-orange-500 p-8 text-center">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">التطبيق مغلق حالياً</h2>
          <p className="text-white/80 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Opening time banner */}
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-orange-500 shrink-0" />
          <span className="text-orange-700 font-bold text-sm">
            يفتح الساعة <span className="text-orange-600 font-black">{openingTime}</span>
          </span>
        </div>

        {!showScheduleForm ? (
          <div className="p-6 space-y-3">
            <p className="text-center text-gray-500 text-sm mb-4">
              هل تريد استلام طلبك عند فتح التطبيق؟
            </p>
            {onScheduleOrder && (
              <Button
                onClick={() => setShowScheduleForm(true)}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:opacity-90"
              >
                <Calendar className="h-5 w-5 ml-2" />
                جدول طلبك لوقت محدد
              </Button>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <h3 className="font-bold text-gray-800 text-center">حدد موعد استلام طلبك</h3>
            <p className="text-xs text-gray-500 text-center">
              سيُرسل طلبك إلى لوحة التحكم قبل 30 دقيقة من موعدك
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-700">التاريخ</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  min={today}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="h-11 text-center font-bold text-gray-800 border-2 border-gray-200 focus:border-primary rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-700">الوقت المطلوب</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-11 text-center font-bold text-gray-800 border-2 border-gray-200 focus:border-primary rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowScheduleForm(false)}
                className="flex-1 h-11 rounded-xl border-2"
              >
                رجوع
              </Button>
              <Button
                onClick={handleScheduleSubmit}
                className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:opacity-90"
              >
                <Send className="h-4 w-4 ml-1" />
                إرسال الطلب
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
