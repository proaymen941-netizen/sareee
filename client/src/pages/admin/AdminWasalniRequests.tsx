import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bike, MapPin, Clock, Phone, User, Eye, CheckCircle, XCircle, Truck, Search } from 'lucide-react';
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

  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/wasalni'],
    queryFn: async () => {
      const res = await fetch('/api/wasalni');
      if (!res.ok) throw new Error('فشل في جلب الطلبات');
      return res.json();
    },
    refetchInterval: 20000,
  });

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
    onError: () => {
      toast({ title: "خطأ في التحديث", variant: "destructive" });
    },
  });

  const filtered = requests.filter((r) => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchSearch = !searchQuery ||
      r.customerName?.includes(searchQuery) ||
      r.customerPhone?.includes(searchQuery) ||
      r.requestNumber?.includes(searchQuery);
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

  const openDetail = (r: any) => {
    setSelectedRequest(r);
    setAdminNotes(r.adminNotes || '');
    setCancelReason(r.cancelReason || '');
    setEstimatedFee(r.estimatedFee || '');
    setShowDetail(true);
  };

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    confirmed: requests.filter(r => r.status === 'confirmed').length,
    delivered: requests.filter(r => r.status === 'delivered').length,
  };

  return (
    <div className="space-y-6 p-4" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <Bike className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">طلبات وصل لي</h1>
          <p className="text-gray-500 text-sm">إدارة طلبات خدمة التوصيل</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'الكل', count: counts.all, color: 'bg-gray-100 text-gray-700' },
          { label: 'انتظار', count: counts.pending, color: 'bg-yellow-100 text-yellow-700' },
          { label: 'مقبول', count: counts.confirmed, color: 'bg-blue-100 text-blue-700' },
          { label: 'مُنفَّذ', count: counts.delivered, color: 'bg-green-100 text-green-700' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-3 text-center`}>
            <div className="text-2xl font-black">{stat.count}</div>
            <div className="text-xs font-semibold">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث بالاسم أو الهاتف أو رقم الطلب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 rounded-xl"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطلبات</SelectItem>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <div className="text-center py-10 text-gray-400">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bike className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-black text-sm text-primary">{request.requestNumber}</span>
                      <Badge className={`text-xs border ${STATUS_COLORS[request.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[request.status] || request.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{request.orderType}</Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-semibold">{request.customerName}</span>
                      <span className="text-gray-400">•</span>
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{request.customerPhone}</span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                        <span className="truncate">من: {request.fromAddress}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                        <span className="truncate">إلى: {request.toAddress}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {request.scheduledDate} {request.scheduledTime}
                      </div>
                      {request.estimatedFee && (
                        <span className="font-bold text-orange-600">{parseFloat(request.estimatedFee).toLocaleString()} ر.ي</span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => openDetail(request)}
                    className="shrink-0 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bike className="h-5 w-5 text-orange-500" />
              تفاصيل طلب وصل لي
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">رقم الطلب</span>
                  <span className="font-bold text-primary">{selectedRequest.requestNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">العميل</span>
                  <span className="font-bold">{selectedRequest.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">الهاتف</span>
                  <span className="font-bold">{selectedRequest.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">نوع الطلب</span>
                  <span className="font-bold">{selectedRequest.orderType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">وقت التنفيذ</span>
                  <span className="font-bold">{selectedRequest.scheduledDate} {selectedRequest.scheduledTime}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 bg-green-50 rounded-xl p-3">
                  <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-gray-500 text-xs">من</p>
                    <p className="font-bold text-gray-800">{selectedRequest.fromAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-red-50 rounded-xl p-3">
                  <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-gray-500 text-xs">إلى</p>
                    <p className="font-bold text-gray-800">{selectedRequest.toAddress}</p>
                  </div>
                </div>
                {selectedRequest.notes && (
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs mb-1">ملاحظات العميل</p>
                    <p className="text-gray-800">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">رسوم التوصيل</label>
                <Input
                  type="number"
                  placeholder="ادخل الرسوم"
                  value={estimatedFee}
                  onChange={(e) => setEstimatedFee(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">ملاحظات الإدارة</label>
                <Textarea
                  placeholder="ملاحظات داخلية..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="rounded-xl resize-none"
                />
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600">سبب الإلغاء (عند الإلغاء)</label>
                  <Input
                    placeholder="سبب الإلغاء..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleUpdateStatus('confirmed')}
                      disabled={updateMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      قبول
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus('cancelled')}
                      disabled={updateMutation.isPending}
                      variant="destructive"
                      className="rounded-xl gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      رفض
                    </Button>
                  </>
                )}
                {selectedRequest.status === 'confirmed' && (
                  <Button
                    onClick={() => handleUpdateStatus('on_way')}
                    disabled={updateMutation.isPending}
                    className="col-span-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1"
                  >
                    <Truck className="h-4 w-4" />
                    السائق في الطريق
                  </Button>
                )}
                {selectedRequest.status === 'on_way' && (
                  <Button
                    onClick={() => handleUpdateStatus('delivered')}
                    disabled={updateMutation.isPending}
                    className="col-span-2 bg-green-600 hover:bg-green-700 text-white rounded-xl gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    تم التنفيذ
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
