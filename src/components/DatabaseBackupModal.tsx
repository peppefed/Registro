import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { Database, Download, Upload, RotateCcw, X, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
}

export const DatabaseBackupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onDataReset,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    const jsonStr = StorageService.exportFullDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_registro_scolastico_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importFullDatabaseJson(content);
      if (success) {
        setImportStatus('success');
        setTimeout(() => {
          onDataReset();
          onClose();
        }, 1200);
      } else {
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefaults = () => {
    if (confirm('Sei sicuro di voler ripristinare il database ai dati dimostrativi iniziali?')) {
      StorageService.resetToDefaults();
      onDataReset();
      onClose();
    }
  };

  const handleClearAllData = () => {
    const confirmation = prompt(
      'ATTENZIONE: Questa operazione eliminerà tutti gli istituti, alunni, voti, presenze e lezioni salvati nel browser.\n\nPer confermare scrivi "CANCELLA" e premi OK:'
    );
    if (confirmation === 'CANCELLA') {
      StorageService.clearAllData();
      onDataReset();
      onClose();
    } else if (confirmation !== null) {
      alert('Operazione annullata. La parola di conferma inserita non è corretta.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-petrol-light p-2 text-petrol">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Database & Backup Unificato</h2>
              <p className="text-xs text-slate-500">
                Salva o ripristina tutti i dati delle tue scuole in un unico file
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {importStatus === 'success' && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Database importato con successo! Aggiornamento in corso...
            </div>
          )}

          {importStatus === 'error' && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-center gap-2 text-xs text-rose-800 font-semibold">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              Errore: il file selezionato non è un backup JSON valido.
            </div>
          )}

          {/* Export button */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Esporta Backup Completo</h3>
              <p className="text-xs text-slate-500">
                Scarica un file JSON con tutti gli istituti, alunni, presenze, voti e diari.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-1.5 rounded-xl bg-terracotta px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-terracotta-hover transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Scarica
            </button>
          </div>

          {/* Import file */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ripristina da File JSON</h3>
              <p className="text-xs text-slate-500">
                Carica un archivio precedentemente salvato.
              </p>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs transition">
              <Upload className="h-4 w-4" />
              Seleziona File
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset button */}
          <div className="rounded-xl border border-amber-200 p-4 bg-amber-50/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-amber-950">Ripristina Dati Esempio</h3>
              <p className="text-xs text-amber-800/80">
                Ricarica gli studenti, le valutazioni e il calendario dimostrativo.
              </p>
            </div>
            <button
              onClick={handleResetToDefaults}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Ripristina
            </button>
          </div>

          {/* Clear All Data Button */}
          <div className="rounded-xl border border-rose-200 p-4 bg-rose-50/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-rose-950">Cancella Tutti i Dati</h3>
              <p className="text-xs text-rose-700">
                Svuota completamente il registro (alunni, voti, presenze e istituti).
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearAllData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-600 hover:bg-rose-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Cancella Tutto
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
