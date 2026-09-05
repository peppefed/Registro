import React, { useState } from 'react';
import { School, Student, AttendanceRecord } from '../types';
import { StorageService } from '../services/storage';
import { calculateAttendanceStats } from '../utils/statistics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Download,
  CheckCircle,
} from 'lucide-react';

interface Props {
  school: School;
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

export const MonthlyReportsView: React.FC<Props> = ({
  school,
  students,
  onSelectStudent,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or '2025-10', etc.
  const attendance = StorageService.getAttendance(undefined, school.id);

  // Extract unique available months from attendance
  const availableMonths = Array.from(
    new Set(attendance.map((a) => a.date.substring(0, 7)))
  ).sort();

  // Compute student stats for selected filter
  const studentMetrics = students.map((student) => {
    let studentRecords = attendance.filter((a) => a.studentId === student.id);
    if (selectedMonth !== 'all') {
      studentRecords = studentRecords.filter((a) => a.date.startsWith(selectedMonth));
    }
    const stats = calculateAttendanceStats(studentRecords);
    return {
      student,
      stats,
    };
  });

  // Overall class stats
  const totalPresences = studentMetrics.reduce((acc, sm) => acc + sm.stats.present, 0);
  const totalAbsences = studentMetrics.reduce((acc, sm) => acc + sm.stats.absent, 0);
  const totalRecorded = studentMetrics.reduce((acc, sm) => acc + sm.stats.total, 0);
  const classPresenceRate =
    totalRecorded > 0 ? Number(((totalPresences / totalRecorded) * 100).toFixed(1)) : 100;

  // Chart dataset
  const chartData = studentMetrics.map((sm) => ({
    name: `${sm.student.firstName} ${sm.student.lastName.charAt(0)}.`,
    presenze: sm.stats.present,
    assenze: sm.stats.absent,
    rate: sm.stats.presenceRate,
  }));

  // High absence alerts (< 80% presence)
  const criticalStudents = studentMetrics.filter(
    (sm) => sm.stats.total >= 4 && sm.stats.presenceRate < 80
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-petrol" />
            Report Mensili e Statistiche Frequenza
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {school.name} • Monitoraggio periodico assenze e percentuale presenze
          </p>
        </div>

        {/* Filter by month */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Periodo:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-xs outline-none"
          >
            <option value="all">Intero Anno Scolastico</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                Mese: {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500 block">Presenza Media Classe</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {classPresenceRate}%
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500 block">Assenze Totali Periodo</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 font-mono">{totalAbsences}</span>
            <span className="text-xs text-slate-400">giorni</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500 block">Lezioni Registrate</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalRecorded}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500 block">Casi di Attenzione</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 font-mono">
              {criticalStudents.length}
            </span>
            <span className="text-xs text-slate-400">frequenza &lt;80%</span>
          </div>
        </div>
      </div>

      {/* Warning alert banner if high absences */}
      {criticalStudents.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <strong className="font-bold">Attenzione assenze elevate:</strong> I seguenti studenti
            presentano una percentuale di assenze superiore al 20%:
            <div className="mt-1 flex flex-wrap gap-2">
              {criticalStudents.map((cs) => (
                <span
                  key={cs.student.id}
                  onClick={() => onSelectStudent(cs.student)}
                  className="cursor-pointer font-semibold underline text-amber-950 hover:text-indigo-700"
                >
                  {cs.student.firstName} {cs.student.lastName} ({cs.stats.absenceRate}% assenze)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Grafico Comparativo Presenze vs Assenze per Studente
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Visualizzazione immediata del carico di presenze di ogni singolo alunno
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `${val} lezioni`,
                  name === 'presenze' ? 'Presenze' : 'Assenze',
                ]}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="presenze" fill="#8FA998" radius={[4, 4, 0, 0]} name="Presenze" />
              <Bar dataKey="assenze" fill="#C4644F" radius={[4, 4, 0, 0]} name="Assenze" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">
            Elenco Studenti e Riepilogo Frequenza
          </h3>
          <span className="text-xs text-slate-500">
            Clicca su "Apri Report" per visualizzare o generare il PDF
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-3 px-4">Alunno</th>
                <th className="py-3 px-4">Livello & Anno</th>
                <th className="py-3 px-4">Teoria Musicale</th>
                <th className="py-3 px-4 text-emerald-700">Presenze</th>
                <th className="py-3 px-4 text-rose-700">Assenze</th>
                <th className="py-3 px-4">Tasso Presenza</th>
                <th className="py-3 px-4 text-right">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentMetrics.map(({ student, stats }) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {student.firstName} {student.lastName}
                    <span className="block text-[11px] font-normal text-slate-400">
                      {student.instrument}
                    </span>
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

                  <td className="py-3 px-4 font-mono font-bold text-salvia-dark">{stats.present}</td>

                  <td className="py-3 px-4 font-mono font-bold text-mattone">{stats.absent}</td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-bold ${
                          stats.presenceRate < 80 ? 'text-mattone' : 'text-slate-900'
                        }`}
                      >
                        {stats.presenceRate}%
                      </span>
                      <div className="h-1.5 w-16 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${stats.presenceRate}%` }}
                          className={`h-full rounded-full ${
                            stats.presenceRate < 80 ? 'bg-mattone' : 'bg-salvia'
                          }`}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectStudent(student)}
                      className="inline-flex items-center gap-1 font-semibold text-petrol hover:text-terracotta transition cursor-pointer"
                    >
                      Apri Report <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
