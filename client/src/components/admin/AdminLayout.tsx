import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  BarChart3, 
  ShoppingBag, 
  Truck, 
  Percent, 
  Settings, 
  Menu,
  LogOut,
  Package,
  Users,
  Bell,
  User,
  Tag,
  DollarSign,
  Shield,
  CreditCard,
  Smartphone,
  Database,
  Star,
  Wallet,
  Ticket,
  X,
  Store,
  FileBarChart,
  Receipt,
  TrendingUp,
  UserCog,
} from 'lucide-react';
import type { UiSettings } from '@shared/schema';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  const currentAdmin = (() => {
    try {
      const stored = localStorage.getItem('admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  })();
  const isSubAdmin = currentAdmin?.userType === 'sub_admin';
  const adminPermissions: string[] = currentAdmin?.permissions || [];
  const isSetupMode = currentAdmin?.isSetupMode === true || localStorage.getItem('admin_token') === 'SETUP_MODE';

  const hasPermission = (perm: string | null) => perm === null || !isSubAdmin || adminPermissions.includes(perm);

  const { data: uiSettings } = useQuery<UiSettings[]>({
    queryKey: ['/api/admin/ui-settings'],
  });

  const { data: ordersData } = useQuery<any>({
    queryKey: ['/api/admin/orders'],
    refetchInterval: 30000,
  });

  const allOrders: any[] = ordersData?.orders || ordersData || [];
  const pendingOrders = allOrders.filter(
    (o: any) => o.status === 'pending' && !o.driverId
  );
  const pendingOrdersCount = pendingOrders.length;

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('admin_sidebar_scroll');
    if (savedScroll && navRef.current) {
      navRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  const saveScrollPosition = useCallback(() => {
    if (navRef.current) {
      sessionStorage.setItem('admin_sidebar_scroll', String(navRef.current.scrollTop));
    }
  }, []);

  const getLogoUrl = () => uiSettings?.find(s => s.key === 'header_logo_url')?.value || '';
  const getSidebarImageUrl = () => uiSettings?.find(s => s.key === 'sidebar_image_url')?.value || '';
  const getAppName = () => uiSettings?.find(s => s.key === 'app_name')?.value || 'السريع ون';

  const menuGroups = [
    {
      key: 'main',
      label: 'الرئيسية',
      items: [
        { icon: BarChart3, label: 'لوحة التحكم', path: '/admin', permission: null },
        { icon: ShoppingBag, label: 'الطلبات', path: '/admin/orders', badge: pendingOrdersCount, permission: 'manage_orders' },
      ]
    },
    {
      key: 'restaurants',
      label: 'المتاجر والمطاعم',
      items: [
        { icon: Store, label: 'إدارة المتاجر', path: '/admin/restaurants', permission: 'manage_menu' },
        { icon: Receipt, label: 'حسابات المتاجر', path: '/admin/restaurant-accounts', permission: 'manage_menu' },
        { icon: FileBarChart, label: 'تقارير المتاجر', path: '/admin/restaurant-reports', permission: 'view_reports' },
      ]
    },
    {
      key: 'store',
      label: 'المنتجات والعروض',
      items: [
        { icon: Tag, label: 'التصنيفات', path: '/admin/categories', permission: 'manage_categories' },
        { icon: Package, label: 'المنتجات', path: '/admin/menu-items', permission: 'manage_menu' },
        { icon: Percent, label: 'العروض', path: '/admin/offers', permission: 'manage_menu' },
        { icon: Ticket, label: 'الكوبونات', path: '/admin/coupons', permission: 'manage_coupons' },
        { icon: CreditCard, label: 'طرق الدفع', path: '/admin/payment-methods', permission: 'manage_settings' },
      ]
    },
    {
      key: 'drivers',
      label: 'السائقون',
      items: [
        { icon: Truck, label: 'إدارة السائقين', path: '/admin/drivers', permission: 'manage_drivers' },
        { icon: DollarSign, label: 'رسوم التوصيل', path: '/admin/delivery-fees', permission: 'manage_drivers' },
        { icon: Wallet, label: 'محافظ السائقين', path: '/admin/wallet', permission: 'manage_drivers' },
      ]
    },
    {
      key: 'reports',
      label: 'التقارير والمالية',
      items: [
        { icon: TrendingUp, label: 'الإيرادات والتوزيع', path: '/admin/financial-reports', permission: 'view_reports' },
        { icon: BarChart3, label: 'التقارير التفصيلية', path: '/admin/detailed-reports', permission: 'view_reports' },
        { icon: Star, label: 'التقييمات', path: '/admin/ratings', permission: 'view_reports' },
      ]
    },
    {
      key: 'management',
      label: 'الإدارة والموارد',
      items: [
        { icon: UserCog, label: 'الموارد البشرية', path: '/admin/hr-management', permission: 'manage_customers' },
        { icon: Users, label: 'العملاء', path: '/admin/users', permission: 'manage_customers' },
        { icon: Shield, label: 'الأمن والخصوصية', path: '/admin/security', permission: 'manage_settings' },
      ]
    },
    {
      key: 'settings',
      label: 'الإعدادات',
      items: [
        { icon: Smartphone, label: 'إدارة الواجهات', path: '/admin/ui-settings', permission: 'manage_settings' },
        { icon: Database, label: 'النسخ الاحتياطي', path: '/admin/backup', permission: 'manage_settings' },
        { icon: User, label: 'الملف الشخصي', path: '/admin/profile', permission: null },
      ]
    },
  ];

  const handleNavigation = useCallback((path: string) => {
    saveScrollPosition();
    setLocation(path);
    setIsSidebarOpen(false);
  }, [saveScrollPosition, setLocation]);

  const handleLogout = () => {
    try {
      const adminUser = localStorage.getItem('admin_user');
      const user = adminUser ? JSON.parse(adminUser) : null;
      if (user && user.id !== 'setup') {
        fetch('/api/admin/security/log-logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
          body: JSON.stringify({ userId: user.id, userName: user.name }),
        }).catch(() => {});
      }
    } catch {}
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    sessionStorage.removeItem('admin_sidebar_scroll');
    window.location.href = '/admin-login';
  };

  const getCurrentPageLabel = () => {
    for (const group of menuGroups) {
      for (const item of group.items) {
        if (location === item.path || (item.path !== '/admin' && location.startsWith(item.path))) {
          return item.label;
        }
      }
    }
    return 'لوحة التحكم';
  };

  const AdminAvatar = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
    <div className={`${size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'} bg-primary rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">
        {currentAdmin?.name ? currentAdmin.name.charAt(0) : 'م'}
      </span>
    </div>
  );

  const NavItems = ({ navElRef }: { navElRef: React.RefObject<HTMLDivElement> }) => (
    <nav ref={navElRef} className="flex-1 p-3 overflow-y-auto">
      {menuGroups.map((group) => {
        const visibleItems = group.items.filter(item => hasPermission((item as any).permission));
        if (visibleItems.length === 0) return null;
        return (
          <div key={group.key} className="mb-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1.5 tracking-widest">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path ||
                  (item.path !== '/admin' && location.startsWith(item.path));
                const badge = (item as any).badge;

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-all duration-150 ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'text-gray-700 hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span className={`flex-1 font-medium text-sm text-right ${isActive ? 'text-white' : 'text-gray-800'}`}>
                      {item.label}
                    </span>
                    {badge > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  const SidebarHeader = () => (
    <>
      {getSidebarImageUrl() ? (
        <div className="w-full h-36 border-b overflow-hidden relative flex-shrink-0">
          <img src={getSidebarImageUrl()} alt="خلفية القائمة" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <div>
              <h2 className="text-white font-bold text-sm leading-tight">لوحة تحكم وادارة</h2>
              <p className="text-white/80 text-xs font-medium">{getAppName()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b flex-shrink-0 header-gradient">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">لوحة تحكم وادارة</h2>
              <p className="text-white/80 text-xs">{getAppName()}</p>
            </div>
          </div>
        </div>
      )}
      <div className="px-3 py-2.5 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AdminAvatar size="sm" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {currentAdmin?.name || 'مدير النظام'}
            </p>
            <p className="text-xs text-gray-500">
              {isSubAdmin ? 'مشرف' : 'صلاحيات كاملة'}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const SidebarFooter = () => (
    <div className="p-3 border-t flex-shrink-0">
      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
        size="sm"
      >
        <LogOut className="h-4 w-4" />
        تسجيل الخروج
      </Button>
    </div>
  );

  const NotificationsPanel = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`absolute ${isMobile ? 'left-0' : 'left-0'} top-full mt-2 ${isMobile ? 'w-72' : 'w-80'} bg-white rounded-xl shadow-2xl border border-gray-100 z-50`}>
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-bold text-sm">الإشعارات</h3>
        <div className="flex items-center gap-2">
          {pendingOrdersCount > 0 && (
            <Badge variant="destructive" className="text-xs">{pendingOrdersCount} طلب جديد</Badge>
          )}
          <button onClick={() => setShowNotifications(false)} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {pendingOrders.length > 0 ? (
          pendingOrders.slice(0, 6).map((order: any) => (
            <div
              key={order.id}
              className="p-3 border-b hover:bg-primary/5 cursor-pointer transition-colors"
              onClick={() => { handleNavigation('/admin/orders'); setShowNotifications(false); }}
            >
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">طلب جديد #{order.orderNumber || order.id?.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500 truncate">{order.customerName || 'عميل'} — {order.totalAmount} ريال</p>
                  <p className="text-xs text-red-500 mt-0.5">بانتظار تعيين سائق</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-400">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">لا توجد إشعارات جديدة</p>
          </div>
        )}
      </div>
      {pendingOrders.length > 6 && (
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-primary hover:bg-primary/5 text-xs"
            onClick={() => { handleNavigation('/admin/orders'); setShowNotifications(false); }}
          >
            عرض جميع الطلبات ({pendingOrders.length})
          </Button>
        </div>
      )}
    </div>
  );

  const BellButton = () => (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative h-9 w-9"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="h-5 w-5" />
        {pendingOrdersCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
            {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
          </span>
        )}
      </Button>
      {showNotifications && <NotificationsPanel />}
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden" dir="rtl">
      {/* Desktop Sidebar - fixed height, no scrolling outside */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-l shadow-lg flex-shrink-0 h-full">
        <SidebarHeader />
        <NavItems navElRef={navRef} />
        <SidebarFooter />
      </aside>

      {/* Right Side: Header + Scrollable Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Sticky Top Header - never scrolls */}
        <header className="bg-white border-b flex items-center justify-between px-4 py-3 flex-shrink-0 shadow-sm z-30">
          {/* Left: Logo / Page label */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0 flex flex-col border-none">
                <SidebarHeader />
                <NavItems navElRef={mobileNavRef} />
                <SidebarFooter />
              </SheetContent>
            </Sheet>

            {getLogoUrl() ? (
              <img src={getLogoUrl()} alt="شعار" className="h-8 object-contain" />
            ) : (
              <div>
                <p className="font-bold text-gray-900 text-sm leading-tight hidden lg:block">
                  لوحة تحكم وادارة — {getCurrentPageLabel()}
                </p>
                <p className="font-bold text-gray-900 text-sm leading-tight lg:hidden">
                  {getCurrentPageLabel()}
                </p>
              </div>
            )}
          </div>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center gap-1">
            <BellButton />
            <button
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => handleNavigation('/admin/profile')}
            >
              <AdminAvatar />
              <span className="text-sm font-medium text-gray-700">
                {currentAdmin?.name || 'مدير النظام'}
              </span>
            </button>
            <button
              className="lg:hidden"
              onClick={() => handleNavigation('/admin/profile')}
            >
              <AdminAvatar size="sm" />
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto">
          {isSetupMode && (
            <div className="bg-amber-500 text-white px-4 py-2.5 text-sm flex items-center justify-between gap-3 flex-wrap" dir="rtl">
              <span className="font-medium">
                ⚠️ أنت في وضع الإعداد الأولي — أنشئ حساب المدير الآن.
              </span>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors flex-shrink-0"
              >
                تسجيل الخروج
              </button>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Overlay to close notifications */}
      {showNotifications && (
        <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)} />
      )}
    </div>
  );
};
