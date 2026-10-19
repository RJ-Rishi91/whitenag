import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { Item } from '../models/Item.js';
import { Godown } from '../models/Godown.js';
import { StockLevel } from '../models/StockLevel.js';
import { StockMovement } from '../models/StockMovement.js';
import {
  recordStockMovement,
  reserveOrderStock,
  releaseOrderStock,
  shipOrderStock,
  transferGodownStock
} from '../services/stockService.js';

test('Stock Engine & Transaction Verification Suite', async (t) => {
  await connectDB();

  const item = await Item.findOne({ category: 'finished' });
  const godowns = await Godown.find().limit(2);
  const fromGodown = godowns[0];
  const toGodown = godowns[1];

  assert.ok(item, 'Finished goods item must exist');
  assert.ok(fromGodown, 'Source godown must exist');
  assert.ok(toGodown, 'Target godown must exist');

  await t.test('1. Direct stock movement updates physical and available', async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await recordStockMovement({
        itemId: item._id,
        godownId: fromGodown._id,
        qty: 50,
        type: 'production_in',
        session
      });

      await session.commitTransaction();
    } finally {
      session.endSession();
    }

    const level = await StockLevel.findOne({ itemId: item._id, godownId: fromGodown._id });
    assert.ok(level.physical >= 50, 'Physical stock should reflect inward production');
    assert.equal(level.available, level.physical - level.reserved, 'Available must strictly equal physical - reserved');
  });

  await t.test('2. Order stock reservation increases reserved without reducing physical', async () => {
    const prevLevel = await StockLevel.findOne({ itemId: item._id, godownId: fromGodown._id });
    const prevPhysical = prevLevel.physical;
    const prevReserved = prevLevel.reserved;

    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNo: 'TEST-ORD-001',
      godownId: fromGodown._id,
      items: [{ itemId: item._id, qty: 10 }]
    };

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await reserveOrderStock(mockOrder, session);
      await session.commitTransaction();
    } finally {
      session.endSession();
    }

    const postLevel = await StockLevel.findOne({ itemId: item._id, godownId: fromGodown._id });
    assert.equal(postLevel.physical, prevPhysical, 'Physical stock must not decrease upon reservation');
    assert.equal(postLevel.reserved, prevReserved + 10, 'Reserved stock must increment by requested order quantity');
    assert.equal(postLevel.available, postLevel.physical - postLevel.reserved, 'Available must decrease accordingly');
  });

  await t.test('3. Order stock release restores reserved and available levels', async () => {
    const prevLevel = await StockLevel.findOne({ itemId: item._id, godownId: fromGodown._id });

    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNo: 'TEST-ORD-001',
      godownId: fromGodown._id,
      items: [{ itemId: item._id, qty: 10 }]
    };

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await releaseOrderStock(mockOrder, session);
      await session.commitTransaction();
    } finally {
      session.endSession();
    }

    const postLevel = await StockLevel.findOne({ itemId: item._id, godownId: fromGodown._id });
    assert.equal(postLevel.reserved, prevLevel.reserved - 10, 'Reserved stock must decrement upon release');
    assert.equal(postLevel.available, postLevel.physical - postLevel.reserved);
  });

  await t.test('4. Order shipped reduces both physical and reserved', async () => {
    // First reserve
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNo: 'TEST-ORD-002',
      godownId: fromGodown._id,
      items: [{ itemId: item._id, qty: 5 }]
    };

    let session = await mongoose.startSession();
    session.startTransaction();
    await reserveOrderStock(mockOrder, session);
    await session.commitTransaction();
    session.endSession();

    const reservedLevel = await StockLevel.findOne({ itemId: item._id, godownId: fromGodown._id });

    // Then ship
    session = await mongoose.startSession();
    session.startTransaction();
    await shipOrderStock(mockOrder, session);
    await session.commitTransaction();
    session.endSession();

    const shippedLevel = await StockLevel.findOne({ itemId: item._id, godownId: fromGodown._id });
    assert.equal(shippedLevel.physical, reservedLevel.physical - 5, 'Physical stock must decrease by shipped quantity');
    assert.equal(shippedLevel.reserved, reservedLevel.reserved - 5, 'Reserved stock must decrease by shipped quantity');
    assert.equal(shippedLevel.available, shippedLevel.physical - shippedLevel.reserved);
  });

  await t.test('5. Godown transfer shifts physical inventory accurately between warehouses', async () => {
    const fromBefore = await StockLevel.findOne({ itemId: item._id, godownId: fromGodown._id });
    const toBefore = await StockLevel.findOne({ itemId: item._id, godownId: toGodown._id }) || { physical: 0 };

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await transferGodownStock({
        fromGodownId: fromGodown._id,
        toGodownId: toGodown._id,
        lines: [{ itemId: item._id, qty: 8 }],
        refId: new mongoose.Types.ObjectId(),
        remarks: 'Unit test inter-warehouse shift',
        session
      });
      await session.commitTransaction();
    } finally {
      session.endSession();
    }

    const fromAfter = await StockLevel.findOne({ itemId: item._id, godownId: fromGodown._id });
    const toAfter = await StockLevel.findOne({ itemId: item._id, godownId: toGodown._id });

    assert.equal(fromAfter.physical, fromBefore.physical - 8, 'Source warehouse physical inventory must decrease');
    assert.equal(toAfter.physical, toBefore.physical + 8, 'Destination warehouse physical inventory must increase');
  });

  await t.test('6. BOM scaling proportionality calculation', () => {
    const baseQty = 100;
    const producedQty = 250;
    const baseFormulaItemQty = 42; // e.g. 42 kg of Urad Dal for 100 packs

    const scaledExpectedConsumption = baseFormulaItemQty * (producedQty / baseQty);
    assert.equal(scaledExpectedConsumption, 105, '250 packs at 42 kg/100 packs should scale to 105 kg');
  });

  await disconnectDB();
});
