import { useState, useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowLeft,
  Star,
  Clock,
  Heart,
  AlertTriangle,
  UtensilsCrossed,
  Plus,
  Minus,
  X,
  Tag,
  Sparkles,
  Percent,
} from 'lucide-react';
import type { Restaurant, MenuItem, RestaurantSection } from '@shared/schema';
import { getRestaurantStatus, canOrderFromRestaurant, getAppStatus } from '../utils/restaurantHours';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toggleMealFavoriteWithApi, getLocalMealFavorites } from '@/lib/favorites';
import StoreClosedDialog from '@/components/StoreClosedDialog';
import { useUiSettings } from '@/context/UiSettingsContext';
import { useLanguage } from '@/context/LanguageContext';

const MEAL_FAV_KEY = 'meal_favorites';
function loadMealFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(MEAL_FAV_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function saveMealFavorites(s: Set<string>) {
  localStorage.setItem(MEAL_FAV_KEY, JSON.stringify([...s]));
}

const REST_FAV_KEY = 'restaurant_favorites';
function loadRestFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(REST_FAV_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function saveRestFavorites(s: Set<string>) {
  localStorage.setItem(REST_FAV_KEY, JSON.stringify([...s]));
}

function RatingModal({
  restaurantId,
  restaurantName,
  onClose,
}: {
  restaurantId: string;
  restaurantName: string;
  onClose: () => void;
}) {
  const { t, language, dir, isRTL } = useLanguage();
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selected, comment }),
      });
      if (!res.ok) throw new Error('فشل في إرسال التقييم');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('rate_success_title'), description: t('rate_success_desc') });
      onClose();
    },
    onError: () => {
      toast({ title: t('error'), description: t('rate_error_desc'), variant: 'destructive' });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose} dir={dir}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <X className="h-4 w-4 text-gray-600" />
          </button>
          <h2 className="text-base font-black text-gray-900">
            {t('rate_store_name').replace('{name}', restaurantName)}
          </h2>
          <div className="w-8" />
        </div>

        <p className="text-center text-gray-500 text-sm mb-4">{t('how_was_experience')}</p>

        <div className="flex justify-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(star)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`h-10 w-10 transition-colors ${
                  star <= (hovered || selected)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>

        {selected > 0 && (
          <p className="text-center text-sm font-bold text-primary mb-4">
            {selected === 1 ? t('rate_terrible') : selected === 2 ? t('rate_bad') : selected === 3 ? t('rate_ok') : selected === 4 ? t('rate_good') : t('rate_excellent')}
          </p>
        )}

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={t('comment_placeholder')}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none h-20 focus:outline-none focus:border-primary mb-4"
          dir={dir}
        />

        <button
          onClick={() => {
            if (!selected) {
              toast({ title: t('alert', 'تنبيه'), description: t('rate_warning_star'), variant: 'destructive' });
              return;
            }
            mutation.mutate();
          }}
          disabled={mutation.isPending}
          className="w-full bg-primary text-white font-black py-3.5 rounded-2xl shadow-sm active:scale-95 transition disabled:opacity-60"
        >
          {mutation.isPending ? t('sending_rate') : t('rate_send')}
        </button>
      </div>
    </div>
  );
}

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t, language, dir, isRTL } = useLanguage();

  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [mealFavs, setMealFavs] = useState<Set<string>>(loadMealFavorites);
  const [restFavs, setRestFavs] = useState<Set<string>>(loadRestFavorites);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [showStoreClosed, setShowStoreClosed] = useState(false);
  const [storeClosedMsg, setStoreClosedMsg] = useState('');

  const { addItem, removeItem, getItemQuantity } = useCart();
  const { toast } = useToast();
  const { getSetting } = useUiSettings();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const appStatus = useMemo(() => {
    const openingTime = getSetting('opening_time') || '08:00';
    const closingTime = getSetting('closing_time') || '23:00';
    const storeStatus = getSetting('store_status') || 'open';
    return getAppStatus(openingTime, closingTime, storeStatus);
  }, [getSetting]);

  const { data: restaurant, isLoading: restaurantLoading } = useQuery<Restaurant>({
    queryKey: ['/api/restaurants', id],
  });

  const { data: menuData } = useQuery<{ allItems: MenuItem[] }>({
    queryKey: ['/api/restaurants', id, 'menu'],
    enabled: !!id,
  });
  const menuItems = menuData?.allItems ?? [];

  const { data: sections = [] } = useQuery<RestaurantSection[]>({
    queryKey: ['/api/restaurants', id, 'sections'],
    enabled: !!id,
  });

  // عروض المجموعة الخاصة بهذا المتجر (bundle offers)
  const { data: bundleOffers = [] } = useQuery<any[]>({
    queryKey: ['/api/special-offers/restaurant', id],
    queryFn: async () => {
      const res = await fetch(`/api/special-offers?restaurantId=${id}&offerType=bundle`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.filter((o: any) => o.offerType === 'bundle' && o.isActive);
    },
    enabled: !!id,
  });

  // عروض الخصم الخاصة بهذا المتجر (discount offers)
  const { data: discountOffers = [] } = useQuery<any[]>({
    queryKey: ['/api/special-offers/discount', id],
    queryFn: async () => {
      if (!id) return [];
      const res = await fetch(`/api/special-offers?restaurantId=${id}&offerType=discount`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.filter((o: any) => (o.offerType === 'discount' || !o.offerType) && o.isActive);
    },
    enabled: !!id,
  });

  const menuCategories = Array.from(new Set(menuItems.map(i => i.category).filter(Boolean)));
  const hasSections = sections.length > 0;

  const displaySections: { id: string; name: string }[] = hasSections
    ? sections.map(s => ({ id: s.id, name: s.name }))
    : (menuCategories as string[]).map(c => ({ id: c, name: c }));

  // البحث عن عروض الخصم المتعلقة بقسم معين
  const getSectionOffer = (secId: string, secName: string) => {
    return discountOffers.find((o: any) => {
      if (o.sectionId && (o.sectionId === secId || o.categoryId === secId)) return true;
      if (o.sectionName && o.sectionName.trim().toLowerCase() === secName.trim().toLowerCase()) return true;
      if (o.categoryName && o.categoryName.trim().toLowerCase() === secName.trim().toLowerCase()) return true;
      if (o.title && o.title.trim().toLowerCase() === secName.trim().toLowerCase()) return true;
      return false;
    });
  };

  // العروض النشطة الموجهة إما للقسم الحالي أو للمتجر بأكمله
  const activeSectionOffers = useMemo(() => {
    if (selectedSection === 'all') {
      return discountOffers;
    }
    const currentSec = displaySections.find(s => s.id === selectedSection);
    const secName = currentSec ? currentSec.name : selectedSection;
    return discountOffers.filter((o: any) => {
      // إذا كان العرض مخصص للمتجر بالكامل
      if (o.discountScope === 'store' || (!o.sectionId && !o.categoryId && o.discountScope !== 'section' && o.discountScope !== 'category')) return true;
      // أو مخصص لهذا القسم تحديداً
      if (o.sectionId && (o.sectionId === selectedSection || o.categoryId === selectedSection)) return true;
      if (o.sectionName && o.sectionName.trim().toLowerCase() === secName.trim().toLowerCase()) return true;
      if (o.categoryName && o.categoryName.trim().toLowerCase() === secName.trim().toLowerCase()) return true;
      if (o.title && o.title.trim().toLowerCase() === secName.trim().toLowerCase()) return true;
      return false;
    });
  }, [discountOffers, selectedSection, displaySections]);

  const filteredItems = menuItems.filter(item => {
    if (selectedSection === 'all') return true;
    if (hasSections) return item.category === displaySections.find(s => s.id === selectedSection)?.name;
    return item.category === selectedSection;
  });

  const toggleRestFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    setRestFavs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveRestFavorites(next);
      return next;
    });
  };

  const toggleMealFav = async (e: React.MouseEvent, itemId: string, itemName?: string, item?: any) => {
    e.stopPropagation();
    const isNowFav = await toggleMealFavoriteWithApi(itemId, user?.id, item);
    setMealFavs(new Set(getLocalMealFavorites()));
    
    queryClient.invalidateQueries({ queryKey: ['/api/favorites/check', user?.id, itemId] });
    queryClient.invalidateQueries({ queryKey: ['/api/favorites/products', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });

    toast({
      title: isNowFav ? t('added_to_fav') : t('removed_from_fav'),
      description: isNowFav 
        ? t('fav_added_msg').replace('{name}', itemName || t('meal_default_name')) 
        : t('fav_removed_msg').replace('{name}', itemName || t('meal_default_name')),
    });
  };

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse" dir={dir}>
        <div className="w-full h-44 bg-primary/20" />
        <div className="p-4 space-y-3">
          <div className="h-20 bg-white rounded-2xl shadow-sm" />
          <div className="h-10 bg-gray-200 rounded-full" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-3" dir={dir}>
        <UtensilsCrossed className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500 font-bold">{t('restaurant_not_found')}</p>
        <button onClick={() => setLocation('/')} className="text-primary text-sm font-bold">
          {t('back_to_home')}
        </button>
      </div>
    );
  }

  const status = getRestaurantStatus(restaurant, appStatus.isOpen);
  const orderStatus = canOrderFromRestaurant(restaurant, appStatus.isOpen);
  const isRestFav = id ? restFavs.has(id) : false;

  const handleAddItem = (item: MenuItem) => {
    if (!orderStatus.canOrder) {
      setStoreClosedMsg(orderStatus.message || (language === 'ar' ? 'عذراً، المتجر مغلق حالياً' : 'Sorry, store is currently closed'));
      setShowStoreClosed(true);
      return;
    }
    addItem(item, item.restaurantId || restaurant.id, restaurant.name);
  };

  const rating = Number(restaurant.rating) || 4;
  const currencySymbol = t('currency_symbol');

  return (
    <div className="min-h-screen bg-gray-50 pb-28" dir={dir}>

      {/* ── Sticky Header - back button + name only ── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 px-3.5 py-2.5">
          <button
            onClick={() => setLocation('/')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-50 hover:bg-orange-100 active:scale-95 transition flex-shrink-0 text-[#FF5722]"
          >
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          </button>
          <h1 className="flex-1 text-slate-900 text-base font-black truncate">
            {restaurant.name}
          </h1>
        </div>

        {/* Restaurant hero image */}
        {restaurant.image ? (
          <div className="w-full h-44 overflow-hidden">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-orange-100/60 to-orange-50 flex items-center justify-center">
            <UtensilsCrossed className="h-12 w-12 text-[#FF5722]/40" />
          </div>
        )}
      </div>

      {/* ── Info Card ── */}
      <div className="mx-3.5 -mt-3 bg-white rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-orange-100/80 p-4 z-10 relative">
        {/* Rating row - clickable */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setRatingOpen(true)}
            className="flex items-center gap-0.5 group"
            title={t('rate_restaurant_title')}
          >
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                  i <= Math.round(rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-200 text-slate-200'
                }`}
              />
            ))}
            <span className="text-xs font-bold text-slate-400 mx-1.5">({(Number(rating) || 0).toFixed(1)})</span>
          </button>
          <span className="text-xs text-slate-400 font-medium">{t('prices_match_store')}</span>
          <div className="text-right cursor-pointer" onClick={() => setRatingOpen(true)}>
            <div className="text-[11px] font-black text-[#FF5722] leading-none">{t('rate_restaurant_title')}</div>
          </div>
        </div>

        {/* Status + timing + favorite */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-orange-50/60 rounded-xl px-3 py-1.5 border border-orange-100">
            <Clock className="h-3.5 w-3.5 text-[#FF5722]" />
            <span className="text-xs font-bold text-slate-700">
              {t('order_takes')} {restaurant.deliveryTime || '40 - 60'} {t('minutes_unit')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black px-3 py-1 rounded-xl ${
              status.isOpen
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-white'
            }`}>
              {status.isOpen ? t('open_status') : t('closed_status')}
            </span>
            <button
              onClick={toggleRestFav}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition active:scale-95 ${
                isRestFav ? 'bg-orange-50 border-orange-200 text-[#FF5722]' : 'bg-white border-slate-200 text-slate-400 hover:text-[#FF5722]'
              }`}
            >
              <Heart className={`h-4 w-4 ${isRestFav ? 'fill-[#FF5722]' : ''}`} />
            </button>
          </div>
        </div>

        {restaurant.description && (
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed line-clamp-2">
            {restaurant.description}
          </p>
        )}
      </div>

      {/* ── Closed alert ── */}
      {!orderStatus.canOrder && (
        <div className="mx-3.5 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl p-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-700 text-xs font-bold">{orderStatus.message}</p>
        </div>
      )}

      {/* ── Section Tabs ── */}
      {displaySections.length > 0 && (
        <div className="mt-3 bg-white/95 backdrop-blur-md border-b border-orange-100 sticky top-[52px] z-30 shadow-sm">
          <div className="flex items-center gap-2 px-3.5 py-2.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedSection('all')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                selectedSection === 'all'
                  ? 'bg-gradient-to-r from-[#FF6E40] to-[#FF5722] text-white border-transparent shadow-sm shadow-orange-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{t('all_categories')}</span>
              {discountOffers.length > 0 && (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                  selectedSection === 'all' ? 'bg-white text-[#FF5722]' : 'bg-[#FF5722] text-white'
                }`}>
                  {t('offers_tag')}
                </span>
              )}
            </button>
            {displaySections.map(sec => {
              const secOffer = getSectionOffer(sec.id, sec.name);
              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSection(sec.id)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                    selectedSection === sec.id
                      ? 'bg-gradient-to-r from-[#FF6E40] to-[#FF5722] text-white border-transparent shadow-sm shadow-orange-500/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{sec.name}</span>
                  {secOffer && (
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                      selectedSection === sec.id ? 'bg-white text-[#FF5722]' : 'bg-[#FF5722] text-white'
                    }`}>
                      {secOffer.discountPercent ? `${secOffer.discountPercent}%` : t('offers_tag')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Active Discount Offers Banner ── */}
      {activeSectionOffers.length > 0 && (
        <div className="px-3 pt-3">
          <div className="space-y-2">
            {activeSectionOffers.map((offer: any) => (
              <div
                key={offer.id}
                className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-300/80 rounded-2xl p-3 flex items-center gap-3 shadow-xs animate-in fade-in duration-300"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 animate-pulse text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-md">
                      🔥 {offer.title || t('bundle_offer_tag')}
                    </span>
                    {offer.discountPercent && (
                      <span className="text-xs font-black text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-md">
                        {t('discount_label')} {offer.discountPercent}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-950 font-bold mt-1 leading-snug">
                    {offer.description || (language === 'ar' ? `احصل على خصم ${offer.discountPercent || 10}% عند الطلب بـ ${offer.minimumOrder || 4000} ريال أو أكثر` : `Get ${offer.discountPercent || 10}% off when ordering ${offer.minimumOrder || 4000} YER or more`)}
                  </p>
                  {offer.minimumOrder && parseFloat(offer.minimumOrder) > 0 && (
                    <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                      💡 {language === 'ar' ? `الشرط: إجمالي الطلب من هذا القسم يجب أن يكون ${offer.minimumOrder} ريال أو أكثر ليتم تطبيق الخصم تلقائياً في السلة` : `Requirement: Order total from this section must be at least ${offer.minimumOrder} YER to apply the discount automatically`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bundle Offers Section ── */}
      {bundleOffers.length > 0 && (selectedSection === 'all' || displaySections.find(s => s.id === selectedSection)?.name === 'العروض' || displaySections.find(s => s.id === selectedSection)?.name === 'Offers') && (
        <div className="px-3 pt-4">
          <h2 className="text-sm font-black text-gray-800 mb-2 flex items-center gap-1">
            🎁 <span>{t('special_offers_sec')}</span>
          </h2>
          <div className="space-y-3">
            {bundleOffers.map(offer => {
              const bundleItemId = `bundle_${offer.id}`;
              const qty = getItemQuantity(bundleItemId);
              return (
                <div key={offer.id} className="bg-gradient-to-l from-orange-50/80 to-white rounded-2xl border border-orange-200/70 shadow-[0_4px_16px_rgba(255,87,34,0.06)] overflow-hidden flex">
                  {/* صورة العرض */}
                  <div className="flex-shrink-0 w-28 h-28 relative">
                    {offer.image ? (
                      <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-orange-100/50 flex items-center justify-center">
                        <span className="text-3xl">🎁</span>
                      </div>
                    )}
                    <span className="absolute top-1.5 right-1.5 bg-[#FF5722] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                      {t('bundle_offer_tag')}
                    </span>
                  </div>

                  {/* محتوى العرض */}
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-1">{offer.title}</h3>
                      {offer.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{offer.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[#FF5722] font-black text-sm">{(parseFloat(offer?.bundlePrice || '0') || 0).toFixed(0)} {currencySymbol}</span>
                      {qty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 rounded-full px-2 py-1">
                          <button
                            onClick={() => removeItem(bundleItemId)}
                            className="w-6 h-6 bg-[#FF5722] rounded-full flex items-center justify-center text-white active:scale-95 transition shadow-xs"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-[#FF5722] font-black text-sm w-4 text-center">{qty}</span>
                          <button
                            onClick={() => {
                              const virtualItem: any = {
                                id: bundleItemId,
                                name: offer.title,
                                description: offer.description,
                                price: String(offer.bundlePrice),
                                image: offer.image || '',
                                category: language === 'ar' ? 'العروض' : 'Offers',
                                restaurantId: id || '',
                                isAvailable: true,
                                isSpecialOffer: true,
                              };
                              addItem(virtualItem, id || '', restaurant.name);
                            }}
                            className="w-6 h-6 bg-[#FF5722] rounded-full flex items-center justify-center text-white active:scale-95 transition shadow-xs"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!orderStatus.canOrder) {
                              setStoreClosedMsg(orderStatus.message || (language === 'ar' ? 'عذراً، المتجر مغلق حالياً' : 'Sorry, store is currently closed'));
                              setShowStoreClosed(true);
                              return;
                            }
                            const virtualItem: any = {
                              id: bundleItemId,
                              name: offer.title,
                              description: offer.description,
                              price: String(offer.bundlePrice),
                              image: offer.image || '',
                              category: language === 'ar' ? 'العروض' : 'Offers',
                              restaurantId: id || '',
                              isAvailable: true,
                              isSpecialOffer: true,
                            };
                            addItem(virtualItem, id || '', restaurant.name);
                          }}
                          className="flex items-center gap-1 bg-gradient-to-r from-[#FF6E40] to-[#FF5722] text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-sm shadow-orange-500/20 active:scale-95 transition"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {t('add_to_cart')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Menu Items ── */}
      <div className="px-3.5 pt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredItems.length === 0 && bundleOffers.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="h-14 w-14 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-bold text-sm">{t('no_items_in_section')}</p>
            {displaySections.length === 0 && menuItems.length === 0 && (
              <p className="text-slate-300 text-xs mt-1">{t('no_items_added_yet')}</p>
            )}
          </div>
        ) : filteredItems.length === 0 ? null : (
          filteredItems.map(item => {
            const qty = getItemQuantity(item.id);
            const isMealFav = mealFavs.has(item.id);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border border-orange-100/60 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(255,87,34,0.08)] transition-all overflow-hidden flex ${
                  item.isAvailable === false ? 'opacity-60' : ''
                }`}
              >
                {/* Image */}
                <div className="relative flex-shrink-0 w-28 h-28">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-orange-50/40 flex items-center justify-center">
                      <UtensilsCrossed className="h-9 w-9 text-slate-300" />
                    </div>
                  )}
                  {/* Favorite heart on image */}
                  <button
                    onClick={e => toggleMealFav(e, item.id, item.name, item)}
                    className={`absolute top-1.5 left-1.5 w-7 h-7 flex items-center justify-center rounded-full shadow-sm border transition active:scale-95 ${
                      isMealFav ? 'bg-[#FF5722] border-[#FF5722] text-white' : 'bg-white/90 backdrop-blur-xs border-slate-200 text-slate-400'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isMealFav ? 'fill-white text-white' : 'text-slate-400'}`} />
                  </button>
                  {item.isAvailable === false && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-[10px] font-black bg-slate-800 rounded px-1.5 py-0.5">
                        {t('unavailable')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      {(item as any).discountPrice ? (
                        <>
                          <span className="text-[#FF5722] font-black text-sm">{(item as any).discountPrice} {currencySymbol}</span>
                          <span className="text-slate-400 text-[11px] line-through">{item.price} {currencySymbol}</span>
                        </>
                      ) : (
                        <span className="text-[#FF5722] font-black text-sm">{item.price} {currencySymbol}</span>
                      )}
                    </div>

                    {item.isAvailable !== false && (
                      qty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 rounded-full px-2 py-1">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-6 h-6 bg-[#FF5722] rounded-full flex items-center justify-center text-white active:scale-95 transition shadow-xs"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-[#FF5722] font-black text-sm w-4 text-center">{qty}</span>
                          <button
                            onClick={() => addItem(item, item.restaurantId || restaurant.id, restaurant.name)}
                            className="w-6 h-6 bg-[#FF5722] rounded-full flex items-center justify-center text-white active:scale-95 transition shadow-xs"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addItem(item, item.restaurantId || restaurant.id, restaurant.name)}
                          className="flex items-center gap-1 bg-gradient-to-r from-[#FF6E40] to-[#FF5722] text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-sm shadow-orange-500/20 active:scale-95 transition"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {t('add_to_cart')}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Rating Modal ── */}
      {ratingOpen && id && restaurant && (
        <RatingModal
          restaurantId={id}
          restaurantName={restaurant.name}
          onClose={() => setRatingOpen(false)}
        />
      )}

      <StoreClosedDialog
        open={showStoreClosed}
        message={storeClosedMsg}
        onClose={() => setShowStoreClosed(false)}
      />
    </div>
  );
}
