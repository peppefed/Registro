import React, { useState } from 'react';
import { School } from '../types';
import { StorageService } from '../services/storage';
import { Building2, Plus, Edit2, Trash2, CheckCircle2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeSchoolId: string;
  onSelectSchool: (id: string) => void;
  onSchoolsChanged: () => void;
}

export const SchoolManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeSchoolId,
  onSelectSchool,
  onSchoolsChanged,
}) => {
  const [schools, setSchools] = useState<School[]>(StorageService.getSchools());
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<School>>({
    name: '',
    city: '',
    academicYear: '2025/2026',
    address: '',
    phone: '',
    notes: '',
  });

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingSchool(null);
    setFormData({
      name: '',
      city: '',
      academicYear: '2025/2026',
      address: '',
      phone: '',
      notes: '',
    });
  };

  const handleStartEdit = (school: School) => {
    setEditingSchool(school);
    setIsCreating(false);
    setFormData({ ...school });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    let updatedSchools: School[];
    if (editingSchool) {
      updatedSchools = schools.map((s) =>
        s.id === editingSchool.id ? ({ ...s, ...formData } as School) : s
      );
    } else {
      const newSchool: School = {
        id: `school-${Date.now()}`,
        name: formData.name.trim(),
        city: formData.city?.trim() || '',
        academicYear: formData.academicYear?.trim() || '2025/2026',
        address: formData.address?.trim() || '',
        phone: formData.phone?.trim() || '',
        notes: formData.notes?.trim() || '',
      };
      updatedSchools = [...schools, newSchool];
      onSelectSchool(newSchool.id);
    }

    StorageService.saveSchools(updatedSchools);
    setSchools(updatedSchools);
    setIsCreating(false);
    setEditingSchool(null);
    onSchoolsChanged();
  };

  const handleDelete = (id: string) => {
    if (schools.length <= 1) {
      alert('Non puoi eliminare l\'unica scuola presente.');
      return;
    }
    const studentCount = StorageService.getStudents(id).length;
    if (studentCount > 0) {
      if (!confirm(`Questa scuola ha ${studentCount} alunni associati. Vuoi comunque eliminarla?`)) {
        return;
      }
    } else {
      if (!confirm('Sei sicuro di voler eliminare questa scuola?')) return;
    }

    const updated = schools.filter((s) => s.id !== id);
    StorageService.saveSchools(updated);
    setSchools(updated);

    if (activeSchoolId === id && updated.length > 0) {
      onSelectSchool(updated[0].id);
    }
    onSchoolsChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-petrol-light p-2 text-petrol">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Gestione Istituti e Scuole</h2>
              <p className="text-xs text-slate-500">
                Separa gli elenchi per scuola mantenendo il database unificato
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Action to create */}
          {!isCreating && !editingSchool && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">
                Scuole configurate ({schools.length})
              </span>
              <button
                type="button"
                onClick={handleStartCreate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-terracotta px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-terracotta-hover transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Aggiungi Nuova Scuola
              </button>
            </div>
          )}

          {/* Form when creating or editing */}
          {(isCreating || editingSchool) && (
            <form onSubmit={handleSave} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <h3 className="text-sm font-bold text-indigo-900">
                  {editingSchool ? 'Modifica Dati Scuola' : 'Nuova Scuola o Istituto'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingSchool(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Annulla
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Scuola / Istituto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="es. Accademia Musicale Mozart o I.C. Verdi"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Città</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="es. Milano (MI)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Anno Scolastico
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear || '2025/2026'}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="2025/2026"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Indirizzo</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="es. Via Garibaldi 10"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefono / Contatto</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="es. 02 1234567"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Note Scuola</label>
                  <input
                    type="text"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="es. Corsi individuali strumento e musica da camera"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingSchool(null);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-terracotta px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-terracotta-hover transition cursor-pointer"
                >
                  Salva Scuola
                </button>
              </div>
            </form>
          )}

          {/* List of schools */}
          <div className="space-y-3">
            {schools.map((school) => {
              const students = StorageService.getStudents(school.id);
              const isActive = school.id === activeSchoolId;

              return (
                <div
                  key={school.id}
                  className={`rounded-xl border p-4 transition ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-400'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 rounded-lg p-2 ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{school.name}</h4>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Attiva
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-500">
                          {school.city && <span>📍 {school.city}</span>}
                          <span>📅 A.S. {school.academicYear}</span>
                          <span>👥 {students.length} alunni iscritti</span>
                        </div>
                        {school.address && (
                          <p className="mt-1 text-xs text-slate-400">{school.address}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSchool(school.id);
                            onClose();
                          }}
                          className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                        >
                          Seleziona
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(school)}
                        title="Modifica"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(school.id)}
                        title="Elimina"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex justify-end">
          <button
            type="button"
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
