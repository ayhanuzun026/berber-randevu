// İşletme bilgileri — tek yerden yönetim
export const BUSINESS = {
  name: 'Salih Yılmaz Barber Shop',
  shortName: 'Eskişehir Berber',
  slogan: 'Modern Tarzın Adresi',
  phone: '0506 694 92 00',
  email: 'info@eskisehirberber.com',
  address: 'Şirintepe, Bursa Cd. No:51/A, 26200 Tepebaşı/Eskişehir',
  mapUrl: 'https://maps.google.com/?q=Şirintepe,+Bursa+Cd.+No:51/A,+26200+Tepebaşı/Eskişehir',
  instagram: 'https://instagram.com/eskisehirberber',
  instagramPersonal: 'https://instagram.com/salihyilmaz.es',
  website: 'https://eskisehirberber.com',
  founded: 2012,
  workingHours: {
    weekdays: { open: '10:00', close: '21:00' },
    saturday: { open: '10:00', close: '21:00' },
    sunday: null, // kapalı
  },
};

// Randevu ayarları
export const APPOINTMENT = {
  slotDuration: 15, // dakika
  maxAdvanceDays: 30, // en fazla kaç gün ileriye randevu alınabilir
  minAdvanceHours: 1, // en az kaç saat önceden randevu alınabilir
  maxConcurrent: 1, // personel başına eş zamanlı randevu
};

// Hizmet listesi — randevu formunda ve anasayfada ortak kullanılır
export const SERVICES_LIST = [
  { id: 'sac-kesimi', name: 'Saç Kesimi', desc: 'Klasik ve modern saç kesim teknikleri', price: 450, duration: 30 },
  { id: 'sac-kesimi-yikama', name: 'Saç Kesimi ve Yıkama', desc: 'Saç kesimi + yıkama paketi', price: 550, duration: 40 },
  { id: 'sac-kesimi-agda', name: 'Saç Kesimi - Ağda', desc: 'Saç kesimi ve ağda birlikte', price: 600, duration: 40 },
  { id: 'sac-sakal', name: 'Saç - Sakal Kesimi', desc: 'Saç kesimi ve sakal kesimi birlikte', price: 700, duration: 45 },
  { id: 'sac-sakal-yikama', name: 'Saç - Sakal Kesimi ve Yıkama', desc: 'Komple bakım: saç, sakal ve yıkama', price: 800, duration: 50 },
  { id: 'cocuk-tirasi', name: 'Çocuk Tıraşı', desc: 'Çocuklar için özel saç kesimi', price: 450, duration: 20 },
  { id: 'sakal-tirasi', name: 'Sakal Tıraşı', desc: 'Profesyonel sakal tıraşı ve şekillendirme', price: 250, duration: 20 },
  { id: 'sakal-tirasi-agda', name: 'Sakal Tıraşı ve Ağda', desc: 'Sakal tıraşı ve ağda birlikte', price: 400, duration: 30 },
  { id: 'fon', name: 'Fön Çekimi', desc: 'Saç kurutma ve şekillendirme', price: 200, duration: 15 },
  { id: 'kas-tasarimi', name: 'Kaş Tasarımı', desc: 'Profesyonel kaş şekillendirme', price: 150, duration: 10 },
  { id: 'sac-yikama', name: 'Saç Yıkama', desc: 'Profesyonel saç yıkama hizmeti', price: 100, duration: 15 },
  { id: 'ense-tirasi', name: 'Ense Tıraşı', desc: 'Ense bölgesi düzeltme ve temizleme', price: 100, duration: 10 },
  { id: 'agda', name: 'Ağda', desc: 'Ağda ile tüy alma hizmeti', price: 150, duration: 30 },
  { id: 'vip-paket', name: 'VIP Paket', desc: 'Saç & sakal kesimi, kaş tasarımı, ağda, buharlı cilt bakımı ve yıkama & fön', price: 2500, duration: 90 },
  { id: 'cilt-bakimi-buharli', name: 'SW Cilt Bakımı Buharlı', desc: 'Buharlı derin cilt bakım uygulaması', price: 1250, duration: 50 },
  { id: 'cilt-bakimi', name: 'SW Cilt Bakımı', desc: 'Profesyonel cilt bakım uygulaması', price: 1000, duration: 40 },
  { id: 'damat-tirasi', name: 'Damat Tıraşı', desc: 'Detaylı bilgi için bizimle iletişime geçebilirsiniz', price: null, duration: 90 },
  { id: 'sac-kesimi-ustura', name: 'Saç Kesimi - Ustura', desc: 'Ustura ile detaylı saç kesimi', price: 600, duration: 30 },
];

// Randevu durumları
export const STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
};

export const STATUS_LABELS = {
  [STATUS.PENDING]: 'Beklemede',
  [STATUS.CONFIRMED]: 'Onaylandı',
  [STATUS.CANCELLED]: 'İptal Edildi',
  [STATUS.COMPLETED]: 'Tamamlandı',
  [STATUS.NO_SHOW]: 'Gelmedi',
};

export const STATUS_COLORS = {
  [STATUS.PENDING]: '#f59e0b',
  [STATUS.CONFIRMED]: '#10b981',
  [STATUS.CANCELLED]: '#ef4444',
  [STATUS.COMPLETED]: '#6366f1',
  [STATUS.NO_SHOW]: '#6b7280',
};
