import { describe, it, expect } from 'vitest';
import { SERVICES_LIST, getServicePrice, getServiceDuration } from './constants';

// firestore.rules içindeki priceOf() haritasının birebir kopyası.
// Bu test, constants.js ile güvenlik kurallarının fiyat açısından
// senkron kalmasını garanti eder — biri değişip diğeri değişmezse test kırılır.
const RULES_PRICE_MAP = {
  'sac-kesimi': 450,
  'sac-kesimi-yikama': 550,
  'sac-kesimi-agda': 600,
  'sac-sakal': 700,
  'sac-sakal-yikama': 800,
  'cocuk-tirasi': 450,
  'sakal-tirasi': 250,
  'sakal-tirasi-agda': 400,
  fon: 200,
  'kas-tasarimi': 150,
  'sac-yikama': 100,
  'ense-tirasi': 100,
  agda: 150,
  'vip-paket': 2500,
  'cilt-bakimi-buharli': 1250,
  'cilt-bakimi': 1000,
  'sac-kesimi-ustura': 600,
};

describe('getServicePrice / getServiceDuration', () => {
  it('bilinen hizmetin fiyatını döndürür', () => {
    expect(getServicePrice('sac-kesimi')).toBe(450);
    expect(getServiceDuration('sac-kesimi')).toBe(30);
  });

  it('bilinmeyen hizmet için undefined döndürür', () => {
    expect(getServicePrice('yok-boyle-hizmet')).toBeUndefined();
    expect(getServiceDuration('yok-boyle-hizmet')).toBeUndefined();
  });

  it('damat tıraşı fiyatı null (fiyat sorulacak)', () => {
    expect(getServicePrice('damat-tirasi')).toBeNull();
  });
});

describe('constants ↔ firestore.rules fiyat senkronizasyonu', () => {
  it('kurallardaki her fiyat constants ile aynı olmalı', () => {
    for (const [id, price] of Object.entries(RULES_PRICE_MAP)) {
      expect(getServicePrice(id), `Fiyat uyuşmazlığı: ${id}`).toBe(price);
    }
  });

  it('null fiyatlı hizmetler dışında tüm hizmetler kural haritasında olmalı', () => {
    const missing = SERVICES_LIST.filter(
      (svc) => svc.price !== null && !(svc.id in RULES_PRICE_MAP)
    ).map((svc) => svc.id);
    expect(missing, `Kural haritasında eksik hizmetler: ${missing.join(', ')}`).toEqual([]);
  });
});
