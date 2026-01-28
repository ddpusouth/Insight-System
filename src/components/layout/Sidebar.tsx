import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  FileText,
  Upload,
  Image,
  BarChart3,
  Settings,
  GraduationCap,
  Building,
  UserCheck,
  ClipboardList,
  LogOut,
  Mail,
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'ddpo'] },
  { name: 'Colleges', href: '/colleges', icon: Building, roles: ['ddpo'] },
  //  { name: 'Students', href: '/students', icon: GraduationCap, roles: ['admin'] },
  //  { name: 'Teachers', href: '/teachers', icon: Users, roles: ['admin'] },
  { name: 'Infrastructure', href: '/infrastructure', icon: Building, roles: ['admin'] },
  { name: 'Documents', href: '/documents', icon: FileText, roles: ['admin', 'ddpo'] },
  { name: 'Chat', href: '/chat', icon: MessageSquare, roles: ['admin', 'ddpo'] },
  { name: 'Query', href: '/query', icon: MessageSquare, roles: ['admin', 'ddpo'] },
  { name: 'Circular', href: '/circular', icon: FileText, roles: ['admin', 'ddpo'] },
  { name: 'Attendance', href: '/attendance', icon: ClipboardList, roles: ['admin', 'ddpo'] },
  { name: 'Contact Messages', href: '/ddpo-messages', icon: Mail, roles: ['ddpo'] },
  { name: 'Report', href: '/report', icon: BarChart3, roles: ['ddpo'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user?.role || '')
  );

  const handleLinkClick = () => {
    if (onClose && window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "w-64 bg-card border-r border-border shadow-sm flex flex-col",
        "fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out", // Mobile styles: fixed, high z-index
        "md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:z-0 md:translate-x-0", // Desktop styles: sticky, below header, correct height
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground w-full mt-2"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
};