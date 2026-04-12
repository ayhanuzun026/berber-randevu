import {
  FiScissors,
  FiStar,
  FiDroplet,
  FiSmile,
  FiUser,
  FiAward,
  FiWind,
  FiEye,
  FiZap,
} from 'react-icons/fi';
import { SERVICES_LIST } from '../../config/constants';
import './Services.css';

const ICON_MAP = {
  'sac-kesimi': <FiScissors />,
  'sac-kesimi-yikama': <FiScissors />,
  'sac-kesimi-agda': <FiScissors />,
  'sac-sakal': <FiScissors />,
  'sac-sakal-yikama': <FiScissors />,
  'cocuk-tirasi': <FiSmile />,
  'sakal-tirasi': <FiUser />,
  'sakal-tirasi-agda': <FiUser />,
  'fon': <FiWind />,
  'kas-tasarimi': <FiEye />,
  'sac-yikama': <FiDroplet />,
  'ense-tirasi': <FiZap />,
  'agda': <FiZap />,
  'vip-paket': <FiStar />,
  'cilt-bakimi-buharli': <FiSmile />,
  'cilt-bakimi': <FiSmile />,
  'damat-tirasi': <FiAward />,
  'sac-kesimi-ustura': <FiScissors />,
};

export default function Services() {
  return (
    <section id="hizmetler" className="section services">
      <div className="container">
        <h2 className="section-title">Hizmetlerimiz</h2>
        <p className="section-subtitle">
          Profesyonel ekibimizle size en iyi bakım deneyimini sunuyoruz
        </p>
        <div className="services__grid">
          {SERVICES_LIST.map((service) => (
            <div key={service.id} className="card services__card">
              <div className="services__icon">
                {ICON_MAP[service.id] || <FiScissors />}
              </div>
              <h3 className="services__name">{service.name}</h3>
              <p className="services__desc">{service.desc}</p>
              <div className="services__meta">
                <span className="services__duration">{service.duration} dk</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
