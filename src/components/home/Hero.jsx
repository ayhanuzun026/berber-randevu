import { Link } from 'react-router-dom';
import { FiCalendar, FiArrowRight } from 'react-icons/fi';
import { BUSINESS } from '../../config/constants';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__overlay" />
      <div className="container hero__content">
        <span className="hero__badge">{BUSINESS.founded}'DEN BERİ HİZMETİNİZDE</span>
        <div className="hero__brand">
          <img src="/logo.png" alt={BUSINESS.name} className="hero__logo" />
          <h1 className="hero__title">
            {BUSINESS.slogan}
          </h1>
        </div>
        <p className="hero__subtitle">
          Profesyonel berber hizmetleri ile tarzınızı yansıtın.
          Online randevu alın, sıra beklemeden gelin.
        </p>
        <div className="hero__actions">
          <Link to="/randevu" className="btn btn-primary btn-lg">
            <FiCalendar />
            Randevu Al
          </Link>
          <a href="#hizmetler" className="btn btn-secondary btn-lg">
            Hizmetlerimiz
            <FiArrowRight />
          </a>
        </div>
        <div className="hero__stats">
          <div className="hero__stat">
            <span className="hero__stat-number">{new Date().getFullYear() - BUSINESS.founded}+</span>
            <span className="hero__stat-label">Yıllık Deneyim</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-number">5000+</span>
            <span className="hero__stat-label">Mutlu Müşteri</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-number">4.9</span>
            <span className="hero__stat-label">Google Puan</span>
          </div>
        </div>
      </div>
    </section>
  );
}
