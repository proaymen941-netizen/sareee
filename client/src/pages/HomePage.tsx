import { useState, useEffect } from 'react';
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
  ShoppingBag,
  MapPin,
  Navigation,
} from 'lucide-react';
import TimingBanner from '@/components/TimingBanner';
import { Badge } from '@/components/ui/badge';
import { useUiSettings } from '@/context/UiSettingsContext';
import type { Category, Restaurant, SpecialOffer } from '@shared/schema';
import { useUserLocation } from '@/context/LocationContext';

// حساب المسافة بين نقطتين (كيلومتر)
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

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTab, setSelectedTab] = useState('all');
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { getSetting } = useUiSettings();
  const { location: userLocation } = useUserLocation();

  const getS = (key: string, defaultValue: string) => getSetting(key) || defaultValue;
  const showSection = (key: string) => getSetting(key) !== 'false';

  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: offers } = useQuery<SpecialOffer[]>({
    queryKey: ['/api/special-offers'],
  });

  const activeOffers = offers?.filter(o => o.isActive) || [];

  useEffect(() => {
    if (activeOffers.length > 1) {
      const interval = setInterval(() => {
        setCurrentOfferIndex(prev => (prev + 1) % activeOffers.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeOffers.length]);

  const handleRestaurantClick = (restaurantId: string) => {
    setLocation(`/restaurant/${restaurantId}`);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tabs = [
    { key: 'all', label: getS('btn_tab_all', 'الكل') },
    { key: 'nearest', label: getS('btn_tab_nearest', 'الأقرب') },
    { key: 'newest', label: getS('btn_tab_new', 'الجديدة') },
    { key: 'popular', label: getS('btn_tab_favorites', 'المفضلة') },
  ];

  const activeCategories = categories?.filter(c => c.isActive !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) || [];

  // حساب المسافة لكل مطعم
  const userLat = userLocation.position?.coords.latitude;
  const userLng = userLocation.position?.coords.longitude;

  const getDistance = (restaurant: Restaurant): number | null => {
    if (!userLat || !userLng) return null;
    const lat = restaurant.latitude ? parseFloat(String(restaurant.latitude)) : null;
    const lng = restaurant.longitude ? parseFloat(String(restaurant.longitude)) : null;
    if (!lat || !lng) return null;
    return haversineDistance(userLat, userLng, lat, lng);
  };

  const filteredRestaurants = restaurants?.filter(restaurant => {
    if (!restaurant.isActive) return false;
    if (selectedCategory !== 'all' && restaurant.categoryId !== selectedCategory) return false;
    if (selectedTab === 'popular' && !restaurant.isFeatured) return false;
    if (selectedTab === 'newest' && !restaurant.isNew) return false;
    return true;
  });

  // ترتيب حسب الأقرب
  const sortedRestaurants = filteredRestaurants ? [...filteredRestaurants].sort((a, b) => {
    if (selectedTab === 'nearest') {
      const da = getDistance(a);
      const db = getDistance(b);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    }
    return 0;
  }) : [];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* Timing Banner */}
      {showSection('show_hero_section') && <TimingBanner />}

      {/* Categories Horizontal Scroll */}
      {showSection('show_categories') && (
        <div className="bg-white border-b border-gray-100">
          <div className="flex overflow-x-auto no-scrollbar px-3 py-3 gap-2">
            {/* All Categories */}
            <button
              className="flex flex-col items-center gap-1.5 shrink-0 min-w-[72px]"
              onClick={() => { setSelectedCategory('all'); setSelectedTab('all'); }}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${
                selectedCategory === 'all'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 bg-gray-50'
              }`}>
                <Menu className={`h-7 w-7 ${selectedCategory === 'all' ? 'text-primary' : 'text-gray-400'}`} />
              </div>
              <span className={`text-[11px] font-bold text-center leading-tight ${selectedCategory === 'all' ? 'text-primary' : 'text-gray-500'}`}>
                {getS('text_all_categories', 'كل التصنيفات')}
              </span>
            </button>

            {activeCategories.map((category) => (
              <button
                key={category.id}
                className="flex flex-col items-center gap-1.5 shrink-0 min-w-[72px]"
                onClick={() => { setSelectedCategory(category.id); setSelectedTab('all'); }}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all overflow-hidden ${
                  selectedCategory === category.id
                    ? 'border-primary shadow-sm'
                    : 'border-gray-100 bg-gray-50'
                }`}>
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className={`h-7 w-7 ${selectedCategory === category.id ? 'text-primary' : 'text-gray-400'}`} />
                  )}
                </div>
                <span className={`text-[11px] font-bold text-center leading-tight ${selectedCategory === category.id ? 'text-primary' : 'text-gray-500'}`}>
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Offers Slider Banner */}
      {showSection('show_hero_section') && activeOffers.length > 0 && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative overflow-hidden rounded-2xl shadow-md">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(${currentOfferIndex * 100}%)` }}
            >
              {activeOffers.map((offer) => (
                <div key={offer.id} className="w-full flex-shrink-0 relative h-[170px] bg-gradient-to-br from-amber-900 via-amber-800 to-red-900">
                  {offer.image && (
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/30 to-transparent" />

                  {/* Badges top */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {offer.showBadge !== false && (
                      <>
                        <span className="bg-primary text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                          {offer.badgeText1 || 'طازج يومياً'}
                        </span>
                        <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/30">
                          {offer.badgeText2 || 'عروض حصرية'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 text-right">
                    <h3 className="text-white text-2xl font-black leading-tight mb-1 drop-shadow-lg">
                      {offer.title}
                    </h3>
                    <p className="text-white/80 text-xs mb-3 leading-snug line-clamp-1">{offer.description}</p>
                    <div className="flex items-center justify-between">
                      {(offer as any).discountAmount && (
                        <span className="text-white/90 text-xs font-bold bg-black/30 px-2.5 py-1 rounded-full">
                          خصم {(offer as any).discountAmount} ر.ي
                        </span>
                      )}
                      <button
                        className="bg-white text-gray-800 text-xs font-black px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg hover:bg-primary hover:text-white transition-colors"
                        onClick={() => {
                          if (offer.categoryId) {
                            const cat = activeCategories.find(c => c.id === offer.categoryId);
                            if (cat) { setLocation(`/category/${cat.name}`); return; }
                          }
                          setLocation('/category/العروض');
                        }}
                      >
                        تسوق الآن
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            {activeOffers.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {activeOffers.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentOfferIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentOfferIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                  />
                ))}
              </div>
            )}

            {/* Arrows */}
            {activeOffers.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentOfferIndex(p => (p - 1 + activeOffers.length) % activeOffers.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentOfferIndex(p => (p + 1) % activeOffers.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Restaurants Section */}
      <div className="px-3 pt-4 pb-24">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-xs font-medium">
            {sortedRestaurants.length} مطعم ومحل
          </span>
          <h2 className="text-base font-black text-gray-900">جميع المطاعم والمحلات</h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-3 bg-white rounded-t-xl overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`flex-1 py-2.5 font-bold text-sm border-b-2 transition-colors ${
                selectedTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Location hint for nearest tab */}
        {selectedTab === 'nearest' && !userLat && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-3">
            <Navigation className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="text-xs text-blue-700 font-medium">يرجى السماح بالوصول إلى موقعك لعرض المطاعم الأقرب</span>
          </div>
        )}

        {/* Restaurant Cards */}
        <div className="space-y-2.5">
          {sortedRestaurants.map((restaurant) => {
            const distance = getDistance(restaurant);
            return (
              <div
                key={restaurant.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
                onClick={() => handleRestaurantClick(restaurant.id)}
              >
                <div className="flex items-center p-3 gap-3">
                  {/* Image on right (RTL) */}
                  <div className="shrink-0 relative">
                    <div className="w-[72px] h-[72px] rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                      {restaurant.image ? (
                        <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                  </div>

                  {/* Restaurant Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-gray-900 text-sm leading-tight mb-0.5 text-right">
                      {restaurant.name}
                    </h4>
                    {restaurant.description && (
                      <p className="text-xs text-gray-400 leading-tight mb-1.5 truncate text-right">
                        {restaurant.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 justify-end flex-wrap text-[11px] text-gray-400">
                      {selectedTab === 'nearest' && distance !== null && (
                        <span className="flex items-center gap-0.5 text-primary font-bold">
                          <MapPin className="h-3 w-3" />
                          {formatDistance(distance)}
                        </span>
                      )}
                      {restaurant.deliveryTime && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {restaurant.deliveryTime}
                        </span>
                      )}
                      {typeof restaurant.deliveryFee !== 'undefined' && (
                        <span className="flex items-center gap-0.5">
                          <Tag className="h-3 w-3" />
                          {restaurant.deliveryFee} ريال
                        </span>
                      )}
                      {restaurant.rating && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          {restaurant.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Favorite + Status */}
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <button
                      className="p-1"
                      onClick={(e) => toggleFavorite(restaurant.id, e)}
                    >
                      <Heart className={`h-5 w-5 transition-colors ${favorites.has(restaurant.id) ? 'fill-primary text-primary' : 'text-gray-200'}`} />
                    </button>
                    <Badge className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                      restaurant.isOpen ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-white'
                    }`}>
                      {restaurant.isOpen ? 'مفتوح' : 'مغلق'}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {sortedRestaurants.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="h-10 w-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-bold">لا توجد مطاعم متاحة</p>
              <p className="text-gray-400 text-sm mt-1">جرب تغيير التصنيف أو الفلتر</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
