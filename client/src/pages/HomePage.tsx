import { useState } from 'react';
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
} from 'lucide-react';
import TimingBanner from '@/components/TimingBanner';
import { Badge } from '@/components/ui/badge';
import { useUiSettings } from '@/context/UiSettingsContext';
import type { Category, Restaurant } from '@shared/schema';

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTab, setSelectedTab] = useState('all');
  const { getSetting, isFeatureEnabled } = useUiSettings();

  const getS = (key: string, defaultValue: string) => getSetting(key) || defaultValue;
  const showSection = (key: string) => getSetting(key) !== 'false';

  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const handleRestaurantClick = (restaurantId: string) => {
    setLocation(`/restaurant/${restaurantId}`);
  };

  const tabs = [
    { key: 'all', label: getS('btn_tab_all', 'الكل') },
    { key: 'nearest', label: getS('btn_tab_nearest', 'الأقرب') },
    { key: 'newest', label: getS('btn_tab_new', 'الجديدة') },
    { key: 'popular', label: getS('btn_tab_favorites', 'المفضلة') },
  ];

  const filteredRestaurants = restaurants?.filter(restaurant => {
    if (selectedCategory !== 'all' && restaurant.categoryId !== selectedCategory) return false;
    if (selectedTab === 'popular' && !restaurant.isFeatured) return false;
    if (selectedTab === 'newest' && !restaurant.isNew) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Timing Banner - appears just below the header */}
      {showSection('show_hero_section') && (
        <TimingBanner />
      )}

      {/* Categories Section - Horizontal Scroll */}
      {showSection('show_categories') && (
        <div className="bg-white border-b">
          <div className="flex overflow-x-auto no-scrollbar px-4 py-3 gap-3">
            {/* All Categories */}
            <div 
              className={`flex flex-col items-center gap-1.5 cursor-pointer shrink-0 min-w-[70px]`}
              onClick={() => { setSelectedCategory('all'); setSelectedTab('all'); }}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${
                selectedCategory === 'all' 
                  ? 'bg-primary/10 border-primary shadow-sm' 
                  : 'bg-gray-50 border-gray-100'
              }`}>
                <Menu className={`h-7 w-7 ${selectedCategory === 'all' ? 'text-primary' : 'text-gray-500'}`} />
              </div>
              <span className={`text-[11px] font-bold text-center leading-tight ${selectedCategory === 'all' ? 'text-primary' : 'text-gray-600'}`}>
                {getS('text_all_categories', 'كل التصنيفات')}
              </span>
            </div>

            {categories?.map((category) => (
              <div 
                key={category.id} 
                className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 min-w-[70px]"
                onClick={() => { setSelectedCategory(category.id); setSelectedTab('all'); }}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all overflow-hidden ${
                  selectedCategory === category.id 
                    ? 'border-primary shadow-sm' 
                    : 'bg-gray-50 border-gray-100'
                }`}>
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                  ) : category.icon ? (
                    <i className={`${category.icon} text-2xl ${selectedCategory === category.id ? 'text-primary' : 'text-gray-500'}`} />
                  ) : (
                    <UtensilsCrossed className={`h-7 w-7 ${selectedCategory === category.id ? 'text-primary' : 'text-gray-500'}`} />
                  )}
                </div>
                <span className={`text-[11px] font-bold text-center leading-tight ${selectedCategory === category.id ? 'text-primary' : 'text-gray-600'}`}>
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Offers Banners */}
      {showSection('show_hero_section') && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex overflow-x-auto no-scrollbar gap-3">
            {/* Offer Banner 1 */}
            <div 
              className="relative flex-shrink-0 w-[85vw] max-w-xs h-36 overflow-hidden rounded-2xl cursor-pointer"
              onClick={() => setLocation('/offers')}
            >
              <div className="absolute inset-0 orange-gradient p-4 text-white flex flex-col justify-between">
                <div>
                  <div className="bg-white/25 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block mb-2">
                    عرض خاص
                  </div>
                  <h3 className="text-sm font-black leading-snug">
                    {getS('offer_banner_1_title', 'عروض حصرية يومية للتوصيل')}
                  </h3>
                </div>
                <div>
                  <p className="text-[11px] text-white/85 mb-2">
                    {getS('offer_banner_1_subtitle', 'اطلب الآن واستمتع بأسرع توصيل')}
                  </p>
                  <div className="bg-white text-primary text-[11px] font-black px-4 py-1.5 rounded-full inline-flex items-center gap-1">
                    {getS('btn_shop_now', 'تسوق الآن')}
                    <ChevronLeft className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Offer Banner 2 */}
            <div 
              className="relative flex-shrink-0 w-[85vw] max-w-xs h-36 overflow-hidden rounded-2xl cursor-pointer"
              onClick={() => setLocation('/offers')}
            >
              <div className="absolute inset-0 red-gradient p-4 text-white flex flex-col justify-between">
                <div>
                  <div className="bg-white/25 px-2.5 py-1 rounded-full text-[11px] font-bold inline-block mb-2">
                    كل العروض
                  </div>
                  <h3 className="text-sm font-black leading-snug">
                    {getS('offer_banner_2_title', 'اكتشف أحدث العروض والخصومات')}
                  </h3>
                </div>
                <div>
                  <p className="text-[11px] text-white/85 mb-2">
                    {getS('offer_banner_2_subtitle', 'خصومات حصرية على الطلبات')}
                  </p>
                  <div className="bg-white text-red-600 text-[11px] font-black px-4 py-1.5 rounded-full inline-flex items-center gap-1">
                    {getS('btn_shop_now', 'تسوق الآن')}
                    <ChevronLeft className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant List Section */}
      <div className="px-4 pt-3 pb-20">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-4 bg-white rounded-t-xl overflow-hidden">
          {tabs.map((tab) => (
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

        {/* Restaurant Cards */}
        <div className="space-y-3">
          {filteredRestaurants?.map((restaurant) => (
            <div 
              key={restaurant.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]"
              onClick={() => handleRestaurantClick(restaurant.id)}
            >
              <div className="flex items-center p-3 gap-3">
                {/* Heart + Closed Badge (right in RTL) */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <button 
                    className="p-1 text-gray-300 hover:text-primary transition-colors"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <Heart className="h-5 w-5" />
                  </button>
                  <Badge className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                    restaurant.isOpen 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-700 text-white'
                  }`}>
                    {restaurant.isOpen ? 'مفتوح' : 'مغلق'}
                  </Badge>
                </div>

                {/* Restaurant Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 text-base leading-tight mb-0.5">
                    {restaurant.name}
                  </h4>
                  {restaurant.description && (
                    <p className="text-xs text-gray-500 leading-tight mb-1 truncate">
                      {restaurant.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    {restaurant.deliveryTime && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {restaurant.deliveryTime}
                      </span>
                    )}
                    {restaurant.deliveryFee !== undefined && (
                      <span className="flex items-center gap-0.5">
                        <Tag className="h-3 w-3" />
                        {restaurant.deliveryFee} ريال
                      </span>
                    )}
                  </div>
                </div>

                {/* Restaurant Logo + Rating */}
                <div className="shrink-0 flex flex-col items-center gap-1.5">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                    {restaurant.image ? (
                      <img 
                        src={restaurant.image} 
                        alt={restaurant.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <UtensilsCrossed className="h-7 w-7 text-gray-300" />
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((star) => (
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
          ))}

          {/* Empty State */}
          {(!filteredRestaurants || filteredRestaurants.length === 0) && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="h-10 w-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-bold text-lg">لا توجد مطاعم متاحة</p>
              <p className="text-gray-400 text-sm mt-1">جرب تغيير التصنيف أو الفلتر</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
