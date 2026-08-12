import React from 'react';
import { Booking, User, BookingStatus, PrintStatus } from '../types';
import { BookingCard } from './BookingCard';

interface KanbanBoardProps {
  bookings: Booking[];
  currentUser: User;
  allUsers: User[];
  onViewBooking: (b: Booking) => void;
  onEditBooking: (b: Booking) => void;
  onDeleteBooking: (id: string) => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onPrintStatusChange: (id: string, printStatus: PrintStatus) => void;
}

const ALL_STATUSES: BookingStatus[] = [
  'جديد',
  'في انتظار العربون',
  'مؤكد',
  'قادم',
  'تم التصوير',
  'جاري التجهيز',
  'جاهز',
  'تم التسليم',
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  bookings,
  currentUser,
  allUsers,
  onViewBooking,
  onEditBooking,
  onDeleteBooking,
  onStatusChange,
  onPrintStatusChange,
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 no-scrollbar min-h-[600px]">
      {ALL_STATUSES.map((statusKey) => {
        const columnBookings = bookings.filter((b) => b.status === statusKey);

        return (
          <div
            key={statusKey}
            className="w-80 shrink-0 bg-slate-100/80 rounded-3xl p-4 border border-slate-200/80 flex flex-col gap-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 px-1">
              <h4 className="font-black text-slate-900 text-sm">{statusKey}</h4>
              <span className="bg-slate-200 text-slate-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                {columnBookings.length}
              </span>
            </div>

            {/* Column Bookings List */}
            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-0.5">
              {columnBookings.length === 0 ? (
                <div className="bg-white/60 rounded-2xl p-6 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200">
                  لا توجد حجوزات في هذه الحالة
                </div>
              ) : (
                columnBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    currentUser={currentUser}
                    allUsers={allUsers}
                    onView={onViewBooking}
                    onEdit={onEditBooking}
                    onDelete={onDeleteBooking}
                    onStatusChange={onStatusChange}
                    onPrintStatusChange={onPrintStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
