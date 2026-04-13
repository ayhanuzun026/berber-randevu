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
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1500!2d30.4773474!3d39.7936557!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cc142c0b21d6fd%3A0xe5f40c301508657e!2sEski%C5%9Fehir%20Berber!5e0!3m2!1str!2str!4v1"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Eskişehir Berber Konum"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
