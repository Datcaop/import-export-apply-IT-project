// Dữ liệu danh mục mẫu, lấy theo prototype (erp-prototype-html/).

export const USERS = [
  { username: 'thuha', fullName: 'Nguyễn Thu Hà', title: 'Thủ kho Hà Nội' },
  { username: 'quan', fullName: 'Trần Minh Quân', title: 'Nhân viên mua hàng' },
  { username: 'nam', fullName: 'Lê Hoàng Nam', title: 'Nhân viên bán hàng' },
  { username: 'long', fullName: 'Phạm Đức Long', title: 'Nhân viên kho' },
  { username: 'ketoan', fullName: 'Đỗ Thị Mai', title: 'Kế toán' },
];

export const CURRENCIES = [
  { code: 'VND', name: 'Đồng Việt Nam', decimals: 0, isBase: true },
  { code: 'USD', name: 'Đô la Mỹ', decimals: 2, isBase: false },
  { code: 'EUR', name: 'Euro', decimals: 2, isBase: false },
  { code: 'CNY', name: 'Nhân dân tệ', decimals: 2, isBase: false },
];

/** [ngày, tỷ giá] theo Vietcombank */
export const RATES: Record<string, [string, string][]> = {
  USD: [
    ['2026-08-05', '25200'],
    ['2026-08-28', '25250'],
    ['2026-09-02', '25300'],
    ['2026-09-10', '25350'],
    ['2026-09-17', '25365'],
    ['2026-09-18', '25380'],
    ['2026-09-19', '25400'],
  ],
  EUR: [
    ['2026-09-02', '29650'],
    ['2026-09-10', '29720'],
    ['2026-09-19', '29810'],
  ],
  CNY: [
    ['2026-08-20', '3540'],
    ['2026-09-02', '3555'],
    ['2026-09-19', '3568'],
  ],
};

export const PRODUCTS = [
  { sku: 'BP-K120', name: 'Bàn phím cơ K120', uom: 'PCS', isActive: true },
  { sku: 'CH-M50', name: 'Chuột không dây M50', uom: 'PCS', isActive: true },
  { sku: 'TN-H3', name: 'Tai nghe H3', uom: 'PCS', isActive: true },
  { sku: 'MN-24F', name: 'Màn hình 24 inch F24', uom: 'PCS', isActive: true },
  { sku: 'CAP-C1', name: 'Cáp USB-C 1m', uom: 'PCS', isActive: true },
  { sku: 'DE-L2', name: 'Đế tản nhiệt laptop L2', uom: 'PCS', isActive: true },
  { sku: 'HUB-U4', name: 'Bộ chia USB 4 cổng', uom: 'PCS', isActive: true },
  { sku: 'BL-P01', name: 'Balo laptop P01', uom: 'PCS', isActive: false },
];

export const WAREHOUSES = [
  { code: 'HN', name: 'Kho Hà Nội', address: 'Lô A2, KCN Quang Minh, Mê Linh, Hà Nội', isActive: true },
  { code: 'HCM', name: 'Kho TP.HCM', address: 'Số 12 đường số 7, KCN Tân Tạo, Bình Tân, TP.HCM', isActive: true },
  { code: 'DN', name: 'Kho Đà Nẵng', address: 'Lô 5, KCN Hòa Khánh, Liên Chiểu, Đà Nẵng', isActive: true },
  { code: 'HN-BH', name: 'Kho bảo hành Hà Nội', address: 'Số 18 Phạm Hùng, Cầu Giấy, Hà Nội', isActive: true },
  { code: 'HP', name: 'Kho Hải Phòng', address: 'KCN Đình Vũ, Hải An, Hải Phòng', isActive: false },
  { code: 'CT', name: 'Kho Cần Thơ', address: 'KCN Trà Nóc, Bình Thủy, Cần Thơ', isActive: false },
];

export const SUPPLIERS = [
  { code: 'NCC-KEYTECH', name: 'Shenzhen Keytech Co., Ltd', taxCode: null, countryCode: 'CN', defaultCurrency: 'USD', isActive: true },
  { code: 'NCC-TAIPEI', name: 'Taipei Display Inc.', taxCode: null, countryCode: 'TW', defaultCurrency: 'USD', isActive: true },
  { code: 'NCC-GZCABLE', name: 'Guangzhou Cable Ltd', taxCode: null, countryCode: 'CN', defaultCurrency: 'CNY', isActive: true },
  { code: 'NCC-PKV', name: 'Công ty CP Phụ kiện Việt', taxCode: '0109876543', countryCode: 'VN', defaultCurrency: 'VND', isActive: true },
  { code: 'NCC-HAIAU', name: 'Công ty TNHH Điện tử Hải Âu', taxCode: '0312345678', countryCode: 'VN', defaultCurrency: 'VND', isActive: true },
  { code: 'NCC-MUELLER', name: 'Müller Elektronik GmbH', taxCode: null, countryCode: 'DE', defaultCurrency: 'EUR', isActive: true },
  { code: 'NCC-OSAKA', name: 'Osaka Parts K.K.', taxCode: null, countryCode: 'JP', defaultCurrency: null, isActive: false },
];

export const CUSTOMERS = [
  { code: 'KH-MINHPHAT', name: 'Công ty TNHH Minh Phát', taxCode: '0102345678', address: 'Số 18 Phạm Hùng, Cầu Giấy, Hà Nội', countryCode: 'VN', defaultCurrency: 'VND', isActive: true },
  { code: 'KH-HAINAM', name: 'Cửa hàng Tin học Hải Nam', taxCode: '8012345678', address: '45 Lê Lợi, Hải Châu, Đà Nẵng', countryCode: 'VN', defaultCurrency: 'VND', isActive: true },
  { code: 'KH-ANKHANG', name: 'Công ty CP Giải pháp An Khang', taxCode: '0107654321', address: '12 Duy Tân, Cầu Giấy, Hà Nội', countryCode: 'VN', defaultCurrency: 'VND', isActive: true },
  { code: 'KH-SAOVIET', name: 'Công ty TNHH Thương mại Sao Việt', taxCode: '0313456789', address: '88 Cộng Hòa, Tân Bình, TP.HCM', countryCode: 'VN', defaultCurrency: 'VND', isActive: true },
  { code: 'KH-PHUCLONG', name: 'Công ty CP Công nghệ Phúc Long', taxCode: '0314567890', address: '210 Nguyễn Thị Minh Khai, Quận 3, TP.HCM', countryCode: 'VN', defaultCurrency: 'VND', isActive: true },
  { code: 'KH-TECHPARTNER', name: 'Tech Partner Pte. Ltd', taxCode: null, address: '1 Raffles Place, Singapore', countryCode: 'SG', defaultCurrency: 'USD', isActive: true },
  { code: 'KH-LE', name: 'Khách lẻ', taxCode: null, address: null, countryCode: 'VN', defaultCurrency: 'VND', isActive: true },
  { code: 'KH-BACHKHOA', name: 'Cửa hàng Máy tính Bách Khoa', taxCode: '0105556667', address: '1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội', countryCode: 'VN', defaultCurrency: 'VND', isActive: false },
];
