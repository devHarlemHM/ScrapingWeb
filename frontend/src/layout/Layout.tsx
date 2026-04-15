import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { SearchModal } from '../pages/SearchModal';
import { LoginModal } from '../pages/LoginModal';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { isAuthenticated, signOut } = useAuth();

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <Sidebar 
          onSearchClick={() => setIsSearchModalOpen(true)} 
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          isAuthenticated={isAuthenticated}
          onAuthClick={() => {
            if (isAuthenticated) {
              signOut();
            } else {
              setIsLoginModalOpen(true);
            }
          }}
        />

        <div className="pl-20">
          {children}
        </div>
        <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    </div>
  );
}