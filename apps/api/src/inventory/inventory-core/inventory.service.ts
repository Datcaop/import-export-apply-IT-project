import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import type { Tx } from '../../prisma/prisma-tx.js';
import { DomainError } from '../../common/domain-error.js';
import { D, weightedAverage, type TxnType, type RefType } from '@erp/shared';

export interface BalancePair {
  productId: bigint;
  warehouseId: bigint;
}

export interface InboundItem {
  productId: bigint;
  warehouseId: bigint;
  qty: string;
  unitCostBase: string; // VND
  refType: RefType;
  refId: bigint;
  refLineId: bigint;
  txnType: TxnType;
  createdBy?: bigint | null;
  note?: string;
}

export interface OutboundItem {
  productId: bigint;
  warehouseId: bigint;
  qty: string;
  refType: RefType;
  refId: bigint;
  refLineId: bigint;
  txnType: TxnType;
  createdBy?: bigint | null;
  note?: string;
}

@Injectable()
export class InventoryService {
  /**
   * Khóa dòng tồn kho để đảm bảo không ai khác được sửa trong lúc tính toán.
   * Tạo sẵn dòng nếu chưa có. Luôn khóa theo đúng thứ tự id để tránh deadlock.
   */
  async lockBalances(tx: Tx, pairs: BalancePair[]) {
    if (pairs.length === 0) return [];
    
    // 1. Loại bỏ trùng lặp và sắp xếp
    const uniqueMap = new Map<string, BalancePair>();
    for (const p of pairs) {
      uniqueMap.set(`${p.productId}-${p.warehouseId}`, p);
    }
    const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
      if (a.productId !== b.productId) return a.productId < b.productId ? -1 : 1;
      return a.warehouseId < b.warehouseId ? -1 : 1;
    });

    // 2. Tạo sẵn nếu thiếu
    if (sorted.length > 0) {
      const data = sorted.map((p) => ({
        productId: p.productId,
        warehouseId: p.warehouseId,
        qtyOnHand: 0,
        avgCost: 0,
      }));
      await tx.inventoryBalance.createMany({
        data,
        skipDuplicates: true,
      });
    }

    // 3. Khóa dòng bằng raw SQL
    const conditions = sorted.map((_, i) => `(product_id = $${i * 2 + 1} AND warehouse_id = $${i * 2 + 2})`);
    const values = sorted.flatMap((p) => [p.productId, p.warehouseId]);
    
    const query = `
      SELECT * FROM inventory_balance
      WHERE ${conditions.join(' OR ')}
      ORDER BY product_id, warehouse_id
      FOR UPDATE
    `;
    
    // Dùng queryRawUnsafe vì số lượng tham số động
    await tx.$executeRawUnsafe(query, ...values);

    // 4. Lấy dữ liệu qua Prisma (đã bị khóa bởi lệnh trên trong cùng transaction)
    return tx.inventoryBalance.findMany({
      where: {
        OR: sorted.map((p) => ({ productId: p.productId, warehouseId: p.warehouseId })),
      },
      orderBy: [{ productId: 'asc' }, { warehouseId: 'asc' }],
    });
  }

  /**
   * Cộng tồn kho, cập nhật giá vốn bình quân gia quyền.
   * Phải gọi `lockBalances` trước khi gọi hàm này.
   */
  async applyInbound(tx: Tx, items: InboundItem[]) {
    for (const item of items) {
      const balance = await tx.inventoryBalance.findUnique({
        where: { productId_warehouseId: { productId: item.productId, warehouseId: item.warehouseId } },
      });
      if (!balance) {
        throw new DomainError('INTERNAL', 'Lỗi hệ thống: Dòng tồn kho chưa được tạo/khóa.');
      }

      const newQty = D(balance.qtyOnHand).add(item.qty);
      const newAvgCost = weightedAverage(balance.qtyOnHand, balance.avgCost, item.qty, item.unitCostBase);

      await tx.inventoryBalance.update({
        where: { productId_warehouseId: { productId: item.productId, warehouseId: item.warehouseId } },
        data: {
          qtyOnHand: newQty.toString(),
          avgCost: newAvgCost.toString(),
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          productId: item.productId,
          warehouseId: item.warehouseId,
          txnType: item.txnType,
          qtyChange: item.qty, // Dương
          qtyAfter: newQty.toString(),
          unitCostBase: item.unitCostBase,
          refType: item.refType,
          refId: item.refId,
          refLineId: item.refLineId,
          createdBy: item.createdBy,
          note: item.note,
        },
      });
    }
  }

  /**
   * Trừ tồn kho, giữ nguyên giá vốn, trả về giá vốn đã dùng.
   * Phải gọi `lockBalances` trước khi gọi hàm này.
   */
  async applyOutbound(tx: Tx, items: OutboundItem[]): Promise<{ costs: Record<string, string> }> {
    const costs: Record<string, string> = {};
    for (const item of items) {
      const balance = await tx.inventoryBalance.findUnique({
        where: { productId_warehouseId: { productId: item.productId, warehouseId: item.warehouseId } },
      });
      if (!balance) {
        throw new DomainError('INTERNAL', 'Lỗi hệ thống: Dòng tồn kho chưa được tạo/khóa.');
      }

      const currentQty = D(balance.qtyOnHand);
      const newQty = currentQty.sub(item.qty);

      await tx.inventoryBalance.update({
        where: { productId_warehouseId: { productId: item.productId, warehouseId: item.warehouseId } },
        data: {
          qtyOnHand: newQty.toString(),
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          productId: item.productId,
          warehouseId: item.warehouseId,
          txnType: item.txnType,
          qtyChange: D(item.qty).neg().toString(), // Âm
          qtyAfter: newQty.toString(),
          unitCostBase: balance.avgCost, // Lấy giá vốn bình quân hiện tại
          refType: item.refType,
          refId: item.refId,
          refLineId: item.refLineId,
          createdBy: item.createdBy,
          note: item.note,
        },
      });
      
      costs[item.refLineId.toString()] = balance.avgCost.toString();
    }
    return { costs };
  }
}
