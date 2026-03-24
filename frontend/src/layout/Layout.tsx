import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { SearchModal } from '../pages/SearchModal';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <Sidebar 
          onSearchClick={() => setIsSearchModalOpen(true)} 
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />

        <div className="pl-20">
          {children}
        </div>
        <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      </div>
    </div>
  );
}