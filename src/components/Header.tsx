import React from 'react';
import { User, Booking } from '../types';
import {
  Calendar,
  Printer,
  Users,
  BarChart3,
  Plus,
  Shield,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  LogOut,
  Menu,
} from 'lucide-react';
import { canPerformAction } from '../utils/permissions';
import { useAuth } from '../contexts/AuthContext';
import { NotificationReminders } from './NotificationReminders';

interface HeaderProps {
  currentUser: User;
  activeTab: 'bookings' | 'upcoming' | 'calendar' | 'printing' | 'users' | 'stats' | 'account';
  onTabChange: (tab: 'bookings' | 'upcoming' | 'calendar' | 'printing' | 'users' | 'stats' | 'account') => void;
  onOpenCreateModal: () => void;
  onOpenSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalBookingsCount: number;
  printingJobsCount: number;
  bookings: Booking[];
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onOpenCreateModal,
  onOpenSidebar,
  searchQuery,
  onSearchChange,
  totalBookingsCount,
  printingJobsCount,
  bookings,
}) => {
  const canCreate = canPerformAction(currentUser, 'createBooking');
  const { signOut } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 lg:sticky lg:inset-x-auto w-full max-w-full overflow-x-clip bg-slate-900/95 backdrop-blur-xl text-white shadow-md z-30 border-b border-slate-800">
      {/* Top studio bar */}
      <div className="w-full min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 overflow-hidden">
        <div className="w-full min-w-0 flex items-center justify-between h-20 gap-2 overflow-hidden">
          {/* Menu Button & Logo */}
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={onOpenSidebar}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700/80 transition-colors cursor-pointer flex items-center justify-center shrink-0 lg:hidden"
              title="فتح القائمة الجانبية"
              aria-label="القائمة الجانبية"
            >
              <Menu className="w-5 h-5 text-blue-400" />
            </button>

            <div className="flex min-w-0 items-center gap-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="hidden sm:block text-lg sm:text-xl font-bold tracking-tight text-white font-tajawal">
                    ستوديو فوتو
                  </h1>
                  <span className="bg-blue-500/20 text-blue-400 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full border border-blue-500/30 whitespace-nowrap hidden xs:inline-block">
                    إدارة الحجوزات
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden md:block">
                  إدارة الحجوزات، الطباعة، والصلاحيات بالحقول
                </p>
              </div>
            </div>
          </div>

          {/* Search bar & Quick Create Button */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NotificationReminders bookings={bookings} />
            <div className="relative hidden md:block w-64 lg:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ابحث باسم العميل، الهاتف أو الفعالية..."
                className="w-full bg-slate-800/90 text-sm text-slate-200 placeholder-slate-400 pl-4 pr-10 py-2 rounded-lg border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            {canCreate && (
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">حجز جديد</span>
              </button>
            )}

            <div onClick={() => onTabChange('account')} role="button" tabIndex={0} title="حسابي" className="flex shrink-0 items-center gap-1 sm:gap-2.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 p-1 sm:p-1.5 sm:pl-2 rounded-lg overflow-hidden cursor-pointer">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/40"
                />
                <div className="hidden sm:block text-right text-xs">
                  <div className="font-bold text-slate-200 line-clamp-1">
                    {currentUser.name}
                  </div>
                  <div className="hidden sm:flex text-blue-400 font-medium items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {currentUser.role}
                  </div>
                </div>
              <button onClick={signOut} title="تسجيل الخروج" aria-label="تسجيل الخروج" className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"><LogOut className="w-4 h-4"/></button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
