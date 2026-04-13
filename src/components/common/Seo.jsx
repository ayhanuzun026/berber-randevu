import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BUSINESS } from '../../config/constants';

const DEFAULT_IMAGE = `${BUSINESS.website}/logo.png`;
const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex, nofollow';
const STRUCTURED_DATA_ID = 'structured-data';

const ROUTE_META = {
  '/': {
    title: 'Eski\u015fehir Berber ve Online Randevu | Salih Y\u0131lmaz Barber Shop',
    description:
      'Salih Y\u0131lmaz Barber Shop, Tepeba\u015f\u0131 Eski\u015fehir\'de profesyonel erkek sa\u00e7 kesimi, sakal t\u0131ra\u015f\u0131 ve online randevu hizmeti sunar.',
    robots: DEFAULT_ROBOTS,
  },
  '/giris': {
    title: 'Giri\u015f | Salih Y\u0131lmaz Barber Shop',
    description:
      'Salih Y\u0131lmaz Barber Shop hesab\u0131n\u0131za giri\u015f yaparak online randevular\u0131n\u0131z\u0131 y\u00f6netin.',
    robots: NOINDEX_ROBOTS,
  },
  '/randevu': {
    title: 'Randevu Olu\u015ftur | Salih Y\u0131lmaz Barber Shop',
    description:
      'Sa\u00e7 kesimi, sakal t\u0131ra\u015f\u0131 ve bak\u0131m hizmetleri i\u00e7in online randevu olu\u015fturun.',
    robots: NOINDEX_ROBOTS,
  },
  '/profil': {
    title: 'Profilim | Salih Y\u0131lmaz Barber Shop',
    description: 'Hesap bilgilerinizi ve ge\u00e7mi\u015f randevular\u0131n\u0131z\u0131 y\u00f6netin.',
    robots: NOINDEX_ROBOTS,
  },
  '/admin': {
    title: 'Y\u00f6netim Paneli | Salih Y\u0131lmaz Barber Shop',
    description: 'Salih Y\u0131lmaz Barber Shop y\u00f6netim paneli.',
    robots: NOINDEX_ROBOTS,
  },
  '/gizlilik-politikasi': {
    title: 'Gizlilik Politikas\u0131 | Salih Y\u0131lmaz Barber Shop',
    description:
      'Salih Y\u0131lmaz Barber Shop gizlilik politikas\u0131: ki\u015fisel verilerin i\u015flenmesi, saklanmas\u0131 ve ileti\u015fim tercihleri.',
    robots: DEFAULT_ROBOTS,
  },
};

const HOME_STRUCTURED_DATA = [
  {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    '@id': `${BUSINESS.website}/#organization`,
    name: 'Salih Y\u0131lmaz Barber Shop',
    alternateName: 'Eski\u015fehir Berber',
    url: BUSINESS.website,
    image: DEFAULT_IMAGE,
    logo: DEFAULT_IMAGE,
    telephone: formatPhoneNumber(BUSINESS.phone),
    email: BUSINESS.email,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '\u015eirintepe, Bursa Cd. No:51/A',
      addressLocality: 'Tepeba\u015f\u0131',
      addressRegion: 'Eski\u015fehir',
      postalCode: '26200',
      addressCountry: 'TR',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '21:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '21:00',
      },
    ],
    sameAs: [BUSINESS.instagram, BUSINESS.instagramPersonal].filter(Boolean),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BUSINESS.website}/#website`,
    url: BUSINESS.website,
    name: 'Eski\u015fehir Berber',
    inLanguage: 'tr-TR',
  },
];

function formatPhoneNumber(phoneNumber) {
  const digits = phoneNumber.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('0')) {
    return `+90${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `+90${digits}`;
  }

  return `+${digits}`;
}

function setOrCreateMeta(selector, attributeName, attributeValue, content) {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attributeName, attributeValue);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

function setCanonical(url) {
  let canonical = document.head.querySelector('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }

  canonical.setAttribute('href', url);
}

function setStructuredData(data) {
  const existing = document.getElementById(STRUCTURED_DATA_ID);

  if (!data) {
    existing?.remove();
    return;
  }

  const script = existing || document.createElement('script');
  script.id = STRUCTURED_DATA_ID;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);

  if (!existing) {
    document.head.appendChild(script);
  }
}

export default function Seo() {
  const location = useLocation();
  const meta = ROUTE_META[location.pathname] || ROUTE_META['/'];
  const canonicalUrl =
    location.pathname === '/' ? `${BUSINESS.website}/` : `${BUSINESS.website}${location.pathname}`;
  const structuredData = location.pathname === '/' ? HOME_STRUCTURED_DATA : null;

  useEffect(() => {
    document.title = meta.title;

    setOrCreateMeta('meta[name="description"]', 'name', 'description', meta.description);
    setOrCreateMeta('meta[name="robots"]', 'name', 'robots', meta.robots);
    setOrCreateMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setOrCreateMeta('meta[property="og:locale"]', 'property', 'og:locale', 'tr_TR');
    setOrCreateMeta('meta[property="og:site_name"]', 'property', 'og:site_name', BUSINESS.name);
    setOrCreateMeta('meta[property="og:title"]', 'property', 'og:title', meta.title);
    setOrCreateMeta('meta[property="og:description"]', 'property', 'og:description', meta.description);
    setOrCreateMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setOrCreateMeta('meta[property="og:image"]', 'property', 'og:image', DEFAULT_IMAGE);
    setOrCreateMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setOrCreateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title);
    setOrCreateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description);
    setOrCreateMeta('meta[name="twitter:image"]', 'name', 'twitter:image', DEFAULT_IMAGE);
    setCanonical(canonicalUrl);
    setStructuredData(structuredData);
  }, [canonicalUrl, meta, structuredData]);

  return null;
}
