import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bike, MapPin, Clock, Phone, User, Eye, CheckCircle, XCircle, Truck, Search, UserCheck, Navigation } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// حساب المسافة بين نقطتين (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مقبول',
  on_way: 'في الطريق',
  delivered: 'تم التنفيذ',
  cancelled: 'ملغي',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  on_way: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export default function AdminWasalniRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [estimatedFee, setEstimatedFee] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/wasalni'],
    queryFn: async () => {
      const res = await fetch('/api/wasalni');
      if (!res.ok) throw new Error('فشل في جلب الطلبات');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: drivers = [] } = useQuery<any[]>({
    queryKey: ['/api/drivers'],
    queryFn: async () => {
      const res = await fetch('/api/drivers');
      if (!res.ok) return [];
      return res.json();
    }
  });

  // اقتراح أقرب سائق بناءً على موقع البداية
  const suggestedDriver = useMemo(() => {
    if (!selectedRequest || !selectedRequest.fromLat || !selectedRequest.fromLng || drivers.length === 0) return null;
    
    const availableDrivers = drivers.filter(d => d.isActive && d.isAvailable && d.latitude && d.longitude);
    if (availableDrivers.length === 0) return null;

    const driversWithDistances = availableDrivers.map(driver => ({
      ...driver,
      distanceToPickup: calculateDistance(
        parseFloat(selectedRequest.fromLat), 
        parseFloat(selectedRequest.fromLng),
        parseFloat(driver.latitude),
        parseFloat(driver.longitude)
      )
    }));

    return driversWithDistances.sort((a, b) => a.distanceToPickup - b.distanceToPickup)[0];
  }, [selectedRequest, drivers]);

  useEffect(() => {
    if (suggestedDriver && !selectedDriverId && showDetail) {
      setSelectedDriverId(suggestedDriver.id);
    }
  }, [suggestedDriver, showDetail]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/wasalni/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('فشل في تحديث الطلب');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wasalni'] });
      toast({ title: "تم تحديث الطلب بنجاح" });
      setShowDetail(false);
    },
    onError: (err: any) => {
      toast({ title: "خطأ في التحديث", description: err.message, variant: "destructive" });
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: async ({ requestId, driverId }: { requestId: string; driverId: string }) => {
      const res = await fetch(`/api/wasalni/${requestId}/assign-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      });
      if (!res.ok) throw new Error('فشل في تعيين السائق');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wasalni'] });
      toast({ title: "✅ تم تعيين السائق بنجاح" });
      setShowDetail(false);
    },
    onError: (err: any) => {
      toast({ title: "❌ خطأ", description: err.message, variant: "destructive" });
    },
  });

  const filtered = requests.filter((r) => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchSearch = !searchQuery ||
      r.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerPhone?.includes(searchQuery) ||
      r.requestNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleUpdateStatus = (status: string) => {
    if (!selectedRequest) return;
    const data: any = { status };
    if (adminNotes) data.adminNotes = adminNotes;
    if (status === 'cancelled' && cancelReason) data.cancelReason = cancelReason;
    if (estimatedFee) data.estimatedFee = estimatedFee;
    updateMutation.mutate({ id: selectedRequest.id, data });
  };

  const handleAssignDriver = () => {
    if (!selectedRequest || !selectedDriverId) return;
    assignDriverMutation.mutate({ requestId: selectedRequest.id, driverId: selectedDriverId });
  };

  const openDetail = (r: any) => {
    setSelectedRequest(r);
    setAdminNotes(r.adminNotes || '');
    setCancelReason(r.cancelReason || '');
    setEstimatedFee(r.estimatedFee || '');
    setSelectedDriverId(r.driverId || '');
    setShowDetail(true);
  };

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    confirmed: requests.filter(r => r.status === 'confirmed').length,
    delivered: requests.filter(r => r.status === 'delivered').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center">
            <Bike className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-none mb-1">طلبات وصل لي</h1>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Wasalni Service Control</p>
          </div>
        </div>
        <div className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
          <span className="text-orange-700 text-xs font-bold">{counts.pending} جديد</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Stats Slider */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {[
            { label: 'الكل', count: counts.all, color: 'bg-white text-gray-700 border-gray-200' },
            { label: 'انتظار', count: counts.pending, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
            { label: 'مقبول', count: counts.confirmed, color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'مُنفَّذ', count: counts.delivered, color: 'bg-green-50 text-green-700 border-green-200' },
          ].map((stat) => (
            <div 
              key={stat.label} 
              className={`${stat.color} border rounded-2xl p-4 min-w-[100px] flex-shrink-0 flex flex-col items-center justify-center shadow-sm`}
            >
              <span className="text-2xl font-black mb-1">{stat.count}</span>
              <span className="text-[10px] font-bold uppercase opacity-70">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ابحث بالاسم، الهاتف، أو رقم الطلب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-12 rounded-2xl border-gray-200 shadow-sm focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className="rounded-full h-8 text-[11px] font-bold px-4 flex-shrink-0"
            >
              الكل
            </Button>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <Button
                key={val}
                variant={filterStatus === val ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(val)}
                className="rounded-full h-8 text-[11px] font-bold px-4 flex-shrink-0 whitespace-nowrap"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 font-bold text-sm">جاري جلب البيانات...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <Bike className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">لا يوجد أي طلبات حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((request) => (
              <Card 
                key={request.id} 
                onClick={() => openDetail(request)}
                className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
              >
                <CardContent className="p-0">
                  <div className="bg-white p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-orange-600 mb-1 uppercase tracking-tighter">
                          {request.requestNumber}
                        </span>
                        <h3 className="font-black text-gray-900 line-clamp-1">{request.customerName}</h3>
                      </div>
                      <Badge className={`rounded-xl text-[10px] font-black h-6 px-3 border-none shadow-sm ${STATUS_COLORS[request.status]}`}>
                        {STATUS_LABELS[request.status]}
                      </Badge>
                    </div>

                    <div className="space-y-3 relative">
                      <div className="absolute top-2 right-1 w-[1px] h-6 bg-gray-100" />
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <MapPin className="h-3 w-3 text-green-600" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-600 line-clamp-1">من: {request.fromAddress}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                          <MapPin className="h-3 w-3 text-red-600" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-600 line-clamp-1">إلى: {request.toAddress}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">الوقت المجدول</span>
                          <span className="text-[10px] font-black text-gray-700">{request.scheduledDate || 'الآن'} {request.scheduledTime}</span>
                        </div>
                      </div>
                      {request.estimatedFee && (
                        <div className="text-left">
                          <span className="text-[9px] font-bold text-gray-400 block text-right uppercase">التكلفة</span>
                          <span className="text-sm font-black text-orange-600">{parseFloat(request.estimatedFee).toLocaleString()} ر.ي</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog - Fullscreen Mobile Friendly */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-xl p-0 h-[90vh] md:h-auto overflow-y-auto rounded-t-3xl md:rounded-3xl border-none" dir="rtl">
          <div className="p-6 space-y-6">
            <DialogHeader className="mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                    <Bike className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black text-gray-900 leading-none">تفاصيل الطلب</DialogTitle>
                    <p className="text-gray-400 text-xs font-bold mt-1 uppercase">{selectedRequest?.requestNumber}</p>
                  </div>
                </div>
                {selectedRequest && (
                  <Badge className={`rounded-xl text-[10px] font-black h-7 px-4 border-none shadow-sm ${STATUS_COLORS[selectedRequest.status]}`}>
                    {STATUS_LABELS[selectedRequest.status]}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-6">
                {/* Section: Customer Info */}
                <div className="bg-white rounded-3xl p-5 border shadow-sm space-y-4">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">معلومات العميل</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{selectedRequest.customerName}</p>
                        <p className="text-[11px] font-bold text-gray-500">{selectedRequest.customerPhone}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => window.open(`tel:${selectedRequest.customerPhone}`)}
                      className="rounded-2xl h-10 w-10 border-blue-100 text-blue-600 bg-blue-50/50"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-gray-50 rounded-2xl p-3">
                      <span className="text-[9px] font-bold text-gray-400 block mb-1">نوع الغرض</span>
                      <span className="text-xs font-black text-gray-700">{selectedRequest.orderType}</span>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-3">
                      <span className="text-[9px] font-bold text-gray-400 block mb-1">تاريخ الطلب</span>
                      <span className="text-xs font-black text-gray-700">{new Date(selectedRequest.createdAt).toLocaleDateString('ar-YE')}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Route Info */}
                <div className="bg-white rounded-3xl p-5 border shadow-sm space-y-5">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">مسار التوصيل</h4>
                  <div className="space-y-6 relative">
                    <div className="absolute top-7 right-3.5 w-0.5 h-10 bg-dashed border-r-2 border-dashed border-gray-100" />
                    <div className="flex gap-4">
                      <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0 shadow-sm">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-green-600 uppercase block mb-1 tracking-tighter">نقطة الاستلام</span>
                        <p className="text-sm font-bold text-gray-800 leading-tight">{selectedRequest.fromAddress}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0 shadow-sm">
                        <MapPin className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-red-600 uppercase block mb-1 tracking-tighter">وجهة الوصول</span>
                        <p className="text-sm font-bold text-gray-800 leading-tight">{selectedRequest.toAddress}</p>
                      </div>
                    </div>
                  </div>
                  {selectedRequest.notes && (
                    <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4">
                      <p className="text-[10px] font-black text-orange-600 uppercase mb-2">ملاحظات إضافية</p>
                      <p className="text-sm text-orange-900 font-medium leading-relaxed italic">"{selectedRequest.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Section: Pricing & Driver Assignment */}
                <div className="bg-white rounded-3xl p-5 border shadow-sm space-y-6">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">التكلفة والسائق</h4>
                  
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-gray-500 pr-2">رسوم التوصيل التقديرية (ر.ي)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-300">YER</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={estimatedFee}
                        onChange={(e) => setEstimatedFee(e.target.value)}
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-black text-lg focus:ring-orange-500 pr-4"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[11px] font-black text-gray-500 pr-2 flex items-center gap-2">
                      <Navigation className="h-3 w-3" />
                      تعيين السائق وتتبعه
                    </Label>
                    
                    {suggestedDriver && (
                      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-green-600 uppercase">السائق الأقرب (مقترح)</span>
                            <p className="text-sm font-black text-green-900">{suggestedDriver.name}</p>
                            <p className="text-[10px] font-bold text-green-700/70">يبعد {suggestedDriver.distanceToPickup.toFixed(1)} كم عن الموقع</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedDriverId(suggestedDriver.id)}
                          className="bg-green-600 hover:bg-green-700 h-8 rounded-xl text-[10px] font-bold"
                        >
                          اختيار
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                        <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 font-bold">
                          <SelectValue placeholder="اختر من قائمة السائقين..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {drivers.filter(d => d.isActive && d.isAvailable).map((driver: any) => (
                            <SelectItem key={driver.id} value={driver.id} className="font-bold py-3">
                              {driver.name} ({driver.phone})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        disabled={!selectedDriverId || assignDriverMutation.isPending}
                        onClick={handleAssignDriver}
                        className="h-12 w-24 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-xs"
                      >
                        {assignDriverMutation.isPending ? 'جاري...' : 'حفظ'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Section: Admin Actions */}
                <div className="space-y-3 pt-4">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">الإجراءات الإدارية</h4>
                  
                  {selectedRequest.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleUpdateStatus('confirmed')}
                        disabled={updateMutation.isPending}
                        className="h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black gap-2 shadow-lg shadow-green-100"
                      >
                        <CheckCircle className="h-5 w-5" />
                        قبول الطلب
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus('cancelled')}
                        disabled={updateMutation.isPending}
                        variant="destructive"
                        className="h-14 rounded-2xl font-black gap-2 shadow-lg shadow-red-100"
                      >
                        <XCircle className="h-5 w-5" />
                        إلغاء الطلب
                      </Button>
                    </div>
                  )}

                  {selectedRequest.status === 'confirmed' && (
                    <Button
                      onClick={() => handleUpdateStatus('on_way')}
                      disabled={updateMutation.isPending}
                      className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black gap-2 shadow-lg shadow-purple-100"
                    >
                      <Truck className="h-5 w-5" />
                      تغيير للحالة: في الطريق
                    </Button>
                  )}

                  {selectedRequest.status === 'on_way' && (
                    <Button
                      onClick={() => handleUpdateStatus('delivered')}
                      disabled={updateMutation.isPending}
                      className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black gap-2 shadow-lg shadow-green-100"
                    >
                      <CheckCircle className="h-5 w-5" />
                      تأكيد التسجيل النهائي (تم التنفيذ)
                    </Button>
                  )}
                  
                  <div className="space-y-2 pt-4">
                    <Label className="text-[11px] font-black text-gray-400 pr-2 uppercase">ملاحظات داخلية (الإدارة)</Label>
                    <Textarea
                      placeholder="اكتب ملاحظات إدارية سرية هنا..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="rounded-3xl border-gray-100 bg-gray-50/50 resize-none p-4 font-medium"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
