import { lineAmount, orderTotals, rollupPoStatus, rollupSoStatus, toBase, unitCostBase, weightedAverage } from './calc.js';

describe('calc', () => {
  it('computes line amount like NUMERIC(19,4)', () => {
    expect(lineAmount('100', '18.50').toFixed(4)).toBe('1850.0000');
    expect(lineAmount('3', '0.33335').toFixed(4)).toBe('1.0001');
  });

  it('converts to VND rounding half up to whole dong', () => {
    expect(unitCostBase('18.50', '25400').toFixed(0)).toBe('469900');
    expect(toBase('0.5', '1').toFixed(0)).toBe('1');
    expect(toBase('14.00', '25350').toFixed(0)).toBe('354900');
  });

  it('totals equal the sum of rounded lines (PO-2026-0142)', () => {
    const { totalAmount, totalAmountBase } = orderTotals(
      [
        { qty: '100', unitPrice: '18.50' },
        { qty: '200', unitPrice: '9.75' },
        { qty: '50', unitPrice: '14.00' },
      ],
      '25300',
    );
    expect(totalAmount.toFixed(2)).toBe('4500.00');
    expect(totalAmountBase.toFixed(0)).toBe('113850000');
  });

  it('weighted average cost', () => {
    // từ 0: lấy luôn giá nhập
    expect(weightedAverage('0', '0', '60', '468975').toFixed(4)).toBe('468975.0000');
    // (40 × 460.000 + 60 × 468.975) / 100 = 465.385
    expect(weightedAverage('40', '460000', '60', '468975').toFixed(4)).toBe('465385.0000');
    // làm tròn 4 chữ số lẻ
    expect(weightedAverage('3', '10', '1', '11').toFixed(4)).toBe('10.2500');
    expect(weightedAverage('1', '1', '2', '2').toFixed(4)).toBe('1.6667');
  });

  it('rolls up PO and SO status', () => {
    expect(rollupPoStatus([{ ordered: '10', done: '0' }])).toBe('APPROVED');
    expect(rollupPoStatus([{ ordered: '10', done: '4' }, { ordered: '5', done: '0' }])).toBe('PARTIALLY_RECEIVED');
    expect(rollupPoStatus([{ ordered: '10', done: '10' }, { ordered: '5', done: '5' }])).toBe('RECEIVED');
    expect(rollupSoStatus([{ ordered: '30', done: '20' }])).toBe('PARTIALLY_ISSUED');
    expect(rollupSoStatus([{ ordered: '30', done: '30' }])).toBe('ISSUED');
  });
});
