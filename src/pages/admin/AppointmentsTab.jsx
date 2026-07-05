import { useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FiCheck, FiX, FiClock, FiCalendar, FiFilter, FiUser, FiPhone, FiUsers } from 'react-icons/fi';
import { updateAppointmentStatus } from '../../services/appointmentService';
import { STATUS, STATUS_LABELS, STATUS_COLORS } from '../../config/constants';
import { useToast } from '../../context/ToastContext';

export default function AppointmentsTab({ appointments, setAppointments }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (appointmentId, newStatus) => {
    setUpdatingId(appointmentId);
    try {
      const opts = newStatus === STATUS.CANCELLED ? { cancelledBy: 'admin' } : {};
      await updateAppointmentStatus(appointmentId, newStatus, opts);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? { ...a, status: newStatus, ...(newStatus === STATUS.CANCELLED ? { cancelledBy: 'admin' } : {}) }
            : a
        )
      );
    } catch {
      toast('Durum güncellenirken bir hata oluştu.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAppointments =
    filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const statusCounts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
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
                {appt.servicePrice && <div className="admin__card-price">{appt.servicePrice} ₺</div>}
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
                    {format(new Date(appt.date + 'T00:00:00'), 'd MMM yyyy, EEEE', { locale: tr })}
                  </span>
                </div>
                <div className="admin__detail">
                  <FiClock size={14} />
                  <span>
                    {appt.time} ({appt.serviceDuration} dk)
                  </span>
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
  );
}
