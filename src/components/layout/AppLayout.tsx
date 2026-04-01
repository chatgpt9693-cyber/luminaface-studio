import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

export default function AppLayout() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background dark">
        <main className="min-h-screen pb-16">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      <Sidebar />
      <main className="ml-[240px] min-h-screen transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
