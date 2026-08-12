import React from 'react';
import { User, Booking } from '../types';
import {
  Camera,
  Calendar,
  CalendarDays,
  CalendarRange,
  Printer,
  Users,
  BarChart3,
  Plus,
  Shield,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  LayoutGrid,
  Columns3,
  Table as TableIcon,
  RotateCcw,
  Sliders,
  Award,
} from 'lucide-react';
import { canPerformAction } from '../utils/permissions';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  activeTab: 'bookings' | 'upcoming' | 'calendar' | 'printing' | 'users' | 'stats' | 'account';
  onTabChange: (tab: 'bookings' | 'upcoming' | 'calendar' | 'printing' | 'users' | 'stats' | 'account') => void;
  onOpenCreateModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalBookingsCount: number;
  printingJobsCount: number;
  viewMode: 'cards' | 'kanban' | 'table';
  onViewModeChange: (mode: 'cards' | 'kanban' | 'table') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeTab,
  onTabChange,
  onOpenCreateModal,
  searchQuery,
  onSearchChange,
  totalBookingsCount,
  printingJobsCount,
  viewMode,
  onViewModeChange,
}) => {
  const canCreate = canPerformAction(currentUser, 'createBooking');

  return (
    <>
      {/* Mobile Backdrop (Only on mobile when open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content (Persistent on Web, Drawer on Mobile) */}
      <aside
        className={`bg-slate-900 text-white border-l border-slate-800 flex flex-col shrink-0 z-40 transition-all duration-300 ${
          isOpen
            ? 'fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] shadow-2xl h-dvh animate-in slide-in-from-right z-50 lg:w-72 lg:h-dvh lg:shadow-none lg:animate-none'
            : 'hidden lg:flex lg:fixed lg:right-0 lg:top-0 lg:bottom-0 lg:w-72 lg:h-dvh'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-tajawal text-white tracking-tight">
                ستوديو فوتو
              </h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded border border-blue-500/30">
                نظام إدارة الحجوزات
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer lg:hidden"
            title="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar inside Sidebar */}
        <div className="p-4 border-b border-slate-800/80 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث باسم العميل أو الموبايل..."
              className="w-full bg-slate-800/90 text-xs text-slate-200 placeholder-slate-400 pl-3 pr-9 py-2.5 rounded-lg border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Quick Action Button */}
        {canCreate && (
          <div className="p-4 pb-2 shrink-0">
            <button
              onClick={() => {
                onOpenCreateModal();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 px-4 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>حجز جديد</span>
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {/* Main Navigation */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
              القائمة الرئيسية
            </div>
            <nav className="space-y-1">
              {/* Bookings */}
              <button
                onClick={() => {
                  onTabChange('bookings');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span>جميع الحجوزات</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'bookings'
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {totalBookingsCount}
                </span>
              </button>

              {/* Today & 3 Days Sessions */}
              <button
                onClick={() => {
                  onTabChange('upcoming');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-amber-400" />
                  <span>جدول اليوم والـ 3 أيام</span>
                </div>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold">
                  جديد
                </span>
              </button>

              {/* Calendar View */}
              <button
                onClick={() => {
                  onTabChange('calendar');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarRange className="w-4 h-4 text-blue-400" />
                  <span>تقويم المواعيد</span>
                </div>
              </button>

              {/* Printing */}
              <button
                onClick={() => {
                  onTabChange('printing');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'printing'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Printer className="w-4 h-4" />
                  <span>إدارة الطباعة</span>
                </div>
                {printingJobsCount > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === 'printing'
                        ? 'bg-blue-700 text-white'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {printingJobsCount}
                  </span>
                )}
              </button>

              {/* Users & Permissions (Admin Only) */}
              {currentUser.isSystemAdmin && (
                <button
                  onClick={() => {
                    onTabChange('users');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span>المستخدمين والصلاحيات</span>
                  </div>
                  <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30 font-bold">
                    المدير
                  </span>
                </button>
              )}

              {/* Stats & Overview */}
              <button
                onClick={() => {
                  onTabChange('stats');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'stats'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4" />
                  <span>التقارير والإحصائيات</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Display Mode (if Bookings tab active) */}
          {activeTab === 'bookings' && (
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>وضع عرض الحجوزات</span>
                <Sliders className="w-3 h-3 text-blue-400" />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onViewModeChange('cards')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 mb-1" />
                  <span>بطاقات</span>
                </button>

                <button
                  onClick={() => onViewModeChange('kanban')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    viewMode === 'kanban'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Columns3 className="w-4 h-4 mb-1" />
                  <span>كانبان</span>
                </button>

                <button
                  onClick={() => onViewModeChange('table')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <TableIcon className="w-4 h-4 mb-1" />
                  <span>جدول</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Footer: Current User Status */}
        <button onClick={() => { onTabChange('account'); onClose(); }} className={`w-full text-right p-4 border-t border-slate-800 shrink-0 flex items-center gap-3 transition-colors ${activeTab==='account'?'bg-blue-600/20':'bg-slate-950/60 hover:bg-slate-800'}`}>
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/40 shrink-0"
          />
          <div className="hidden sm:block flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>{currentUser.role}</span>
            </div>
          </div>
        </button>
      </aside>
    </>
  );
};
