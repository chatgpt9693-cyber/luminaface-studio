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
    <nav className="fixed bottom-0 left-0 right-0 h-16 z-40 border-t border-border/50" 
      style={{
        background: 'linear-gradient(180deg, hsl(280 8% 7% / 0.95), hsl(280 8% 5% / 0.98))',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 -4px 24px hsl(280 20% 0% / 0.5), 0 -1px 0 hsl(340 45% 72% / 0.1) inset'
      }}>
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-300"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-bottom-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full"
                  style={{
                    background: 'linear-gradient(90deg, hsl(340 45% 72%), hsl(280 30% 70%))',
                    boxShadow: '0 2px 12px hsl(340 45% 72% / 0.6)'
                  }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`relative transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                <item.icon
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 rounded-full blur-md"
                    style={{ background: 'hsl(340 45% 72% / 0.3)' }}
                  />
                )}
              </div>
              <span
                className={`text-xs font-medium transition-all duration-300 ${
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
