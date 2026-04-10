import { Clock, Store } from 'lucide-react';

interface AppClosedOverlayProps {
  openingTime: string;
  closingTime: string;
  message: string;
}

export default function AppClosedOverlay({ openingTime, message }: AppClosedOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Store className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">التطبيق مغلق حالياً</h2>
        <p className="text-gray-500 text-sm mb-5 leading-relaxed">{message}</p>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3 inline-flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500 shrink-0" />
          <span className="text-orange-700 font-bold text-sm">
            يفتح الساعة <span className="text-orange-600 font-black">{openingTime}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
