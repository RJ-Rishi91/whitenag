import express from 'express';
import { Order } from '../models/Order.js';
import { Party } from '../models/Party.js';
import { Item } from '../models/Item.js';
import { Invoice } from '../models/Invoice.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/search?q=
router.get('/', async (req, res, next) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    if (!q || q.length < 2) {
      return res.json({ success: true, results: { orders: [], customers: [], items: [], invoices: [] } });
    }

    const regex = new RegExp(q, 'i');

    const [orders, customers, items, invoices] = await Promise.all([
      Order.find({
        $or: [
          { orderNo: regex },
          { challanNo: regex },
          { remarks: regex }
        ]
      }).populate('partyId', 'name mobile').limit(8),

      Party.find({
        type: 'customer',
        $or: [
          { name: regex },
          { mobile: regex },
          { city: regex },
          { gstin: regex }
        ]
      }).limit(8),

      Item.find({
        $or: [
          { name: regex },
          { sku: regex },
          { productGroup: regex }
        ]
      }).limit(8),

      Invoice.find({
        $or: [
          { invoiceNo: regex },
          { challanNo: regex }
        ]
      }).populate('partyId', 'name').limit(8)
    ]);

    res.json({
      success: true,
      query: q,
      results: {
        orders,
        customers,
        items,
        invoices
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
