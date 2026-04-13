import { useState, useEffect, useRef, useCallback } from 'react';
import { format, addDays, startOfDay, getDay, startOfWeek, startOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  FiCheck,
  FiX,
  FiClock,
  FiCalendar,
  FiFilter,
  FiUser,
  FiPhone,
  FiPlus,
  FiTrash2,
  FiUsers,
  FiImage,
  FiLock,
  FiUnlock,
  FiDollarSign,
  FiTrendingUp,
  FiBarChart2,
} from 'react-icons/fi';
import {
  getAllAppointments,
  updateAppointmentStatus,
  getAppointmentsByDateAndStaff,
} from '../services/appointmentService';
import { getAllStaff, addStaff, deleteStaff, updateStaff, uploadStaffPhoto } from '../services/staffService';
import { getGalleryImages, addGalleryImage, deleteGalleryImage } from '../services/galleryService';
import { getBlockedSlots, toggleBlockedSlot } from '../services/blockedSlotService';
import { STATUS, STATUS_LABELS, STATUS_COLORS, BUSINESS, APPOINTMENT } from '../config/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './AdminPage.css';

function generateAllTimeSlots() {
  const hours = BUSINESS.workingHours.weekdays;
  if (!hours) return [];

  const [startH, startM] = hours.open.split(':').map(Number);
  const [endH, endM] = hours.close.split(':').map(Number);

  const slots = [];
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + APPOINTMENT.slotDuration <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += APPOINTMENT.slotDuration;
  }

  return slots;
}

function generateNextDays(count) {
  const dates = [];
  const today = startOfDay(new Date());
  for (let i = 0; i < count; i++) {
    const date = addDays(today, i);
    if (getDay(date) !== 0) {
      dates.push(date);
    }
  }
  return dates;
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Zil melodisi: 3 nota
    const notes = [
      { freq: 784, start: 0, dur: 0.15 },     // G5
      { freq: 988, start: 0.18, dur: 0.15 },   // B5
      { freq: 1175, start: 0.36, dur: 0.25 },  // D6
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });

    setTimeout(() => ctx.close(), 1500);
  } catch {
    // Ses çalınamazsa sessizce devam et
  }
}

function buildAppointmentNotification(appointments) {
  const [latestAppointment] = appointments;

  if (!latestAppointment) {
    return {
      title: 'Yeni Randevu',
      message: `${appointments.length} yeni randevu geldi.`,
    };
  }

  const customerName = latestAppointment.customerName || 'Yeni musteri';
  const serviceName = latestAppointment.serviceName || 'Randevu';
  const dateLabel = latestAppointment.date || '';
  const timeLabel = latestAppointment.time || '';

  return {
    title: appointments.length > 1 ? `${appointments.length} Yeni Randevu` : 'Yeni Randevu',
    message: `${customerName} - ${serviceName} (${dateLabel} ${timeLabel})`.trim(),
  };
}

export default function AdminPage() {
  const [tab, setTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  // Staff state
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffTitle, setNewStaffTitle] = useState('Berber');
  const [newStaffPhoto, setNewStaffPhoto] = useState('');
  const [newStaffFile, setNewStaffFile] = useState(null);
  const [addingStaff, setAddingStaff] = useState(false);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryAlt, setGalleryAlt] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Slot management state
  const [slotDate, setSlotDate] = useState(null);
  const [slotStaff, setSlotStaff] = useState(null);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [togglingSlot, setTogglingSlot] = useState(null);

  // Revenue state
  const [revenuePeriod, setRevenuePeriod] = useState('all');
  const [revenueStaff, setRevenueStaff] = useState('all');

  // Notification state
  const [notification, setNotification] = useState(null);
  const knownAppointmentIds = useRef(new Set());
  const refreshInterval = useRef(null);
  const notificationTimeout = useRef(null);

  const allTimeSlots = generateAllTimeSlots();
  const slotDates = generateNextDays(30);

  useEffect(() => {
    getAllAppointments()
      .then((data) => {
        setAppointments(data);
        knownAppointmentIds.current = new Set(data.map((appointment) => appointment.id));
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));

    getAllStaff()
      .then(setStaffList)
      .catch(() => setStaffList([]))
      .finally(() => setStaffLoading(false));

    getGalleryImages()
      .then(setGalleryImages)
      .catch(() => setGalleryImages([]))
      .finally(() => setGalleryLoading(false));
  }, []);

  // 30 saniyede bir otomatik yenileme
  const refreshAppointments = useCallback(() => {
    getAllAppointments()
      .then((data) => {
        const newAppointments = data.filter(
          (appointment) => !knownAppointmentIds.current.has(appointment.id)
        );

        if (newAppointments.length > 0) {
          const nextNotification = buildAppointmentNotification(newAppointments);

          clearTimeout(notificationTimeout.current);
          playNotificationSound();
          setNotification(nextNotification);
          notificationTimeout.current = window.setTimeout(() => {
            setNotification(null);
          }, 8000);
        }

        knownAppointmentIds.current = new Set(data.map((appointment) => appointment.id));
        setAppointments(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshInterval.current = setInterval(refreshAppointments, 30000);
    return () => {
      clearInterval(refreshInterval.current);
      clearTimeout(notificationTimeout.current);
    };
  }, [refreshAppointments]);

  // Slot yonetimi: tarih + personel secildiginde verileri getir
  useEffect(() => {
    if (!slotDate || !slotStaff) return;

    const dateStr = format(slotDate, 'yyyy-MM-dd');
    setSlotsLoading(true);

    Promise.all([
      getBlockedSlots(dateStr, slotStaff.id),
      getAppointmentsByDateAndStaff(dateStr, slotStaff.id),
    ])
      .then(([blocked, booked]) => {
        setBlockedSlots(blocked);
        setBookedSlots(booked);
      })
      .catch(() => {
        setBlockedSlots([]);
        setBookedSlots([]);
      })
      .finally(() => setSlotsLoading(false));
  }, [slotDate, slotStaff]);

  const handleStatusChange = async (appointmentId, newStatus) => {
    setUpdatingId(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: newStatus } : a
        )
      );
    } catch {
      alert('Durum güncellenirken bir hata oluştu.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    setAddingStaff(true);
    try {
      let photoURL = newStaffPhoto.trim();
      if (newStaffFile) {
        photoURL = await uploadStaffPhoto(newStaffFile);
      }
      const id = await addStaff({ name: newStaffName.trim(), title: newStaffTitle.trim(), photoURL });
      setStaffList((prev) => [
        ...prev,
        { id, name: newStaffName.trim(), title: newStaffTitle.trim(), photoURL, active: true },
      ]);
      setNewStaffName('');
      setNewStaffTitle('Berber');
      setNewStaffPhoto('');
      setNewStaffFile(null);
    } catch {
      alert('Personel eklenirken bir hata oluştu.');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (!confirm(`"${staffName}" personelini silmek istediğinize emin misiniz?`)) return;

    try {
      await deleteStaff(staffId);
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    } catch {
      alert('Personel silinirken bir hata oluştu.');
    }
  };

  const handleToggleStaff = async (staffId, currentActive) => {
    try {
      await updateStaff(staffId, { active: !currentActive });
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === staffId ? { ...s, active: !currentActive } : s
        )
      );
    } catch {
      alert('Durum güncellenirken bir hata oluştu.');
    }
  };

  const handleUploadGallery = async (e) => {
    e.preventDefault();
    if (!galleryFile) return;

    setUploadingImage(true);
    try {
      const image = await addGalleryImage(galleryFile, galleryAlt.trim());
      setGalleryImages((prev) => [image, ...prev]);
      setGalleryFile(null);
      setGalleryAlt('');
    } catch {
      alert('Fotoğraf yüklenirken bir hata oluştu.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteGallery = async (imageId, storagePath) => {
    if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return;

    try {
      await deleteGalleryImage(imageId, storagePath);
      setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      alert('Fotoğraf silinirken bir hata oluştu.');
    }
  };

  const handleToggleSlot = async (time) => {
    if (!slotDate || !slotStaff) return;

    const dateStr = format(slotDate, 'yyyy-MM-dd');
    setTogglingSlot(time);

    try {
      const result = await toggleBlockedSlot(dateStr, slotStaff.id, time);

      if (result.action === 'blocked') {
        setBlockedSlots((prev) => [...prev, { id: result.id, date: dateStr, staffId: slotStaff.id, time }]);
      } else {
        setBlockedSlots((prev) => prev.filter((s) => s.time !== time));
      }
    } catch {
      alert('Slot güncellenirken bir hata oluştu.');
    } finally {
      setTogglingSlot(null);
    }
  };

  const getSlotInfo = (time) => {
    const isBlocked = blockedSlots.some((s) => s.time === time);
    if (isBlocked) return 'blocked';

    for (const appt of bookedSlots) {
      const startMin = timeToMinutes(appt.time);
      const duration = appt.serviceDuration || APPOINTMENT.slotDuration;
      const endMin = startMin + duration;
      const slotMin = timeToMinutes(time);
      // 45dk 10:00 -> 10:45'te biter, 10:45 serbest
      if (slotMin >= startMin && slotMin < endMin) return 'booked';
    }

    return 'available';
  };

  const getBookedApptForSlot = (time) => {
    for (const appt of bookedSlots) {
      const startMin = timeToMinutes(appt.time);
      const duration = appt.serviceDuration || APPOINTMENT.slotDuration;
      const endMin = startMin + duration;
      const slotMin = timeToMinutes(time);
      if (slotMin >= startMin && slotMin < endMin) return appt;
    }
    return null;
  };

  const filteredAppointments =
    filter === 'all'
      ? appointments
      : appointments.filter((a) => a.status === filter);

  const statusCounts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  // Hasılat hesaplamaları
  const completedAppointments = appointments.filter((a) => a.status === STATUS.COMPLETED);

  const getRevenueFiltered = () => {
    let filtered = completedAppointments;

    // Tarih filtresi
    if (revenuePeriod !== 'all') {
      const today = startOfDay(new Date());
      let startDate;
      if (revenuePeriod === 'today') {
        startDate = format(today, 'yyyy-MM-dd');
        filtered = filtered.filter((a) => a.date === startDate);
      } else if (revenuePeriod === 'week') {
        startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        filtered = filtered.filter((a) => a.date >= startDate);
      } else if (revenuePeriod === 'month') {
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        filtered = filtered.filter((a) => a.date >= startDate);
      }
    }

    // Personel filtresi
    if (revenueStaff !== 'all') {
      filtered = filtered.filter((a) => a.staffId === revenueStaff);
    }

    return filtered;
  };

  const revenueData = getRevenueFiltered();
  const totalRevenue = revenueData.reduce((sum, a) => sum + (a.servicePrice || 0), 0);
  const avgRevenue = revenueData.length > 0 ? Math.round(totalRevenue / revenueData.length) : 0;

  const serviceBreakdown = revenueData.reduce((acc, a) => {
    const key = a.serviceName || 'Bilinmeyen';
    if (!acc[key]) acc[key] = { count: 0, total: 0 };
    acc[key].count += 1;
    acc[key].total += a.servicePrice || 0;
    return acc;
  }, {});

  const serviceRows = Object.entries(serviceBreakdown)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);

  const staffBreakdown = revenueData.reduce((acc, a) => {
    const key = a.staffName || 'Bilinmeyen';
    const id = a.staffId || 'unknown';
    if (!acc[id]) acc[id] = { name: key, count: 0, total: 0 };
    acc[id].count += 1;
    acc[id].total += a.servicePrice || 0;
    return acc;
  }, {});

  const staffRows = Object.values(staffBreakdown).sort((a, b) => b.total - a.total);

  if (loading) {
    return <LoadingSpinner text="Yükleniyor..." />;
  }

  return (
    <section className="admin section">
      <div className="container">
        <h1 className="section-title">Yönetim Paneli</h1>

        {/* Bildirim kutusu */}
        {notification && (
          <div className="admin__notification" role="status" aria-live="polite">
            <div className="admin__notification-content">
              <span className="admin__notification-icon">🔔</span>
              <div className="admin__notification-text">
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
              </div>
              <button
                className="admin__notification-close"
                onClick={() => setNotification(null)}
              >
                <FiX size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Tab navigasyon */}
        <div className="admin__tabs">
          <button
            className={`admin__tab ${tab === 'appointments' ? 'admin__tab--active' : ''}`}
            onClick={() => setTab('appointments')}
          >
            <FiCalendar /> Randevular
          </button>
          <button
            className={`admin__tab ${tab === 'slots' ? 'admin__tab--active' : ''}`}
            onClick={() => setTab('slots')}
          >
            <FiClock /> Saat Yönetimi
          </button>
          <button
            className={`admin__tab ${tab === 'staff' ? 'admin__tab--active' : ''}`}
            onClick={() => setTab('staff')}
          >
            <FiUsers /> Personel
          </button>
          <button
            className={`admin__tab ${tab === 'gallery' ? 'admin__tab--active' : ''}`}
            onClick={() => setTab('gallery')}
          >
            <FiImage /> Galeri
          </button>
          <button
            className={`admin__tab ${tab === 'revenue' ? 'admin__tab--active' : ''}`}
            onClick={() => setTab('revenue')}
          >
            <FiDollarSign /> Hasılat
          </button>
        </div>

        {/* RANDEVULAR TAB */}
        {tab === 'appointments' && (
          <>
            <div className="admin__stats">
              <div className="admin__stat-card">
                <span className="admin__stat-number">{appointments.length}</span>
                <span className="admin__stat-label">Toplam</span>
              </div>
              <div className="admin__stat-card">
                <span className="admin__stat-number" style={{ color: STATUS_COLORS[STATUS.PENDING] }}>
                  {statusCounts[STATUS.PENDING] || 0}
                </span>
                <span className="admin__stat-label">Beklemede</span>
              </div>
              <div className="admin__stat-card">
                <span className="admin__stat-number" style={{ color: STATUS_COLORS[STATUS.CONFIRMED] }}>
                  {statusCounts[STATUS.CONFIRMED] || 0}
                </span>
                <span className="admin__stat-label">Onaylı</span>
              </div>
              <div className="admin__stat-card">
                <span className="admin__stat-number" style={{ color: STATUS_COLORS[STATUS.COMPLETED] }}>
                  {statusCounts[STATUS.COMPLETED] || 0}
                </span>
                <span className="admin__stat-label">Tamamlanan</span>
              </div>
            </div>

            <div className="admin__filters">
              <FiFilter />
              <button
                className={`admin__filter-btn ${filter === 'all' ? 'admin__filter-btn--active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Tümü
              </button>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`admin__filter-btn ${filter === key ? 'admin__filter-btn--active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="admin__empty">
                <p>Bu filtreye uygun randevu bulunamadı.</p>
              </div>
            ) : (
              <div className="admin__list">
                {filteredAppointments.map((appt) => (
                  <div key={appt.id} className="admin__card card">
                    <div className="admin__card-header">
                      <div className="admin__card-info">
                        <h3>{appt.serviceName}</h3>
                        <span
                          className="admin__status-badge"
                          style={{
                            backgroundColor: `${STATUS_COLORS[appt.status]}20`,
                            color: STATUS_COLORS[appt.status],
                            borderColor: `${STATUS_COLORS[appt.status]}40`,
                          }}
                        >
                          {STATUS_LABELS[appt.status]}
                        </span>
                      </div>
                      {appt.servicePrice && (
                        <div className="admin__card-price">{appt.servicePrice} ₺</div>
                      )}
                    </div>

                    <div className="admin__card-details">
                      <div className="admin__detail">
                        <FiUser size={14} />
                        <span>{appt.customerName || appt.customerPhone}</span>
                      </div>
                      <div className="admin__detail">
                        <FiPhone size={14} />
                        <span>{appt.customerPhone}</span>
                      </div>
                      {appt.staffName && (
                        <div className="admin__detail">
                          <FiUsers size={14} />
                          <span>{appt.staffName}</span>
                        </div>
                      )}
                      <div className="admin__detail">
                        <FiCalendar size={14} />
                        <span>
                          {format(new Date(appt.date + 'T00:00:00'), 'd MMM yyyy, EEEE', {
                            locale: tr,
                          })}
                        </span>
                      </div>
                      <div className="admin__detail">
                        <FiClock size={14} />
                        <span>{appt.time} ({appt.serviceDuration} dk)</span>
                      </div>
                    </div>

                    {appt.note && (
                      <div className="admin__card-note">
                        <strong>Not:</strong> {appt.note}
                      </div>
                    )}

                    <div className="admin__card-actions">
                      {appt.status === STATUS.PENDING && (
                        <>
                          <button
                            className="btn btn-sm admin__btn-confirm"
                            onClick={() => handleStatusChange(appt.id, STATUS.CONFIRMED)}
                            disabled={updatingId === appt.id}
                          >
                            <FiCheck /> Onayla
                          </button>
                          <button
                            className="btn btn-sm admin__btn-cancel"
                            onClick={() => handleStatusChange(appt.id, STATUS.CANCELLED)}
                            disabled={updatingId === appt.id}
                          >
                            <FiX /> Reddet
                          </button>
                        </>
                      )}
                      {appt.status === STATUS.CONFIRMED && (
                        <>
                          <button
                            className="btn btn-sm admin__btn-complete"
                            onClick={() => handleStatusChange(appt.id, STATUS.COMPLETED)}
                            disabled={updatingId === appt.id}
                          >
                            <FiCheck /> Tamamlandı
                          </button>
                          <button
                            className="btn btn-sm admin__btn-noshow"
                            onClick={() => handleStatusChange(appt.id, STATUS.NO_SHOW)}
                            disabled={updatingId === appt.id}
                          >
                            <FiX /> Gelmedi
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* SAAT YÖNETİMİ TAB */}
        {tab === 'slots' && (
          <>
            <div className="admin__slots-section">
              <h2 className="admin__section-title">Saat Yönetimi</h2>
              <p className="admin__section-desc">
                Tarih ve personel seçerek istediğiniz saatleri kapatabilir veya açabilirsiniz.
              </p>

              {/* Personel secimi */}
              <div className="admin__slots-filters">
                <div className="admin__slots-staff">
                  <label className="admin__slots-label">Personel</label>
                  <div className="admin__slots-staff-list">
                    {staffList.filter((s) => s.active).map((staff) => (
                      <button
                        key={staff.id}
                        className={`admin__slots-staff-btn ${
                          slotStaff?.id === staff.id ? 'admin__slots-staff-btn--active' : ''
                        }`}
                        onClick={() => {
                          setSlotStaff(staff);
                          setBlockedSlots([]);
                          setBookedSlots([]);
                        }}
                      >
                        <FiUser size={14} /> {staff.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tarih secimi */}
                <div className="admin__slots-dates">
                  <label className="admin__slots-label">Tarih</label>
                  <div className="admin__slots-date-list">
                    {slotDates.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const isSelected = slotDate && format(slotDate, 'yyyy-MM-dd') === dateStr;
                      return (
                        <button
                          key={dateStr}
                          className={`admin__slots-date-btn ${
                            isSelected ? 'admin__slots-date-btn--active' : ''
                          }`}
                          onClick={() => {
                            setSlotDate(date);
                            setBlockedSlots([]);
                            setBookedSlots([]);
                          }}
                        >
                          <span className="admin__slots-date-day">
                            {format(date, 'EEE', { locale: tr })}
                          </span>
                          <span className="admin__slots-date-num">
                            {format(date, 'd')}
                          </span>
                          <span className="admin__slots-date-month">
                            {format(date, 'MMM', { locale: tr })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Slot grid */}
              {slotDate && slotStaff && (
                <>
                  {/* Legend */}
                  <div className="admin__slots-legend">
                    <div className="admin__slots-legend-item">
                      <span className="admin__slots-legend-dot admin__slots-legend-dot--available" />
                      Müsait
                    </div>
                    <div className="admin__slots-legend-item">
                      <span className="admin__slots-legend-dot admin__slots-legend-dot--booked" />
                      Randevulu
                    </div>
                    <div className="admin__slots-legend-item">
                      <span className="admin__slots-legend-dot admin__slots-legend-dot--blocked" />
                      Kapalı
                    </div>
                  </div>

                  {slotsLoading ? (
                    <p className="admin__empty">Yükleniyor...</p>
                  ) : (
                    <div className="admin__slots-grid">
                      {allTimeSlots.map((time) => {
                        const status = getSlotInfo(time);
                        const isToggling = togglingSlot === time;
                        const appt = status === 'booked' ? getBookedApptForSlot(time) : null;

                        return (
                          <button
                            key={time}
                            className={`admin__slot-card admin__slot-card--${status}`}
                            onClick={() => status !== 'booked' && handleToggleSlot(time)}
                            disabled={status === 'booked' || isToggling}
                            title={
                              status === 'booked' && appt
                                ? `${appt.customerName || 'Müşteri'} - ${appt.serviceName} (${appt.serviceDuration} dk)`
                                : status === 'blocked'
                                ? 'Kapalı - Açmak için tıklayın'
                                : 'Müsait - Kapatmak için tıklayın'
                            }
                          >
                            <span className="admin__slot-time">{time}</span>
                            <span className="admin__slot-icon">
                              {status === 'blocked' && <FiLock size={14} />}
                              {status === 'booked' && <FiUser size={14} />}
                              {status === 'available' && <FiUnlock size={14} />}
                            </span>
                            {status === 'booked' && appt && (
                              <span className="admin__slot-appt">
                                {appt.serviceName}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {!slotDate || !slotStaff ? (
                <div className="admin__empty">
                  <p>Lütfen personel ve tarih seçin.</p>
                </div>
              ) : null}
            </div>
          </>
        )}

        {/* PERSONEL TAB */}
        {tab === 'staff' && (
          <>
            <div className="admin__staff-section">
              <h2 className="admin__section-title">Personel Ekle</h2>
              <form className="admin__staff-form" onSubmit={handleAddStaff}>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ad Soyad"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                />
                <input
                  className="form-input"
                  type="text"
                  placeholder="Unvan (ör: Berber)"
                  value={newStaffTitle}
                  onChange={(e) => setNewStaffTitle(e.target.value)}
                />
                <input
                  className="form-input"
                  type="url"
                  placeholder="Fotoğraf URL (opsiyonel)"
                  value={newStaffPhoto}
                  onChange={(e) => setNewStaffPhoto(e.target.value)}
                />
                <div className="admin__staff-upload">
                  <label className="admin__staff-upload-label">
                    veya dosya yükle
                    <input
                      type="file"
                      accept="image/*"
                      className="admin__staff-upload-input"
                      onChange={(e) => setNewStaffFile(e.target.files[0] || null)}
                    />
                  </label>
                  {newStaffFile && (
                    <span className="admin__staff-upload-name">{newStaffFile.name}</span>
                  )}
                </div>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!newStaffName.trim() || addingStaff}
                >
                  <FiPlus /> {addingStaff ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </form>
            </div>

            <div className="admin__staff-section">
              <h2 className="admin__section-title">Mevcut Personel</h2>
              {staffLoading ? (
                <p className="admin__empty">Yükleniyor...</p>
              ) : staffList.length === 0 ? (
                <p className="admin__empty">Henüz personel eklenmemiş.</p>
              ) : (
                <div className="admin__staff-list">
                  {staffList.map((staff) => (
                    <div
                      key={staff.id}
                      className={`admin__staff-card card ${!staff.active ? 'admin__staff-card--inactive' : ''}`}
                    >
                      <div className="admin__staff-card-avatar">
                        {staff.photoURL ? (
                          <img src={staff.photoURL} alt={staff.name} />
                        ) : (
                          <FiUser size={24} />
                        )}
                      </div>
                      <div className="admin__staff-card-info">
                        <span className="admin__staff-card-name">{staff.name}</span>
                        <span className="admin__staff-card-title">{staff.title}</span>
                      </div>
                      <div className="admin__staff-card-status">
                        <span className={`admin__staff-badge ${staff.active ? 'admin__staff-badge--active' : 'admin__staff-badge--inactive'}`}>
                          {staff.active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      <div className="admin__staff-card-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleToggleStaff(staff.id, staff.active)}
                        >
                          {staff.active ? 'Pasif Yap' : 'Aktif Yap'}
                        </button>
                        <button
                          className="btn btn-sm admin__btn-cancel"
                          onClick={() => handleDeleteStaff(staff.id, staff.name)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* GALERİ TAB */}
        {tab === 'gallery' && (
          <>
            <div className="admin__gallery-section">
              <h2 className="admin__section-title">Fotoğraf Yükle</h2>
              <form className="admin__gallery-form" onSubmit={handleUploadGallery}>
                <div className="admin__gallery-upload">
                  <label className="admin__gallery-upload-label">
                    Fotoğraf Seç
                    <input
                      type="file"
                      accept="image/*"
                      className="admin__staff-upload-input"
                      onChange={(e) => setGalleryFile(e.target.files[0] || null)}
                    />
                  </label>
                  {galleryFile && (
                    <span className="admin__staff-upload-name">{galleryFile.name}</span>
                  )}
                </div>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Açıklama (opsiyonel)"
                  value={galleryAlt}
                  onChange={(e) => setGalleryAlt(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!galleryFile || uploadingImage}
                >
                  <FiPlus /> {uploadingImage ? 'Yükleniyor...' : 'Yükle'}
                </button>
              </form>
            </div>

            <div className="admin__gallery-section">
              <h2 className="admin__section-title">Mevcut Fotoğraflar ({galleryImages.length})</h2>
              {galleryLoading ? (
                <p className="admin__empty">Yükleniyor...</p>
              ) : galleryImages.length === 0 ? (
                <p className="admin__empty">Henüz fotoğraf eklenmemiş.</p>
              ) : (
                <div className="admin__gallery-grid">
                  {galleryImages.map((img) => (
                    <div key={img.id} className="admin__gallery-item">
                      <img src={img.url} alt={img.alt} />
                      <button
                        className="admin__gallery-delete"
                        onClick={() => handleDeleteGallery(img.id, img.storagePath)}
                        title="Sil"
                      >
                        <FiTrash2 size={16} />
                      </button>
                      {img.alt && (
                        <span className="admin__gallery-alt">{img.alt}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* HASILAT TAB */}
        {tab === 'revenue' && (
          <>
            <div className="admin__revenue-section">
              <h2 className="admin__section-title">
                <FiTrendingUp /> Hasılat Takibi
              </h2>

              {/* Filtreler */}
              <div className="admin__revenue-filters">
                <div className="admin__revenue-filter-group">
                  <label className="admin__slots-label">Dönem</label>
                  <div className="admin__revenue-period-list">
                    {[
                      { key: 'today', label: 'Bugün' },
                      { key: 'week', label: 'Bu Hafta' },
                      { key: 'month', label: 'Bu Ay' },
                      { key: 'all', label: 'Tüm Zamanlar' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        className={`admin__filter-btn ${revenuePeriod === key ? 'admin__filter-btn--active' : ''}`}
                        onClick={() => setRevenuePeriod(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin__revenue-filter-group">
                  <label className="admin__slots-label">Personel</label>
                  <div className="admin__revenue-period-list">
                    <button
                      className={`admin__filter-btn ${revenueStaff === 'all' ? 'admin__filter-btn--active' : ''}`}
                      onClick={() => setRevenueStaff('all')}
                    >
                      Tümü
                    </button>
                    {staffList.map((staff) => (
                      <button
                        key={staff.id}
                        className={`admin__filter-btn ${revenueStaff === staff.id ? 'admin__filter-btn--active' : ''}`}
                        onClick={() => setRevenueStaff(staff.id)}
                      >
                        {staff.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Özet kartları */}
              <div className="admin__revenue-stats">
                <div className="admin__revenue-stat-card admin__revenue-stat-card--primary">
                  <FiDollarSign className="admin__revenue-stat-icon" />
                  <span className="admin__revenue-stat-number">
                    {totalRevenue.toLocaleString('tr-TR')} ₺
                  </span>
                  <span className="admin__revenue-stat-label">Toplam Hasılat</span>
                </div>
                <div className="admin__revenue-stat-card">
                  <FiBarChart2 className="admin__revenue-stat-icon" />
                  <span className="admin__revenue-stat-number">{revenueData.length}</span>
                  <span className="admin__revenue-stat-label">Tamamlanan Randevu</span>
                </div>
                <div className="admin__revenue-stat-card">
                  <FiTrendingUp className="admin__revenue-stat-icon" />
                  <span className="admin__revenue-stat-number">
                    {avgRevenue.toLocaleString('tr-TR')} ₺
                  </span>
                  <span className="admin__revenue-stat-label">Ortalama İşlem</span>
                </div>
              </div>

              {/* Hizmet bazlı tablo */}
              {serviceRows.length > 0 && (
                <div className="admin__revenue-table-section">
                  <h3 className="admin__revenue-table-title">Hizmet Bazlı Gelir</h3>
                  <div className="admin__revenue-table-wrapper">
                    <table className="admin__revenue-table">
                      <thead>
                        <tr>
                          <th>Hizmet</th>
                          <th>Adet</th>
                          <th>Toplam</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceRows.map((row) => (
                          <tr key={row.name}>
                            <td>{row.name}</td>
                            <td>{row.count}</td>
                            <td className="admin__revenue-table-price">
                              {row.total.toLocaleString('tr-TR')} ₺
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Personel bazlı tablo */}
              {staffRows.length > 0 && (
                <div className="admin__revenue-table-section">
                  <h3 className="admin__revenue-table-title">Personel Bazlı Gelir</h3>
                  <div className="admin__revenue-table-wrapper">
                    <table className="admin__revenue-table">
                      <thead>
                        <tr>
                          <th>Personel</th>
                          <th>Randevu</th>
                          <th>Toplam</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffRows.map((row) => (
                          <tr key={row.name}>
                            <td>{row.name}</td>
                            <td>{row.count}</td>
                            <td className="admin__revenue-table-price">
                              {row.total.toLocaleString('tr-TR')} ₺
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Son tamamlanan randevular */}
              {revenueData.length > 0 ? (
                <div className="admin__revenue-table-section">
                  <h3 className="admin__revenue-table-title">
                    Son Tamamlanan Randevular
                  </h3>
                  <div className="admin__revenue-table-wrapper">
                    <table className="admin__revenue-table">
                      <thead>
                        <tr>
                          <th>Tarih</th>
                          <th>Hizmet</th>
                          <th>Müşteri</th>
                          <th>Personel</th>
                          <th>Ücret</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueData.slice(0, 20).map((appt) => (
                          <tr key={appt.id}>
                            <td>
                              {format(new Date(appt.date + 'T00:00:00'), 'd MMM', { locale: tr })}
                              {' '}{appt.time}
                            </td>
                            <td>{appt.serviceName}</td>
                            <td>{appt.customerName || '-'}</td>
                            <td>{appt.staffName || '-'}</td>
                            <td className="admin__revenue-table-price">
                              {appt.servicePrice ? `${appt.servicePrice.toLocaleString('tr-TR')} ₺` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="admin__empty">
                  <p>Bu dönemde tamamlanan randevu bulunamadı.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
