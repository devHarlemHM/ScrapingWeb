import { useEffect, useMemo, useState } from 'react';

import type { PlatformConfig, ScrapingConfig, SentimentConfig } from '../models/admin';
import { adminService } from '../services/adminService';

type AdminTab = 'platforms' | 'sentiments' | 'scraping';

export function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('platforms');
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [sentiments, setSentiments] = useState<SentimentConfig[]>([]);
  const [scrapings, setScrapings] = useState<ScrapingConfig[]>([]);
  const [newPlatform, setNewPlatform] = useState('');
  const [newSentiment, setNewSentiment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleCreatePlatform = async () => {
    if (!newPlatform.trim()) return;
    await adminService.createPlatform({ name: newPlatform.trim(), status: true });
    setNewPlatform('');
    await loadData();
  };

  const handleEditPlatform = async (item: PlatformConfig) => {
    const nextName = window.prompt('Nuevo nombre de plataforma', item.name);
    if (!nextName || !nextName.trim()) return;
    await adminService.updatePlatform(item.id, { name: nextName.trim(), status: item.status });
    await loadData();
  };

  const handleCreateSentiment = async () => {
    if (!newSentiment.trim()) return;
    await adminService.createSentiment({ name: newSentiment.trim(), status: true });
    setNewSentiment('');
    await loadData();
  };

  const handleEditSentiment = async (item: SentimentConfig) => {
    const nextName = window.prompt('Nuevo nombre de sentimiento', item.name);
    if (!nextName || !nextName.trim()) return;
    await adminService.updateSentiment(item.id, { name: nextName.trim(), status: item.status });
    await loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-8">
      <div className="max-w-6xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Control dinamico de plataformas, sentimientos y scraping activo.
          </p>
        </div>

        <div className="px-6 pt-4 flex gap-2 border-b border-gray-100 dark:border-slate-700">
          {[
            { key: 'platforms', label: 'Platforms' },
            { key: 'sentiments', label: 'Sentiments' },
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

        <div className="p-6">
          {isLoading && <p className="text-sm text-cyan-700 dark:text-cyan-300">Cargando...</p>}
          {error && <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}

          {!isLoading && activeTab === 'platforms' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={newPlatform}
                  onChange={(event) => setNewPlatform(event.target.value)}
                  placeholder="Nueva plataforma"
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
                <button onClick={handleCreatePlatform} className="px-4 py-2 rounded-lg bg-cyan-600 text-white">
                  Crear
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-slate-400">
                      <th className="py-2">Name</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platforms.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100 dark:border-slate-700">
                        <td className="py-2 text-gray-800 dark:text-slate-100">{item.name}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.status ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {item.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2 flex gap-2">
                          <button onClick={() => adminService.togglePlatform(item.id).then(loadData)} className="px-2 py-1 rounded bg-slate-200 text-slate-800">
                            Toggle
                          </button>
                          <button onClick={() => handleEditPlatform(item)} className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                            Edit
                          </button>
                          <button onClick={() => adminService.deletePlatform(item.id).then(loadData)} className="px-2 py-1 rounded bg-rose-100 text-rose-800">
                            Delete
                          </button>
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
              <div className="flex gap-2">
                <input
                  value={newSentiment}
                  onChange={(event) => setNewSentiment(event.target.value)}
                  placeholder="Nuevo sentimiento"
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
                <button onClick={handleCreateSentiment} className="px-4 py-2 rounded-lg bg-cyan-600 text-white">
                  Crear
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-slate-400">
                      <th className="py-2">Name</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentiments.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100 dark:border-slate-700">
                        <td className="py-2 text-gray-800 dark:text-slate-100">{item.name}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.status ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {item.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2 flex gap-2">
                          <button onClick={() => adminService.toggleSentiment(item.id).then(loadData)} className="px-2 py-1 rounded bg-slate-200 text-slate-800">
                            Toggle
                          </button>
                          <button onClick={() => handleEditSentiment(item)} className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                            Edit
                          </button>
                          <button onClick={() => adminService.deleteSentiment(item.id).then(loadData)} className="px-2 py-1 rounded bg-rose-100 text-rose-800">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'scraping' && (
            <div className="space-y-3">
              {activeScraping && (
                <p className="text-sm text-cyan-700 dark:text-cyan-300">
                  Activo: {activeScraping.source}
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-slate-400">
                      <th className="py-2">Source</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Active</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrapings.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100 dark:border-slate-700">
                        <td className="py-2 text-gray-800 dark:text-slate-100">{item.source}</td>
                        <td className="py-2 text-gray-700 dark:text-slate-300">{item.status}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                            {item.is_active ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => adminService.activateScraping(item.id).then(loadData)}
                            className="px-2 py-1 rounded bg-cyan-100 text-cyan-800 disabled:opacity-50"
                            disabled={item.is_active}
                          >
                            Activate
                          </button>
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
    </div>
  );
}
