import { Menu, CircleUser } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
  onProfileClick?: () => void;
}

export default function Header({ onMenuClick, onProfileClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-surface-variant/20 shadow-none">
      <div className="flex items-center justify-between px-4 md:px-8 h-16 max-w-7xl mx-auto">
        <button
          onClick={onMenuClick}
          className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full active:scale-95 duration-150 ease-in-out"
          title="Menú"
          id="header-menu-btn"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-headline-md text-[18px] md:text-[20px] font-semibold text-primary dark:text-primary-fixed-dim tracking-tight truncate px-4 text-center flex-grow">
          Apreciación del discurso
        </h1>
        <button
          onClick={onProfileClick}
          className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full active:scale-95 duration-150 ease-in-out"
          title="Usuario"
          id="header-user-btn"
        >
          <CircleUser className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
