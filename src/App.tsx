import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';

import { FeedScreen } from './screens/FeedScreen';
import { ChatListScreen } from './screens/ChatListScreen';
import { ChatDetailScreen } from './screens/ChatDetailScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { BlockedUsersScreen } from './screens/BlockedUsersScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { AdminModerationQueueScreen } from './screens/AdminModerationQueueScreen';
import { AdminUserManagementScreen } from './screens/AdminUserManagementScreen';
import { AdminAuditLogScreen } from './screens/AdminAuditLogScreen';

import {
  LandingScreen,
  LoginScreen,
  RegisterScreen,
  OnboardingProfileScreen,
} from './screens/AuthScreens';

const MainLayout: React.FC = () => {
  const { activeScreen, setActiveScreen, currentUser, toast, hideToast } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const renderScreen = () => {
    // Auth & Onboarding Flow
    if (!currentUser) {
      if (activeScreen === 'register') return <RegisterScreen />;
      if (activeScreen === 'login') return <LoginScreen />;
      return <LandingScreen />;
    }

    if (activeScreen === 'onboarding') {
      return <OnboardingProfileScreen />;
    }

    // Chat Detail view
    if (activeScreen === 'chat_detail' && activeConversationId) {
      return (
        <ChatDetailScreen
          conversationId={activeConversationId}
          onBack={() => {
            setActiveConversationId(null);
            setActiveScreen('chat');
          }}
        />
      );
    }

    // Main Domain Screens
    switch (activeScreen) {
      case 'feed':
        return <FeedScreen />;

      case 'chat':
        return (
          <ChatListScreen
            onSelectConversation={(convId) => {
              setActiveConversationId(convId);
              setActiveScreen('chat_detail');
            }}
          />
        );

      case 'notifications':
        return <NotificationsScreen />;

      case 'profile_me':
        return <ProfileScreen />;

      case 'blocked_users':
        return <BlockedUsersScreen />;

      case 'settings_privacy':
        return <SettingsScreen />;

      // Admin Suite
      case 'admin_dashboard':
        return (
          <AdminDashboardScreen
            onNavigateTab={(tab) => {
              if (tab === 'reports') setActiveScreen('admin_reports');
              else if (tab === 'users') setActiveScreen('admin_users');
              else if (tab === 'audit') setActiveScreen('admin_audit');
              else setActiveScreen('admin_dashboard');
            }}
          />
        );

      case 'admin_reports':
        return <AdminModerationQueueScreen />;

      case 'admin_users':
        return <AdminUserManagementScreen />;

      case 'admin_audit':
        return <AdminAuditLogScreen />;

      default:
        return <FeedScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* Body Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {currentUser && activeScreen !== 'onboarding' && <Sidebar />}

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {renderScreen()}
        </main>
      </div>

      {/* Global Toast Banner */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          code={toast.code}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
