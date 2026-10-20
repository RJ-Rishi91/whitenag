import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore.js';
import { Layout } from './components/Layout.jsx';

// Version 1.0 Classic Pages
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

// Version 2.0 Modern Executive Pages & Shell
import { LayoutV2 } from './v2/components/LayoutV2.jsx';
import { DashboardV2 } from './v2/pages/DashboardV2.jsx';
import { OrdersKanbanV2 } from './v2/pages/OrdersKanbanV2.jsx';
import { NewOrderV2 } from './v2/pages/NewOrderV2.jsx';
import { DeliveryBoardV2 } from './v2/pages/DeliveryBoardV2.jsx';
import { ProductionV2 } from './v2/pages/ProductionV2.jsx';
import { InvoiceV2 } from './v2/pages/InvoiceV2.jsx';

// Version 3.0 Clean Enterprise Pro Pages & Shell
import { LayoutV3 } from './v3/components/LayoutV3.jsx';
import { DashboardV3 } from './v3/pages/DashboardV3.jsx';
import { OrdersV3 } from './v3/pages/OrdersV3.jsx';
import { NewOrderV3 } from './v3/pages/NewOrderV3.jsx';
import { DeliveryV3 } from './v3/pages/DeliveryV3.jsx';
import { ProductionV3 } from './v3/pages/ProductionV3.jsx';
import { InvoicesV3 } from './v3/pages/InvoicesV3.jsx';
import { TallySyncV3 } from './v3/pages/TallySyncV3.jsx';

function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Determines landing page based on user version preference (default v3)
function RootResolver() {
  const version = localStorage.getItem('erp_version') || 'v3';
  if (version === 'v3') {
    return <Navigate to="/v3" replace />;
  }
  if (version === 'v2') {
    return <Navigate to="/v2" replace />;
  }
  return <Dashboard />;
}

export function App() {
  const handleSwitchVersion = (targetVersion) => {
    localStorage.setItem('erp_version', targetVersion);
    if (targetVersion === 'v3') {
      window.location.hash = '#/v3';
    } else if (targetVersion === 'v2') {
      window.location.hash = '#/v2';
    } else {
      window.location.hash = '#/';
    }
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* ============================================================ */}
        {/* VERSION 3.0 ENTERPRISE PRO (Clean, High-Density, Anti-AI-Slop)*/}
        {/* ============================================================ */}
        <Route
          path="/v3"
          element={
            <ProtectedRoute>
              <LayoutV3 onSwitchVersion={handleSwitchVersion} />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardV3 />} />
          <Route path="orders" element={<OrdersV3 />} />
          <Route path="orders/new" element={<NewOrderV3 />} />
          <Route path="delivery" element={<DeliveryV3 />} />
          <Route path="production" element={<ProductionV3 />} />
          <Route path="invoices" element={<InvoicesV3 />} />
          <Route path="invoices/:id" element={<InvoicesV3 />} />
          <Route path="sync" element={<TallySyncV3 />} />
        </Route>

        {/* ============================================================ */}
        {/* VERSION 2.0 EXECUTIVE (Stitch Design & Motion)               */}
        {/* ============================================================ */}
        <Route
          path="/v2"
          element={
            <ProtectedRoute>
              <LayoutV2 onSwitchVersion={handleSwitchVersion} />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardV2 />} />
          <Route path="orders" element={<OrdersKanbanV2 />} />
          <Route path="orders/new" element={<NewOrderV2 />} />
          <Route path="delivery" element={<DeliveryBoardV2 />} />
          <Route path="manufacturing" element={<ProductionV2 />} />
          <Route path="invoices" element={<InvoiceV2 />} />
          <Route path="invoices/:id" element={<InvoiceV2 />} />
        </Route>

        {/* ============================================================ */}
        {/* VERSION 1.0 CLASSIC (100% Intact and Preserved)              */}
        {/* ============================================================ */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Resolves to v3, v2, or v1 dashboard based on preference */}
          <Route index element={<RootResolver />} />
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
