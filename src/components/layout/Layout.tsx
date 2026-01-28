import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { NotificationBell } from '@/components/ui/notification-bell';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Header onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <div className="flex flex-1 relative">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <main className="flex-1 p-6 w-full">
            {children}
          </main>
        </div>
        <NotificationBell />
      </div>
    </NotificationProvider>
  );
};