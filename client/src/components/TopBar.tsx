import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  ShoppingCart, 
  Heart, 
  User, 
  Search,
  Menu as MenuIcon,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useUiSettings } from '@/context/UiSettingsContext';

export const TopBar: React.FC = () => {
  const [, setLocation] = useLocation();
  const { state } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { getSetting, loading: settingsLoading } = useUiSettings();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const logoUrl = getSetting('header_logo_url') || getSetting('logo_url') || '';
  const appName = getSetting('app_name') || 'السريع ون';
  const addressText = getSetting('address_text') || 'دائماً في خدمتك';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleOpenCart = () => {
    window.dispatchEvent(new CustomEvent('openCart'));
  };

  const getItemCount = () => state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="sticky top-0 z-50">
      {/* Desktop Header */}
      <div className="bg-white border-b hidden md:block shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-8" dir="rtl">
          <div
            className="cursor-pointer shrink-0"
            onClick={() => setLocation('/')}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-14 w-auto object-contain" />
            ) : (
              <div className="text-2xl font-black text-primary">{appName}</div>
            )}
          </div>

          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearch} className="relative group">
              <input
                className="w-full pr-12 pl-4 h-11 bg-gray-100 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-xl transition-all text-sm font-medium text-right outline-none"
                placeholder={t('search_placeholder') || 'ابحث...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocation(user ? '/profile' : '/auth')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <User className="h-6 w-6 text-gray-600" />
            </button>
            <button
              onClick={() => setLocation('/favorites')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Heart className="h-6 w-6 text-gray-600" />
            </button>
            <button
              onClick={handleOpenCart}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            >
              <ShoppingCart className="h-6 w-6 text-gray-600" />
              {getItemCount() > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-primary text-white text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-black border border-white">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header - matching reference image */}
      <div className="md:hidden header-gradient shadow-lg" dir="rtl">
        <div className="px-2 py-2 flex items-center justify-between">

          {/* Right side (RTL start): Heart + Cart */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setLocation('/favorites')}
              className="h-10 w-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <Heart className="h-5 w-5" />
            </button>
            <button
              onClick={handleOpenCart}
              className="h-10 w-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {getItemCount() > 0 && (
                <span className="absolute top-1 right-1 bg-white text-primary text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-black">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>

          {/* Center: Logo / App Name */}
          <button
            className="flex-1 flex flex-col items-center cursor-pointer"
            onClick={() => setLocation('/')}
          >
            {settingsLoading ? (
              <div className="h-6 w-28 bg-white/20 animate-pulse rounded" />
            ) : logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-9 w-auto object-contain" />
            ) : (
              <span className="text-white font-black text-xl leading-tight">{appName}</span>
            )}
            <div className="flex items-center gap-0.5 text-white/80 text-[11px] mt-0.5">
              <ChevronDown className="h-3 w-3" />
              <span>{addressText}</span>
            </div>
          </button>

          {/* Left side (RTL end): Search + User + Menu */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="h-10 w-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setLocation(user ? '/profile' : '/auth')}
              className="h-10 w-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <User className="h-5 w-5" />
            </button>
            <button
              onClick={() => document.getElementById('sidebar-trigger')?.click()}
              className="h-10 w-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {isSearchOpen && (
          <div className="px-3 pb-2.5">
            <form onSubmit={handleSearch} className="relative">
              <input
                autoFocus
                className="w-full bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 rounded-full px-4 py-2 pr-10 text-sm focus:outline-none focus:bg-white/30 text-right"
                placeholder="ابحث عن مطعم أو طبق..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
