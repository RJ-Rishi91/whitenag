import { StockMovement } from '../models/StockMovement.js';
import { StockLevel } from '../models/StockLevel.js';

export async function recordStockMovement({
  itemId,
  godownId,
  qty,
  type,
  refType = null,
  refId = null,
  batchNo = '',
  rate = 0,
  date = new Date(),
  remarks = '',
  createdBy = null,
  session = null
}) {
  const movement = new StockMovement({
    itemId,
    godownId,
    qty,
    type,
    refType,
    refId,
    batchNo,
    rate,
    date,
    remarks,
    createdBy
  });

  if (session) {
    await movement.save({ session });
  } else {
    await movement.save();
  }

  // Update denormalized StockLevel
  let level = await StockLevel.findOne({ itemId, godownId }).session(session);
  if (!level) {
    level = new StockLevel({ itemId, godownId, physical: 0, reserved: 0, available: 0 });
  }

  switch (type) {
    case 'purchase':
    case 'production_in':
    case 'transfer_in':
      level.physical += Math.abs(qty);
      break;

    case 'consumption':
    case 'transfer_out':
    case 'wastage':
      level.physical -= Math.abs(qty);
      break;

    case 'reserve':
      // qty reserved for order
      level.reserved += Math.abs(qty);
      break;

    case 'release':
      // qty released from cancelled or modified order
      level.reserved = Math.max(0, level.reserved - Math.abs(qty));
      break;

    case 'ship':
      // Order actually leaves godown: decreases both physical and reserved
      level.physical -= Math.abs(qty);
      level.reserved = Math.max(0, level.reserved - Math.abs(qty));
      break;

    case 'adjustment':
      // Adjustment can be positive or negative
      level.physical += qty;
      break;

    case 'pack':
      // Packing is a status milestone; inventory remains reserved until Shipped
      break;

    default:
      break;
  }

  level.available = level.physical - level.reserved;

  if (session) {
    await level.save({ session });
  } else {
    await level.save();
  }

  return { movement, level };
}

export async function reserveOrderStock(order, session = null) {
  for (const item of order.items) {
    await recordStockMovement({
      itemId: item.itemId,
      godownId: order.godownId,
      qty: item.qty,
      type: 'reserve',
      refType: 'Order',
      refId: order._id,
      remarks: `Reserved for Order ${order.orderNo}`,
      session
    });
  }
}

export async function releaseOrderStock(order, session = null) {
  for (const item of order.items) {
    await recordStockMovement({
      itemId: item.itemId,
      godownId: order.godownId,
      qty: item.qty,
      type: 'release',
      refType: 'Order',
      refId: order._id,
      remarks: `Released from Order ${order.orderNo}`,
      session
    });
  }
}

export async function shipOrderStock(order, session = null) {
  for (const item of order.items) {
    await recordStockMovement({
      itemId: item.itemId,
      godownId: order.godownId,
      qty: item.qty,
      type: 'ship',
      refType: 'Order',
      refId: order._id,
      remarks: `Shipped for Order ${order.orderNo}`,
      session
    });
  }
}

export async function transferGodownStock({
  fromGodownId,
  toGodownId,
  lines,
  refId = null,
  remarks = '',
  createdBy = null,
  session = null
}) {
  for (const line of lines) {
    // 1. Out from source godown
    await recordStockMovement({
      itemId: line.itemId,
      godownId: fromGodownId,
      qty: -Math.abs(line.qty),
      type: 'transfer_out',
      refType: 'StockTransfer',
      refId,
      remarks: `Transfer to ${toGodownId}: ${remarks}`,
      createdBy,
      session
    });

    // 2. In to destination godown
    await recordStockMovement({
      itemId: line.itemId,
      godownId: toGodownId,
      qty: Math.abs(line.qty),
      type: 'transfer_in',
      refType: 'StockTransfer',
      refId,
      remarks: `Transfer from ${fromGodownId}: ${remarks}`,
      createdBy,
      session
    });
  }
}

export async function checkStockAvailability(items, godownId) {
  const itemIds = items.map(i => i.itemId);
  const levels = await StockLevel.find({
    godownId,
    itemId: { $in: itemIds }
  });

  const levelMap = new Map();
  levels.forEach(l => levelMap.set(l.itemId.toString(), l.available));

  const warnings = [];
  for (const item of items) {
    const available = levelMap.get(item.itemId.toString()) || 0;
    if (available < item.qty) {
      warnings.push({
        itemId: item.itemId,
        sku: item.sku,
        name: item.name,
        requested: item.qty,
        available,
        shortfall: item.qty - available
      });
    }
  }

  return {
    isAvailable: warnings.length === 0,
    warnings
  };
}
