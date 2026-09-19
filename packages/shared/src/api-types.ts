// Kiểu dữ liệu API trả về. Id và số thập phân là chuỗi; ngày là 'yyyy-MM-dd'; thời điểm là ISO.

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserRef {
  id: string;
  fullName: string;
}

export interface MeDto {
  id: string;
  username: string;
  fullName: string;
  title: string | null;
}

export interface LoginResultDto {
  token: string;
  user: MeDto;
}

export interface CurrencyDto {
  code: string;
  name: string;
  decimals: number;
  isBase: boolean;
}

export interface ExchangeRateDto {
  id: string;
  currencyCode: string;
  rateDate: string;
  rate: string;
  source: string | null;
  createdBy: UserRef | null;
  createdAt: string;
}

export interface RateSuggestionDto {
  rate: string;
  rateDate: string;
  source: string | null;
}

export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  uom: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Có chứng từ tham chiếu → không cho sửa SKU */
  inUse: boolean;
  /** Tồn theo kho (chỉ kho có dòng tồn) */
  stock: { warehouseId: string; warehouseCode: string; qtyOnHand: string }[];
}

export interface ProductLookupDto {
  id: string;
  sku: string;
  name: string;
  uom: string;
}

export interface WarehouseDto {
  id: string;
  code: string;
  name: string;
  address: string | null;
  isActive: boolean;
  skuInStock: number;
  inUse: boolean;
}

export interface SupplierDto {
  id: string;
  code: string;
  name: string;
  taxCode: string | null;
  countryCode: string | null;
  defaultCurrency: string | null;
  isActive: boolean;
  openPoCount: number;
  inUse: boolean;
}

export interface CustomerDto {
  id: string;
  code: string;
  name: string;
  taxCode: string | null;
  address: string | null;
  countryCode: string | null;
  defaultCurrency: string | null;
  isActive: boolean;
  openSoCount: number;
  inUse: boolean;
}

export interface RefDto {
  id: string;
  code: string;
  name: string;
}

export interface PoItemDto {
  id: string;
  poId: string;
  lineNo: number;
  productId: string;
  productSku: string;
  productName: string;
  productUom: string;
  qtyOrdered: string;
  qtyReceived: string;
  unitPrice: string;
  lineAmount: string;
}

export interface PurchaseOrderDto {
  id: string;
  poNo: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string | null;
  currencyCode: string;
  exchangeRate: string;
  exchangeRateSource: string | null;
  status: string;
  totalAmount: string;
  totalAmountBase: string;
  terms: string | null;
  note: string | null;
  createdBy: UserRef | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  cancelledBy: UserRef | null;
  cancelReason: string | null;
  closedAt: string | null;
  closedBy: UserRef | null;
  items: PoItemDto[];
}

export interface GrItemDto {
  id: string;
  grId: string;
  lineNo: number;
  poItemId: string | null;
  productId: string;
  productSku: string;
  productName: string;
  productUom: string;
  qty: string;
  unitCost: string;
  unitCostBase: string;
}

export interface GoodsReceiptDto {
  id: string;
  grNo: string;
  receiptType: string;
  poId: string | null;
  poNo: string | null;
  supplierId: string | null;
  supplierCode: string | null;
  supplierName: string | null;
  customerId: string | null;
  customerCode: string | null;
  customerName: string | null;
  soId: string | null;
  soNo: string | null;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  receiptDate: string;
  currencyCode: string;
  exchangeRate: string;
  status: string;
  postedAt: string | null;
  postedBy: UserRef | null;
  note: string | null;
  createdBy: UserRef | null;
  createdAt: string;
  cancelledAt: string | null;
  cancelledBy: UserRef | null;
  cancelReason: string | null;
  items: GrItemDto[];
  candidateLines?: PoItemDto[];
}

export interface SoItemDto {
  id: string;
  soId: string;
  lineNo: number;
  productId: string;
  productSku: string;
  productName: string;
  productUom: string;
  qtyOrdered: string;
  qtyIssued: string;
  unitPrice: string;
  lineAmount: string;
}

export interface SalesOrderDto {
  id: string;
  soNo: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  orderDate: string;
  currencyCode: string;
  exchangeRate: string;
  status: string;
  totalAmount: string;
  totalAmountBase: string;
  salespersonId: string | null;
  salespersonName: string | null;
  shipToAddress: string | null;
  defaultWarehouseId: string | null;
  paymentTerms: string | null;
  note: string | null;
  createdBy: UserRef | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  cancelledBy: UserRef | null;
  cancelReason: string | null;
  closedAt: string | null;
  closedBy: UserRef | null;
  items: SoItemDto[];
}

export interface GiItemDto {
  id: string;
  giId: string;
  lineNo: number;
  soItemId: string | null;
  productId: string;
  productSku: string;
  productName: string;
  productUom: string;
  qty: string;
  unitCostBase: string | null;
}

export interface GoodsIssueDto {
  id: string;
  giNo: string;
  soId: string | null;
  soNo: string | null;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  issueDate: string;
  status: string;
  postedAt: string | null;
  postedBy: UserRef | null;
  note: string | null;
  createdBy: UserRef | null;
  createdAt: string;
  cancelledAt: string | null;
  cancelledBy: UserRef | null;
  cancelReason: string | null;
  items: GiItemDto[];
  candidateLines?: SoItemDto[];
}

