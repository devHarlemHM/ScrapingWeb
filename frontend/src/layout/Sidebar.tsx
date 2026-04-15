import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Home, Search, Compass, TrendingUp, Moon, Sun, Shield, Users, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface SidebarProps {
  onSearchClick: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isAuthenticated: boolean;
  onAuthClick: () => void;
}

export function Sidebar({ onSearchClick, isDarkMode, onToggleDarkMode, isAuthenticated, onAuthClick }: SidebarProps) {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Tooltip.Provider delayDuration={200}>
      <motion.div
        initial={{ width: 80 }}
        animate={{ width: isExpanded ? 240 : 80 }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className="fixed left-0 top-0 h-screen bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col py-6 z-50 shadow-md dark:shadow-2xl transition-colors duration-300"
      >
        {/* Logo */}
        <div className="px-5 mb-12">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="text-gray-900 dark:text-white font-bold text-lg leading-tight whitespace-nowrap">
                    HOTELENS
                  </div>
                  <div className="text-cyan-600 dark:text-cyan-400 text-xs uppercase tracking-wider whitespace-nowrap">
                    Powered by AI
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation - Centered */}
        <nav className="flex-1 flex flex-col justify-center gap-2 px-4">
          {!isAuthenticated && (
            <>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Link to="/">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        isActive('/')
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                          : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      <Home className="w-5 h-5 flex-shrink-0" />
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="font-medium whitespace-nowrap"
                          >
                            Inicio
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                </Tooltip.Trigger>
                {!isExpanded && (
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl border border-slate-700"
                      sideOffset={10}
                    >
                      Inicio
                      <Tooltip.Arrow className="fill-slate-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Link to="/explore">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        isActive('/explore')
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                          : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      <Compass className="w-5 h-5 flex-shrink-0" />
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="font-medium whitespace-nowrap"
                          >
                            Explorar
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                </Tooltip.Trigger>
                {!isExpanded && (
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl border border-slate-700"
                      sideOffset={10}
                    >
                      Explorar
                      <Tooltip.Arrow className="fill-slate-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSearchClick}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                      location.pathname.includes('/results')
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                        : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    <Search className="w-5 h-5 flex-shrink-0" />
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="font-medium whitespace-nowrap"
                        >
                          Búsqueda
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </Tooltip.Trigger>
                {!isExpanded && (
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl border border-slate-700"
                      sideOffset={10}
                    >
                      Búsqueda
                      <Tooltip.Arrow className="fill-slate-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            </>
          )}

          {isAuthenticated && (
            <>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Link to="/admin">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        isActive('/admin')
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                          : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      <Shield className="w-5 h-5 flex-shrink-0" />
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="font-medium whitespace-nowrap"
                          >
                            Admin Panel
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                </Tooltip.Trigger>
                {!isExpanded && (
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl border border-slate-700"
                      sideOffset={10}
                    >
                      Admin Panel
                      <Tooltip.Arrow className="fill-slate-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Link to="/users">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        isActive('/users')
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                          : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      <Users className="w-5 h-5 flex-shrink-0" />
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="font-medium whitespace-nowrap"
                          >
                            User Management
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                </Tooltip.Trigger>
                {!isExpanded && (
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl border border-slate-700"
                      sideOffset={10}
                    >
                      User Management
                      <Tooltip.Arrow className="fill-slate-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            </>
          )}
        </nav>

        {/* Footer - Dark Mode Toggle */}
        <div className="px-4 mt-auto border-t border-gray-200 dark:border-slate-700 pt-4">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleDarkMode}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white transition-all"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 flex-shrink-0 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 flex-shrink-0 text-indigo-500" />
                )}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </Tooltip.Trigger>
            {!isExpanded && (
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl border border-slate-700"
                  sideOffset={10}
                >
                  {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
                  <Tooltip.Arrow className="fill-slate-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onAuthClick}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white transition-all"
                >
                  {isAuthenticated ? (
                    <LogOut className="w-5 h-5 flex-shrink-0 text-rose-500" />
                  ) : (
                    <LogIn className="w-5 h-5 flex-shrink-0 text-cyan-600" />
                  )}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium whitespace-nowrap"
                      >
                        {isAuthenticated ? 'Sign Out' : 'Sign In'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </Tooltip.Trigger>
              {!isExpanded && (
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="right"
                    className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl border border-slate-700"
                    sideOffset={10}
                  >
                    {isAuthenticated ? 'Sign Out' : 'Sign In'}
                    <Tooltip.Arrow className="fill-slate-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gray-400 dark:text-slate-500 text-xs text-center mt-3"
              >
                v1.0.0
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Tooltip.Provider>
  );
}