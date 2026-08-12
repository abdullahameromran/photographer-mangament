/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Booking, BookingStatus, PrintStatus } from './types';
import { filterBookingsForUser, canPerformAction, calculateFinancials } from './utils/permissions';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BookingCard } from './components/BookingCard';
import { BookingModal } from './components/BookingModal';
import { PrintManagement } from './components/PrintManagement';
import { UsersManagement } from './components/UsersManagement';
import { StatsOverview } from './components/StatsOverview';
import { KanbanBoard } from './components/KanbanBoard';
import { TodaySessionsView } from './components/TodaySessionsView';
import { CalendarView } from './components/CalendarView';
import { AccountPage } from './components/AccountPage';
import {
  LayoutGrid,
  Columns3,
  Table as TableIcon,
  Plus,
  Filter,
  Search,
  Sparkles,
  Printer,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { bookingsApi, isSupabaseConfigured, usersApi } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user: authUser } = useAuth();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) { setIsDataLoading(false); return; }
    let active = true;
    const introStartedAt = Date.now();
    Promise.all([bookingsApi.list(), usersApi.list()])
      .then(([bookingData,userData]) => { if (active) { setBookings(bookingData || []); setUsers(userData); } })
      .catch((error) => setDataError(error instanceof Error ? error.message : 'تعذر فتح مساحة العمل'))
      .finally(() => {
        const remainingIntroTime = Math.max(0, 2000 - (Date.now() - introStartedAt));
        window.setTimeout(() => { if (active) setIsDataLoading(false); }, remainingIntroTime);
      });
    return () => { active = false; };
  }, []);

  const currentUser = users.find((u) => u.id === authUser?.id) || users[0];

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<
    'bookings' | 'upcoming' | 'calendar' | 'printing' | 'users' | 'stats' | 'account'
  >('bookings');
  const [viewMode, setViewMode] = useState<'cards' | 'kanban' | 'table'>('cards');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Sidebar Drawer State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<Booking | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter bookings according to user's assigned scope (All, Assigned Only, Selected)
  const accessibleBookings = currentUser ? filterBookingsForUser(bookings, currentUser) : [];

  // Apply search and status filters
  const filteredBookings = accessibleBookings.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase());

    const financialStatus = calculateFinancials(b.price, b.hasDeposit, b.depositAmount).remaining === 0 && b.price > 0
      ? 'مدفوع بالكامل'
      : 'غير مدفوع بالكامل';
    const matchesStatus = statusFilter === 'all' || financialStatus === statusFilter;
    const matchesType = typeFilter === 'all' || b.bookingTypes.includes(typeFilter as any);

    return matchesSearch && matchesStatus && matchesType;
  });

  // Modal handlers
  const handleOpenCreateModal = () => {
    setSelectedBookingForModal(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenCreateModalWithDate = (dateStr: string) => {
    setSelectedBookingForModal({ date: dateStr } as Booking);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (booking: Booking) => {
    setSelectedBookingForModal(booking);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (booking: Booking) => {
    setSelectedBookingForModal(booking);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleSaveBooking = async (bookingData: Partial<Booking>) => {
    if (modalMode === 'create') {
      const newBooking: Booking = {
        id: `bk_${Date.now()}`,
        title: bookingData.title || 'حجز جديد',
        customerName: bookingData.customerName || '',
        phone: bookingData.phone || '',
        whatsapp: bookingData.whatsapp || bookingData.phone || '',
        bookingTypes: bookingData.bookingTypes || ['سيشن'],
        typeSchedules: bookingData.typeSchedules || [],
        date: bookingData.date || new Date().toISOString().split('T')[0],
        startTime: bookingData.startTime || '18:00',
        endTime: bookingData.endTime || '22:00',
        location: bookingData.location || '',
        mapUrl: bookingData.mapUrl || '',
        notes: bookingData.notes || '',
        price: bookingData.price || 0,
        hasDeposit: bookingData.hasDeposit ?? false,
        depositAmount: bookingData.depositAmount || 0,
        hasPrint: bookingData.hasPrint ?? false,
        printOptions: bookingData.printOptions || {
          largeCanvas: false,
          smallCanvas: false,
          album30x45: false,
          album30x60: false,
          photoCards: false,
          photoCardsCount: 0,
        },
        printStatus: bookingData.printStatus || 'لم تبدأ',
        reminder: bookingData.reminder || 'قبل يوم',
        assignedUserIds: bookingData.assignedUserIds || (authUser ? [authUser.id] : []),
        status: bookingData.status || 'مؤكد',
        createdAt: new Date().toISOString().split('T')[0],
      };

      setBookings((current) => [newBooking, ...current]);
      try {
        const realId = await bookingsApi.create(newBooking);
        setBookings((current) => current.map((item) => item.id === newBooking.id ? { ...item, id: realId } : item));
        showToast(`✨ تم تسجيل الحجز "${newBooking.title}" بنجاح!`);
      } catch (error) {
        setBookings((current) => current.filter((item) => item.id !== newBooking.id));
        showToast(`تعذر حفظ الحجز: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
      }
    } else if (modalMode === 'edit' && selectedBookingForModal) {
      const updated = bookings.map((b) =>
        b.id === selectedBookingForModal.id ? ({ ...b, ...bookingData } as Booking) : b
      );
      setBookings(updated);
      try { await bookingsApi.update(selectedBookingForModal.id, bookingData); showToast('✅ تم حفظ التعديلات على الحجز بنجاح'); }
      catch (error) { setBookings(bookings); showToast(`تعذر حفظ التعديل: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`); }
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm('هل أنت تأكد من إلغاء وحذف هذا الحجز نهائياً؟')) {
      const previous = bookings;
      setBookings(bookings.filter((b) => b.id !== bookingId));
      try { await bookingsApi.remove(bookingId); showToast('🗑️ تم حذف الحجز من النظام'); }
      catch (error) { setBookings(previous); showToast(`تعذر حذف الحجز: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`); }
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    setBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    try { await bookingsApi.update(bookingId, { status:newStatus }); showToast(`🔄 تم تغيير حالة الحجز إلى "${newStatus}"`); }
    catch (error) { const fresh = await bookingsApi.list().catch(() => null); if (fresh) setBookings(fresh); showToast(`تعذر تغيير الحالة: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`); }
  };

  const handlePrintStatusChange = async (bookingId: string, newPrintStatus: PrintStatus) => {
    setBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, printStatus: newPrintStatus } : b))
    );
    try { await bookingsApi.updatePrintStatus(bookingId, newPrintStatus); showToast(`🖨️ تم تحديث حالة الطباعة إلى "${newPrintStatus}"`); }
    catch (error) { const fresh = await bookingsApi.list().catch(() => null); if (fresh) setBookings(fresh); showToast(`تعذر تحديث الطباعة: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`); }
  };

  // User management handlers
  const handleSaveUser = async (updatedUser: User) => {
    const exists = users.some((u) => u.id === updatedUser.id);
    if (exists) {
      setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      try { await usersApi.update(updatedUser); showToast(`⚙️ تم تحديث صلاحيات وحقول المستخدم "${updatedUser.name}"`); }
      catch(error) { setUsers(await usersApi.list().catch(()=>users)); showToast(`تعذر تحديث المستخدم: ${error instanceof Error?error.message:'خطأ غير متوقع'}`); }
    } else {
      showToast('أنشئ حساب العضو من صفحة التسجيل أولاً، ثم عدّل صلاحياته هنا.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('هل أنت متاكد من حذف هذا المستخدم؟')) {
      const previous=users;setUsers(users.filter((u) => u.id !== userId));
      try { await usersApi.removeProfile(userId); showToast('🗑️ تم حذف ملف المستخدم وصلاحياته'); }
      catch(error){setUsers(previous);showToast(`تعذر حذف المستخدم: ${error instanceof Error?error.message:'خطأ غير متوقع'}`);}
    }
  };

  const printJobsCount = accessibleBookings.filter((b) => b.hasPrint).length;

  if (dataError || (!isDataLoading && !currentUser)) return (
    <div dir="rtl" className="min-h-screen grid place-items-center bg-slate-950 text-white font-cairo px-5">
      <div className="max-w-md text-center bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-rose-500/10 text-rose-400 grid place-items-center"><Layers className="w-7 h-7" /></div>
        <h1 className="text-xl font-black mb-3">تعذر فتح مساحة العمل</h1>
        <p className="text-sm leading-7 text-slate-400 mb-6">{dataError || 'لا يوجد ملف مستخدم مرتبط بهذا الحساب. طبّق migrations قاعدة البيانات ثم سجّل الدخول من جديد.'}</p>
        <button onClick={() => window.location.reload()} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-sm transition-colors">إعادة المحاولة</button>
      </div>
    </div>
  );

  if (isDataLoading) return (
    <div dir="rtl" className="studio-loader-shell font-cairo" role="status" aria-label="جاري تجهيز مساحة العمل">
      <div className="studio-loader-glow" />
      <div className="studio-loader-content">
        <div className="studio-loader-camera">
          <span className="studio-loader-ring" />
          <span className="studio-loader-lens"><span /></span>
          <span className="studio-loader-flash" />
        </div>
        <div className="studio-loader-brand">Studio Flow</div>
        <p>نجهّز مساحة عملك</p>
        <div className="studio-loader-dots" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100/70 text-slate-900 pb-20 font-cairo flex flex-col lg:flex-row">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white font-semibold px-5 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in slide-in-from-bottom-4 text-xs sm:text-sm">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation (Persistent on Desktop, Drawer on Mobile) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCreateModal={handleOpenCreateModal}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalBookingsCount={accessibleBookings.length}
        printingJobsCount={printJobsCount}
      />

      {/* Main Studio Content Area */}
      <div className="flex-1 min-w-0 flex flex-col pt-20 lg:pt-0 lg:mr-72">
        {/* Main Studio Header */}
        <Header
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalBookingsCount={accessibleBookings.length}
          printingJobsCount={printJobsCount}
          bookings={accessibleBookings}
        />

        {/* Main Container Body */}
        <main className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 overflow-x-hidden">
        {/* Tab 1: Bookings Management */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Filter & View Controls Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search mobile */}
              <div className="md:hidden">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم العميل أو الموبايل..."
                    className="w-full bg-slate-50 text-xs text-slate-800 placeholder-slate-400 pl-3 pr-9 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Status & Type Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <span className="text-xs font-bold text-slate-400 shrink-0 ml-1 uppercase tracking-wider text-[10px]">
                  الحالة:
                </span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الكل ({accessibleBookings.length})
                </button>

                <button
                  onClick={() => setStatusFilter('مدفوع بالكامل')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'مدفوع بالكامل'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  مدفوع بالكامل
                </button>

                <button
                  onClick={() => setStatusFilter('غير مدفوع بالكامل')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'غير مدفوع بالكامل'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  غير مدفوع بالكامل
                </button>
              </div>

              {/* View Switcher (Cards vs Kanban vs Table) */}
              <div className="flex items-center gap-2 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === 'cards'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>بطاقات</span>
                  </button>

                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === 'kanban'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Columns3 className="w-4 h-4" />
                    <span>كانبان (أعمدة)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* View Mode Content */}
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-base">لا توجد حجوزات متاحة</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  قد يكون هذا بسبب قيود الصلاحيات المطبقة على حسابك الحالي أو عدم مطابقة شروط البحث.
                </p>
                {canPerformAction(currentUser, 'createBooking') && (
                  <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة حجز جديد الآن</span>
                  </button>
                )}
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredBookings.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    currentUser={currentUser}
                    allUsers={users}
                    onView={handleOpenViewModal}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteBooking}
                    onStatusChange={handleStatusChange}
                    onPrintStatusChange={handlePrintStatusChange}
                  />
                ))}
              </div>
            ) : (
              <KanbanBoard
                bookings={filteredBookings}
                currentUser={currentUser}
                allUsers={users}
                onViewBooking={handleOpenViewModal}
                onEditBooking={handleOpenEditModal}
                onDeleteBooking={handleDeleteBooking}
                onStatusChange={handleStatusChange}
                onPrintStatusChange={handlePrintStatusChange}
              />
            )}
          </div>
        )}

        {/* Tab 2: Today & Next 3 Days Sessions */}
        {activeTab === 'upcoming' && (
          <TodaySessionsView
            bookings={accessibleBookings}
            currentUser={currentUser}
            allUsers={users}
            onEditBooking={handleOpenEditModal}
            onOpenCreateModalWithDate={handleOpenCreateModalWithDate}
            onStatusChange={handleStatusChange}
          />
        )}

        {/* Tab 3: Interactive Calendar View */}
        {activeTab === 'calendar' && (
          <CalendarView
            bookings={accessibleBookings}
            currentUser={currentUser}
            allUsers={users}
            onEditBooking={handleOpenEditModal}
            onOpenCreateModalWithDate={handleOpenCreateModalWithDate}
          />
        )}

        {/* Tab 4: Print Pipeline Management */}
        {activeTab === 'printing' && (
          <PrintManagement
            bookings={accessibleBookings}
            currentUser={currentUser}
            onPrintStatusChange={handlePrintStatusChange}
            onViewBooking={handleOpenViewModal}
          />
        )}

        {/* Tab 3: Users & Granular Field Permissions */}
        {activeTab === 'users' && currentUser.isSystemAdmin && (
          <UsersManagement
            users={users}
            allBookings={bookings}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {/* Tab 4: Overview & Analytics */}
        {activeTab === 'stats' && (
          <StatsOverview bookings={accessibleBookings} currentUser={currentUser} />
        )}
        {activeTab === 'account' && <AccountPage currentUser={currentUser} />}
      </main>
      </div>

      {/* Booking View / Edit / Create Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBooking}
        initialBooking={selectedBookingForModal}
        mode={modalMode}
        currentUser={currentUser}
        allUsers={users}
      />
    </div>
  );
}
