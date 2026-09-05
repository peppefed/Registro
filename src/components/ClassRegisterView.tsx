import React, { useState } from 'react';
import { School, Student, AttendanceRecord, AttendanceStatus } from '../types';
import { StorageService } from '../services/storage';
import { formatDateItalian } from '../utils/statistics';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  CheckSquare,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Music,
} from 'lucide-react';

interface Props {
  school: School;
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

export const ClassRegisterView: React.FC<Props> = ({
  school,
  students,
  onSelectStudent,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    StorageService.getAttendance(undefined, school.id)
  );

  // Navigate day by day
  const changeDateByDays = (offset: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offset);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const getStudentStatus = (studentId: string): AttendanceStatus | null => {
    const record = attendance.find(
      (a) => a.studentId === studentId && a.date === selectedDate
    );
    return record ? record.status : null;
  };

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    const record: AttendanceRecord = {
      id: `att-${studentId}-${selectedDate}`,
      studentId,
      schoolId: school.id,
      date: selectedDate,
      status,
    };
    StorageService.recordAttendance(record);
    setAttendance(StorageService.getAttendance(undefined, school.id));
  };

  const handleMarkAllPresent = () => {
    students.forEach((s) => {
      const record: AttendanceRecord = {
        id: `att-${s.id}-${selectedDate}`,
        studentId: s.id,
        schoolId: school.id,
        date: selectedDate,
        status: 'presente',
      };
      StorageService.recordAttendance(record);
    });
    setAttendance(StorageService.getAttendance(undefined, school.id));
  };

  // Day summary counts
  const dayRecords = attendance.filter((a) => a.date === selectedDate);
  const presentCount = dayRecords.filter(
    (a) => a.status === 'presente' || a.status === 'ritardo'
  ).length;
  const absentCount = dayRecords.filter((a) => a.status === 'assente').length;
  const lateCount = dayRecords.filter((a) => a.status === 'ritardo').length;
  const rate =
    students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-petrol" />
            Registro Appello Giornaliero di Classe
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {school.name} • Gestisci le presenze e le assenze per ogni data del calendario
          </p>
        </div>

        {/* Date navigator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs transition cursor-pointer"
              title="Giorno precedente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 px-2 outline-none"
            />
            <button
              onClick={() => changeDateByDays(1)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs transition cursor-pointer"
              title="Giorno successivo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleMarkAllPresent}
            className="inline-flex items-center gap-1.5 rounded-xl bg-terracotta px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-terracotta-hover transition cursor-pointer"
          >
            <CheckSquare className="h-4 w-4" />
            Tutti Presenti
          </button>
        </div>
      </div>

      {/* Summary KPI Strip for the chosen day */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500 block">Alunni Iscritti</span>
          <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
            {students.length}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500 block">Presenti Oggi</span>
          <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
            {presentCount}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500 block">Assenze Oggi</span>
          <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">
            {absentCount}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500 block">Tasso Presenze Data</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-indigo-700 font-mono">{rate}%</span>
            <div className="h-2 w-16 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${rate}%` }}
                className="h-full bg-indigo-600 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Roll Call Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800">
            Appello del {formatDateItalian(selectedDate)}
          </h3>
          <span className="text-xs text-slate-500">
            Fai clic sui pulsanti per impostare rapidamente lo stato
          </span>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Nessun alunno presente in questo istituto.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Alunno</th>
                  <th className="py-3 px-4">Corso / Strumento</th>
                  <th className="py-3 px-4">Livello & Anno</th>
                  <th className="py-3 px-4">Teoria Musicale</th>
                  <th className="py-3 px-4 text-center">Stato Appello</th>
                  <th className="py-3 px-4 text-right">Scheda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const status = getStudentStatus(student.id);

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
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Music className="h-3 w-3" />
                            {student.musicTheoryTeacher || 'Sì'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'presente')}
                            className={`px-2.5 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                              status === 'presente'
                                ? 'bg-salvia text-white border-salvia shadow-xs font-bold'
                                : 'bg-white text-salvia-dark border-salvia/40 hover:bg-salvia-light'
                            }`}
                          >
                            Presente
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'assente')}
                            className={`px-2.5 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                              status === 'assente'
                                ? 'bg-mattone text-white border-mattone shadow-xs font-bold'
                                : 'bg-white text-mattone border-mattone/40 hover:bg-mattone-light'
                            }`}
                          >
                            Assente
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'ritardo')}
                            className={`px-2.5 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                              status === 'ritardo'
                                ? 'bg-miele text-white border-miele shadow-xs font-bold'
                                : 'bg-white text-miele-dark border-miele/40 hover:bg-miele-light'
                            }`}
                          >
                            Ritardo
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'giustificato')}
                            className={`px-2.5 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                              status === 'giustificato'
                                ? 'bg-petrol text-white border-petrol shadow-xs font-bold'
                                : 'bg-white text-petrol border-petrol/40 hover:bg-petrol-light'
                            }`}
                          >
                            Giustificato
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(student)}
                          className="inline-flex items-center gap-1 text-petrol hover:text-terracotta font-semibold cursor-pointer"
                        >
                          Apri Diario <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
