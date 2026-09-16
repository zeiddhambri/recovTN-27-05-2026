import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AppSidebar, { SidebarNavContent } from './AppSidebar';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex bg-mist min-h-screen">
      <AppSidebar />

      {/* Mobile top bar + navigation drawer */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-16 bg-navy text-white flex items-center gap-3 px-4 border-b border-white/5">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu size={22} aria-hidden />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-navy text-white border-r border-white/5">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
            <SidebarNavContent onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link to="/dashboard" className="text-xl font-extrabold tracking-tighter font-syne">
          <span className="text-sky">Recov</span>TN
        </Link>
      </header>

      <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 pt-20 pb-8 lg:py-8 min-w-0">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
