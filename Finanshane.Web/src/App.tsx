import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import OverviewPage from '@/pages/OverviewPage';
import TradePage from '@/pages/TradePage';
import MarketsPage from '@/pages/MarketsPage';
import HoldingsPage from '@/pages/HoldingsPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="trade" element={<TradePage />} />
            <Route path="markets" element={<MarketsPage />} />
            <Route path="holdings" element={<HoldingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
