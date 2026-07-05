import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FiUser, FiLock, FiUnlock } from 'react-icons/fi';
import { getAppointmentsByDateAndStaff } from '../../services/appointmentService';
import { getBlockedSlots, toggleBlockedSlot } from '../../services/blockedSlotService';
import { APPOINTMENT } from '../../config/constants';
import { timeToMinutes } from '../../utils/slots';
import { getWorkingSlots, getAvailableDates } from '../../utils/businessHours';
import { DEFAULT_SETTINGS } from '../../services/settingsService';
import { useToast } from '../../context/ToastContext';

export default function SlotsTab({ staffList, settings = DEFAULT_SETTINGS }) {
  const { toast } = useToast();
  const [slotDate, setSlotDate] = useState(null);
  const [slotStaff, setSlotStaff] = useState(null);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [togglingSlot, setTogglingSlot] = useState(null);

  const allTimeSlots = slotDate ? getWorkingSlots(slotDate, settings) : [];
  const slotDates = getAvailableDates(settings, 30);

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

  const getSlotInfo = (time) => {
    if (blockedSlots.some((s) => s.time === time)) return 'blocked';

    for (const appt of bookedSlots) {
      const startMin = timeToMinutes(appt.time);
      const duration = appt.serviceDuration || APPOINTMENT.slotDuration;
      const slotMin = timeToMinutes(time);
      if (slotMin >= startMin && slotMin < startMin + duration) return 'booked';
    }

    return 'available';
  };

  const getBookedApptForSlot = (time) => {
    for (const appt of bookedSlots) {
      const startMin = timeToMinutes(appt.time);
      const duration = appt.serviceDuration || APPOINTMENT.slotDuration;
      const slotMin = timeToMinutes(time);
      if (slotMin >= startMin && slotMin < startMin + duration) return appt;
    }
    return null;
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
      toast('Slot güncellenirken bir hata oluştu.', 'error');
    } finally {
      setTogglingSlot(null);
    }
  };

  return (
    <div className="admin__slots-section">
      <h2 className="admin__section-title">Saat Yönetimi</h2>
      <p className="admin__section-desc">
        Tarih ve personel seçerek istediğiniz saatleri kapatabilir veya açabilirsiniz.
      </p>

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

        <div className="admin__slots-dates">
          <label className="admin__slots-label">Tarih</label>
          <div className="admin__slots-date-list">
            {slotDates.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isSelected = slotDate && format(slotDate, 'yyyy-MM-dd') === dateStr;
              return (
                <button
                  key={dateStr}
                  className={`admin__slots-date-btn ${isSelected ? 'admin__slots-date-btn--active' : ''}`}
                  onClick={() => {
                    setSlotDate(date);
                    setBlockedSlots([]);
                    setBookedSlots([]);
                  }}
                >
                  <span className="admin__slots-date-day">{format(date, 'EEE', { locale: tr })}</span>
                  <span className="admin__slots-date-num">{format(date, 'd')}</span>
                  <span className="admin__slots-date-month">{format(date, 'MMM', { locale: tr })}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {slotDate && slotStaff && (
        <>
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
                      <span className="admin__slot-appt">{appt.serviceName}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {(!slotDate || !slotStaff) && (
        <div className="admin__empty">
          <p>Lütfen personel ve tarih seçin.</p>
        </div>
      )}
    </div>
  );
}
