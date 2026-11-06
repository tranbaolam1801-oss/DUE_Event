import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EventProvider } from './contexts/EventContext';
import { MainLayout } from './components/layout/MainLayout';
import { UserRole } from './types';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { EventListPage } from './pages/EventListPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventCreatePage } from './pages/EventCreatePage';
import { EventEditPage } from './pages/EventEditPage';
import { ApprovalQueuePage } from './pages/ApprovalQueuePage';
import { ResourceCalendarPage } from './pages/ResourceCalendarPage';
import { FacilityListPage } from './pages/FacilityListPage';
import { HandoverPage } from './pages/HandoverPage';
import { SettlementPage } from './pages/SettlementPage';
import { ReportPage } from './pages/ReportPage';
import { AIReviewPage } from './pages/AIReviewPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotificationPage } from './pages/NotificationPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Component bảo vệ route theo vai trò người dùng
const RoleRoute: React.FC<{ children: React.ReactNode; allowedRoles: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { currentUser } = useAuth();
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <EventProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="events" element={<EventListPage />} />
                <Route
                  path="events/create"
                  element={
                    <RoleRoute allowedRoles={['BTC', 'ADMIN']}>
                      <EventCreatePage />
                    </RoleRoute>
                  }
                />
                <Route path="events/:id" element={<EventDetailPage />} />
                <Route path="events/:id/edit" element={<EventEditPage />} />
                <Route
                  path="approvals"
                  element={
                    <RoleRoute allowedRoles={['BCN_KHOA', 'DOAN_TRUONG', 'CSVC', 'KHTC', 'ADMIN']}>
                      <ApprovalQueuePage />
                    </RoleRoute>
                  }
                />
                <Route path="calendar" element={<ResourceCalendarPage />} />
                <Route
                  path="facilities"
                  element={
                    <RoleRoute allowedRoles={['CSVC', 'ADMIN']}>
                      <FacilityListPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="handover"
                  element={
                    <RoleRoute allowedRoles={['CSVC', 'BTC', 'ADMIN']}>
                      <HandoverPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="settlements"
                  element={
                    <RoleRoute allowedRoles={['KHTC', 'BTC', 'ADMIN']}>
                      <SettlementPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <RoleRoute allowedRoles={['BTC', 'DOAN_TRUONG', 'ADMIN']}>
                      <ReportPage />
                    </RoleRoute>
                  }
                />
                <Route path="ai-review" element={<AIReviewPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="notifications" element={<NotificationPage />} />
                <Route
                  path="admin/users"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <UserManagementPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="admin/settings"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <SystemSettingsPage />
                    </RoleRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </EventProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
