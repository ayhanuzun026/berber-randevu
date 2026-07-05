import { logger } from 'firebase-functions';

// Netgsm HTTP API üzerinden SMS gönderir.
// Kimlik bilgileri Firebase secret'larından gelir (koda/git'e asla yazılmaz):
//   NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_HEADER (onaylı gönderici başlığı)
//
// Bilgiler tanımlı değilse fonksiyon SESSİZCE atlar (sistem bozulmaz) —
// böylece paket alınana kadar her şey güvenle uyur.

const NETGSM_ENDPOINT = 'https://api.netgsm.com.tr/sms/send/get';

// +905xx / 905xx / 05xx -> 5xxxxxxxxx (Netgsm formatı)
export function normalizePhone(raw) {
  if (!raw) return '';
  let d = String(raw).replace(/[^0-9]/g, '');
  if (d.startsWith('90')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return d; // 5xxxxxxxxx
}

export async function sendSms(phone, message, creds) {
  const { usercode, password, header } = creds;

  // Kimlik bilgisi yoksa sessizce atla — sistem çalışmaya devam eder
  if (!usercode || !password || !header) {
    logger.warn('SMS atlandı: Netgsm bilgileri tanımlı değil (dormant mod).');
    return { skipped: true };
  }

  const gsmno = normalizePhone(phone);
  if (!gsmno || gsmno.length < 10) {
    logger.warn('SMS atlandı: geçersiz telefon numarası.', { phone });
    return { skipped: true, reason: 'invalid-phone' };
  }

  const params = new URLSearchParams({
    usercode,
    password,
    gsmno,
    message,
    msgheader: header,
  });

  try {
    const res = await fetch(`${NETGSM_ENDPOINT}?${params.toString()}`, { method: 'GET' });
    const text = (await res.text()).trim();

    // Netgsm başarı yanıtı "00" veya "01/02 <jobid>" ile başlar; hata kodları 20,30,40,...
    const code = text.split(' ')[0];
    const ok = ['00', '01', '02'].includes(code);

    if (!ok) {
      logger.error('Netgsm SMS hatası', { code, text, gsmno });
      return { ok: false, code, text };
    }

    logger.info('SMS gönderildi', { gsmno, code });
    return { ok: true, code, text };
  } catch (err) {
    logger.error('Netgsm isteği başarısız', { error: String(err) });
    return { ok: false, error: String(err) };
  }
}
