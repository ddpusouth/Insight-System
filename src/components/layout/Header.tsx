import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, Bell, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive';
      case 'teacher': return 'bg-secondary';
      case 'ddpo': return 'bg-accent';
      default: return 'bg-primary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ddpo': return 'DDPO';
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  return (
    <header className="bg-gradient-primary shadow-md border-b border-border sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center h-16">
          {onMobileMenuToggle && (
            <button
              className="md:hidden p-2 text-primary-foreground absolute left-0 top-1/2 -translate-y-1/2 hover:bg-white/10 rounded-md transition-colors"
              onClick={onMobileMenuToggle}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-primary-foreground m-0 p-0 whitespace-nowrap">
            INSIGHT SYSTEM
          </h1>
        </div>
      </div>
    </header>
  );
};