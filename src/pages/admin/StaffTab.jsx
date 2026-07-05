import { useState } from 'react';
import { FiUser, FiPlus, FiTrash2 } from 'react-icons/fi';
import { addStaff, deleteStaff, updateStaff, uploadStaffPhoto } from '../../services/staffService';
import { useToast } from '../../context/ToastContext';

export default function StaffTab({ staffList, setStaffList, staffLoading }) {
  const { toast, confirm } = useToast();
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffTitle, setNewStaffTitle] = useState('Berber');
  const [newStaffPhoto, setNewStaffPhoto] = useState('');
  const [newStaffFile, setNewStaffFile] = useState(null);
  const [addingStaff, setAddingStaff] = useState(false);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    setAddingStaff(true);
    try {
      let photoURL = newStaffPhoto.trim();
      if (newStaffFile) {
        photoURL = await uploadStaffPhoto(newStaffFile);
      }
      const id = await addStaff({ name: newStaffName.trim(), title: newStaffTitle.trim(), photoURL });
      setStaffList((prev) => [
        ...prev,
        { id, name: newStaffName.trim(), title: newStaffTitle.trim(), photoURL, active: true },
      ]);
      setNewStaffName('');
      setNewStaffTitle('Berber');
      setNewStaffPhoto('');
      setNewStaffFile(null);
      toast('Personel eklendi.', 'success');
    } catch {
      toast('Personel eklenirken bir hata oluştu.', 'error');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    const ok = await confirm(`"${staffName}" personelini silmek istediğinize emin misiniz?`, {
      confirmText: 'Sil',
      danger: true,
    });
    if (!ok) return;

    try {
      await deleteStaff(staffId);
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
      toast('Personel silindi.', 'success');
    } catch {
      toast('Personel silinirken bir hata oluştu.', 'error');
    }
  };

  const handleToggleStaff = async (staffId, currentActive) => {
    try {
      await updateStaff(staffId, { active: !currentActive });
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, active: !currentActive } : s))
      );
    } catch {
      toast('Durum güncellenirken bir hata oluştu.', 'error');
    }
  };

  return (
    <>
      <div className="admin__staff-section">
        <h2 className="admin__section-title">Personel Ekle</h2>
        <form className="admin__staff-form" onSubmit={handleAddStaff}>
          <input
            className="form-input"
            type="text"
            placeholder="Ad Soyad"
            value={newStaffName}
            onChange={(e) => setNewStaffName(e.target.value)}
          />
          <input
            className="form-input"
            type="text"
            placeholder="Unvan (ör: Berber)"
            value={newStaffTitle}
            onChange={(e) => setNewStaffTitle(e.target.value)}
          />
          <input
            className="form-input"
            type="url"
            placeholder="Fotoğraf URL (opsiyonel)"
            value={newStaffPhoto}
            onChange={(e) => setNewStaffPhoto(e.target.value)}
          />
          <div className="admin__staff-upload">
            <label className="admin__staff-upload-label">
              veya dosya yükle
              <input
                type="file"
                accept="image/*"
                className="admin__staff-upload-input"
                onChange={(e) => setNewStaffFile(e.target.files[0] || null)}
              />
            </label>
            {newStaffFile && <span className="admin__staff-upload-name">{newStaffFile.name}</span>}
          </div>
          <button className="btn btn-primary" type="submit" disabled={!newStaffName.trim() || addingStaff}>
            <FiPlus /> {addingStaff ? 'Ekleniyor...' : 'Ekle'}
          </button>
        </form>
      </div>

      <div className="admin__staff-section">
        <h2 className="admin__section-title">Mevcut Personel</h2>
        {staffLoading ? (
          <p className="admin__empty">Yükleniyor...</p>
        ) : staffList.length === 0 ? (
          <p className="admin__empty">Henüz personel eklenmemiş.</p>
        ) : (
          <div className="admin__staff-list">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className={`admin__staff-card card ${!staff.active ? 'admin__staff-card--inactive' : ''}`}
              >
                <div className="admin__staff-card-avatar">
                  {staff.photoURL ? <img src={staff.photoURL} alt={staff.name} /> : <FiUser size={24} />}
                </div>
                <div className="admin__staff-card-info">
                  <span className="admin__staff-card-name">{staff.name}</span>
                  <span className="admin__staff-card-title">{staff.title}</span>
                </div>
                <div className="admin__staff-card-status">
                  <span
                    className={`admin__staff-badge ${
                      staff.active ? 'admin__staff-badge--active' : 'admin__staff-badge--inactive'
                    }`}
                  >
                    {staff.active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="admin__staff-card-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleToggleStaff(staff.id, staff.active)}
                  >
                    {staff.active ? 'Pasif Yap' : 'Aktif Yap'}
                  </button>
                  <button
                    className="btn btn-sm admin__btn-cancel"
                    onClick={() => handleDeleteStaff(staff.id, staff.name)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
