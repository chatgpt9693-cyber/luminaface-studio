import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  TrendingUp,
  CalendarCheck,
  History,
} from 'lucide-react';

const masterNavItems = [
  { icon: LayoutDashboard, label: 'Главная', path: '/' },
  { icon: Calendar, label: 'Календарь', path: '/calendar' },
  { icon: Users, label: 'Клиенты', path: '/clients' },
  { icon: TrendingUp, label: 'Доходы', path: '/income' },
];

const clientNavItems = [
  { icon: LayoutDashboard, label: 'Главная', path: '/client' },
  { icon: CalendarCheck, label: 'Записаться', path: '/client/booking' },
  { icon: History, label: 'История', path: '/client/history' },
];

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = user?.role === 'MASTER' ? masterNavItems : clientNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 z-40 bg-sidebar/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-bottom-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full bg-primary"
                  transition={{ duration: 0.3 }}
                />
              )}
              <item.icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
