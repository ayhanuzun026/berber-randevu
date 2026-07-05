import { useState, useEffect } from 'react';
import {
  FiX,
  FiClock,
  FiCalendar,
  FiUsers,
  FiImage,
  FiDollarSign,
} from 'react-icons/fi';
import { getAllStaff } from '../services/staffService';
import { getGalleryImages } from '../services/galleryService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAppointmentsRealtime } from './admin/useAppointmentsRealtime';
import AppointmentsTab from './admin/AppointmentsTab';
import SlotsTab from './admin/SlotsTab';
import StaffTab from './admin/StaffTab';
import GalleryTab from './admin/GalleryTab';
import RevenueTab from './admin/RevenueTab';
import './AdminPage.css';

const TABS = [
  { key: 'appointments', label: 'Randevular', Icon: FiCalendar },
  { key: 'slots', label: 'Saat Yönetimi', Icon: FiClock },
  { key: 'staff', label: 'Personel', Icon: FiUsers },
  { key: 'gallery', label: 'Galeri', Icon: FiImage },
  { key: 'revenue', label: 'Hasılat', Icon: FiDollarSign },
];

export default function AdminPage() {
  const [tab, setTab] = useState('appointments');

  const { appointments, setAppointments, loading, notification, dismissNotification } =
    useAppointmentsRealtime();

  // Personel ve galeri (birden çok sekmede paylaşılır)
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  useEffect(() => {
    getAllStaff()
      .then(setStaffList)
      .catch(() => setStaffList([]))
      .finally(() => setStaffLoading(false));

    getGalleryImages()
      .then(setGalleryImages)
      .catch(() => setGalleryImages([]))
      .finally(() => setGalleryLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner text="Yükleniyor..." />;
  }

  return (
    <section className="admin section">
      <div className="container">
        <h1 className="section-title">Yönetim Paneli</h1>

        {notification && (
          <div className="admin__notification" role="status" aria-live="polite">
            <div className="admin__notification-content">
              <span className="admin__notification-icon">🔔</span>
              <div className="admin__notification-text">
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
              </div>
              <button className="admin__notification-close" onClick={dismissNotification}>
                <FiX size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="admin__tabs">
          {TABS.map((t) => {
            const TabIcon = t.Icon;
            return (
              <button
                key={t.key}
                className={`admin__tab ${tab === t.key ? 'admin__tab--active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                <TabIcon /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'appointments' && (
          <AppointmentsTab appointments={appointments} setAppointments={setAppointments} />
        )}

        {tab === 'slots' && <SlotsTab staffList={staffList} />}

        {tab === 'staff' && (
          <StaffTab staffList={staffList} setStaffList={setStaffList} staffLoading={staffLoading} />
        )}

        {tab === 'gallery' && (
          <GalleryTab
            galleryImages={galleryImages}
            setGalleryImages={setGalleryImages}
            galleryLoading={galleryLoading}
          />
        )}

        {tab === 'revenue' && <RevenueTab appointments={appointments} staffList={staffList} />}
      </div>
    </section>
  );
}
