import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { BUSINESS } from '../../config/constants';
import './Contact.css';

export default function Contact() {
  return (
    <section id="iletisim" className="section contact">
      <div className="container">
        <h2 className="section-title">İletişim</h2>
        <p className="section-subtitle">
          Bize ulaşın veya doğrudan gelin
        </p>
        <div className="contact__grid">
          <div className="contact__info">
            <div className="contact__item">
              <div className="contact__icon"><FiMapPin /></div>
              <div>
                <h4>Adres</h4>
                <p>{BUSINESS.address}</p>
              </div>
            </div>
            <div className="contact__item">
              <div className="contact__icon"><FiPhone /></div>
              <div>
                <h4>Telefon</h4>
                <a href={`tel:${BUSINESS.phone}`}>{BUSINESS.phone}</a>
              </div>
            </div>
            <div className="contact__item">
              <div className="contact__icon"><FiMail /></div>
              <div>
                <h4>E-posta</h4>
                <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
              </div>
            </div>
            <div className="contact__item">
              <div className="contact__icon"><FiClock /></div>
              <div>
                <h4>Çalışma Saatleri</h4>
                <p>Pzt-Cum: {BUSINESS.workingHours.weekdays.open} – {BUSINESS.workingHours.weekdays.close}</p>
                <p>Cumartesi: {BUSINESS.workingHours.saturday.open} – {BUSINESS.workingHours.saturday.close}</p>
                <p>Pazar: <span className="contact__closed">Kapalı</span></p>
              </div>
            </div>
          </div>
          <div className="contact__map">
            <div className="contact__map-placeholder">
              Harita burada görünecek
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
