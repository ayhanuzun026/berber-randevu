import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiPhone, FiCalendar, FiLogIn, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { BUSINESS } from '../../config/constants';
import './Header.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sayfa değiştiğinde menüyü kapat
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="container header__inner">
        <Link to="/" className="header__logo">
          <img src="/logo.png" alt={BUSINESS.name} className="header__logo-img" />
          <span className="header__logo-text">{BUSINESS.name}</span>
        </Link>

        <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
          <Link to="/" className={`header__link ${isActive('/') ? 'header__link--active' : ''}`}>
            Ana Sayfa
          </Link>
          <a href="/#hizmetler" className="header__link">
            Hizmetler
          </a>
          <a href="/#galeri" className="header__link">
            Galeri
          </a>
          <a href="/#iletisim" className="header__link">
            İletişim
          </a>
          {user && (
            <Link to="/profil" className={`header__link ${isActive('/profil') ? 'header__link--active' : ''}`}>
              Profilim
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className={`header__link ${isActive('/admin') ? 'header__link--active' : ''}`}>
              Yönetim
            </Link>
          )}
        </nav>

        <div className="header__actions">
          <a href={`tel:${BUSINESS.phone}`} className="header__phone">
            <FiPhone />
            <span>{BUSINESS.phone}</span>
          </a>
          <Link to="/randevu" className="btn btn-primary btn-sm">
            <FiCalendar />
            <span>Randevu Al</span>
          </Link>
          {user ? (
            <button
              className="header__auth-btn"
              onClick={() => { logout(); navigate('/'); }}
              title="Çıkış Yap"
            >
              <FiLogOut size={18} />
            </button>
          ) : (
            <Link to="/giris" className="header__auth-btn" title="Giriş Yap">
              <FiLogIn size={18} />
            </Link>
          )}
          <button
            className="header__menu-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Menü"
          >
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
