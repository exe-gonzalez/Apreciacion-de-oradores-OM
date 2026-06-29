import { Menu, CircleUser } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
  onProfileClick?: () => void;
  currentTab: 'inicio' | 'nueva' | 'historial';
  setCurrentTab: (tab: 'inicio' | 'nueva' | 'historial') => void;
  activeSessionId: string | null;
  onBackFromCollaborative: () => void;
}

export default function Header({ 
  onMenuClick, 
  onProfileClick,
  currentTab,
  setCurrentTab,
  activeSessionId,
  onBackFromCollaborative
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-surface-variant/20 shadow-none">
      <div className="flex items-center justify-between px-4 md:px-8 h-16 max-w-7xl mx-auto">
        {/* Left: Title and Mobile Menu */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full active:scale-95 duration-150 ease-in-out"
            title="Menú"
            id="header-menu-btn"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-headline-md text-[18px] md:text-[20px] font-semibold text-primary dark:text-primary-fixed-dim tracking-tight truncate">
            Apreciación del discurso
          </h1>
        </div>

        {/* Center: Web Navigation (Desktop only, centered without overlap) */}
        <div className="hidden md:flex items-center gap-1 bg-surface-container-low p-1.5 rounded-full border border-outline-variant/30">
          <button
            onClick={() => {
              if (activeSessionId) onBackFromCollaborative();
              setCurrentTab('inicio');
            }}
            className={`font-label-large text-[14px] px-4 py-1.5 rounded-full transition-colors font-semibold cursor-pointer ${
              currentTab === 'inicio' && !activeSessionId
                ? 'text-primary bg-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
            id="desktop-nav-inicio"
          >
            Inicio
          </button>
          <button
            onClick={() => {
              if (activeSessionId) onBackFromCollaborative();
              setCurrentTab('nueva');
            }}
            className={`font-label-large text-[14px] px-4 py-1.5 rounded-full transition-colors font-semibold cursor-pointer ${
              currentTab === 'nueva' && !activeSessionId
                ? 'text-primary bg-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
            id="desktop-nav-nueva"
          >
            Nueva
          </button>
          <button
            onClick={() => {
              if (activeSessionId) onBackFromCollaborative();
              setCurrentTab('historial');
            }}
            className={`font-label-large text-[14px] px-4 py-1.5 rounded-full transition-colors font-semibold cursor-pointer ${
              currentTab === 'historial' && !activeSessionId
                ? 'text-primary bg-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
            id="desktop-nav-historial"
          >
            Historial
          </button>
        </div>

        {/* Right: Admin Icon */}
        <div className="flex items-center">
          <button
            onClick={onProfileClick}
            className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full active:scale-95 duration-150 ease-in-out"
            title="Usuario"
            id="header-user-btn"
          >
            <CircleUser className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
