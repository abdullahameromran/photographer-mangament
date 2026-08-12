/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Booking, BookingStatus, PrintStatus } from './types';
import { INITIAL_USERS, INITIAL_BOOKINGS } from './data/initialData';
import { filterBookingsForUser, canPerformAction } from './utils/permissions';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { UserSimulatorBar } from './components/UserSimulatorBar';
import { BookingCard } from './components/BookingCard';
import { BookingModal } from './components/BookingModal';
import { PrintManagement } from './components/PrintManagement';
import { UsersManagement } from './components/UsersManagement';
import { StatsOverview } from './components/StatsOverview';
import { KanbanBoard } from './components/KanbanBoard';
import { TodaySessionsView } from './components/TodaySessionsView';
import { CalendarView } from './components/CalendarView';
import {
  LayoutGrid,
  Columns3,
  Table as TableIcon,
  Plus,
  Filter,
  Search,
  RotateCcw,
  Sparkles,
  Printer,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

export default function App() {
  // Load initial data from localStorage or fallback
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('photo_studio_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('photo_studio_bookings');
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('photo_studio_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('photo_studio_bookings', JSON.stringify(bookings));
    } catch (e) {
      console.error(e);
    }
  }, [bookings]);

  // Current Logged-In / Simulated User
  const [currentUserId, setCurrentUserId] = useState<string>('user_admin');
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const adminUser = users.find((u) => u.isSystemAdmin) || users[0];

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<
    'bookings' | 'upcoming' | 'calendar' | 'printing' | 'users' | 'stats'
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
  const accessibleBookings = filterBookingsForUser(bookings, currentUser);

  // Apply search and status filters
  const filteredBookings = accessibleBookings.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
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

  const handleSaveBooking = (bookingData: Partial<Booking>) => {
    if (modalMode === 'create') {
      const newBooking: Booking = {
        id: `bk_${Date.now()}`,
        title: bookingData.title || 'حجز جديد',
        customerName: bookingData.customerName || '',
        phone: bookingData.phone || '',
        whatsapp: bookingData.whatsapp || bookingData.phone || '',
        bookingTypes: bookingData.bookingTypes || ['سيشن'],
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
        assignedUserIds: bookingData.assignedUserIds || [currentUser.id],
        status: bookingData.status || 'مؤكد',
        createdAt: new Date().toISOString().split('T')[0],
      };

      setBookings([newBooking, ...bookings]);
      showToast(`✨ تم تسجيل الحجز "${newBooking.title}" بنجاح!`);
    } else if (modalMode === 'edit' && selectedBookingForModal) {
      const updated = bookings.map((b) =>
        b.id === selectedBookingForModal.id ? ({ ...b, ...bookingData } as Booking) : b
      );
      setBookings(updated);
      showToast('✅ تم حفظ التعديلات على الحجز بنجاح');
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    if (window.confirm('هل أنت تأكد من إلغاء وحذف هذا الحجز نهائياً؟')) {
      setBookings(bookings.filter((b) => b.id !== bookingId));
      showToast('🗑️ تم حذف الحجز من النظام');
    }
  };

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    setBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    showToast(`🔄 تم تغيير حالة الحجز إلى "${newStatus}"`);
  };

  const handlePrintStatusChange = (bookingId: string, newPrintStatus: PrintStatus) => {
    setBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, printStatus: newPrintStatus } : b))
    );
    showToast(`🖨️ تم تحديث حالة الطباعة إلى "${newPrintStatus}"`);
  };

  // User management handlers
  const handleSaveUser = (updatedUser: User) => {
    const exists = users.some((u) => u.id === updatedUser.id);
    if (exists) {
      setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      showToast(`⚙️ تم تحديث صلاحيات وحقول المستخدم "${updatedUser.name}"`);
    } else {
      setUsers([...users, updatedUser]);
      showToast(`👤 تم إضافة المستخدم الجديد "${updatedUser.name}"`);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('هل أنت متاكد من حذف هذا المستخدم؟')) {
      setUsers(users.filter((u) => u.id !== userId));
      if (currentUserId === userId) {
        setCurrentUserId('user_admin');
      }
      showToast('🗑️ تم حذف المستخدم');
    }
  };

  const handleResetSampleData = () => {
    if (window.confirm('إعادة ضبط كافة البيانات والطباعة والصلاحيات للوضع الافتراضي؟')) {
      setUsers(INITIAL_USERS);
      setBookings(INITIAL_BOOKINGS);
      setCurrentUserId('user_admin');
      showToast('🔄 تم استعادة البيانات النموذجية الافتراضية');
    }
  };

  const printJobsCount = accessibleBookings.filter((b) => b.hasPrint).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-20 font-cairo flex flex-col lg:flex-row">
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
        allUsers={users}
        onSelectUser={(u) => setCurrentUserId(u.id)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCreateModal={handleOpenCreateModal}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalBookingsCount={accessibleBookings.length}
        printingJobsCount={printJobsCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Studio Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Main Studio Header */}
        <Header
          currentUser={currentUser}
          allUsers={users}
          onSelectUser={(u) => setCurrentUserId(u.id)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalBookingsCount={accessibleBookings.length}
          printingJobsCount={printJobsCount}
        />

        {/* Live User Permission Simulator Indicator */}
        <UserSimulatorBar
          currentUser={currentUser}
          adminUser={adminUser}
          onResetToAdmin={() => setCurrentUserId('user_admin')}
          visibleBookingsCount={accessibleBookings.length}
        />

        {/* Main Container Body */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
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
                  onClick={() => setStatusFilter('مؤكد')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'مؤكد'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  مؤكد
                </button>

                <button
                  onClick={() => setStatusFilter('في انتظار العربون')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'في انتظار العربون'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  في انتظار العربون
                </button>

                <button
                  onClick={() => setStatusFilter('تم التصوير')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'تم التصوير'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  تم التصوير
                </button>

                <button
                  onClick={() => setStatusFilter('تم التسليم')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'تم التسليم'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  تم التسليم
                </button>
              </div>

              {/* View Switcher (Cards vs Kanban vs Table) */}
              <div className="flex items-center gap-2 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <button
                  onClick={handleResetSampleData}
                  className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="إعادة ضبط البيانات النموذجية"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">إعادة ضبط</span>
                </button>

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
