import React from 'react';
import { User, Booking } from '../types';
import {
  Camera,
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

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  activeTab: 'bookings' | 'upcoming' | 'calendar' | 'printing' | 'users' | 'stats';
  onTabChange: (tab: 'bookings' | 'upcoming' | 'calendar' | 'printing' | 'users' | 'stats') => void;
  onOpenCreateModal: () => void;
  onOpenSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalBookingsCount: number;
  printingJobsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  activeTab,
  onTabChange,
  onOpenCreateModal,
  onOpenSidebar,
  searchQuery,
  onSearchChange,
  totalBookingsCount,
  printingJobsCount,
}) => {
  const canCreate = canPerformAction(currentUser, 'createBooking');

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30 border-b border-slate-800">
      {/* Top studio bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2">
          {/* Menu Button & Logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenSidebar}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700/80 transition-colors cursor-pointer flex items-center justify-center shrink-0 lg:hidden"
              title="فتح القائمة الجانبية"
              aria-label="القائمة الجانبية"
            >
              <Menu className="w-5 h-5 text-blue-400" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-tajawal">
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
          <div className="flex items-center gap-3">
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

            {/* User Switcher Simulator */}
            <div className="relative group">
              <div className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 p-1.5 pl-3 rounded-lg cursor-pointer transition-all">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/40"
                />
                <div className="text-right text-xs">
                  <div className="font-bold text-slate-200 line-clamp-1">
                    {currentUser.name}
                  </div>
                  <div className="text-blue-400 font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {currentUser.role}
                  </div>
                </div>
              </div>

              {/* User Switcher Dropdown */}
              <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 border-b border-slate-800 mb-1 flex items-center justify-between">
                  <span>تبديل الحساب لتجربة الصلاحيات:</span>
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {allUsers.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => onSelectUser(u)}
                        className={`w-full text-right p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-bold">{u.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {u.role} • {u.permissions.bookingScope === 'all' ? 'كل الحجوزات' : 'المسندة فقط'}
                            </div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
