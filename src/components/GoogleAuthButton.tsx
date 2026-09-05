import React, { useState, useEffect } from 'react';
import { SyncService } from '../services/syncService';
import { CloudSyncStatus } from '../types';
import { User } from 'firebase/auth';
import {
  Cloud,
  RefreshCw,
  LogOut,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Info,
  ShieldCheck,
  X,
} from 'lucide-react';

export const GoogleAuthButton: React.FC = () => {
  const [user, setUser] = useState<User | null>(SyncService.getUser());
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('offline');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDevicesModalOpen, setIsDevicesModalOpen] = useState(false);

  useEffect(() => {
    const unsubAuth = SyncService.subscribeAuth((u) => {
      setUser(u);
    });

    const unsubSync = SyncService.subscribeSync((status, lastSync, err) => {
      setSyncStatus(status);
      if (lastSync) setLastSyncedAt(lastSync);
      if (err) setErrorMessage(err);
      else setErrorMessage(null);
    });

    return () => {
      unsubAuth();
      unsubSync();
    };
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await SyncService.loginWithGoogle();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err.message || 'Errore durante l\'accesso con Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await SyncService.logout();
      setIsMenuOpen(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsLoading(true);
    try {
      await SyncService.forceSyncNow();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Appena avviato';
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <>
      {user ? (
        /* Logged in with Google */
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs hover:bg-slate-50 transition cursor-pointer text-left"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Utente'}
                referrerPolicy="no-referrer"
                className="h-6 w-6 rounded-full object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-petrol text-white flex items-center justify-center text-xs font-bold">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
              </div>
            )}

            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                {syncStatus === 'syncing' ? (
                  <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Salvo...
                  </span>
                ) : syncStatus === 'error' ? (
                  <span className="flex items-center gap-0.5 text-rose-600 font-semibold">
                    <AlertCircle className="h-2.5 w-2.5" /> Errore
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Cloud Attivo
                  </span>
                )}
              </div>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* User & Multi-Device Menu */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* User Info Header */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Utente'}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-petrol text-white flex items-center justify-center text-sm font-bold">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {user.displayName || 'Docente'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {user.email}
                    </div>
                    <div className="inline-flex items-center gap-1 mt-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <ShieldCheck className="h-3 w-3" /> Account Google Verificato
                    </div>
                  </div>
                </div>

                {/* Cloud Sync Status info */}
                <div className="py-2.5 border-b border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Stato Sincronizzazione:</span>
                    <span className="font-bold flex items-center gap-1 text-emerald-600">
                      {syncStatus === 'syncing' ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
                          <span className="text-amber-600">In corso</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="h-3.5 w-3.5" />
                          Sincronizzato
                        </>
                      )}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>Ultimo salvataggio:</span>
                    <span className="font-mono text-slate-600">{formatLastSync(lastSyncedAt)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isLoading}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Sincronizza Adesso
                  </button>
                </div>

                {/* Multi Device Guide Trigger */}
                <div className="py-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDevicesModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 rounded-xl bg-petrol-light/50 p-2 text-left hover:bg-petrol-light transition cursor-pointer"
                  >
                    <div className="rounded-lg bg-petrol p-1.5 text-white">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-petrol">
                        Apri su altri dispositivi
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Come accedere da iPad o smartphone
                      </div>
                    </div>
                  </button>
                </div>

                {/* Logout Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Disconnetti Account Google
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Not logged in: Google Sign In Button */
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
            title="Accedi con Google per sincronizzare tra dispositivi"
          >
            {/* Official Google G SVG icon */}
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Accesso in corso...' : 'Accedi con Google'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDevicesModalOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-petrol hover:bg-slate-100 transition cursor-pointer"
            title="Perché accedere con Google?"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Multi-Device Guide Modal */}
      {isDevicesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-petrol-light p-2 text-petrol">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Sincronizzazione Multi-Dispositivo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Usa il tuo registro ovunque: scuola, casa, tablet o smartphone
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDevicesModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <span className="font-bold">Database Cloud Firebase attivo:</span> quando effettui l'accesso con il tuo account Google, ogni voto, presenza e nota inserita viene salvata sul cloud protetto e sincronizzata in tempo reale su qualsiasi altro dispositivo connesso.
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Come aprire il registro da un altro dispositivo:
                </h4>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-petrol text-white text-xs font-bold shrink-0">
                    1
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold">Apri il link dell'applicazione</span> sul browser del tuo tablet, telefono o computer della scuola.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-petrol text-white text-xs font-bold shrink-0">
                    2
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold">Clicca su "Accedi con Google"</span> in alto a destra ed effettua il login con lo stesso indirizzo email:
                    {user ? (
                      <span className="block mt-1 font-semibold text-petrol bg-white px-2 py-1 rounded border border-slate-200">
                        {user.email}
                      </span>
                    ) : (
                      <span className="block mt-1 text-slate-500 italic">
                        (Il tuo account Google)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-petrol text-white text-xs font-bold shrink-0">
                    3
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold">Tutto pronto!</span> Istituti, alunni, diari delle lezioni e presenze appariranno immediatamente e rimarranno sempre aggiornati.
                  </div>
                </div>
              </div>

              {/* Devices illustration badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="rounded-xl border border-slate-100 p-2 bg-slate-50/50">
                  <Laptop className="h-5 w-5 mx-auto text-slate-600 mb-1" />
                  <span className="text-[11px] font-bold text-slate-700 block">PC / Mac</span>
                  <span className="text-[10px] text-slate-400">Aula e casa</span>
                </div>
                <div className="rounded-xl border border-slate-100 p-2 bg-slate-50/50">
                  <Smartphone className="h-5 w-5 mx-auto text-slate-600 mb-1" />
                  <span className="text-[11px] font-bold text-slate-700 block">Smartphone</span>
                  <span className="text-[10px] text-slate-400">Rapido appello</span>
                </div>
                <div className="rounded-xl border border-slate-100 p-2 bg-slate-50/50">
                  <Laptop className="h-5 w-5 mx-auto text-slate-600 mb-1" />
                  <span className="text-[11px] font-bold text-slate-700 block">iPad / Tablet</span>
                  <span className="text-[10px] text-slate-400">Durante la lezione</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-3.5">
              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsDevicesModalOpen(false);
                    handleLogin();
                  }}
                  className="rounded-xl bg-terracotta px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-terracotta-hover transition cursor-pointer"
                >
                  Accedi Ora con Google
                </button>
              ) : (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Dispositivo attualmente sincronizzato
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsDevicesModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer ml-auto"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
