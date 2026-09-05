import React, { useState } from 'react';
import { School } from '../types';
import {
  Building2,
  Users,
  Calendar,
  BarChart3,
  Database,
  ChevronDown,
  BookOpen,
} from 'lucide-react';

interface Props {
  schools: School[];
  activeSchool: School;
  onSelectSchool: (id: string) => void;
  onOpenSchoolManager: () => void;
  onOpenBackupModal: () => void;
  activeMainTab: 'alunni' | 'appello' | 'statistiche';
  onChangeMainTab: (tab: 'alunni' | 'appello' | 'statistiche') => void;
  totalStudentsInActiveSchool: number;
}

export const Navbar: React.FC<Props> = ({
  schools,
  activeSchool,
  onSelectSchool,
  onOpenSchoolManager,
  onOpenBackupModal,
  activeMainTab,
  onChangeMainTab,
  totalStudentsInActiveSchool,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md no-print">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand & School Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-[#E8845C] p-2 text-white shadow-xs">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-extrabold text-slate-900 leading-tight">
                  Registro Docenti
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">
                  Presenze, Diario & Valutazioni
                </p>
              </div>
            </div>

            {/* School Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
              >
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span className="max-w-[140px] sm:max-w-[200px] truncate">
                  {activeSchool?.name || 'Seleziona Scuola'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-20">
                    <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      Istituti / Scuole
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                      {schools.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            onSelectSchool(s.id);
                            setDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
                            s.id === activeSchool?.id
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{s.name}</span>
                          {s.id === activeSchool?.id && (
                            <span className="h-2 w-2 rounded-full bg-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onOpenSchoolManager();
                        }}
                        className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        + Gestisci o Aggiungi Scuole
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => onChangeMainTab('alunni')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeMainTab === 'alunni'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Alunni ({totalStudentsInActiveSchool})
            </button>

            <button
              onClick={() => onChangeMainTab('appello')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeMainTab === 'appello'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Appello & Presenze
            </button>

            <button
              onClick={() => onChangeMainTab('statistiche')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeMainTab === 'statistiche'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Report & Statistiche
            </button>
          </nav>

          {/* Right Action: Backup Database & Local Storage */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenBackupModal}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:shadow-xs transition cursor-pointer"
              title="Backup, Esportazione e Ripristino JSON"
            >
              <Database className="h-4 w-4 text-[#2C6E63]" />
              <span>Backup & Dati</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden py-2 border-t border-slate-100 justify-around text-xs font-bold">
          <button
            onClick={() => onChangeMainTab('alunni')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg ${
              activeMainTab === 'alunni' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Alunni
          </button>
          <button
            onClick={() => onChangeMainTab('appello')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg ${
              activeMainTab === 'appello' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" /> Appello
          </button>
          <button
            onClick={() => onChangeMainTab('statistiche')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg ${
              activeMainTab === 'statistiche' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" /> Statistiche
          </button>
        </div>
      </div>
    </header>
  );
};
