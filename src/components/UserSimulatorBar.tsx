import React from 'react';
import { User } from '../types';
import { ShieldAlert, EyeOff, Lock, UserCheck, RotateCcw } from 'lucide-react';
import { ALL_FIELD_KEYS } from '../types';

interface UserSimulatorBarProps {
  currentUser: User;
  adminUser: User;
  onResetToAdmin: () => void;
  visibleBookingsCount: number;
}

export const UserSimulatorBar: React.FC<UserSimulatorBarProps> = ({
  currentUser,
  onResetToAdmin,
  visibleBookingsCount,
}) => {
  if (currentUser.isSystemAdmin) {
    return null;
  }

  // Find fields hidden for this user
  const hiddenFields = ALL_FIELD_KEYS.filter(
    (item) => !currentUser.permissions.fields[item.key]?.view
  );

  const scopeLabel =
    currentUser.permissions.bookingScope === 'all'
      ? 'كل الحجوزات'
      : currentUser.permissions.bookingScope === 'assigned'
      ? 'الحجوزات الخاصة به فقط (المسندة له)'
      : 'حجوزات محددة باليد';

  return (
    <div className="bg-slate-900 text-white px-4 py-2.5 shadow-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold flex items-center gap-2 text-slate-100">
              <span>وضع المحاكاة نشط:</span>
              <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-bold text-xs">
                {currentUser.name} ({currentUser.role})
              </span>
            </div>
            <div className="text-slate-400 font-medium flex flex-wrap items-center gap-2 mt-0.5 text-xs">
              <span>• نطاق الحجوزات: <strong className="text-slate-200 font-semibold">{scopeLabel}</strong> ({visibleBookingsCount} حجز متاح)</span>
              {hiddenFields.length > 0 && (
                <span className="flex items-center gap-1 bg-red-900/30 text-red-300 border border-red-800/40 px-2 py-0.5 rounded text-[11px] font-semibold">
                  <EyeOff className="w-3 h-3" />
                  حقول مخفية: {hiddenFields.map((f) => f.label).join('، ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onResetToAdmin}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors shadow-sm shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>العودة لحساب المدير (Admin)</span>
        </button>
      </div>
    </div>
  );
};
