import { useState } from 'react';
import { Menu, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import MobileMenu from './MobileMenu';

interface MobileHeaderProps {
  title: string;
}

export default function MobileHeader({ title }: MobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur-lg">
        <button
          onClick={() => setMenuOpen(true)}
          className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base font-semibold text-foreground truncate flex-1 text-center px-2">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 glow-dot w-1.5 h-1.5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-semibold">
            {user?.avatarInitials || 'U'}
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
