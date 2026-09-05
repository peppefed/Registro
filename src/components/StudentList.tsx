import React, { useState } from 'react';
import { School, Student } from '../types';
import { StorageService } from '../services/storage';
import { calculateAttendanceStats } from '../utils/statistics';
import {
  Search,
  Plus,
  User,
  Music,
  GraduationCap,
  ArrowRight,
  Edit2,
  Trash2,
  FileDown,
  LayoutGrid,
  List as ListIcon,
  CheckCircle,
} from 'lucide-react';

interface Props {
  school: School;
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export const StudentList: React.FC<Props> = ({
  school,
  students,
  onSelectStudent,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [theoryFilter, setTheoryFilter] = useState('all'); // 'all', 'yes', 'no'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter students
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const instrument = (student.instrument || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(term) || instrument.includes(term);
    const matchesLevel = levelFilter === 'all' || student.level === levelFilter;
    const matchesTheory =
      theoryFilter === 'all' ||
      (theoryFilter === 'yes' && student.attendsMusicTheory) ||
      (theoryFilter === 'no' && !student.attendsMusicTheory);

    return matchesSearch && matchesLevel && matchesTheory;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-indigo-600" />
            Registro Alunni — {school.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredStudents.length} di {students.length} alunni iscritti • A.S. {school.academicYear}
          </p>
        </div>

        <button
          type="button"
          onClick={onAddStudent}
          className="inline-flex items-center gap-2 rounded-xl bg-terracotta px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-terracotta-hover transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Aggiungi Alunno
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca per nome o strumento..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Level filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="all">Tutti i Livelli</option>
            <option value="Base">Base</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzato">Avanzato</option>
          </select>

          {/* Theory filter */}
          <select
            value={theoryFilter}
            onChange={(e) => setTheoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="all">Tutti (Teoria Musicale)</option>
            <option value="yes">Con Teoria Musicale</option>
            <option value="no">Senza Teoria Musicale</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid' ? 'bg-white shadow-2xs text-indigo-600' : 'text-slate-400'
              }`}
              title="Vista Griglia"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${
                viewMode === 'table' ? 'bg-white shadow-2xs text-indigo-600' : 'text-slate-400'
              }`}
              title="Vista Tabellare"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table List */}
      {filteredStudents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
          <User className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Nessun alunno trovato</p>
          <p className="text-xs text-slate-400 mt-1">
            Modifica i criteri di ricerca oppure fai clic su "Aggiungi Alunno".
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const attendance = StorageService.getAttendance(student.id, school.id);
            const stats = calculateAttendanceStats(attendance);
            const evals = StorageService.getEvaluations(student.id, school.id);
            const evalMeta = evals.find((e) => e.type === 'meta_anno');
            const evalFine = evals.find((e) => e.type === 'fine_anno');

            return (
              <div
                key={student.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition">
                        {student.firstName} {student.lastName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-semibold text-slate-600">
                          {student.instrument || 'Strumento'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500">
                          {student.level} ({student.academicYear})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditStudent(student)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Modifica Anagrafica"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteStudent(student.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Elimina Alunno"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Teoria Musicale pill */}
                  <div className="mt-3">
                    {student.attendsMusicTheory ? (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 border border-amber-200">
                        <Music className="h-3.5 w-3.5 text-amber-600" />
                        <span>Teoria: {student.musicTheoryTeacher || 'Iscritto'}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] text-slate-400 border border-slate-100">
                        <span>Senza Teoria</span>
                      </div>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                    <div className="rounded-lg bg-slate-50 p-1.5">
                      <span className="text-[10px] text-slate-400 font-medium block">Presenza</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {stats.presenceRate}%
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-1.5">
                      <span className="text-[10px] text-slate-400 font-medium block">Assenze</span>
                      <span className="font-mono font-bold text-rose-600">{stats.absent}</span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-1.5">
                      <span className="text-[10px] text-slate-400 font-medium block">Valutazioni</span>
                      <span className="font-mono font-bold text-indigo-600">
                        {evalFine
                          ? `${evalFine.overallGrade}`
                          : evalMeta
                          ? `${evalMeta.overallGrade}`
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action button */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectStudent(student)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 px-3 text-xs font-bold text-slate-800 hover:bg-terracotta hover:text-white transition cursor-pointer"
                  >
                    Apri Scheda, Diario & PDF
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-3 px-4">Alunno</th>
                <th className="py-3 px-4">Strumento</th>
                <th className="py-3 px-4">Livello & Anno</th>
                <th className="py-3 px-4">Teoria Musicale</th>
                <th className="py-3 px-4 text-center">Presenze / Assenze</th>
                <th className="py-3 px-4 text-center">Voto Metà Anno</th>
                <th className="py-3 px-4 text-center">Voto Fine Anno</th>
                <th className="py-3 px-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const attendance = StorageService.getAttendance(student.id, school.id);
                const stats = calculateAttendanceStats(attendance);
                const evals = StorageService.getEvaluations(student.id, school.id);
                const evalMeta = evals.find((e) => e.type === 'meta_anno');
                const evalFine = evals.find((e) => e.type === 'fine_anno');

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {student.firstName} {student.lastName}
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {student.instrument || 'Corso'}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {student.level} • {student.academicYear}
                    </td>

                    <td className="py-3 px-4">
                      {student.attendsMusicTheory ? (
                        <span className="text-amber-800 font-medium text-[11px]">
                          ✓ {student.musicTheoryTeacher || 'Sì'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-emerald-600">
                        {stats.presenceRate}%
                      </span>
                      <span className="text-slate-400 text-[11px] ml-1">
                        ({stats.absent} assenze)
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-indigo-700">
                      {evalMeta ? `${evalMeta.overallGrade.toFixed(1)}` : '-'}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                      {evalFine ? `${evalFine.overallGrade.toFixed(1)}` : '-'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(student)}
                          className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                          Scheda
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditStudent(student)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteStudent(student.id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
