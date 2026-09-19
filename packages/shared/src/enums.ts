// Tập giá trị hợp lệ cho các cột VARCHAR + CHECK (xem migration db_rules).

export const PO_STATUS = ['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED'] as const;
export type PoStatus = (typeof PO_STATUS)[number];

export const SO_STATUS = ['DRAFT', 'CONFIRMED', 'PARTIALLY_ISSUED', 'ISSUED', 'CLOSED', 'CANCELLED'] as const;
export type SoStatus = (typeof SO_STATUS)[number];

/** Trạng thái chứng từ kho: phiếu nhập, phiếu xuất, phiếu điều chỉnh */
export const DOC_STATUS = ['DRAFT', 'POSTED', 'CANCELLED'] as const;
export type DocStatus = (typeof DOC_STATUS)[number];

export const RECEIPT_TYPE = ['PURCHASE', 'NON_PO', 'OPENING', 'CUSTOMER_RETURN'] as const;
export type ReceiptType = (typeof RECEIPT_TYPE)[number];

export const ADJ_REASON = ['STOCKTAKE', 'DAMAGED', 'LOST', 'OTHER'] as const;
export type AdjReason = (typeof ADJ_REASON)[number];

export const TXN_TYPE = ['RECEIPT', 'ISSUE', 'ADJUST_IN', 'ADJUST_OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'REVERSAL'] as const;
export type TxnType = (typeof TXN_TYPE)[number];

export const REF_TYPE = ['GR', 'GI', 'ADJ', 'TRF'] as const;
export type RefType = (typeof REF_TYPE)[number];

export const DOC_TYPE = ['PO', 'GR', 'SO', 'GI', 'ADJ'] as const;
export type DocType = (typeof DOC_TYPE)[number];

export const UOM = ['PCS', 'BOX', 'SET', 'KG', 'M'] as const;
export type Uom = (typeof UOM)[number];
