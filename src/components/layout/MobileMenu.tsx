import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  TrendingUp,
  Flower2,
  LogOut,
  X,
  CalendarCheck,
  History,
} from 'lucide-react';

const masterNavItems = [
  { icon: LayoutDashboard, label: 'Дашборд', path: '/' },
  { icon: Calendar, label: 'Календарь', path: '/calendar' },
  { icon: Users, label: 'Клиенты', path: '/clients' },
  { icon: Scissors, label: 'Услуги', path: '/services' },
  { icon: TrendingUp, label: 'Доходы', path: '/income' },
];

const clientNavItems = [
  { icon: LayoutDashboard, label: 'Главная', path: '/client' },
  { icon: CalendarCheck, label: 'Записаться', path: '/client/booking' },
  { icon: History, label: 'История', path: '/client/history' },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const navItems = user?.role === 'MASTER' ? masterNavItems : clientNavItems;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{
              background: 'radial-gradient(circle at 30% 50%, hsl(340 45% 72% / 0.15), hsl(280 20% 0% / 0.8))',
              backdropFilter: 'blur(8px)'
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] z-50 flex flex-col border-r border-border/50"
            style={{
              background: 'linear-gradient(135deg, hsl(280 8% 8%), hsl(280 8% 6%))',
              boxShadow: '4px 0 24px hsl(280 20% 0% / 0.5), 1px 0 0 hsl(340 45% 72% / 0.1) inset'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Flower2 className="w-4 h-4 text-primary" />
                </div>
                <span
                  className="text-lg font-bold glow-text"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Belka_faces
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="px-4 py-4 border-b border-border/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20"
                style={{ background: 'radial-gradient(circle, hsl(340 45% 72%), transparent)' }}
              />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-primary text-lg font-bold flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(340 45% 72% / 0.25), hsl(280 30% 70% / 0.2))',
                    boxShadow: '0 4px 16px hsl(340 45% 72% / 0.3), 0 0 0 2px hsl(340 45% 72% / 0.2) inset'
                  }}>
                  {user?.avatarInitials || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.name || 'Пользователь'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                    style={{
                      background: 'linear-gradient(135deg, hsl(340 45% 72% / 0.15), hsl(340 45% 72% / 0.1))',
                      borderColor: 'hsl(340 45% 72% / 0.3)',
                      color: 'hsl(340 45% 72%)',
                      boxShadow: '0 2px 8px hsl(340 45% 72% / 0.2)'
                    }}>
                    {user?.role === 'MASTER' ? '👑 Мастер' : '💎 Клиент'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobile-menu-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary"
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="px-3 pb-4 border-t border-border pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Выйти</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
