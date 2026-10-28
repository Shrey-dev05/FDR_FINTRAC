import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/authContext';
import { AccessibilityProvider } from './lib/accessibilityContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { FDRListPage } from './features/fdrs/FDRListPage';
import { FDRDetailPage } from './features/fdrs/FDRDetailPage';
import { FDRCreateWizard } from './features/fdrs/FDRCreateWizard';
import { VerificationQueuePage } from './features/verification/VerificationQueuePage';
import { VerificationWorkspacePage } from './features/verification/VerificationWorkspacePage';
import { MaturityMonitorPage } from './features/maturity/MaturityMonitorPage';
import { RequestListPage } from './features/requests/RequestListPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { UserManagementPage } from './features/admin/UserManagementPage';
import { AuditTrailPage } from './features/admin/AuditTrailPage';
import { SystemSettingsPage } from './features/admin/SystemSettingsPage';

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="fdrs" element={<FDRListPage />} />
              <Route path="fdrs/new" element={<FDRCreateWizard />} />
              <Route path="fdrs/:id" element={<FDRDetailPage />} />
              <Route path="verification" element={<VerificationQueuePage />} />
              <Route path="verification/:id" element={<VerificationWorkspacePage />} />
              <Route path="maturity" element={<MaturityMonitorPage />} />
              <Route path="requests" element={<RequestListPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="admin/users" element={<UserManagementPage />} />
              <Route path="admin/audit" element={<AuditTrailPage />} />
              <Route path="admin/settings" element={<SystemSettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AccessibilityProvider>
  );
};
