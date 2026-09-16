import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import CommandPalette from '@/components/global/CommandPalette';
import NotificationBell from '@/components/global/NotificationBell';
import AppSidebar, { SidebarNavContent } from './AppSidebar';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

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
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setPaletteOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Recherche globale"
          >
            <Search size={20} aria-hidden />
          </button>
          <NotificationBell dark />
        </div>
      </header>

      <div className="flex-1 lg:ml-64 min-w-0 flex flex-col">
        {/* Desktop top bar: global search + notifications */}
        <div className="hidden lg:flex sticky top-0 z-30 h-16 shrink-0 items-center justify-between gap-4 border-b border-navy/10 bg-mist/85 backdrop-blur px-8">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex w-full max-w-md items-center gap-2.5 rounded-lg border border-navy/10 bg-white px-3.5 py-2 text-sm text-slate-500 hover:border-navy/25 transition"
          >
            <Search size={16} aria-hidden />
            <span className="flex-1 text-left">Rechercher un dossier, une page…</span>
            <kbd className="rounded border border-navy/10 bg-mist px-1.5 py-0.5 text-[11px] font-semibold">⌘K</kbd>
          </button>
          <NotificationBell />
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-20 pb-8 lg:py-8 min-w-0">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
