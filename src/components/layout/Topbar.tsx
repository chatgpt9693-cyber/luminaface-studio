import { Bell, Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileHeader from './MobileHeader';

export default function Topbar({ title }: { title: string }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileHeader title={title} />;
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Search className="w-4 h-4" />
        </button>
        <button className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 glow-dot w-1.5 h-1.5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-semibold">
          М
        </div>
      </div>
    </header>
  );
}
