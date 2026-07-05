import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { addGalleryImage, deleteGalleryImage } from '../../services/galleryService';
import { useToast } from '../../context/ToastContext';

export default function GalleryTab({ galleryImages, setGalleryImages, galleryLoading }) {
  const { toast, confirm } = useToast();
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryAlt, setGalleryAlt] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleUploadGallery = async (e) => {
    e.preventDefault();
    if (!galleryFile) return;

    setUploadingImage(true);
    try {
      const image = await addGalleryImage(galleryFile, galleryAlt.trim());
      setGalleryImages((prev) => [image, ...prev]);
      setGalleryFile(null);
      setGalleryAlt('');
      toast('Fotoğraf yüklendi.', 'success');
    } catch {
      toast('Fotoğraf yüklenirken bir hata oluştu.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteGallery = async (imageId, storagePath) => {
    const ok = await confirm('Bu fotoğrafı silmek istediğinize emin misiniz?', {
      confirmText: 'Sil',
      danger: true,
    });
    if (!ok) return;

    try {
      await deleteGalleryImage(imageId, storagePath);
      setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
      toast('Fotoğraf silindi.', 'success');
    } catch {
      toast('Fotoğraf silinirken bir hata oluştu.', 'error');
    }
  };

  return (
    <>
      <div className="admin__gallery-section">
        <h2 className="admin__section-title">Fotoğraf Yükle</h2>
        <form className="admin__gallery-form" onSubmit={handleUploadGallery}>
          <div className="admin__gallery-upload">
            <label className="admin__gallery-upload-label">
              Fotoğraf Seç
              <input
                type="file"
                accept="image/*"
                className="admin__staff-upload-input"
                onChange={(e) => setGalleryFile(e.target.files[0] || null)}
              />
            </label>
            {galleryFile && <span className="admin__staff-upload-name">{galleryFile.name}</span>}
          </div>
          <input
            className="form-input"
            type="text"
            placeholder="Açıklama (opsiyonel)"
            value={galleryAlt}
            onChange={(e) => setGalleryAlt(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={!galleryFile || uploadingImage}>
            <FiPlus /> {uploadingImage ? 'Yükleniyor...' : 'Yükle'}
          </button>
        </form>
      </div>

      <div className="admin__gallery-section">
        <h2 className="admin__section-title">Mevcut Fotoğraflar ({galleryImages.length})</h2>
        {galleryLoading ? (
          <p className="admin__empty">Yükleniyor...</p>
        ) : galleryImages.length === 0 ? (
          <p className="admin__empty">Henüz fotoğraf eklenmemiş.</p>
        ) : (
          <div className="admin__gallery-grid">
            {galleryImages.map((img) => (
              <div key={img.id} className="admin__gallery-item">
                <img src={img.url} alt={img.alt} />
                <button
                  className="admin__gallery-delete"
                  onClick={() => handleDeleteGallery(img.id, img.storagePath)}
                  title="Sil"
                >
                  <FiTrash2 size={16} />
                </button>
                {img.alt && <span className="admin__gallery-alt">{img.alt}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
