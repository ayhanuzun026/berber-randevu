import { describe, it, expect } from 'vitest';
import {
  timeToMinutes,
  minutesToTime,
  coveredSlotTimes,
  reservationId,
  isSlotAvailable,
} from './slots';

describe('timeToMinutes / minutesToTime', () => {
  it('saat metnini dakikaya çevirir', () => {
    expect(timeToMinutes('10:00')).toBe(600);
    expect(timeToMinutes('10:15')).toBe(615);
    expect(timeToMinutes('00:00')).toBe(0);
  });

  it('dakikayı saat metnine çevirir (sıfır dolgulu)', () => {
    expect(minutesToTime(600)).toBe('10:00');
    expect(minutesToTime(615)).toBe('10:15');
    expect(minutesToTime(9 * 60 + 5)).toBe('09:05');
  });
});

describe('coveredSlotTimes', () => {
  it('45 dakikalık hizmet 3 adet 15dk slot kaplar', () => {
    expect(coveredSlotTimes('10:00', 45)).toEqual(['10:00', '10:15', '10:30']);
  });

  it('15 dakikalık hizmet tek slot kaplar', () => {
    expect(coveredSlotTimes('10:00', 15)).toEqual(['10:00']);
  });

  it('süre slot katı değilse yukarı yuvarlar (20dk -> 2 slot)', () => {
    expect(coveredSlotTimes('10:00', 20)).toEqual(['10:00', '10:15']);
  });

  it('90 dakikalık hizmet 6 slot kaplar', () => {
    expect(coveredSlotTimes('14:00', 90)).toHaveLength(6);
    expect(coveredSlotTimes('14:00', 90).at(-1)).toBe('15:15');
  });
});

describe('reservationId', () => {
  it('deterministik kimlik üretir (çift rezervasyon engeli)', () => {
    expect(reservationId('2026-07-10', 'abc123', '10:00')).toBe('2026-07-10_abc123_1000');
  });

  it('aynı girdi her zaman aynı kimliği verir', () => {
    const a = reservationId('2026-07-10', 'x', '09:15');
    const b = reservationId('2026-07-10', 'x', '09:15');
    expect(a).toBe(b);
  });
});

describe('isSlotAvailable', () => {
  const working = ['10:00', '10:15', '10:30', '10:45', '11:00'];

  it('boş takvimde müsait', () => {
    expect(isSlotAvailable('10:00', 30, [], [], working)).toBe(true);
  });

  it('kapsanan slotlardan biri rezerve ise müsait değil', () => {
    // 30dk -> 10:00 + 10:15. 10:15 dolu.
    expect(isSlotAvailable('10:00', 30, ['10:15'], [], working)).toBe(false);
  });

  it('kapsanan slotlardan biri kapalıysa müsait değil', () => {
    expect(isSlotAvailable('10:00', 30, [], ['10:15'], working)).toBe(false);
  });

  it('hizmet çalışma saati dışına taşarsa müsait değil', () => {
    // 60dk -> 11:00 + 11:15... ama 11:15 çalışma slotlarında yok
    expect(isSlotAvailable('11:00', 30, [], [], working)).toBe(false);
  });

  it('bitişik dolu slot bir sonraki başlangıcı engellemez', () => {
    // 10:00 30dk dolu (10:00,10:15). 10:30 boş -> 15dk hizmet müsait.
    expect(isSlotAvailable('10:30', 15, ['10:00', '10:15'], [], working)).toBe(true);
  });
});
