import { useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FiSave, FiPlus, FiTrash2, FiCalendar } from 'react-icons/fi';
import { updateBusinessSettings } from '../../services/settingsService';
import { useToast } from '../../context/ToastContext';

export default function SettingsTab({ settings, setSettings }) {
  const { toast } = useToast();
  const [weekday, setWeekday] = useState(settings.weekday);
  const [saturday, setSaturday] = useState(settings.saturday);
  const [sundayClosed, setSundayClosed] = useState(settings.sundayClosed);
  const [holidays, setHolidays] = useState(settings.holidays || []);
  const [newHoliday, setNewHoliday] = useState('');
  const [saving, setSaving] = useState(false);

  const addHoliday = () => {
    if (!newHoliday) return;
    if (holidays.includes(newHoliday)) {
      toast('Bu tarih zaten ekli.', 'info');
      return;
    }
    setHolidays((prev) => [...prev, newHoliday].sort());
    setNewHoliday('');
  };

  const removeHoliday = (date) => {
    setHolidays((prev) => prev.filter((d) => d !== date));
  };

  const handleSave = async () => {
    setSaving(true);
    const next = { weekday, saturday, sundayClosed, holidays };
    try {
      await updateBusinessSettings(next);
      setSettings((prev) => ({ ...prev, ...next }));
      toast('Çalışma saatleri kaydedildi.', 'success');
    } catch {
      toast('Ayarlar kaydedilirken bir hata oluştu.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin__settings-section">
      <h2 className="admin__section-title">Çalışma Saatleri</h2>
      <p className="admin__section-desc">
        Açılış/kapanış saatlerini ve kapalı günleri buradan yönetin. Değişiklikler randevu
        ekranına anında yansır.
      </p>

      <div className="admin__settings-hours">
        <div className="admin__settings-row">
          <span className="admin__settings-day">Hafta içi (Pzt–Cum)</span>
          <div className="admin__settings-inputs">
            <input
              type="time"
              className="form-input"
              value={weekday.open}
              onChange={(e) => setWeekday((w) => ({ ...w, open: e.target.value }))}
            />
            <span>–</span>
            <input
              type="time"
              className="form-input"
              value={weekday.close}
              onChange={(e) => setWeekday((w) => ({ ...w, close: e.target.value }))}
            />
          </div>
        </div>

        <div className="admin__settings-row">
          <span className="admin__settings-day">Cumartesi</span>
          <div className="admin__settings-inputs">
            <input
              type="time"
              className="form-input"
              value={saturday.open}
              onChange={(e) => setSaturday((s) => ({ ...s, open: e.target.value }))}
            />
            <span>–</span>
            <input
              type="time"
              className="form-input"
              value={saturday.close}
              onChange={(e) => setSaturday((s) => ({ ...s, close: e.target.value }))}
            />
          </div>
        </div>

        <div className="admin__settings-row">
          <span className="admin__settings-day">Pazar</span>
          <label className="admin__settings-toggle">
            <input
              type="checkbox"
              checked={sundayClosed}
              onChange={(e) => setSundayClosed(e.target.checked)}
            />
            Kapalı
          </label>
        </div>
      </div>

      <h3 className="admin__section-title" style={{ marginTop: 24 }}>
        Tatil / Kapalı Günler
      </h3>
      <p className="admin__section-desc">
        Bayram, izin gibi tamamen kapalı günleri ekleyin. Bu günlerde randevu alınamaz.
      </p>

      <div className="admin__settings-holiday-add">
        <input
          type="date"
          className="form-input"
          value={newHoliday}
          onChange={(e) => setNewHoliday(e.target.value)}
        />
        <button className="btn btn-secondary btn-sm" onClick={addHoliday} disabled={!newHoliday}>
          <FiPlus /> Ekle
        </button>
      </div>

      {holidays.length > 0 && (
        <div className="admin__settings-holiday-list">
          {holidays.map((date) => (
            <div key={date} className="admin__settings-holiday-item">
              <FiCalendar size={14} />
              <span>{format(new Date(date + 'T00:00:00'), 'd MMMM yyyy, EEEE', { locale: tr })}</span>
              <button
                className="admin__settings-holiday-remove"
                onClick={() => removeHoliday(date)}
                title="Kaldır"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="admin__settings-save">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <FiSave /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
