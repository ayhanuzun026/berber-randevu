import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FiX, FiCheck } from 'react-icons/fi';
import { getReservedSlots, rescheduleAppointment } from '../../services/appointmentService';
import { getBlockedSlots } from '../../services/blockedSlotService';
import { isSlotAvailable, coveredSlotTimes } from '../../utils/slots';
import { getWorkingSlots, getAvailableDates } from '../../utils/businessHours';
import { useToast } from '../../context/ToastContext';
import './RescheduleModal.css';

export default function RescheduleModal({ appt, settings, onClose, onDone }) {
  const { toast } = useToast();
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [reserved, setReserved] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const dates = getAvailableDates(settings, 30);
  const duration = appt.serviceDuration || 15;

  useEffect(() => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    setLoading(true);
    Promise.all([getReservedSlots(dateStr, appt.staffId), getBlockedSlots(dateStr, appt.staffId)])
      .then(([res, blk]) => {
        // Randevunun kendi mevcut slotlarını "dolu" sayma (aynı güne ertelerken)
        let resTimes = res;
        if (dateStr === appt.date) {
          const own = coveredSlotTimes(appt.time, duration);
          resTimes = res.filter((t) => !own.includes(t));
        }
        setReserved(resTimes);
        setBlocked(blk.map((b) => b.time));
      })
      .catch(() => {
        setReserved([]);
        setBlocked([]);
      })
      .finally(() => setLoading(false));
  }, [date, appt.staffId, appt.date, appt.time, duration]);

  const workingSlots = date ? getWorkingSlots(date, settings) : [];
  const availableSlots = workingSlots.filter((slot) =>
    isSlotAvailable(slot, duration, reserved, blocked, workingSlots)
  );

  const handleConfirm = async () => {
    if (!date || !time) return;
    const newDate = format(date, 'yyyy-MM-dd');
    setSaving(true);
    try {
      await rescheduleAppointment(appt.id, appt, newDate, time);
      toast('Randevunuz ertelendi.', 'success');
      onDone(newDate, time);
    } catch (err) {
      if (err?.message === 'SLOT_TAKEN') {
        toast('Bu saat az önce alındı. Lütfen başka bir saat seçin.', 'error');
        setTime(null);
      } else {
        toast('Erteleme sırasında bir hata oluştu.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="reschedule-overlay" onClick={onClose}>
      <div className="reschedule-box" onClick={(e) => e.stopPropagation()}>
        <div className="reschedule-head">
          <div>
            <h3>Randevuyu Ertele</h3>
            <p>{appt.serviceName} · {appt.staffName}</p>
          </div>
          <button className="reschedule-close" onClick={onClose} aria-label="Kapat">
            <FiX size={20} />
          </button>
        </div>

        <div className="reschedule-current">
          Mevcut: <strong>{format(new Date(appt.date + 'T00:00:00'), 'd MMM', { locale: tr })} {appt.time}</strong>
        </div>

        <label className="reschedule-label">Yeni Tarih</label>
        <div className="reschedule-dates">
          {dates.map((d) => {
            const ds = format(d, 'yyyy-MM-dd');
            const isSel = date && format(date, 'yyyy-MM-dd') === ds;
            return (
              <button
                key={ds}
                className={`reschedule-date ${isSel ? 'reschedule-date--active' : ''}`}
                onClick={() => {
                  setDate(d);
                  setTime(null);
                }}
              >
                <span>{format(d, 'EEE', { locale: tr })}</span>
                <strong>{format(d, 'd')}</strong>
                <span>{format(d, 'MMM', { locale: tr })}</span>
              </button>
            );
          })}
        </div>

        {date && (
          <>
            <label className="reschedule-label">Yeni Saat</label>
            {loading ? (
              <p className="reschedule-empty">Yükleniyor...</p>
            ) : availableSlots.length === 0 ? (
              <p className="reschedule-empty">Bu tarihte müsait saat yok.</p>
            ) : (
              <div className="reschedule-times">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    className={`reschedule-time ${time === slot ? 'reschedule-time--active' : ''}`}
                    onClick={() => setTime(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="reschedule-actions">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Vazgeç
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleConfirm}
            disabled={!date || !time || saving}
          >
            <FiCheck /> {saving ? 'Erteleniyor...' : 'Ertele'}
          </button>
        </div>
      </div>
    </div>
  );
}
