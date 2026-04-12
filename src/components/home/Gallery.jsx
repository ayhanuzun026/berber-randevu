import './Gallery.css';

const GALLERY_ITEMS = [
  { id: 1, alt: 'Saç kesimi örneği 1' },
  { id: 2, alt: 'Sakal tıraşı örneği' },
  { id: 3, alt: 'VIP bakım' },
  { id: 4, alt: 'Saç kesimi örneği 2' },
  { id: 5, alt: 'Modern saç stili' },
  { id: 6, alt: 'Salon iç mekan' },
];

export default function Gallery() {
  return (
    <section id="galeri" className="section gallery">
      <div className="container">
        <h2 className="section-title">Galeri</h2>
        <p className="section-subtitle">
          Çalışmalarımızdan örnekler
        </p>
        <div className="gallery__grid">
          {GALLERY_ITEMS.map((item) => (
            <div key={item.id} className="gallery__item">
              <div className="gallery__placeholder">
                <span>{item.alt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
