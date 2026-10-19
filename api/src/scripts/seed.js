import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  Role,
  User,
  Area,
  Godown,
  Unit,
  Item,
  Party,
  BOM,
  StockLevel,
  StockMovement,
  Counter
} from '../models/index.js';
import { recordStockMovement } from '../services/stockService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await connectDB();

    console.log('Clearing existing collections...');
    await Promise.all([
      Role.deleteMany({}),
      User.deleteMany({}),
      Area.deleteMany({}),
      Godown.deleteMany({}),
      Unit.deleteMany({}),
      Item.deleteMany({}),
      Party.deleteMany({}),
      BOM.deleteMany({}),
      StockLevel.deleteMany({}),
      StockMovement.deleteMany({}),
      Counter.deleteMany({})
    ]);

    console.log('1. Seeding Roles...');
    const roles = await Role.insertMany([
      {
        name: 'Administrator',
        code: 'ADMIN',
        description: 'Complete system access, permissions and sync management',
        permissions: ['*']
      },
      {
        name: 'Order Executive',
        code: 'ORDER',
        description: 'Create and manage customer orders and customer records',
        permissions: ['order.create', 'order.edit', 'order.view', 'customer.create', 'customer.view', 'stock.view']
      },
      {
        name: 'Packing Supervisor',
        code: 'PACKING',
        description: 'Mark orders packed and check reserved warehouse stock',
        permissions: ['order.pack', 'order.view', 'stock.view']
      },
      {
        name: 'Delivery Driver',
        code: 'DELIVERY',
        description: 'Manage area-wise dispatches and deliveries, collect cash/UPI',
        permissions: ['order.ship', 'order.deliver', 'order.view', 'delivery.view', 'payment.record']
      },
      {
        name: 'Accounts Executive',
        code: 'ACCOUNTS',
        description: 'Payments, collections, cash/bank ledgers and Tally reconciliation',
        permissions: ['payment.record', 'payment.view', 'invoice.create', 'invoice.view', 'sync.view', 'order.view', 'reports.view']
      }
    ]);

    const adminRole = roles.find(r => r.code === 'ADMIN');
    const orderRole = roles.find(r => r.code === 'ORDER');
    const packingRole = roles.find(r => r.code === 'PACKING');
    const deliveryRole = roles.find(r => r.code === 'DELIVERY');
    const accountsRole = roles.find(r => r.code === 'ACCOUNTS');

    console.log('2. Seeding Users (Password: admin123 / order123 etc.)...');
    const defaultPasswordHash = await User.hashPassword('admin123');

    const users = await User.insertMany([
      {
        name: 'Managing Director (Admin)',
        username: 'admin',
        mobile: '9829012345',
        passwordHash: defaultPasswordHash,
        roleId: adminRole._id,
        mustChangePassword: false
      },
      {
        name: 'Suresh Meena (Order Desk)',
        username: 'order',
        mobile: '9829012346',
        passwordHash: await User.hashPassword('order123'),
        roleId: orderRole._id,
        mustChangePassword: false
      },
      {
        name: 'Ramesh Patel (Packing Lead)',
        username: 'packing',
        mobile: '9829012347',
        passwordHash: await User.hashPassword('pack123'),
        roleId: packingRole._id,
        mustChangePassword: false
      },
      {
        name: 'Dinesh Gurjar (Delivery Logistics)',
        username: 'delivery',
        mobile: '9829012348',
        passwordHash: await User.hashPassword('delivery123'),
        roleId: deliveryRole._id,
        mustChangePassword: false
      },
      {
        name: 'Pooja Jain (Accounts & Tally)',
        username: 'accounts',
        mobile: '9829012349',
        passwordHash: await User.hashPassword('accounts123'),
        roleId: accountsRole._id,
        mustChangePassword: false
      }
    ]);

    console.log('3. Seeding 31 Areas of Udaipur...');
    const areaCodes = [
      'SEC 3', 'SEC 4', 'SEC 5', 'SEC 6', 'SEC 7', 'SEC 8', 'SEC 9',
      'SEC 11', 'SEC 12', 'SEC 13', 'SEC 14', 'TITARDI', 'SAVINA',
      'BALICHA', 'SURAJPOL', 'UDAIPOL', 'DELHIGATE', 'CHETAK',
      'SARV RITU VILAS', 'SEVASHARAM', 'DURGA NURSERY', 'KUMARO KA BHATTA',
      'ANAND PLAZA', 'KESHAV NAGAR', 'PAHADA', 'UNIVERSITY ROAD',
      'KALKA MATA ROAD', 'CELEBRATION', 'SHOBHAGHPURA', 'UIT', 'KRISHI MANDI'
    ];

    const areaDocs = areaCodes.map(name => ({
      code: name.replace(/\s+/g, '-').toUpperCase(),
      name,
      city: 'Udaipur',
      pincode: '313001'
    }));
    const areas = await Area.insertMany(areaDocs);
    const areaMap = new Map(areas.map(a => [a.name, a]));

    console.log('4. Seeding Units of Measurement...');
    const units = await Unit.insertMany([
      { name: 'Pieces (Pack)', symbol: 'pcs (pack)', tallyUnit: 'NOS' },
      { name: 'Kilograms', symbol: 'kg', tallyUnit: 'KGS' },
      { name: 'Grams', symbol: 'g', tallyUnit: 'GMS' },
      { name: 'Boxes', symbol: 'box', tallyUnit: 'BOX' },
      { name: 'Quintal', symbol: 'qtl', tallyUnit: 'QTL' }
    ]);
    const pcsUnit = units.find(u => u.symbol === 'pcs (pack)');
    const kgUnit = units.find(u => u.symbol === 'kg');

    console.log('5. Seeding Godowns...');
    const godowns = await Godown.insertMany([
      {
        name: 'Factory Godown (Manufacturing Plant)',
        code: 'WH-FAC',
        type: 'factory',
        address: 'Plot 42, Sukher Industrial Area, Udaipur',
        tallyGodown: 'Main Location'
      },
      {
        name: 'Central Finished Goods Warehouse',
        code: 'WH-MAIN',
        type: 'warehouse',
        address: 'Bhuwana Bypass, Udaipur',
        tallyGodown: 'Bhuwana Godown'
      },
      {
        name: 'City Distribution Center',
        code: 'WH-CITY',
        type: 'warehouse',
        address: 'Udaipole Market, Udaipur',
        tallyGodown: 'Udaipole Depot'
      }
    ]);
    const factoryGodown = godowns[0];
    const centralGodown = godowns[1];

    console.log('6. Seeding Finished Goods Products from products.json...');
    const productsPath = path.resolve(__dirname, '../../../seed/products.json');
    const productsRaw = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

    const finishedGoodsDocs = productsRaw.map(p => ({
      name: p.name,
      sku: p.sku,
      category: 'finished',
      productGroup: p.productGroup,
      packWeightGrams: p.packWeightGrams,
      packagingVariant: p.packagingVariant,
      unitId: pcsUnit._id,
      unitSymbol: pcsUnit.symbol,
      mrp: p.mrp,
      standardCost: Math.round(p.mrp * 0.65), // approximate production cost
      gstRate: 5,
      hsn: p.productGroup === 'MASALA' ? '0910' : p.productGroup === 'AACHAR' ? '2001' : '1905',
      minStock: 25,
      active: true
    }));

    const finishedItems = await Item.insertMany(finishedGoodsDocs);
    console.log(`Seeded ${finishedItems.length} Finished Goods SKUs.`);

    console.log('7. Seeding Raw Material & Packaging Items...');
    const rawItemsData = [
      { name: 'Urad Dal Mogar', sku: 'RAW-URAD-DAL', category: 'raw', unitId: kgUnit._id, unitSymbol: 'kg', mrp: 120, standardCost: 110, hsn: '0713', minStock: 200 },
      { name: 'Moong Dal Mogar', sku: 'RAW-MOONG-DAL', category: 'raw', unitId: kgUnit._id, unitSymbol: 'kg', mrp: 130, standardCost: 115, hsn: '0713', minStock: 150 },
      { name: 'Chana Dal', sku: 'RAW-CHANA-DAL', category: 'raw', unitId: kgUnit._id, unitSymbol: 'kg', mrp: 85, standardCost: 75, hsn: '0713', minStock: 100 },
      { name: 'Wheat Flour (Premium Atta)', sku: 'RAW-WHEAT-FLOUR', category: 'raw', unitId: kgUnit._id, unitSymbol: 'kg', mrp: 38, standardCost: 32, hsn: '1101', minStock: 300 },
      { name: 'Refined Vegetable Oil', sku: 'RAW-VEG-OIL', category: 'raw', unitId: kgUnit._id, unitSymbol: 'kg', mrp: 140, standardCost: 125, hsn: '1512', minStock: 100 },
      { name: 'Fresh Green Chilli Paste', sku: 'RAW-HARI-MIRCH', category: 'raw', unitId: kgUnit._id, unitSymbol: 'kg', mrp: 70, standardCost: 55, hsn: '0904', minStock: 50 },
      { name: 'Pure Hing (Asafoetida) Grade 1', sku: 'RAW-HING', category: 'raw', unitId: kgUnit._id, unitSymbol: 'kg', mrp: 2800, standardCost: 2400, hsn: '1301', minStock: 10 },
      { name: 'Papad Khar (Sajji Khar)', sku: 'RAW-PAPAD-KHAR', category: 'raw', unitId: kgUnit._id, unitSymbol: 'kg', mrp: 65, standardCost: 50, hsn: '2836', minStock: 30 },
      { name: 'Refined Iodised Salt', sku: 'RAW-SALT', category: 'raw', unitId: kgUnit._id, unitSymbol: 'kg', mrp: 18, standardCost: 12, hsn: '2501', minStock: 100 },
      { name: 'Whole Cumin Seeds (Jeera)', sku: 'RAW-JEERA', category: 'raw', unitId: kgUnit._id, unitSymbol: 'kg', mrp: 320, standardCost: 280, hsn: '0909', minStock: 40 },
      { name: 'Kasuri Methi Leaves', sku: 'RAW-METHI', category: 'raw', unitId: kgUnit._id, unitSymbol: 'kg', mrp: 180, standardCost: 140, hsn: '0910', minStock: 30 },
      { name: 'Printed Nagfani Pouch 500g', sku: 'PKG-POUCH-500G', category: 'packaging', unitId: pcsUnit._id, unitSymbol: 'pcs (pack)', mrp: 3.5, standardCost: 2.8, hsn: '3923', minStock: 1000 },
      { name: 'Printed Nagfani Pouch 200g', sku: 'PKG-POUCH-200G', category: 'packaging', unitId: pcsUnit._id, unitSymbol: 'pcs (pack)', mrp: 2.2, standardCost: 1.8, hsn: '3923', minStock: 1000 }
    ];
    const rawItems = await Item.insertMany(rawItemsData);
    const itemMap = new Map([...finishedItems, ...rawItems].map(i => [i.sku, i]));

    console.log('8. Seeding Bill of Materials (BOM) for Urad Hari Mirch Papad (500g)...');
    const uradPapadItem = itemMap.get('URAD-HARI-MIRCH-PAPAD-500G');
    if (uradPapadItem) {
      await BOM.create({
        productId: uradPapadItem._id,
        name: 'Standard Production Recipe - Urad Hari Mirch Papad',
        version: 1,
        baseQty: 100, // 100 packs of 500g = 50 kg finished output
        baseUnitSymbol: 'pcs (pack)',
        lines: [
          { itemId: itemMap.get('RAW-URAD-DAL')._id, sku: 'RAW-URAD-DAL', name: 'Urad Dal Mogar', qty: 42, unitSymbol: 'kg' },
          { itemId: itemMap.get('RAW-HARI-MIRCH')._id, sku: 'RAW-HARI-MIRCH', name: 'Fresh Green Chilli Paste', qty: 3.5, unitSymbol: 'kg' },
          { itemId: itemMap.get('RAW-HING')._id, sku: 'RAW-HING', name: 'Pure Hing Grade 1', qty: 0.25, unitSymbol: 'kg' },
          { itemId: itemMap.get('RAW-PAPAD-KHAR')._id, sku: 'RAW-PAPAD-KHAR', name: 'Papad Khar', qty: 1.25, unitSymbol: 'kg' },
          { itemId: itemMap.get('RAW-SALT')._id, sku: 'RAW-SALT', name: 'Refined Salt', qty: 1.5, unitSymbol: 'kg' },
          { itemId: itemMap.get('RAW-VEG-OIL')._id, sku: 'RAW-VEG-OIL', name: 'Refined Vegetable Oil', qty: 1.5, unitSymbol: 'kg' },
          { itemId: itemMap.get('PKG-POUCH-500G')._id, sku: 'PKG-POUCH-500G', name: 'Printed Pouch 500g', qty: 100, unitSymbol: 'pcs (pack)' }
        ],
        active: true,
        notes: 'Classic Rajasthani Papad formulation with balanced pungency and crispness.'
      });
    }

    console.log('9. Seeding Sample Customers & Suppliers...');
    const sec4Area = areaMap.get('SEC 4') || areas[0];
    const surajpolArea = areaMap.get('SURAJPOL') || areas[1];
    const savinaArea = areaMap.get('SAVINA') || areas[2];
    const krishiMandiArea = areaMap.get('KRISHI MANDI') || areas[3];

    const parties = await Party.insertMany([
      {
        type: 'customer',
        name: 'Mewar Food Mart & Distributors',
        mobile: '9414112345',
        address: 'Shop 12-14, Commercial Center, Sector 4',
        city: 'Udaipur',
        pincode: '313002',
        areaId: sec4Area._id,
        segment: 'b2b',
        b2bType: 'distributor',
        gstin: '08ABCDE1234F1Z5',
        mapsUrl: 'https://maps.google.com/?q=24.5712,73.7089',
        lat: 24.5712,
        lng: 73.7089,
        creditDays: 15,
        creditLimit: 50000,
        balance: 14200
      },
      {
        type: 'customer',
        name: 'Lakecity Super Store',
        mobile: '9414198765',
        address: 'Near Old Bus Stand, Surajpole',
        city: 'Udaipur',
        pincode: '313001',
        areaId: surajpolArea._id,
        segment: 'b2b',
        b2bType: 'retailer',
        gstin: '08AABCL4567D1Z8',
        mapsUrl: 'https://maps.google.com/?q=24.5789,73.6923',
        lat: 24.5789,
        lng: 73.6923,
        creditDays: 7,
        creditLimit: 25000,
        balance: 6400
      },
      {
        type: 'customer',
        name: 'Rajesh Sharma (Resident)',
        mobile: '9828054321',
        address: 'House 45, Shanti Nagar, Savina',
        city: 'Udaipur',
        pincode: '313002',
        areaId: savinaArea._id,
        segment: 'b2c',
        b2bType: 'none',
        gstin: '',
        mapsUrl: 'https://maps.google.com/?q=24.5562,73.7145',
        lat: 24.5562,
        lng: 73.7145,
        creditDays: 0,
        creditLimit: 0,
        balance: 0
      },
      {
        type: 'supplier',
        name: 'Shreenathji Agro & Spices Commodities',
        mobile: '9414201201',
        address: 'B-28, Krishi Upaj Mandi, Savina Main Road',
        city: 'Udaipur',
        pincode: '313002',
        areaId: krishiMandiArea._id,
        segment: 'b2b',
        b2bType: 'wholesale',
        gstin: '08SHREE9876K1Z2',
        mapsUrl: 'https://maps.google.com/?q=24.5512,73.7180',
        lat: 24.5512,
        lng: 73.7180,
        creditDays: 30,
        balance: -45000 // Payable
      }
    ]);

    console.log('10. Seeding Opening Inventory via Stock Movements...');
    // Seed initial raw materials in Factory Godown
    for (const raw of rawItems) {
      await recordStockMovement({
        itemId: raw._id,
        godownId: factoryGodown._id,
        qty: raw.minStock * 4,
        type: 'purchase',
        refType: 'OpeningStock',
        rate: raw.standardCost,
        remarks: 'Opening raw material stock'
      });
    }

    // Seed finished goods in Central Warehouse
    const sampleSkusToStock = [
      'URAD-HARI-MIRCH-PAPAD-500G',
      'URAD-KALI-MIRCH-PAPAD-500G',
      'METHI-KHAKHRA-200G',
      'METHI-KHAKHRA-500G',
      'JEERA-KHAKHRA-200G',
      'SADA-KHAKHRA-200G',
      'LOUNG-SEV-500G',
      'AAM-AACHAR-500G',
      'JEERAWAN-MASALA-200G'
    ];

    for (const sku of sampleSkusToStock) {
      const item = itemMap.get(sku);
      if (item) {
        await recordStockMovement({
          itemId: item._id,
          godownId: centralGodown._id,
          qty: 120, // 120 packs physical stock
          type: 'production_in',
          refType: 'OpeningStock',
          rate: item.standardCost,
          remarks: 'Opening finished goods stock'
        });
      }
    }

    console.log('Database seeding successfully finished!');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

runSeed();
