import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email y password son requeridos');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
      setEmail('');
      setPassword('');
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No fue posible iniciar sesion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 p-6 border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">Sign In</Dialog.Title>
            <Dialog.Close asChild>
              <button className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Ingresa tus credenciales para acceder al panel administrativo.
          </Dialog.Description>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="admin@hotelens.local"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password</label>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="********"
              />
            </div>

            {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:opacity-95 disabled:opacity-60 transition-opacity"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
