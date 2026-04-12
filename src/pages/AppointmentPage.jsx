import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format,
  addDays,
  startOfDay,
  getDay,
  addHours,
  isBefore,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  FiChevronRight,
  FiChevronLeft,
  FiCheck,
  FiClock,
  FiCalendar,
  FiScissors,
  FiUser,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { SERVICES_LIST, BUSINESS, APPOINTMENT } from '../config/constants';
import { createAppointment, getAppointmentsByDateAndStaff } from '../services/appointmentService';
import { getActiveStaff } from '../services/staffService';
import './AppointmentPage.css';

const STEPS = ['Hizmet', 'Tarih', 'Saat'];

function generateTimeSlots(date) {
  const dayOfWeek = getDay(date);
  if (dayOfWeek === 0) return [];

  const hours =
    dayOfWeek === 6
      ? BUSINESS.workingHours.saturday
      : BUSINESS.workingHours.weekdays;

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

function generateAvailableDates() {
  const dates = [];
  const today = startOfDay(new Date());
  for (let i = 0; i < APPOINTMENT.maxAdvanceDays; i++) {
    const date = addDays(today, i);
    if (getDay(date) !== 0) {
      dates.push(date);
    }
  }
  return dates;
}

export default function AppointmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const availableDates = generateAvailableDates();

  // Personel listesini yükle
  useEffect(() => {
    getActiveStaff()
      .then(setStaffList)
      .catch(() => setStaffList([]))
      .finally(() => setStaffLoading(false));
  }, []);

  // Tarih + personel seçildiğinde dolu slotları getir
  useEffect(() => {
    if (!selectedDate || !selectedStaff) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    setSlotsLoading(true);
    getAppointmentsByDateAndStaff(dateStr, selectedStaff.id)
      .then((appointments) => {
        setBookedSlots(appointments.map((a) => a.time));
      })
      .catch(() => {
        setBookedSlots([]);
      })
      .finally(() => {
        setSlotsLoading(false);
      });
  }, [selectedDate, selectedStaff]);

  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  const now = new Date();
  const minBookingTime = addHours(now, APPOINTMENT.minAdvanceHours);
  const filteredSlots = timeSlots.filter((slot) => {
    if (!selectedDate) return false;
    const [h, m] = slot.split(':').map(Number);
    const slotDate = new Date(selectedDate);
    slotDate.setHours(h, m, 0, 0);
    return !isBefore(slotDate, minBookingTime);
  });

  const canGoNext = () => {
    switch (step) {
      case 0:
        return selectedService !== null && selectedStaff !== null;
      case 1:
        return selectedDate !== null;
      case 2:
        return selectedTime !== null;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      await createAppointment({
        userId: user.uid,
        userEmail: user.email || '',
        customerName: user.displayName || '',
        customerPhone: user.phoneNumber || '',
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        note: '',
      });
      setSuccess(true);
    } catch {
      setError('Randevu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="appointment section">
        <div className="container">
          <div className="appointment__success">
            <div className="appointment__success-icon">
              <FiCheck size={48} />
            </div>
            <h2>Randevunuz Alındı!</h2>
            <p>
              <strong>{selectedStaff.name}</strong> ile{' '}
              <strong>{selectedService.name}</strong> için{' '}
              <strong>
                {format(selectedDate, 'd MMMM yyyy', { locale: tr })}
              </strong>{' '}
              tarihinde saat <strong>{selectedTime}</strong> randevunuz
              oluşturuldu.
            </p>
            <p className="appointment__success-note">
              Randevunuz başarıyla oluşturuldu. Belirtilen saatte bekliyoruz!
            </p>
            <div className="appointment__success-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/profil')}
              >
                Profilime Git
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/')}
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="appointment section">
      <div className="container">
        <h1 className="section-title">Randevu Al</h1>
        <p className="section-subtitle">
          Hizmet seçin, tarih ve saat belirleyin
        </p>

        {/* Step indicator */}
        <div className="appointment__steps">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`appointment__step ${
                i === step ? 'appointment__step--active' : ''
              } ${i < step ? 'appointment__step--done' : ''}`}
            >
              <div className="appointment__step-number">
                {i < step ? <FiCheck size={14} /> : i + 1}
              </div>
              <span className="appointment__step-label">{label}</span>
            </div>
          ))}
        </div>

        {error && <div className="appointment__error">{error}</div>}

        {/* Step 0: Hizmet + Personel seçimi */}
        {step === 0 && (
          <div className="appointment__panel">
            <h3 className="appointment__panel-title">
              <FiScissors /> Hizmet Seçin
            </h3>
            <div className="appointment__services">
              {SERVICES_LIST.map((svc) => {
                const isSelected = selectedService?.id === svc.id;
                return (
                  <React.Fragment key={svc.id}>
                    <button
                      className={`appointment__service-card ${
                        isSelected ? 'appointment__service-card--selected' : ''
                      }`}
                      onClick={() => {
                        setSelectedService(svc);
                        setSelectedStaff(null);
                      }}
                    >
                      <h4>{svc.name}</h4>
                      <p>{svc.desc}</p>
                      <div className="appointment__service-meta">
                        {svc.price && (
                          <span className="appointment__service-price">
                            {svc.price} ₺
                          </span>
                        )}
                        <span className="appointment__service-duration">
                          <FiClock size={14} /> {svc.duration} dk
                        </span>
                      </div>
                    </button>

                    {isSelected && (
                      <div className="appointment__staff-inline">
                        <p className="appointment__staff-label">
                          <FiUser size={14} /> Personel seçin
                        </p>
                        {staffLoading ? (
                          <p className="appointment__loading">Yükleniyor...</p>
                        ) : staffList.length === 0 ? (
                          <p className="appointment__empty">Personel bulunamadı.</p>
                        ) : (
                          <div className="appointment__staff-list">
                            {staffList.map((staff) => (
                              <button
                                key={staff.id}
                                className={`appointment__staff-card ${
                                  selectedStaff?.id === staff.id
                                    ? 'appointment__staff-card--selected'
                                    : ''
                                }`}
                                onClick={() => setSelectedStaff(staff)}
                              >
                                <div className="appointment__staff-avatar">
                                  {staff.photoURL ? (
                                    <img src={staff.photoURL} alt={staff.name} />
                                  ) : (
                                    <FiUser size={24} />
                                  )}
                                </div>
                                <div className="appointment__staff-info">
                                  <span className="appointment__staff-name">
                                    {staff.name}
                                  </span>
                                  <span className="appointment__staff-title">
                                    {staff.title}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Tarih seçimi */}
        {step === 1 && (
          <div className="appointment__panel">
            <h3 className="appointment__panel-title">
              <FiCalendar /> Tarih Seçin
            </h3>
            <div className="appointment__dates">
              {availableDates.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const isSelected =
                  selectedDate &&
                  format(selectedDate, 'yyyy-MM-dd') === dateStr;
                return (
                  <button
                    key={dateStr}
                    className={`appointment__date-card ${
                      isSelected ? 'appointment__date-card--selected' : ''
                    }`}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                  >
                    <span className="appointment__date-day">
                      {format(date, 'EEEE', { locale: tr })}
                    </span>
                    <span className="appointment__date-num">
                      {format(date, 'd')}
                    </span>
                    <span className="appointment__date-month">
                      {format(date, 'MMM', { locale: tr })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Saat seçimi + özet + onay */}
        {step === 2 && (
          <div className="appointment__panel">
            <h3 className="appointment__panel-title">
              <FiClock /> Saat Seçin
            </h3>

            {/* Renk açıklaması */}
            <div className="appointment__legend">
              <div className="appointment__legend-item">
                <span className="appointment__legend-dot appointment__legend-dot--available" />
                Müsait
              </div>
              <div className="appointment__legend-item">
                <span className="appointment__legend-dot appointment__legend-dot--booked" />
                Dolu
              </div>
            </div>

            {slotsLoading ? (
              <p className="appointment__loading">Müsait saatler yükleniyor...</p>
            ) : filteredSlots.length === 0 ? (
              <p className="appointment__empty">
                Bu tarihte müsait saat bulunmuyor. Lütfen başka bir tarih seçin.
              </p>
            ) : (
              <div className="appointment__times">
                {filteredSlots.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      className={`appointment__time-card ${
                        isSelected ? 'appointment__time-card--selected' : ''
                      } ${
                        isBooked
                          ? 'appointment__time-card--booked'
                          : 'appointment__time-card--available'
                      }`}
                      onClick={() => !isBooked && setSelectedTime(slot)}
                      disabled={isBooked}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Saat seçildiyse özet göster */}
            {selectedTime && (
              <div className="appointment__summary">
                <div className="appointment__summary-item">
                  <span>Hizmet</span>
                  <strong>{selectedService.name}</strong>
                </div>
                <div className="appointment__summary-item">
                  <span>Personel</span>
                  <strong>{selectedStaff.name}</strong>
                </div>
                <div className="appointment__summary-item">
                  <span>Tarih</span>
                  <strong>
                    {format(selectedDate, 'd MMMM yyyy, EEEE', { locale: tr })}
                  </strong>
                </div>
                <div className="appointment__summary-item">
                  <span>Saat</span>
                  <strong>{selectedTime}</strong>
                </div>
                <div className="appointment__summary-item">
                  <span>Süre</span>
                  <strong>{selectedService.duration} dakika</strong>
                </div>
                {selectedService.price && (
                  <div className="appointment__summary-item">
                    <span>Ücret</span>
                    <strong className="appointment__summary-price">
                      {selectedService.price} ₺
                    </strong>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="appointment__nav">
          {step > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => setStep((s) => s - 1)}
            >
              <FiChevronLeft /> Geri
            </button>
          )}
          <div className="appointment__nav-spacer" />
          {step < 2 ? (
            <button
              className="btn btn-primary"
              disabled={!canGoNext()}
              onClick={() => setStep((s) => s + 1)}
            >
              İleri <FiChevronRight />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!selectedTime || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Gönderiliyor...' : 'Randevuyu Onayla'}
              {!submitting && <FiCheck />}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
