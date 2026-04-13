import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiClock, FiInstagram } from 'react-icons/fi';
import { BUSINESS } from '../../config/constants';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* İşletme bilgisi */}
          <div className="footer__col">
            <h3 className="footer__brand">{BUSINESS.name}</h3>
            <p className="footer__tagline">{BUSINESS.slogan}</p>
            <p className="footer__since">{BUSINESS.founded}'den beri hizmetinizdeyiz</p>
          </div>

          {/* Hızlı bağlantılar */}
          <div className="footer__col">
            <h4 className="footer__heading">Hızlı Bağlantılar</h4>
            <nav className="footer__links">
              <Link to="/">Ana Sayfa</Link>
              <a href="/#hizmetler">Hizmetler</a>
              <a href="/#galeri">Galeri</a>
              <Link to="/randevu">Randevu Al</Link>
              <Link to="/gizlilik-politikasi">Gizlilik Politikasi</Link>
            </nav>
          </div>

          {/* İletişim */}
          <div className="footer__col">
            <h4 className="footer__heading">İletişim</h4>
            <div className="footer__contact">
              <div className="footer__contact-item">
                <FiMapPin />
                <span>{BUSINESS.address}</span>
              </div>
              <div className="footer__contact-item">
                <FiPhone />
                <a href={`tel:${BUSINESS.phone}`}>{BUSINESS.phone}</a>
              </div>
              <div className="footer__contact-item">
                <FiMail />
                <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
              </div>
            </div>
          </div>

          {/* Çalışma saatleri */}
          <div className="footer__col">
            <h4 className="footer__heading">Çalışma Saatleri</h4>
            <div className="footer__hours">
              <div className="footer__hour-row">
                <span>Pazartesi - Cuma</span>
                <span>{BUSINESS.workingHours.weekdays.open} – {BUSINESS.workingHours.weekdays.close}</span>
              </div>
              <div className="footer__hour-row">
                <span>Cumartesi</span>
                <span>{BUSINESS.workingHours.saturday.open} – {BUSINESS.workingHours.saturday.close}</span>
              </div>
              <div className="footer__hour-row">
                <span>Pazar</span>
                <span className="footer__closed">Kapalı</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {currentYear} {BUSINESS.name}. Tüm hakları saklıdır.</p>
          <div className="footer__social">
            {BUSINESS.instagram && (
              <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FiInstagram size={20} />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
