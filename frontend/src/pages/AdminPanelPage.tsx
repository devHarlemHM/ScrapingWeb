import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Plus, X } from 'lucide-react';

import type { PlatformConfig, ScrapingConfig, SentimentConfig } from '../models/admin';
import { adminService } from '../services/adminService';

type AdminTab = 'platforms' | 'sentiments' | 'scraping';
type ModalMode = 'create' | 'edit';

export function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('platforms');
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [sentiments, setSentiments] = useState<SentimentConfig[]>([]);
  const [scrapings, setScrapings] = useState<ScrapingConfig[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [platformModalMode, setPlatformModalMode] = useState<ModalMode>('create');
  const [platformName, setPlatformName] = useState('');
  const [platformStatus, setPlatformStatus] = useState(true);
  const [editingPlatformId, setEditingPlatformId] = useState<string | null>(null);

  const [isSentimentModalOpen, setIsSentimentModalOpen] = useState(false);
  const [sentimentModalMode, setSentimentModalMode] = useState<ModalMode>('create');
  const [sentimentName, setSentimentName] = useState('');
  const [sentimentStatus, setSentimentStatus] = useState(true);
  const [editingSentimentId, setEditingSentimentId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [platformRows, sentimentRows, scrapingRows] = await Promise.all([
        adminService.listPlatforms(),
        adminService.listSentiments(),
        adminService.listScrapings(),
      ]);
      setPlatforms(platformRows);
      setSentiments(sentimentRows);
      setScrapings(scrapingRows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar configuracion');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeScraping = useMemo(() => scrapings.find((item) => item.is_active), [scrapings]);

  const openCreatePlatform = () => {
    setPlatformModalMode('create');
    setEditingPlatformId(null);
    setPlatformName('');
    setPlatformStatus(true);
    setIsPlatformModalOpen(true);
  };

  const openEditPlatform = (item: PlatformConfig) => {
    setPlatformModalMode('edit');
    setEditingPlatformId(item.id);
    setPlatformName(item.name);
    setPlatformStatus(item.status);
    setIsPlatformModalOpen(true);
  };

  const submitPlatformForm = async () => {
    const normalizedName = platformName.trim();
    if (normalizedName.length < 2) {
      setError('El nombre de plataforma debe tener al menos 2 caracteres');
      return;
    }

    if (platformModalMode === 'create') {
      await adminService.createPlatform({ name: normalizedName, status: platformStatus });
    } else if (editingPlatformId) {
      await adminService.updatePlatform(editingPlatformId, { name: normalizedName, status: platformStatus });
    }

    setIsPlatformModalOpen(false);
    await loadData();
  };

  const openCreateSentiment = () => {
    setSentimentModalMode('create');
    setEditingSentimentId(null);
    setSentimentName('');
    setSentimentStatus(true);
    setIsSentimentModalOpen(true);
  };

  const openEditSentiment = (item: SentimentConfig) => {
    setSentimentModalMode('edit');
    setEditingSentimentId(item.id);
    setSentimentName(item.name);
    setSentimentStatus(item.status);
    setIsSentimentModalOpen(true);
  };

  const submitSentimentForm = async () => {
    const normalizedName = sentimentName.trim();
    if (normalizedName.length < 2) {
      setError('El nombre de sentimiento debe tener al menos 2 caracteres');
      return;
    }

    if (sentimentModalMode === 'create') {
      await adminService.createSentiment({ name: normalizedName, status: sentimentStatus });
    } else if (editingSentimentId) {
      await adminService.updateSentiment(editingSentimentId, { name: normalizedName, status: sentimentStatus });
    }

    setIsSentimentModalOpen(false);
    await loadData();
  };

  const statusBadge = (active: boolean) => (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
        active
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
      }`}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );

  const scrapingStatusLabel = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'completed') return 'Completado';
    if (normalized === 'failed') return 'Fallido';
    if (normalized === 'processing') return 'En proceso';
    return status;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-8">
      <div className="max-w-6xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel Administrativo</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Control dinamico de plataformas, sentimientos y scraping activo.
          </p>
        </div>

        <div className="px-6 pt-4 flex gap-2 border-b border-gray-100 dark:border-slate-700">
          {[
            { key: 'platforms', label: 'Plataformas' },
            { key: 'sentiments', label: 'Sentimientos' },
            { key: 'scraping', label: 'Scraping' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as AdminTab)}
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {isLoading && <p className="text-sm text-cyan-700 dark:text-cyan-300">Cargando...</p>}
          {error && <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}

          {!isLoading && activeTab === 'platforms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Plataformas</h2>
                <button
                  onClick={openCreatePlatform}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Crear
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-700/40 text-gray-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4 text-left">Nombre</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platforms.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100 dark:border-slate-700">
                        <td className="py-3 px-4 text-gray-800 dark:text-slate-100 text-left">{item.name}</td>
                        <td className="py-3 px-4 text-center">{statusBadge(item.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                                <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content className="min-w-44 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg shadow-xl p-1">
                                <DropdownMenu.Item onClick={() => openEditPlatform(item)} className="px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer outline-none">
                                  Editar
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onClick={() => adminService.togglePlatform(item.id).then(loadData)} className="px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer outline-none">
                                  {item.status ? 'Desactivar' : 'Activar'}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onClick={() => adminService.deletePlatform(item.id).then(loadData)} className="px-3 py-2 rounded-md text-sm text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer outline-none">
                                  Eliminar
                                </DropdownMenu.Item>
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'sentiments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sentimientos</h2>
                <button
                  onClick={openCreateSentiment}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Crear
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-700/40 text-gray-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4 text-left">Nombre</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentiments.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100 dark:border-slate-700">
                        <td className="py-3 px-4 text-gray-800 dark:text-slate-100 text-left">{item.name}</td>
                        <td className="py-3 px-4 text-center">{statusBadge(item.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                                <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content className="min-w-44 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg shadow-xl p-1">
                                <DropdownMenu.Item onClick={() => openEditSentiment(item)} className="px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer outline-none">
                                  Editar
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onClick={() => adminService.toggleSentiment(item.id).then(loadData)} className="px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer outline-none">
                                  {item.status ? 'Desactivar' : 'Activar'}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onClick={() => adminService.deleteSentiment(item.id).then(loadData)} className="px-3 py-2 rounded-md text-sm text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer outline-none">
                                  Eliminar
                                </DropdownMenu.Item>
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'scraping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scraping</h2>
                {activeScraping && (
                  <span className="text-sm text-cyan-700 dark:text-cyan-300">Activo: {activeScraping.source}</span>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-700/40 text-gray-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4 text-left">ID</th>
                      <th className="py-3 px-4 text-left">Origen</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-center">Activo</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrapings.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`border-t border-gray-100 dark:border-slate-700 ${
                          item.is_active ? 'bg-emerald-50/70 dark:bg-emerald-900/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-gray-700 dark:text-slate-300 text-left">#{index + 1}</td>
                        <td className="py-3 px-4 text-gray-800 dark:text-slate-100 text-left">{item.source}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              item.status.toLowerCase() === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : item.status.toLowerCase() === 'failed'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}
                          >
                            {scrapingStatusLabel(item.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">{statusBadge(item.is_active)}</td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                                <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content className="min-w-44 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg shadow-xl p-1">
                                <DropdownMenu.Item
                                  onClick={() => adminService.activateScraping(item.id).then(loadData)}
                                  disabled={item.is_active}
                                  className="px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Activar
                                </DropdownMenu.Item>
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog.Root open={isPlatformModalOpen} onOpenChange={setIsPlatformModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-gray-100 dark:border-slate-700 p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                {platformModalMode === 'create' ? 'Crear plataforma' : 'Editar plataforma'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre</label>
                <input
                  value={platformName}
                  onChange={(event) => setPlatformName(event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Ej. Google"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={platformStatus} onChange={(event) => setPlatformStatus(event.target.checked)} />
                Activa
              </label>
              <button onClick={submitPlatformForm} className="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700">
                {platformModalMode === 'create' ? 'Crear' : 'Guardar cambios'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={isSentimentModalOpen} onOpenChange={setIsSentimentModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-gray-100 dark:border-slate-700 p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                {sentimentModalMode === 'create' ? 'Crear sentimiento' : 'Editar sentimiento'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre</label>
                <input
                  value={sentimentName}
                  onChange={(event) => setSentimentName(event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Ej. Positivo"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={sentimentStatus} onChange={(event) => setSentimentStatus(event.target.checked)} />
                Activo
              </label>
              <button onClick={submitSentimentForm} className="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700">
                {sentimentModalMode === 'create' ? 'Crear' : 'Guardar cambios'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
