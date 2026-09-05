import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { X, UserPlus, Music, GraduationCap } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  schoolId: string;
  studentToEdit?: Student | null;
}

const COMMON_LEVELS = ['Propedeutico', 'Base', 'Intermedio', 'Avanzato', 'Grado 1', 'Grado 2', 'Grado 3', 'Grado 4', 'Grado 5'];
const COMMON_YEARS = ['1° Anno', '2° Anno', '3° Anno', '4° Anno', '5° Anno'];
const COMMON_INSTRUMENTS = [
  'Pianoforte',
  'Chitarra Classica',
  'Violino',
  'Violoncello',
  'Flauto Traverso',
  'Clarinetto',
  'Sassofono',
  'Tromba',
  'Batteria e Percussioni',
  'Canto',
  'Teoria e Solfeggio',
  'Altro',
];

export const StudentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  schoolId,
  studentToEdit,
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    firstName: '',
    lastName: '',
    level: 'Base',
    academicYear: '1° Anno',
    attendsMusicTheory: false,
    musicTheoryTeacher: '',
    instrument: 'Pianoforte',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    if (studentToEdit) {
      setFormData({ ...studentToEdit });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        level: 'Base',
        academicYear: '1° Anno',
        attendsMusicTheory: false,
        musicTheoryTeacher: '',
        instrument: 'Pianoforte',
        email: '',
        phone: '',
        notes: '',
      });
    }
  }, [studentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      alert('Inserisci nome e cognome dell\'alunno.');
      return;
    }

    const newStudent: Student = {
      id: studentToEdit ? studentToEdit.id : `stud-${Date.now()}`,
      schoolId: studentToEdit ? studentToEdit.schoolId : schoolId,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      level: formData.level || 'Base',
      academicYear: formData.academicYear || '1° Anno',
      attendsMusicTheory: Boolean(formData.attendsMusicTheory),
      musicTheoryTeacher: formData.attendsMusicTheory ? formData.musicTheoryTeacher?.trim() || '' : '',
      instrument: formData.instrument?.trim() || 'Pianoforte',
      email: formData.email?.trim() || '',
      phone: formData.phone?.trim() || '',
      notes: formData.notes?.trim() || '',
      enrollmentDate: studentToEdit?.enrollmentDate || new Date().toISOString().split('T')[0],
    };

    onSave(newStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-petrol-light p-2 text-petrol">
              {studentToEdit ? <GraduationCap className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {studentToEdit ? 'Modifica Scheda Alunno' : 'Nuova Scheda Alunno'}
              </h2>
              <p className="text-xs text-slate-500">
                Informazioni anagrafiche, livello, anno e teoria musicale
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Nome e Cognome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Alunno *
              </label>
              <input
                type="text"
                required
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="es. Chiara"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cognome Alunno *
              </label>
              <input
                type="text"
                required
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="es. Ferrari"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Livello e Anno di Frequenza */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Livello *
              </label>
              <select
                value={formData.level || 'Base'}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {COMMON_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anno di Frequenza *
              </label>
              <select
                value={formData.academicYear || '1° Anno'}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {COMMON_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Strumento / Corso
              </label>
              <input
                type="text"
                list="instruments-list"
                value={formData.instrument || ''}
                onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                placeholder="es. Pianoforte"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <datalist id="instruments-list">
                {COMMON_INSTRUMENTS.map((ins) => (
                  <option key={ins} value={ins} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Teoria Musicale Section with flag and Teacher */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-slate-800">
                  Frequenta la Teoria Musicale?
                </span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={Boolean(formData.attendsMusicTheory)}
                  onChange={(e) =>
                    setFormData({ ...formData, attendsMusicTheory: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-slate-300 after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                <span className="ml-2 text-xs font-medium text-slate-700">
                  {formData.attendsMusicTheory ? 'Sì' : 'No'}
                </span>
              </label>
            </div>

            {formData.attendsMusicTheory && (
              <div className="pt-2 border-t border-amber-200/60 animate-fadeIn">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Insegnante / Docente di Teoria Musicale
                </label>
                <input
                  type="text"
                  value={formData.musicTheoryTeacher || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, musicTheoryTeacher: e.target.value })
                  }
                  placeholder="es. Prof.ssa Rossana Bellini"
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Contatti facoltativi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email di riferimento
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="es. famiglia@example.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefono / Cellulare
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="es. +39 347 1234567"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Note Alunno */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Note e particolarità didattiche
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="es. Preferenze di repertorio, obiettivi dell'anno scolastico..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="rounded-xl bg-terracotta px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-terracotta-hover transition cursor-pointer"
            >
              {studentToEdit ? 'Aggiorna Scheda' : 'Salva Alunno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
