import React, { useState } from 'react';
import {
  User,
  UserRole,
  UserStatus,
  BookingScope,
  Booking,
  ALL_FIELD_KEYS,
  FieldKey,
  UserPermissions,
} from '../types';
import {
  Users,
  Shield,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sparkles,
  Sliders,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

const DEFAULT_FULL_FIELD_PERMISSIONS = Object.fromEntries(
  ALL_FIELD_KEYS.map(({ key }) => [key, { view: true, edit: true }]),
) as UserPermissions['fields'];
const ASSISTANT_FIELD_PERMISSIONS = Object.fromEntries(
  ALL_FIELD_KEYS.map(({ key }) => [key, {
    view: !['price', 'depositAmount', 'remaining', 'paymentStatus'].includes(key),
    edit: key === 'printSettings',
  }]),
) as UserPermissions['fields'];

interface UsersManagementProps {
  users: User[];
  allBookings: Booking[];
  onSaveUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

export const UsersManagement: React.FC<UsersManagementProps> = ({
  users,
  allBookings,
  onSaveUser,
  onDeleteUser,
}) => {
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for User Edit/Create
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('مساعد');
  const [status, setStatus] = useState<UserStatus>('Active');
  const [avatar, setAvatar] = useState('');
  const [bookingScope, setBookingScope] = useState<BookingScope>('assigned');
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);

  // Action Permissions
  const [actions, setActions] = useState({
    viewBooking: true,
    createBooking: false,
    editBooking: true,
    deleteBooking: false,
    changeStatus: true,
    addNotes: true,
  });

  // Field Permissions
  const [fields, setFields] = useState<Record<FieldKey, { view: boolean; edit: boolean }>>(
    { ...ASSISTANT_FIELD_PERMISSIONS }
  );

  const handleOpenAddUser = () => {
    setSelectedUserForEdit(null);
    setName('');
    setEmail('');
    setRole('مساعد');
    setStatus('Active');
    setAvatar(
      `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`
    );
    setBookingScope('assigned');
    setSelectedBookingIds([]);
    setActions({
      viewBooking: true,
      createBooking: false,
      editBooking: true,
      deleteBooking: false,
      changeStatus: true,
      addNotes: true,
    });
    setFields({ ...ASSISTANT_FIELD_PERMISSIONS });
    setIsModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setSelectedUserForEdit(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setStatus(u.status);
    setAvatar(u.avatar);
    setBookingScope(u.permissions.bookingScope);
    setSelectedBookingIds(u.permissions.selectedBookingIds || []);
    setActions({ ...u.permissions.actions });
    setFields({ ...u.permissions.fields });
    setIsModalOpen(true);
  };

  const applyAssistantPreset = () => {
    setFields({ ...ASSISTANT_FIELD_PERMISSIONS });
    setBookingScope('assigned');
  };

  const applyFullAdminPreset = () => {
    setFields({ ...DEFAULT_FULL_FIELD_PERMISSIONS });
    setBookingScope('all');
    setActions({
      viewBooking: true,
      createBooking: true,
      editBooking: true,
      deleteBooking: true,
      changeStatus: true,
      addNotes: true,
    });
  };

  const toggleAllFieldsView = (viewVal: boolean) => {
    const updated = { ...fields };
    ALL_FIELD_KEYS.forEach((item) => {
      updated[item.key] = {
        ...updated[item.key],
        view: viewVal,
        edit: viewVal ? updated[item.key]?.edit : false,
      };
    });
    setFields(updated);
  };

  const toggleAllFieldsEdit = (editVal: boolean) => {
    const updated = { ...fields };
    ALL_FIELD_KEYS.forEach((item) => {
      updated[item.key] = {
        ...updated[item.key],
        view: editVal ? true : updated[item.key]?.view,
        edit: editVal,
      };
    });
    setFields(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: selectedUserForEdit ? selectedUserForEdit.id : `user_${Date.now()}`,
      name,
      email,
      role,
      status,
      avatar,
      isSystemAdmin: selectedUserForEdit?.isSystemAdmin || false,
      permissions: {
        bookingScope,
        selectedBookingIds,
        actions,
        fields,
      },
    };
    onSaveUser(newUser);
    setIsModalOpen(false);
  };

  const toggleSelectedBooking = (bId: string) => {
    if (selectedBookingIds.includes(bId)) {
      setSelectedBookingIds(selectedBookingIds.filter((id) => id !== bId));
    } else {
      setSelectedBookingIds([...selectedBookingIds, bId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute left-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full inline-block"></span>
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold font-tajawal text-white">
                إدارة المستخدمين والمساعدين والصلاحيات
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              تحديد الصلاحيات الدقيقة لكل مساعد أو مصور: نطاق رؤية الحجوزات + مصفوفة رؤية وتعديل الحقول (مثل إخفاء الأسعار والماليات عن المساعدين).
            </p>
          </div>

          <button
            onClick={handleOpenAddUser}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </div>

      {/* Users Table List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            <span>فريق العمل والمساعدين ({users.length}):</span>
          </h3>
          <span className="text-xs text-slate-500">
            اضغط على "تعديل الصلاحيات" لضبط رؤية الحقول بالمليمتر
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4 pr-6">المستخدم</th>
                <th className="hidden sm:table-cell p-4">الدور الوظيفي</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">نطاق الحجوزات</th>
                <th className="p-4">الماليات والحقول الحساسة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const canViewPrice = u.isSystemAdmin || u.permissions.fields.price?.view;
                const scopeText =
                  u.permissions.bookingScope === 'all'
                    ? 'كل الحجوزات'
                    : u.permissions.bookingScope === 'assigned'
                    ? 'الحجوزات الخاصة به فقط'
                    : `حجوزات محددة (${u.permissions.selectedBookingIds?.length || 0})`;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User info */}
                    <td className="p-4 pr-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-200"
                        />
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-2">
                            <span>{u.name}</span>
                            {u.isSystemAdmin && (
                              <span className="bg-amber-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black">
                                مدير عام
                              </span>
                            )}
                          </div>
                          <div className="hidden sm:block text-xs text-slate-400 dir-ltr text-right">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="hidden sm:table-cell p-4 font-bold text-slate-700">
                      <span className="bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                        {u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {u.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          معطل
                        </span>
                      )}
                    </td>

                    {/* Booking Scope */}
                    <td className="p-4 font-bold text-slate-800">
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-xl text-xs">
                        {scopeText}
                      </span>
                    </td>

                    {/* Financial Access Status */}
                    <td className="p-4 font-bold">
                      {canViewPrice ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl text-xs border border-emerald-200 flex items-center gap-1 w-fit">
                          <Unlock className="w-3.5 h-3.5" /> يمكنه رؤية الأسعار
                        </span>
                      ) : (
                        <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-xl text-xs border border-red-200 flex items-center gap-1 w-fit">
                          <Lock className="w-3.5 h-3.5" /> الأسعار مخفية تماماً
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5 text-amber-400" />
                          <span>تعديل الصلاحيات</span>
                        </button>

                        {!u.isSystemAdmin && (
                          <button
                            onClick={() => onDeleteUser(u.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="حذف المستخدم"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto text-right">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black font-tajawal">
                    {selectedUserForEdit ? `تعديل صلاحيات: ${name}` : 'إضافة مستخدم جديد'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    التحكم الكامل في الحقول المعروضة، الإجراءات، ونطاق الوصول للحجوزات
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Presets Quick Action Bar */}
              <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>قوالب جاهزة للصلاحيات:</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={applyAssistantPreset}
                    className="px-3 py-1.5 bg-white text-slate-900 border border-slate-300 hover:bg-amber-50 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    ⚡ قالب مساعد (إخفاء الأسعار والماليات)
                  </button>

                  <button
                    type="button"
                    onClick={applyFullAdminPreset}
                    className="px-3 py-1.5 bg-slate-900 text-amber-400 hover:bg-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    ⚡ صلاحيات كاملة للمدير
                  </button>
                </div>
              </div>

              {/* Basic User Details */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  1. البيانات الأساسية للمستخدم:
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم المستخدم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: أحمد علي"
                      className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ahmed@studio.com"
                      className="w-full text-sm bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 dir-ltr text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      الدور الوظيفي
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full text-sm font-bold bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="مصور">مصور</option>
                      <option value="مساعد">مساعد</option>
                      <option value="موظف">موظف</option>
                      <option value="Editor">مونتير</option>
                      <option value="Manager">مدير</option>
                      <option value="Admin">مدير النظام</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      حالة الحساب
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as UserStatus)}
                      className="w-full text-sm font-bold bg-white p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Active">نشط</option>
                      <option value="Disabled">معطل</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Booking Scope Selection */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  2. نطاق الحجوزات التي يستطيع المستخدم رؤيتها (Booking Access Scope):
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="bookingScope"
                      checked={bookingScope === 'all'}
                      onChange={() => setBookingScope('all')}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">كل الحجوزات</div>
                      <div className="text-[11px] text-slate-500">
                        المستخدم يستطيع مشاهدة جميع الحجوزات الموجودة في السيستم بلا استثناء.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="bookingScope"
                      checked={bookingScope === 'assigned'}
                      onChange={() => setBookingScope('assigned')}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        الحجوزات الخاصة به فقط (Assigned Only)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        يشاهد فقط الحجوزات التي قام المدير بإسنادها له.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="bookingScope"
                      checked={bookingScope === 'selected'}
                      onChange={() => setBookingScope('selected')}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">حجوزات محددة باليد</div>
                      <div className="text-[11px] text-slate-500">
                        يختار المدير يدوياً الحجوزات التي يستطيع هذا المستخدم الوصول إليها.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Hand-selected Bookings List */}
                {bookingScope === 'selected' && (
                  <div className="bg-white p-4 rounded-xl border border-slate-300 space-y-2">
                    <div className="text-xs font-bold text-slate-800 mb-1">
                      حدد الحجوزات المتاحة لهذا المستخدم:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                      {allBookings.map((b) => {
                        const isChecked = selectedBookingIds.includes(b.id);
                        return (
                          <label
                            key={b.id}
                            className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer ${
                              isChecked
                                ? 'bg-amber-50 border-amber-400 font-bold text-amber-950'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span>
                              {b.title} ({b.customerName})
                            </span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectedBooking(b.id)}
                              className="w-4 h-4 text-amber-600 rounded"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Permissions */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  3. صلاحيات الإجراءات (Actions):
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold text-slate-800">
                  <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.viewBooking}
                      onChange={(e) => setActions({ ...actions, viewBooking: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>مشاهدة الحجوزات</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.createBooking}
                      onChange={(e) => setActions({ ...actions, createBooking: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>إضافة حجز جديد</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.editBooking}
                      onChange={(e) => setActions({ ...actions, editBooking: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>تعديل بيانات الحجز</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.deleteBooking}
                      onChange={(e) => setActions({ ...actions, deleteBooking: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>حذف حجز</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.changeStatus}
                      onChange={(e) => setActions({ ...actions, changeStatus: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>تغيير حالة الحجز</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.addNotes}
                      onChange={(e) => setActions({ ...actions, addNotes: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>إضافة ملاحظات</span>
                  </label>
                </div>
              </div>

              {/* Granular Field Permission Matrix */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    4. التحكم في رؤية وتعديل الحقول داخل الحجز (Field Permissions Matrix):
                  </h3>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleAllFieldsView(true)}
                      className="text-amber-800 bg-amber-100 hover:bg-amber-200 font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      إظهار كل الحقول
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAllFieldsView(false)}
                      className="text-red-800 bg-red-100 hover:bg-red-200 font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      إخفاء الكل
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">اسم الحقل (Field)</th>
                        <th className="p-3">المجموعة</th>
                        <th className="p-3 text-center">صلاحية العرض</th>
                        <th className="p-3 text-center">صلاحية التعديل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ALL_FIELD_KEYS.map((item) => {
                        const current = fields[item.key] || { view: true, edit: true };
                        const isFinancial =
                          item.key === 'price' ||
                          item.key === 'depositAmount' ||
                          item.key === 'remaining' ||
                          item.key === 'paymentStatus';

                        return (
                          <tr
                            key={item.key}
                            className={`hover:bg-slate-50 transition-colors ${
                              isFinancial ? 'bg-amber-500/5 font-bold' : ''
                            }`}
                          >
                            <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                              {isFinancial && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                              <span>{item.label}</span>
                            </td>

                            <td className="p-3 text-slate-500">{item.group}</td>

                            {/* View Toggle */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setFields({
                                    ...fields,
                                    [item.key]: {
                                      view: !current.view,
                                      edit: !current.view ? current.edit : false,
                                    },
                                  })
                                }
                                className={`px-3 py-1 rounded-xl font-black text-xs transition-all cursor-pointer ${
                                  current.view
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                }`}
                              >
                                {current.view ? '✓ مسموح بالعرض' : '✕ مخفي'}
                              </button>
                            </td>

                            {/* Edit Toggle */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                disabled={!current.view}
                                onClick={() =>
                                  setFields({
                                    ...fields,
                                    [item.key]: {
                                      ...current,
                                      edit: !current.edit,
                                    },
                                  })
                                }
                                className={`px-3 py-1 rounded-xl font-black text-xs transition-all cursor-pointer ${
                                  current.edit && current.view
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                                } disabled:opacity-40`}
                              >
                                {current.edit && current.view ? '✓ مسموح بالتعديل' : '✕ للقراءة فقط'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>حفظ الصلاحيات والمستخدم</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
