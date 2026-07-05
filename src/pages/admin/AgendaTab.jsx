import { useState } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FiChevronLeft, FiChevronRight, FiUser, FiPhone, FiClock, FiUsers } from 'react-icons/fi';
import { STATUS, STATUS_LABELS, STATUS_COLORS } from '../../config/constants';
import { timeToMinutes } from '../../utils/slots';

const ACTIVE = [STATUS.PENDING, STATUS.CONFIRMED];

export default function AgendaTab({ appointments }) {
  const [offset, setOffset] = useState(0); // 0 = bugün
  const day = addDays(startOfDay(new Date()), offset);
  const dayStr = format(day, 'yyyy-MM-dd');

  const dayAppointments = appointments
    .filter((a) => a.date === dayStr && ACTIVE.includes(a.status))
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  const totalRevenue = dayAppointments.reduce((sum, a) => sum + (a.servicePrice || 0), 0);

  return (
    <div className="admin__agenda-section">
      <div className="admin__agenda-header">
        <button className="btn btn-secondary btn-sm" onClick={() => setOffset((o) => o - 1)}>
          <FiChevronLeft />
        </button>
        <div className="admin__agenda-date">
          <strong>{format(day, 'd MMMM yyyy', { locale: tr })}</strong>
          <span>{format(day, 'EEEE', { locale: tr })}{offset === 0 ? ' · Bugün' : ''}</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setOffset((o) => o + 1)}>
          <FiChevronRight />
        </button>
      </div>

      <div className="admin__agenda-summary">
        <span>{dayAppointments.length} randevu</span>
        {totalRevenue > 0 && <span>{totalRevenue.toLocaleString('tr-TR')} ₺ beklenen</span>}
      </div>

      {dayAppointments.length === 0 ? (
        <div className="admin__empty">
          <p>Bu gün için aktif randevu yok.</p>
        </div>
      ) : (
        <div className="admin__agenda-list">
          {dayAppointments.map((appt) => (
            <div key={appt.id} className="admin__agenda-item">
              <div className="admin__agenda-time">
                <FiClock size={14} />
                <strong>{appt.time}</strong>
                <span>{appt.serviceDuration} dk</span>
              </div>
              <div className="admin__agenda-info">
                <div className="admin__agenda-service">
                  {appt.serviceName}
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
                <div className="admin__agenda-meta">
                  <span><FiUser size={12} /> {appt.customerName || 'İsimsiz'}</span>
                  <a href={`tel:${appt.customerPhone}`}><FiPhone size={12} /> {appt.customerPhone}</a>
                  {appt.staffName && <span><FiUsers size={12} /> {appt.staffName}</span>}
                </div>
              </div>
              {appt.servicePrice != null && (
                <div className="admin__agenda-price">{appt.servicePrice} ₺</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
