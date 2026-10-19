import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore.js';
import { Layout } from './components/Layout.jsx';

// Pages
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { OrderList } from './pages/orders/OrderList.jsx';
import { NewOrder } from './pages/orders/NewOrder.jsx';
import { OrderDetail } from './pages/orders/OrderDetail.jsx';
import { DeliveryBoard } from './pages/delivery/DeliveryBoard.jsx';
import { CustomerList } from './pages/customers/CustomerList.jsx';
import { CustomerProfile } from './pages/customers/CustomerProfile.jsx';
import { CustomerForm } from './pages/customers/CustomerForm.jsx';
import { StockOverview } from './pages/inventory/StockOverview.jsx';
import { StockTransfer } from './pages/inventory/StockTransfer.jsx';
import { StockAdjustments } from './pages/inventory/StockAdjustments.jsx';
import { ItemMaster } from './pages/inventory/ItemMaster.jsx';
import { PurchaseList } from './pages/purchase/PurchaseList.jsx';
import { NewPurchase } from './pages/purchase/NewPurchase.jsx';
import { ProductionList } from './pages/manufacturing/ProductionList.jsx';
import { NewProduction } from './pages/manufacturing/NewProduction.jsx';
import { BOMManager } from './pages/manufacturing/BOMManager.jsx';
import { InvoiceList } from './pages/billing/InvoiceList.jsx';
import { InvoicePreview } from './pages/billing/InvoicePreview.jsx';
import { PaymentRegister } from './pages/payments/PaymentRegister.jsx';
import { OutstandingList } from './pages/payments/OutstandingList.jsx';
import { ReportsHub } from './pages/reports/ReportsHub.jsx';
import { SyncOverview } from './pages/sync/SyncOverview.jsx';
import { SettingsHub } from './pages/settings/SettingsHub.jsx';
import { Search } from './pages/Search.jsx';
import { NotFound } from './pages/NotFound.jsx';

function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected App Screens inside Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/new" element={<NewOrder />} />
          <Route path="orders/:id" element={<OrderDetail />} />

          <Route path="delivery" element={<DeliveryBoard />} />

          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/new" element={<CustomerForm />} />
          <Route path="customers/:id" element={<CustomerProfile />} />
          <Route path="customers/:id/edit" element={<CustomerForm />} />

          <Route path="stock" element={<StockOverview />} />
          <Route path="stock/transfer" element={<StockTransfer />} />
          <Route path="stock/adjustments" element={<StockAdjustments />} />
          <Route path="items" element={<ItemMaster />} />

          <Route path="purchases" element={<PurchaseList />} />
          <Route path="purchases/new" element={<NewPurchase />} />

          <Route path="manufacturing" element={<ProductionList />} />
          <Route path="manufacturing/new" element={<NewProduction />} />
          <Route path="boms" element={<BOMManager />} />

          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/:id" element={<InvoicePreview />} />

          <Route path="payments" element={<PaymentRegister />} />
          <Route path="outstanding" element={<OutstandingList />} />

          <Route path="reports" element={<ReportsHub />} />
          <Route path="sync" element={<SyncOverview />} />
          <Route path="settings" element={<SettingsHub />} />

          <Route path="search" element={<Search />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
