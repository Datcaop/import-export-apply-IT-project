import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatQty,
  formatRate,
  formatSigned,
  initials,
  parseVnDate,
  parseVnNumber,
  vnToday,
} from './format.js';
import { customerCreateSchema } from './schemas/master.js';

describe('format', () => {
  it('formats numbers the Vietnamese way', () => {
    expect(formatMoney('113850000')).toBe('113.850.000');
    expect(formatMoney('4500', 2)).toBe('4.500,00');
    expect(formatMoney('18.5', 2)).toBe('18,50');
    expect(formatQty('40.0000')).toBe('40');
    expect(formatQty('2.5000')).toBe('2,5');
    expect(formatRate('25400.000000')).toBe('25.400');
    expect(formatSigned('-2')).toBe('−2');
    expect(formatSigned('40')).toBe('+40');
    expect(formatSigned('0')).toBe('0');
    expect(formatMoney('-938300')).toBe('−938.300');
  });

  it('formats dates without timezone drift', () => {
    expect(formatDate('2026-09-19')).toBe('19/09/2026');
    // 03:42 UTC = 10:42 giờ Việt Nam
    expect(formatDateTime('2026-09-19T03:42:00Z')).toBe('19/09/2026 10:42');
    // 18:30 UTC ngày 18 = 01:30 ngày 19 giờ Việt Nam
    expect(formatDateTime('2026-09-18T18:30:00Z')).toBe('19/09/2026 01:30');
    expect(vnToday(new Date('2026-09-18T18:30:00Z'))).toBe('2026-09-19');
  });

  it('parses user input typed Vietnamese style', () => {
    expect(parseVnNumber('25.400')).toBe('25400');
    expect(parseVnNumber('18,50')).toBe('18.50');
    expect(parseVnNumber('1.234,5')).toBe('1234.5');
    expect(parseVnNumber('−2')).toBe('-2');
    expect(parseVnNumber(' 40 ')).toBe('40');
    expect(parseVnNumber('abc')).toBeNull();
    expect(parseVnNumber('')).toBeNull();
    expect(parseVnNumber('1,2,3')).toBeNull();
    expect(parseVnDate('19/09/2026')).toBe('2026-09-19');
    expect(parseVnDate('31/02/2026')).toBeNull();
  });

  it('makes initials', () => {
    expect(initials('Nguyễn Thu Hà')).toBe('TH');
    expect(initials('Long')).toBe('L');
  });

  it('explains a wrong tax code precisely', () => {
    const r = customerCreateSchema.safeParse({ code: 'KH-A', name: 'A', taxCode: '010234567' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain('đang có 9');
  });
});
