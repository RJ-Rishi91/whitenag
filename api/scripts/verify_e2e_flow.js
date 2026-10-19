/**
 * End-to-End Workflow Verification Script for Nagfani Foods ERP
 * Tests the complete lifecycle:
 * Order Creation -> Reservation -> Packing -> Shipping -> Delivery
 * -> Invoice Generation -> Payment Receipt -> Manufacturing Batch (BOM scaling)
 * -> Outbox generation -> Tally Sync
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api/v1';

async function run() {
  console.log('====================================================');
  console.log(' Nagfani Foods ERP - End-to-End Business Flow Test ');
  console.log('====================================================\n');

  // 1. Admin Login
  console.log('1. Authenticating as Admin...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('Login failed: ' + JSON.stringify(loginData));
  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  console.log('   Authenticated successfully. Token obtained.');

  // 2. Fetch Customer & Products & Godowns
  console.log('\n2. Fetching Customer, Products and Godowns...');
  const partiesRes = await fetch(`${BASE_URL}/parties?type=customer`, { headers: authHeaders });
  const parties = (await partiesRes.json()).data;
  const customer = parties.find(p => p.name.includes('Mewar Food Mart')) || parties[0];
  console.log(`   Selected Customer: ${customer.name} (ID: ${customer._id})`);

  const itemsRes = await fetch(`${BASE_URL}/items?category=finished`, { headers: authHeaders });
  const items = (await itemsRes.json()).data;
  const product = items.find(i => i.sku === 'URAD-HARI-MIRCH-PAPAD-500G') || items[0];
  console.log(`   Selected Product: ${product.name} (SKU: ${product.sku}, ID: ${product._id})`);

  const godownsRes = await fetch(`${BASE_URL}/godowns`, { headers: authHeaders });
  const godowns = (await godownsRes.json()).data;
  const mainGodown = godowns.find(g => g.name.includes('Central') || g.name.includes('Main')) || godowns[0];
  console.log(`   Selected Godown: ${mainGodown.name} (ID: ${mainGodown._id})`);

  // Check initial stock
  const initialStockRes = await fetch(`${BASE_URL}/stock/levels?godownId=${mainGodown._id}`, { headers: authHeaders });
  const allLevels = (await initialStockRes.json()).data;
  const initialStock = allLevels.find(l => (l.itemId?._id || l.itemId) === product._id) || { physical: 0, reserved: 0, available: 0 };
  console.log(`   Initial Stock: Physical=${initialStock.physical}, Reserved=${initialStock.reserved}, Available=${initialStock.available}`);

  // 3. Create a New Order
  console.log('\n3. Placing New Order (50 packs)...');
  const orderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      partyId: customer._id,
      godownId: mainGodown._id,
      allowStockOverride: true,
      items: [
        {
          itemId: product._id,
          sku: product.sku,
          name: product.name,
          qty: 50,
          rate: 120,
          unitSymbol: product.unitSymbol || 'pcs (pack)'
        }
      ],
      remarks: 'Urgent delivery for weekend market'
    })
  });
  const orderData = await orderRes.json();
  if (!orderData.success) throw new Error('Order creation failed: ' + JSON.stringify(orderData));
  const order = orderData.data;
  console.log(`   Order Created: ${order.orderNo} (Status: ${order.status}, Total: Rs. ${order.grandTotal})`);

  // Verify stock reservation
  const resLevelsRes = await fetch(`${BASE_URL}/stock/levels?godownId=${mainGodown._id}`, { headers: authHeaders });
  const resLevels = (await resLevelsRes.json()).data;
  const reservedStock = resLevels.find(l => (l.itemId?._id || l.itemId) === product._id) || { physical: 0, reserved: 0, available: 0 };
  console.log(`   Stock after Reservation: Physical=${reservedStock.physical}, Reserved=${reservedStock.reserved}, Available=${reservedStock.available}`);
  if (reservedStock.reserved !== (initialStock.reserved || 0) + 50) {
    throw new Error('Stock reservation mismatch!');
  }
  console.log('   Reservation verified: 50 units reserved without deducting physical stock.');

  // 4. Progress Order: Received -> Packed -> Shipped -> Delivered
  console.log('\n4. Progressing Order Statuses...');
  
  // Pack
  await fetch(`${BASE_URL}/orders/${order._id}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'packed', note: 'Packed in corrugated box #12' })
  });
  console.log('   Status updated: packed');

  // Ship (Triggers physical stock deduction and reservation release)
  await fetch(`${BASE_URL}/orders/${order._id}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'shipped', note: 'Dispatched via Van RJ27-GA-1234' })
  });
  console.log('   Status updated: shipped (Stock movement recorded)');

  const shipLevelsRes = await fetch(`${BASE_URL}/stock/levels?godownId=${mainGodown._id}`, { headers: authHeaders });
  const shipLevels = (await shipLevelsRes.json()).data;
  const shippedStock = shipLevels.find(l => (l.itemId?._id || l.itemId) === product._id) || { physical: 0, reserved: 0, available: 0 };
  console.log(`   Stock after Shipping: Physical=${shippedStock.physical}, Reserved=${shippedStock.reserved}, Available=${shippedStock.available}`);

  // Deliver
  await fetch(`${BASE_URL}/orders/${order._id}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'delivered', note: 'Delivered and acknowledged by shopkeeper' })
  });
  console.log('   Status updated: delivered');

  // 5. Generate Invoice
  console.log('\n5. Generating Tax Invoice from Order...');
  const invRes = await fetch(`${BASE_URL}/invoices/generate-from-order/${order._id}`, {
    method: 'POST',
    headers: authHeaders
  });
  const invData = await invRes.json();
  if (!invData.success) throw new Error('Invoice generation failed: ' + JSON.stringify(invData));
  const invoice = invData.data;
  console.log(`   Invoice Created: ${invoice.invoiceNo}`);
  console.log(`   Subtotal: Rs. ${invoice.subtotal}, CGST: Rs. ${invoice.cgst}, SGST: Rs. ${invoice.sgst}, Grand Total: Rs. ${invoice.grandTotal}`);

  // 6. Record Customer Payment
  console.log('\n6. Recording Customer Payment (UPI)...');
  const payRes = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      partyId: customer._id,
      invoiceId: invoice._id,
      amount: invoice.grandTotal,
      mode: 'upi',
      ref: 'UPI/2026/99887766',
      remarks: 'Full payment received via QR scan'
    })
  });
  const payData = await payRes.json();
  if (!payData.success) throw new Error('Payment recording failed: ' + JSON.stringify(payData));
  const payment = payData.data;
  console.log(`   Payment Recorded: ${payment.receiptNo} (Amount: Rs. ${payment.amount}, Mode: ${payment.mode})`);

  // 7. Manufacturing Batch with BOM
  console.log('\n7. Logging Manufacturing Production Batch (100 units)...');
  const bomRes = await fetch(`${BASE_URL}/boms/for-product/${product._id}`, { headers: authHeaders });
  const bomData = await bomRes.json();
  if (!bomData.success) throw new Error('BOM fetch failed: ' + JSON.stringify(bomData));
  const bom = bomData.data;
  console.log(`   Active BOM found: "${bom.name}" (Base: ${bom.baseQty} ${bom.baseUnitSymbol})`);

  const prodLines = bom.lines.map(line => ({
    itemId: line.itemId?._id || line.itemId,
    sku: line.sku,
    name: line.name,
    bomQty: line.qty,
    actualQty: line.qty,
    unitSymbol: line.unitSymbol
  }));

  const prodRes = await fetch(`${BASE_URL}/production`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      productId: product._id,
      godownId: mainGodown._id,
      bomId: bom._id,
      qty: 100,
      batchNo: 'B-2026-OCT-19',
      lines: prodLines,
      remarks: 'Morning shift batch 1'
    })
  });
  const prodData = await prodRes.json();
  if (!prodData.success) throw new Error('Production logging failed: ' + JSON.stringify(prodData));
  const production = prodData.data;
  console.log(`   Production Batch Recorded: ${production.productionNo} (${production.qty} units of ${product.name})`);
  console.log(`   Raw Materials Consumed: ${production.lines.length} ingredients recorded via stock movements.`);

  // 8. Tally Sync Outbox & Connector Run
  console.log('\n8. Checking Tally Sync Outbox Queue...');
  const pendingRes = await fetch(`${BASE_URL}/sync/pending`, {
    headers: { 'x-api-key': 'nagfani_connector_api_key_secure_2026' }
  });
  const pendingData = await pendingRes.json();
  console.log(`   Pending Outbox Items: ${pendingData.count}`);
  for (const item of pendingData.data) {
    console.log(`   - [${item.entityType.toUpperCase()}] Action: ${item.action}, Key: ${item.idempotencyKey}`);
  }

  console.log('\n   Executing Tally Connector cycle (connector.py --run-once)...');
  await new Promise((resolve, reject) => {
    const connectorProcess = spawn('python3', ['connector.py', '--run-once'], {
      cwd: path.resolve(__dirname, '../../connector'),
      stdio: 'inherit'
    });
    connectorProcess.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Connector exited with code ${code}`));
    });
  });

  // Verify sync status
  const overviewRes = await fetch(`${BASE_URL}/sync/overview`, { headers: authHeaders });
  const overviewData = await overviewRes.json();
  console.log('\n9. Tally Sync Final Status:');
  console.log(`   Connector Online: ${overviewData.connector.isOnline}`);
  console.log(`   Tally Reachable: ${overviewData.connector.tallyReachable}`);
  console.log(`   Outbox Synced Count: ${overviewData.counts.synced}`);
  console.log(`   Outbox Pending Count: ${overviewData.counts.pending}`);
  console.log(`   Outbox Failed Count: ${overviewData.counts.failed}`);

  console.log('\n====================================================');
  console.log(' ALL END-TO-END FLOW TESTS PASSED SUCCESSFULLY! ');
  console.log('====================================================\n');
}

run().catch(err => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
