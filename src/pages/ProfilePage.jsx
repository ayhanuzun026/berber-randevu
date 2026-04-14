import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  FiCalendar,
  FiClock,
  FiX,
  FiUser,
  FiPhone,
  FiLogOut,
  FiChevronDown,
  FiChevronUp,
  FiPlus,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import {
  getAppointmentsByUser,
  updateAppointmentStatus,
} from '../services/appointmentService';
import { STATUS, STATUS_LABELS, STATUS_COLORS } from '../config/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './ProfilePage.css';

function formatPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace('+90', '0');
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }
  return digits;
}

function AppointmentCard({ appt, showCancel, onCancel, cancellingId }) {
  const canCancel =
    showCancel &&
    (appt.status === STATUS.PENDING || appt.status === STATUS.CONFIRMED);

  return (
    <div className="profile__card card">
      <div className="profile__card-header">
        <h4>{appt.serviceName}</h4>
        <span
          className="profile__status"
          style={{
            backgroundColor: `${STATUS_COLORS[appt.status]}20`,
            color: STATUS_COLORS[appt.status],
            borderColor: `${STATUS_COLORS[appt.status]}40`,
          }}
        >
          {STATUS_LABELS[appt.status]}
        </span>
      </div>
      <div className="profile__card-body">
        <div className="profile__detail">
          <FiCalendar size={14} />
          <span>
            {format(new Date(appt.date + 'T00:00:00'), 'd MMMM yyyy, EEEE', {
              locale: tr,
            })}
          </span>
        </div>
        <div className="profile__detail">
          <FiClock size={14} />
          <span>
            {appt.time} ({appt.serviceDuration} dk)
          </span>
        </div>
        {appt.servicePrice && (
          <div className="profile__detail">
            <span className="profile__price">{appt.servicePrice} ₺</span>
          </div>
        )}
      </div>
      {canCancel && (
        <div className="profile__card-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onCancel(appt.id)}
            disabled={cancellingId === appt.id}
          >
            <FiX />
            {cancellingId === appt.id ? 'İptal ediliyor...' : 'İptal Et'}
          </button>
        </div>
      )}
    </div>
  );
}

function AppointmentSection({
  title,
  appointments,
  emptyText,
  defaultOpen = false,
  showCancel = false,
  onCancel,
  cancellingId,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="profile__section">
      <button
        className="profile__section-header"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="profile__section-title">{title}</span>
        <span className="profile__section-right">
          <span className="profile__section-count">{appointments.length}</span>
          {open ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </span>
      </button>
      {open && (
        <div className="profile__section-body">
          {appointments.length === 0 ? (
            <p className="profile__section-empty">{emptyText}</p>
          ) : (
            <div className="profile__section-list">
              {appointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  showCancel={showCancel}
                  onCancel={onCancel}
                  cancellingId={cancellingId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!user) return;

    getAppointmentsByUser(user.uid)
      .then(setAppointments)
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancel = async (appointmentId) => {
    if (!confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) return;

    setCancellingId(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, STATUS.CANCELLED);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: STATUS.CANCELLED } : a
        )
      );
    } catch {
      alert('İptal işlemi sırasında bir hata oluştu.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return <LoadingSpinner text="Profiliniz yükleniyor..." />;
  }

  const now = new Date();

  const activeAppointments = appointments.filter(
    (a) =>
      (a.status === STATUS.PENDING || a.status === STATUS.CONFIRMED) &&
      new Date(a.date + 'T23:59:59') >= now
  );

  const pastAppointments = appointments.filter(
    (a) => a.status === STATUS.COMPLETED
  );

  const cancelledAppointments = appointments.filter(
    (a) => a.status === STATUS.CANCELLED
  );

  const noShowAppointments = appointments.filter(
    (a) => a.status === STATUS.NO_SHOW
  );

  return (
    <section className="profile section">
      <div className="container">
        <h1 className="section-title">Profilim</h1>

        {/* Kişisel Bilgiler */}
        <div className="profile__info card">
          <h3 className="profile__info-title">
            <FiUser /> Kişisel Bilgiler
          </h3>
          {user.phoneNumber && (
            <div className="profile__info-row">
              <FiPhone size={16} />
              <span>{formatPhone(user.phoneNumber)}</span>
            </div>
          )}
          {user.displayName && (
            <div className="profile__info-row">
              <FiUser size={16} />
              <span>{user.displayName}</span>
            </div>
          )}
        </div>

        {/* Yeni Randevu Oluştur */}
        <div className="profile__action">
          <Link to="/randevu" className="btn btn-primary btn-lg">
            <FiPlus /> Yeni Randevu Oluştur
          </Link>
        </div>

        {/* Aktif Randevular */}
        <AppointmentSection
          title="Aktif Randevular"
          appointments={activeAppointments}
          emptyText="Aktif randevunuz bulunmuyor."
          defaultOpen={true}
          showCancel={true}
          onCancel={handleCancel}
          cancellingId={cancellingId}
        />

        {/* Geçmiş Randevular */}
        <AppointmentSection
          title="Geçmiş Randevular"
          appointments={pastAppointments}
          emptyText="Geçmiş randevunuz bulunmuyor."
        />

        {/* İptal Edilen Randevular */}
        <AppointmentSection
          title="İptal Edilen Randevular"
          appointments={cancelledAppointments}
          emptyText="İptal edilen randevunuz bulunmuyor."
        />

        {/* Gitmediğiniz Randevular */}
        <AppointmentSection
          title="Gitmediğiniz Randevular"
          appointments={noShowAppointments}
          emptyText="Bu kategoride randevu bulunmuyor."
        />

        {/* Oturumu Kapat */}
        <div className="profile__logout">
          <button className="btn btn-secondary" onClick={handleLogout}>
            <FiLogOut /> Oturumu Kapat
          </button>
        </div>
      </div>
    </section>
  );
}
