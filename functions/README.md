# SMS Bildirimleri (Netgsm) — Aktivasyon Rehberi

Bu klasör, SMS bildirimleri için **hazır ama uyuyan** Cloud Functions kodunu içerir.
Kod yazılıdır; **Netgsm bilgileri girilene kadar hiçbir SMS gönderilmez** ve
mevcut site normal çalışmaya devam eder.

İki fonksiyon:
- `onAppointmentCreated` — randevu oluşunca müşteriye **onay SMS'i**
- `sendReminders` — her 15 dk çalışır, randevuya **2 saat kala hatırlatma SMS'i** (bir kez)

---

## Aktive etmek için (paket alındığında)

### 1. Firebase Blaze planına geç
Cloud Functions ücretsiz planda dış servise (Netgsm'e) istek atamaz.
Firebase Console → sol altta **Upgrade** → **Blaze (kullandıkça öde)** → kart ekle.
(Küçük kullanımda ücret neredeyse sıfırdır; SMS kontörünü ayrıca Netgsm'e ödersin.)

### 2. Netgsm hesabı
- Netgsm'den hesap aç, **kontör** yükle.
- **Gönderici başlığı** (msgheader) onayı al — birkaç iş günü sürebilir, erken başlat.
- API için: **kullanıcı kodu**, **şifre**, onaylı **başlık**.

### 3. Gizli bilgileri tanımla (koda yazma!)
Proje kökünde terminalde:
```
firebase functions:secrets:set NETGSM_USERCODE
firebase functions:secrets:set NETGSM_PASSWORD
firebase functions:secrets:set NETGSM_HEADER
```
Her komut değeri sorar; Netgsm bilgilerini gir.

### 4. `firebase.json`'a functions bloğunu ekle
Mevcut `firebase.json` içindeki `"firestore"` bloğunun yanına şunu ekle:
```json
"functions": {
  "source": "functions"
},
```

### 5. Bağımlılıkları kur ve deploy et
```
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 6. İşletme adını düzenle (opsiyonel)
`functions/index.js` içinde `BUSINESS_NAME` değerini istediğin gibi ayarla.
SMS metninde Türkçe karakter (ş, ı, ç) maliyeti artırır — ASCII önerilir.

---

## Notlar
- **Mevcut sistemi bozmaz:** functions ayrı deploy edilir. `firebase deploy --only hosting`
  / `--only firestore:rules` komutların aynen çalışmaya devam eder. Blaze'e geçmeden
  **bare `firebase deploy` çalıştırma** (functions'ı deploy etmeye çalışıp hata verir).
- **Hatırlatma işaretleme:** gönderilen hatırlatma randevuya `reminderSent: true` yazar,
  tekrar gönderilmez. (Admin SDK güvenlik kurallarını atlar, kural değişikliği gerekmez.)
- **KVKK (opsiyonel ama önerilir):** randevu formuna "SMS bilgilendirmelerini kabul
  ediyorum" onayı eklenebilir. İstenirse eklenir; şu an sistem değişmesin diye eklenmedi.
- **Sistemi satarsan:** alıcı kendi Netgsm bilgilerini adım 3'teki gibi tanımlar; kod aynı kalır.
- **Zamanlama:** hatırlatma penceresi `REMINDER_HOURS = 2`. Değiştirmek için `index.js`.
