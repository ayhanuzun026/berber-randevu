import { useState } from 'react';
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FiDollarSign, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';
import { STATUS } from '../../config/constants';

const PERIODS = [
  { key: 'today', label: 'Bugün' },
  { key: 'week', label: 'Bu Hafta' },
  { key: 'month', label: 'Bu Ay' },
  { key: 'all', label: 'Tüm Zamanlar' },
];

export default function RevenueTab({ appointments, staffList }) {
  const [revenuePeriod, setRevenuePeriod] = useState('all');
  const [revenueStaff, setRevenueStaff] = useState('all');

  const completedAppointments = appointments.filter((a) => a.status === STATUS.COMPLETED);

  const getRevenueFiltered = () => {
    let filtered = completedAppointments;

    if (revenuePeriod !== 'all') {
      const today = startOfDay(new Date());
      if (revenuePeriod === 'today') {
        const startDate = format(today, 'yyyy-MM-dd');
        filtered = filtered.filter((a) => a.date === startDate);
      } else if (revenuePeriod === 'week') {
        const startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        filtered = filtered.filter((a) => a.date >= startDate);
      } else if (revenuePeriod === 'month') {
        const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        filtered = filtered.filter((a) => a.date >= startDate);
      }
    }

    if (revenueStaff !== 'all') {
      filtered = filtered.filter((a) => a.staffId === revenueStaff);
    }

    return filtered;
  };

  const revenueData = getRevenueFiltered();
  const totalRevenue = revenueData.reduce((sum, a) => sum + (a.servicePrice || 0), 0);
  const avgRevenue = revenueData.length > 0 ? Math.round(totalRevenue / revenueData.length) : 0;

  const serviceBreakdown = revenueData.reduce((acc, a) => {
    const key = a.serviceName || 'Bilinmeyen';
    if (!acc[key]) acc[key] = { count: 0, total: 0 };
    acc[key].count += 1;
    acc[key].total += a.servicePrice || 0;
    return acc;
  }, {});

  const serviceRows = Object.entries(serviceBreakdown)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);

  const staffBreakdown = revenueData.reduce((acc, a) => {
    const key = a.staffName || 'Bilinmeyen';
    const id = a.staffId || 'unknown';
    if (!acc[id]) acc[id] = { name: key, count: 0, total: 0 };
    acc[id].count += 1;
    acc[id].total += a.servicePrice || 0;
    return acc;
  }, {});

  const staffRows = Object.values(staffBreakdown).sort((a, b) => b.total - a.total);

  return (
    <div className="admin__revenue-section">
      <h2 className="admin__section-title">
        <FiTrendingUp /> Hasılat Takibi
      </h2>

      <div className="admin__revenue-filters">
        <div className="admin__revenue-filter-group">
          <label className="admin__slots-label">Dönem</label>
          <div className="admin__revenue-period-list">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                className={`admin__filter-btn ${revenuePeriod === key ? 'admin__filter-btn--active' : ''}`}
                onClick={() => setRevenuePeriod(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="admin__revenue-filter-group">
          <label className="admin__slots-label">Personel</label>
          <div className="admin__revenue-period-list">
            <button
              className={`admin__filter-btn ${revenueStaff === 'all' ? 'admin__filter-btn--active' : ''}`}
              onClick={() => setRevenueStaff('all')}
            >
              Tümü
            </button>
            {staffList.map((staff) => (
              <button
                key={staff.id}
                className={`admin__filter-btn ${revenueStaff === staff.id ? 'admin__filter-btn--active' : ''}`}
                onClick={() => setRevenueStaff(staff.id)}
              >
                {staff.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="admin__revenue-stats">
        <div className="admin__revenue-stat-card admin__revenue-stat-card--primary">
          <FiDollarSign className="admin__revenue-stat-icon" />
          <span className="admin__revenue-stat-number">{totalRevenue.toLocaleString('tr-TR')} ₺</span>
          <span className="admin__revenue-stat-label">Toplam Hasılat</span>
        </div>
        <div className="admin__revenue-stat-card">
          <FiBarChart2 className="admin__revenue-stat-icon" />
          <span className="admin__revenue-stat-number">{revenueData.length}</span>
          <span className="admin__revenue-stat-label">Tamamlanan Randevu</span>
        </div>
        <div className="admin__revenue-stat-card">
          <FiTrendingUp className="admin__revenue-stat-icon" />
          <span className="admin__revenue-stat-number">{avgRevenue.toLocaleString('tr-TR')} ₺</span>
          <span className="admin__revenue-stat-label">Ortalama İşlem</span>
        </div>
      </div>

      {serviceRows.length > 0 && (
        <div className="admin__revenue-table-section">
          <h3 className="admin__revenue-table-title">Hizmet Bazlı Gelir</h3>
          <div className="admin__revenue-table-wrapper">
            <table className="admin__revenue-table">
              <thead>
                <tr>
                  <th>Hizmet</th>
                  <th>Adet</th>
                  <th>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {serviceRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.count}</td>
                    <td className="admin__revenue-table-price">{row.total.toLocaleString('tr-TR')} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {staffRows.length > 0 && (
        <div className="admin__revenue-table-section">
          <h3 className="admin__revenue-table-title">Personel Bazlı Gelir</h3>
          <div className="admin__revenue-table-wrapper">
            <table className="admin__revenue-table">
              <thead>
                <tr>
                  <th>Personel</th>
                  <th>Randevu</th>
                  <th>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {staffRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.count}</td>
                    <td className="admin__revenue-table-price">{row.total.toLocaleString('tr-TR')} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {revenueData.length > 0 ? (
        <div className="admin__revenue-table-section">
          <h3 className="admin__revenue-table-title">Son Tamamlanan Randevular</h3>
          <div className="admin__revenue-table-wrapper">
            <table className="admin__revenue-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Hizmet</th>
                  <th>Müşteri</th>
                  <th>Personel</th>
                  <th>Ücret</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.slice(0, 20).map((appt) => (
                  <tr key={appt.id}>
                    <td>
                      {format(new Date(appt.date + 'T00:00:00'), 'd MMM', { locale: tr })} {appt.time}
                    </td>
                    <td>{appt.serviceName}</td>
                    <td>{appt.customerName || '-'}</td>
                    <td>{appt.staffName || '-'}</td>
                    <td className="admin__revenue-table-price">
                      {appt.servicePrice ? `${appt.servicePrice.toLocaleString('tr-TR')} ₺` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin__empty">
          <p>Bu dönemde tamamlanan randevu bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
