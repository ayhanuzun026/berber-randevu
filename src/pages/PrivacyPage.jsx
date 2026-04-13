import './PrivacyPage.css';

const PRIVACY_SECTIONS = [
  {
    title: 'Hangi verileri topluyoruz?',
    body: [
      'Randevu olusturma ve hesap yonetimi sirasinda ad soyad, telefon numarasi, e-posta adresi ve secilen hizmet bilgilerini isleyebiliriz.',
      'Teknik olarak gerekli oldugunda oturum ve guvenlik kayitlari da tutulabilir.',
    ],
  },
  {
    title: 'Verileri neden kullaniyoruz?',
    body: [
      'Randevu planlamasi yapmak, sizinle iletisime gecmek ve hizmet kalitesini surdurmek icin kullaniriz.',
      'Yasal yukumluluk gerektiren durumlar disinda verilerinizi reklam amacli ucuncu kisilerle satmayiz.',
    ],
  },
  {
    title: 'Veriler kimlerle paylasilabilir?',
    body: [
      'Altyapi hizmetleri icin kullandigimiz teknik saglayicilar ile sinirli duzeyde veri paylasimi olabilir.',
      'Yetkili kamu kurumlarinin hukuka uygun talepleri halinde gerekli bilgiler paylasilabilir.',
    ],
  },
  {
    title: 'Haklariniz',
    body: [
      'Verilerinize erisme, duzeltme, silme ve isleme amacini ogrenme taleplerinizi bize iletebilirsiniz.',
      'Iletisim talepleri icin info@eskisehirberber.com adresine e-posta gonderebilirsiniz.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <section className="section privacy-page">
      <div className="container privacy-page__container">
        <div className="privacy-page__hero">
          <span className="privacy-page__eyebrow">Yasal Bilgilendirme</span>
          <h1 className="privacy-page__title">Gizlilik Politikasi</h1>
          <p className="privacy-page__intro">
            Bu sayfa, Salih Yilmaz Barber Shop tarafindan sunulan online randevu ve iletisim
            sureclerinde hangi verilerin hangi amaclarla islendigini aciklar.
          </p>
          <p className="privacy-page__updated">Son guncelleme: 13 Nisan 2026</p>
        </div>

        <div className="privacy-page__grid">
          {PRIVACY_SECTIONS.map((section) => (
            <article key={section.title} className="card privacy-page__card">
              <h2 className="privacy-page__card-title">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="privacy-page__paragraph">
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
