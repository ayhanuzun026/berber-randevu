import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { FiPhone, FiShield, FiCheck, FiArrowRight, FiUser } from 'react-icons/fi';
import './LoginPage.css';

const PHONE_REGEX = /^(\+90|0)?[5][0-9]{9}$/;

function formatPhoneForFirebase(phone) {
  const digits = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  if (digits.startsWith('+90')) return digits;
  if (digits.startsWith('0')) return '+90' + digits.slice(1);
  return '+90' + digits;
}

export default function LoginPage() {
  const [step, setStep] = useState(0); // 0: telefon, 1: recaptcha, 2: kod, 3: isim
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);

  const recaptchaRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  // Zaten giriş yapılmışsa yönlendir (isim adımı hariç)
  useEffect(() => {
    if (user && step !== 3) {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate, step]);

  // reCAPTCHA başlat
  useEffect(() => {
    if (step === 1 && auth && !recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: 'normal',
        callback: () => {
          // reCAPTCHA çözüldü — SMS gönder butonu aktif
        },
        'expired-callback': () => {
          setError('Doğrulama süresi doldu. Lütfen tekrar deneyin.');
          recaptchaVerifierRef.current = null;
        },
      });
      recaptchaVerifierRef.current.render();
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // cleanup hatalarını yoksay
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, [step]);

  const handlePreVerify = (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\s+/g, '');
    if (!PHONE_REGEX.test(cleanPhone)) {
      setError('Geçerli bir telefon numarası girin. (05XX XXX XX XX)');
      return;
    }

    setStep(1);
  };

  const handleSendCode = async () => {
    setError('');
    setLoading(true);

    try {
      const formattedPhone = formatPhoneForFirebase(phone);
      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifierRef.current
      );
      setConfirmResult(result);
      setStep(2);
    } catch (err) {
      console.error('SMS Error:', err.code, err.message, err);
      if (err.code === 'auth/invalid-phone-number') {
        setError('Geçersiz telefon numarası.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.');
      } else {
        setError(`SMS gönderilemedi: ${err.code || err.message}`);
      }
      // reCAPTCHA sıfırla
      recaptchaVerifierRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Lütfen 6 haneli doğrulama kodunu girin.');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmResult.confirm(code);
      if (!result.user.displayName) {
        setStep(3);
      }
      // displayName varsa Auth state listener yönlendirecek
    } catch (err) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Geçersiz doğrulama kodu. Lütfen tekrar deneyin.');
      } else {
        setError('Doğrulama başarısız. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || fullName.trim().split(/\s+/).length < 2) {
      setError('Lütfen ad ve soyadınızı girin.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: fullName.trim() });
      navigate(from, { replace: true });
    } catch {
      setError('İsim kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (user && step !== 3) return null;

  return (
    <section className="login section">
      <div className="container">
        <div className="login__card">
          {/* Adım göstergesi */}
          <div className="login__steps">
            <div className={`login__step ${step >= 0 ? 'login__step--active' : ''}`}>
              <span className="login__step-num">{step > 0 ? <FiCheck size={12} /> : '1'}</span>
              <span className="login__step-text">Telefon</span>
            </div>
            <div className="login__step-line" />
            <div className={`login__step ${step >= 1 ? 'login__step--active' : ''}`}>
              <span className="login__step-num">{step > 1 ? <FiCheck size={12} /> : '2'}</span>
              <span className="login__step-text">Doğrulama</span>
            </div>
            <div className="login__step-line" />
            <div className={`login__step ${step >= 2 ? 'login__step--active' : ''}`}>
              <span className="login__step-num">3</span>
              <span className="login__step-text">SMS Kodu</span>
            </div>
          </div>

          {/* Step 0: Ön doğrulama — ad ve telefon */}
          {step === 0 && (
            <>
              <div className="login__header">
                <div className="login__icon-wrapper">
                  <FiPhone size={28} />
                </div>
                <h1 className="login__title">Giriş Yap</h1>
                <p className="login__subtitle">
                  Randevu almak için bilgilerinizi girin
                </p>
              </div>

              {error && <div className="login__error">{error}</div>}

              <form onSubmit={handlePreVerify} className="login__form">
                <div className="form-group">
                  <label className="form-label" htmlFor="login-phone">Telefon Numarası</label>
                  <input
                    id="login-phone"
                    className="form-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
                <button className="btn btn-primary login__submit" type="submit">
                  Devam Et <FiArrowRight />
                </button>
              </form>
            </>
          )}

          {/* Step 1: reCAPTCHA doğrulama */}
          {step === 1 && (
            <>
              <div className="login__header">
                <div className="login__icon-wrapper login__icon-wrapper--shield">
                  <FiShield size={28} />
                </div>
                <h1 className="login__title">Robot Doğrulaması</h1>
                <p className="login__subtitle">
                  Güvenliğiniz için lütfen aşağıdaki doğrulamayı tamamlayın
                </p>
              </div>

              {error && <div className="login__error">{error}</div>}

              <div className="login__recaptcha">
                <div ref={recaptchaRef} />
              </div>

              <div className="login__phone-preview">
                <FiPhone size={16} />
                <span>{phone}</span>
              </div>

              <button
                className="btn btn-primary login__submit"
                onClick={handleSendCode}
                disabled={loading}
              >
                {loading ? 'SMS Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                {!loading && <FiArrowRight />}
              </button>

              <button
                className="login__back-btn"
                onClick={() => { setStep(0); setError(''); }}
              >
                Geri Dön
              </button>
            </>
          )}

          {/* Step 2: SMS kodu girişi */}
          {step === 2 && (
            <>
              <div className="login__header">
                <div className="login__icon-wrapper login__icon-wrapper--success">
                  <FiShield size={28} />
                </div>
                <h1 className="login__title">Doğrulama Kodu</h1>
                <p className="login__subtitle">
                  <strong>{phone}</strong> numarasına gönderilen 6 haneli kodu girin
                </p>
              </div>

              {error && <div className="login__error">{error}</div>}

              <form onSubmit={handleVerifyCode} className="login__form">
                <div className="form-group">
                  <input
                    className="form-input login__code-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>
                <button
                  className="btn btn-primary login__submit"
                  type="submit"
                  disabled={loading || code.length !== 6}
                >
                  {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
                  {!loading && <FiCheck />}
                </button>
              </form>

              <button
                className="login__back-btn"
                onClick={() => { setStep(0); setError(''); setCode(''); }}
              >
                Baştan Başla
              </button>
            </>
          )}

          {/* Step 3: İsim Soyisim */}
          {step === 3 && (
            <>
              <div className="login__header">
                <div className="login__icon-wrapper login__icon-wrapper--success">
                  <FiUser size={28} />
                </div>
                <h1 className="login__title">Hoş Geldiniz!</h1>
                <p className="login__subtitle">
                  Randevularınızda sizi tanıyabilmemiz için adınızı ve soyadınızı girin
                </p>
              </div>

              {error && <div className="login__error">{error}</div>}

              <form onSubmit={handleSaveName} className="login__form">
                <div className="form-group">
                  <label className="form-label" htmlFor="login-name">Ad Soyad</label>
                  <input
                    id="login-name"
                    className="form-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz"
                    autoFocus
                  />
                </div>
                <button
                  className="btn btn-primary login__submit"
                  type="submit"
                  disabled={loading || !fullName.trim()}
                >
                  {loading ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
                  {!loading && <FiArrowRight />}
                </button>
              </form>
            </>
          )}

          <p className="login__note">
            Giriş yaparak hizmet şartlarımızı kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </section>
  );
}
