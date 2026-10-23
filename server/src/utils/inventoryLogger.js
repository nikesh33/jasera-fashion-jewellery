import { getPool } from '../config/db.js';

/**
 * Record inventory movement into inventory_transactions ledger table
 * @param {Object} params
 * @param {number} params.variantId - Product variant ID
 * @param {number} params.quantityChange - Delta (+ve for restock/return, -ve for sales/damages)
 * @param {'receipt'|'sale'|'damage'|'loss'|'transfer'|'adjustment'|'return'} params.reason
 * @param {number} [params.referenceId] - Associated order ID or PO ID
 * @param {string} [params.note] - Descriptive note
 * @param {number} [params.actorId] - User or Admin ID who caused the change
 * @param {any} [params.conn] - Optional active transaction connection
 */
export async function recordInventoryTransaction({
  variantId,
  quantityChange,
  reason,
  referenceId = null,
  note = null,
  actorId = null,
  conn = null,
}) {
  if (!variantId || quantityChange === undefined || !reason) return;

  const sql = `
    INSERT INTO inventory_transactions (
      variant_id, quantity_change, reason, reference_id,
      note, actor_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;

  const params = [
    variantId,
    quantityChange,
    reason,
    referenceId,
    note || null,
    actorId || null,
  ];

  try {
    const executor = conn || getPool();
    await executor.query(sql, params);
  } catch (err) {
    console.warn('Non-critical: Failed to record inventory transaction:', err.message);
  }
}
