import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Star, 
  Heart,
  UtensilsCrossed,
  Menu,
  Tag,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Navigation,
} from 'lucide-react';
import TimingBanner from '@/components/TimingBanner';
import { Badge } from '@/components/ui/badge';
import { useUiSettings } from '@/context/UiSettingsContext';
import { useUserLocation } from '@/context/LocationContext';
import type { Category, Restaurant, SpecialOffer } from '@shared/schema';
import { getRestaurantStatus } from '@/utils/restaurantHours';

// ─── Haversine distance (km) ─────────────────────────────────────────────────
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} م`;
  return `${km.toFixed(1)} كم`;
}

// ─── localStorage favorites ───────────────────────────────────────────────────
const FAV_KEY = 'restaurant_favorites';
function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}
function saveFavorites(set: Set<string>) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTab, setSelectedTab] = useState('all');
  const { getSetting } = useUiSettings();
  const { location: userLocation } = useUserLocation();

  // ── Offer slider state ────────────────────────────────────────────────────
  const [offerIndex, setOfferIndex] = useState(0);
  const sliderTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Restaurant favorites ──────────────────────────────────────────────────
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);

  const getS = (key: string, defaultValue: string) => getSetting(key) || defaultValue;
  const showSection = (key: string) => getSetting(key) !== 'false';

  const { data: restaurants } = useQuery<Restaurant[]>({ queryKey: ['/api/restaurants'] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ['/api/categories'] });
  const { data: offers } = useQuery<SpecialOffer[]>({ queryKey: ['/api/special-offers'] });

  const activeOffers = (offers || []).filter(o => o.isActive);

  // ── Auto-slide offers ─────────────────────────────────────────────────────
  const startSlider = useCallback(() => {
    if (sliderTimer.current) clearInterval(sliderTimer.current);
    if (activeOffers.length > 1) {
      sliderTimer.current = setInterval(() => {
        setOfferIndex(prev => (prev + 1) % activeOffers.length);
      }, 4000);
    }
  }, [activeOffers.length]);

  useEffect(() => {
    startSlider();
    return () => { if (sliderTimer.current) clearInterval(sliderTimer.current); };
  }, [startSlider]);

  const prevOffer = () => {
    setOfferIndex(prev => (prev - 1 + activeOffers.length) % activeOffers.length);
    startSlider();
  };
  const nextOffer = () => {
    setOfferIndex(prev => (prev + 1) % activeOffers.length);
    startSlider();
  };

  // ── Toggle restaurant favorite ────────────────────────────────────────────
  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(next);
      return next;
    });
  };

  // ── Filter & sort restaurants ─────────────────────────────────────────────
  const userLat = userLocation.position?.coords.latitude;
  const userLng = userLocation.position?.coords.longitude;

  const filteredRestaurants = (() => {
    let list = (restaurants || []).filter(r => {
      if (selectedCategory !== 'all' && r.categoryId !== selectedCategory) return false;
      if (selectedTab === 'newest' && !r.isNew) return false;
      if (selectedTab === 'favorites' && !favorites.has(r.id)) return false;
      return true;
    });

    if (selectedTab === 'nearest') {
      if (userLat && userLng) {
        list = list
          .map(r => ({
            ...r,
            _dist:
              r.latitude && r.longitude
                ? haversineDistance(userLat, userLng, parseFloat(String(r.latitude)), parseFloat(String(r.longitude)))
                : Infinity,
          }))
          .sort((a: any, b: any) => a._dist - b._dist);
      }
    }
    return list;
  })();

  const tabs = [
    { key: 'all',       label: getS('btn_tab_all',       'الكل')     },
    { key: 'nearest',   label: getS('btn_tab_nearest',   'الأقرب')   },
    { key: 'newest',    label: getS('btn_tab_new',        'الجديدة')  },
    { key: 'favorites', label: getS('btn_tab_favorites',  'المفضلة')  },
  ];

  const currentOffer = activeOffers[offerIndex];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Timing Banner */}
      {showSection('show_hero_section') && <TimingBanner />}

      {/* ── Categories ─────────────────────────────────────────────────────── */}
      {showSection('show_categories') && (
        <div className="bg-white border-b">
          <div className="flex overflow-x-auto no-scrollbar px-4 py-3 gap-3">
            <div
              className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 min-w-[70px]"
              onClick={() => { setSelectedCategory('all'); setSelectedTab('all'); }}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${selectedCategory === 'all' ? 'bg-primary/10 border-primary shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                <Menu className={`h-7 w-7 ${selectedCategory === 'all' ? 'text-primary' : 'text-gray-500'}`} />
              </div>
              <span className={`text-[11px] font-bold text-center leading-tight ${selectedCategory === 'all' ? 'text-primary' : 'text-gray-600'}`}>
                {getS('text_all_categories', 'كل التصنيفات')}
              </span>
            </div>

            {categories?.filter(c => c.isActive !== false).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(cat => (
              <div
                key={cat.id}
                className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 min-w-[70px]"
                onClick={() => { setSelectedCategory(cat.id); setSelectedTab('all'); }}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all overflow-hidden ${selectedCategory === cat.id ? 'border-primary shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                  {cat.image
                    ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    : cat.icon
                      ? <i className={`${cat.icon} text-2xl ${selectedCategory === cat.id ? 'text-primary' : 'text-gray-500'}`} />
                      : <UtensilsCrossed className={`h-7 w-7 ${selectedCategory === cat.id ? 'text-primary' : 'text-gray-500'}`} />
                  }
                </div>
                <span className={`text-[11px] font-bold text-center leading-tight ${selectedCategory === cat.id ? 'text-primary' : 'text-gray-600'}`}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Offers Slider ───────────────────────────────────────────────────── */}
      {showSection('show_hero_section') && (
        <div className="px-4 pt-4 pb-2">
          {activeOffers.length > 0 && currentOffer ? (
            <div className="relative w-full rounded-2xl overflow-hidden shadow-md" style={{ height: activeOffers.length === 1 ? '200px' : '180px' }}>
              {/* Image */}
              {currentOffer.image
                ? <img src={currentOffer.image} alt={currentOffer.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-primary to-red-700" />
              }

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Badge top-right */}
              {currentOffer.showBadge !== false && (
                <div className="absolute top-3 right-3 flex gap-1.5">
                  <span className="bg-primary text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                    {currentOffer.badgeText1 || 'عرض خاص'}
                  </span>
                  {currentOffer.badgeText2 && (
                    <span className="bg-white/25 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {currentOffer.badgeText2}
                    </span>
                  )}
                </div>
              )}

              {/* Content bottom */}
              <div className="absolute bottom-0 right-0 left-0 p-3 text-right">
                <h3 className="text-white font-black text-sm leading-snug line-clamp-2 mb-1">
                  {currentOffer.title}
                </h3>
                {currentOffer.description && (
                  <p className="text-white/80 text-[11px] line-clamp-1 mb-2">
                    {currentOffer.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <button
                    className="bg-white text-primary text-[11px] font-black px-4 py-1.5 rounded-full flex items-center gap-1 shadow"
                    onClick={() => {
                      if (currentOffer.menuItemId) {
                        setLocation(`/category/العروض#product-${currentOffer.menuItemId}`);
                      } else if (currentOffer.restaurantId) {
                        setLocation(`/restaurant/${currentOffer.restaurantId}`);
                      } else {
                        setLocation('/category/العروض');
                      }
                    }}
                  >
                    {getS('btn_shop_now', 'تسوق الآن')}
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  {(currentOffer.discountPercent || currentOffer.discountAmount) && (
                    <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      {currentOffer.discountPercent
                        ? `خصم ${currentOffer.discountPercent}%`
                        : `خصم ${currentOffer.discountAmount} ر.ي`}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrows — only when multiple offers */}
              {activeOffers.length > 1 && (
                <>
                  <button
                    onClick={nextOffer}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={prevOffer}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {activeOffers.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setOfferIndex(i); startSlider(); }}
                        className={`rounded-full transition-all ${i === offerIndex ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                      />
                    ))}
                  </div>

                  {/* كل العروض */}
                  <button
                    className="absolute top-3 left-3 text-white/80 text-[10px] font-bold flex items-center gap-0.5 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full"
                    onClick={() => setLocation('/category/العروض')}
                  >
                    كل العروض
                    <ChevronLeft className="h-2.5 w-2.5" />
                  </button>
                </>
              )}
            </div>
          ) : activeOffers.length === 0 ? (
            /* Fallback when DB has no offers */
            <div
              className="relative w-full h-36 rounded-2xl overflow-hidden cursor-pointer shadow"
              onClick={() => setLocation('/category/العروض')}
            >
              <div className="absolute inset-0 orange-gradient p-4 text-white flex flex-col justify-between">
                <div>
                  <div className="bg-white/25 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block mb-2">عرض خاص</div>
                  <h3 className="text-sm font-black leading-snug">{getS('offer_banner_1_title', 'عروض حصرية يومية للتوصيل')}</h3>
                </div>
                <div>
                  <p className="text-[11px] text-white/85 mb-2">{getS('offer_banner_1_subtitle', 'اطلب الآن واستمتع بأسرع توصيل')}</p>
                  <div className="bg-white text-primary text-[11px] font-black px-4 py-1.5 rounded-full inline-flex items-center gap-1">
                    {getS('btn_shop_now', 'تسوق الآن')}<ChevronLeft className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Restaurant List ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-20">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 font-bold">
            {filteredRestaurants.length} مطعم ومحل
          </span>
          <span className="text-sm font-black text-gray-800">
            {selectedCategory === 'all'
              ? 'جميع المطاعم والمحلات'
              : categories?.find(c => c.id === selectedCategory)?.name || 'المطاعم'}
          </span>
        </div>

        {/* Nearest-tab: show location notice if no GPS */}
        {selectedTab === 'nearest' && !userLat && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 text-right">
            <Navigation className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 font-bold">يرجى السماح بالوصول إلى موقعك لعرض الأقرب إليك</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4 bg-white rounded-t-xl overflow-hidden">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`flex-1 py-3 font-bold text-sm border-b-2 transition-colors ${
                selectedTab === tab.key
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {filteredRestaurants.map(restaurant => {
            const status = getRestaurantStatus(restaurant);
            const isFav = favorites.has(restaurant.id);
            const dist =
              userLat && userLng && restaurant.latitude && restaurant.longitude
                ? haversineDistance(userLat, userLng, parseFloat(String(restaurant.latitude)), parseFloat(String(restaurant.longitude)))
                : null;

            return (
              <div
                key={restaurant.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]"
                onClick={() => setLocation(`/restaurant/${restaurant.id}`)}
              >
                <div className="flex items-center p-3 gap-3">
                  {/* Heart + Status badge */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <button
                      className={`p-1 transition-colors ${isFav ? 'text-primary' : 'text-gray-300 hover:text-primary'}`}
                      onClick={e => toggleFavorite(e, restaurant.id)}
                    >
                      <Heart className={`h-5 w-5 ${isFav ? 'fill-primary' : ''}`} />
                    </button>
                    <Badge className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                      status.isOpen
                        ? status.statusColor === 'yellow' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                        : 'bg-gray-700 text-white'
                    }`}>
                      {status.isOpen ? 'مفتوح' : 'مغلق'}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-gray-900 text-base leading-tight mb-0.5">
                      {restaurant.name}
                    </h4>
                    {restaurant.description && (
                      <p className="text-xs text-gray-500 leading-tight mb-1 truncate">{restaurant.description}</p>
                    )}
                    {restaurant.categoryId && (
                      <p className="text-xs text-gray-400 leading-tight mb-1 truncate">
                        {categories?.find(c => c.id === restaurant.categoryId)?.name || ''}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 flex-wrap">
                      {restaurant.deliveryTime && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />{restaurant.deliveryTime}
                        </span>
                      )}
                      {restaurant.deliveryFee !== undefined && (
                        <span className="flex items-center gap-0.5">
                          <Tag className="h-3 w-3" />{restaurant.deliveryFee} ريال
                        </span>
                      )}
                      {dist !== null && (
                        <span className="flex items-center gap-0.5 text-primary font-bold">
                          <MapPin className="h-3 w-3" />{formatDistance(dist)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Logo + Stars */}
                  <div className="shrink-0 flex flex-col items-center gap-1.5">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                      {restaurant.image
                        ? <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                        : <UtensilsCrossed className="h-7 w-7 text-gray-300" />
                      }
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`h-2.5 w-2.5 ${
                            star <= Math.round(parseFloat(restaurant.rating || '0') || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-200 fill-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {filteredRestaurants.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {selectedTab === 'favorites'
                  ? <Heart className="h-10 w-10 text-gray-300" />
                  : selectedTab === 'nearest'
                    ? <Navigation className="h-10 w-10 text-gray-300" />
                    : <UtensilsCrossed className="h-10 w-10 text-gray-300" />
                }
              </div>
              <p className="text-gray-500 font-bold text-lg">
                {selectedTab === 'favorites'
                  ? 'لا توجد مفضلات بعد'
                  : selectedTab === 'nearest'
                    ? 'لا توجد محلات قريبة'
                    : 'لا توجد مطاعم متاحة'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {selectedTab === 'favorites'
                  ? 'انقر على ♥ في أي مطعم لإضافته للمفضلة'
                  : 'جرب تغيير التصنيف أو الفلتر'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
