import { useState, useEffect } from 'react';
import { getGalleryImages } from '../../services/galleryService';
import './Gallery.css';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGalleryImages()
      .then(setImages)
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="galeri" className="section gallery">
      <div className="container">
        <h2 className="section-title">Galeri</h2>
        <p className="section-subtitle">
          Çalışmalarımızdan örnekler
        </p>
        {loading ? (
          <p className="gallery__loading">Yükleniyor...</p>
        ) : images.length === 0 ? (
          <p className="gallery__loading">Henüz fotoğraf eklenmemiş.</p>
        ) : (
          <div className="gallery__grid">
            {images.map((img) => (
              <div key={img.id} className="gallery__item">
                <img src={img.url} alt={img.alt} loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
