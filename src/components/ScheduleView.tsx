import React, { useState, useMemo } from 'react';
import { School, Student, DayOfWeek, AttendanceStatus, AttendanceRecord } from '../types';
import { StorageService } from '../services/storage';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Plus,
  BookOpen,
  Printer,
  ChevronRight,
  Filter,
  CalendarDays,
  Sparkles,
  MapPin,
  CalendarCheck2,
} from 'lucide-react';

interface Props {
  school: School | null;
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
}

const DAYS_OF_WEEK: { id: DayOfWeek; name: string; shortName: string }[] = [
  { id: 'lunedi', name: 'Lunedì', shortName: 'Lun' },
  { id: 'martedi', name: 'Martedì', shortName: 'Mar' },
  { id: 'mercoledi', name: 'Mercoledì', shortName: 'Mer' },
  { id: 'giovedi', name: 'Giovedì', shortName: 'Gio' },
  { id: 'venerdi', name: 'Venerdì', shortName: 'Ven' },
  { id: 'sabato', name: 'Sabato', shortName: 'Sab' },
  { id: 'domenica', name: 'Domenica', shortName: 'Dom' },
];

function getItalianDayOfWeek(date: Date): DayOfWeek {
  const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday...
  switch (dayIndex) {
    case 1:
      return 'lunedi';
    case 2:
      return 'martedi';
    case 3:
      return 'mercoledi';
    case 4:
      return 'giovedi';
    case 5:
      return 'venerdi';
    case 6:
      return 'sabato';
    default:
      return 'domenica';
  }
}

export const ScheduleView: React.FC<Props> = ({
  school,
  students,
  onSelectStudent,
  onEditStudent,
}) => {
  // Today calculation
  const today = new Date();
  const currentItalianDay = getItalianDayOfWeek(today);
  const todayDateStr = today.toISOString().split('T')[0];

  const [activeSubTab, setActiveSubTab] = useState<'giornata' | 'settimana'>('giornata');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentItalianDay);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayDateStr);
  const [quickAttendance, setQuickAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [filterInstrument, setFilterInstrument] = useState<string>('all');

  // Load today's attendance for fast feedback
  React.useEffect(() => {
    if (!school) return;
    const records = StorageService.getAttendanceForDate(selectedDateStr, school.id);
    const map: Record<string, AttendanceStatus> = {};
    records.forEach((r) => {
      map[r.studentId] = r.status;
    });
    setQuickAttendance(map);
  }, [selectedDateStr, school]);

  // Handle Quick Attendance directly from the Daily schedule list
  const handleSetAttendance = (studentId: string, status: AttendanceStatus) => {
    if (!school) return;
    const newStatus = quickAttendance[studentId] === status ? undefined : status;

    if (newStatus) {
      StorageService.setAttendance(studentId, school.id, selectedDateStr, newStatus);
      setQuickAttendance((prev) => ({ ...prev, [studentId]: newStatus }));
    } else {
      // Toggle off
      const existing = StorageService.getAttendanceForDate(selectedDateStr, school.id).find(
        (a) => a.studentId === studentId
      );
      if (existing) {
        StorageService.deleteAttendance(existing.id);
      }
      setQuickAttendance((prev) => {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      });
    }
  };

  // Group students by day
  const studentsByDay = useMemo(() => {
    const map: Record<DayOfWeek, Student[]> = {
      lunedi: [],
      martedi: [],
      mercoledi: [],
      giovedi: [],
      venerdi: [],
      sabato: [],
      domenica: [],
    };

    students.forEach((student) => {
      if (filterInstrument !== 'all' && student.instrument !== filterInstrument) {
        return;
      }
      if (student.lessonDay) {
        map[student.lessonDay].push(student);
      }
    });

    // Sort chronologically by lessonStartTime
    Object.keys(map).forEach((dayKey) => {
      const d = dayKey as DayOfWeek;
      map[d].sort((a, b) => {
        const timeA = a.lessonStartTime || '99:99';
        const timeB = b.lessonStartTime || '99:99';
        return timeA.localeCompare(timeB);
      });
    });

    return map;
  }, [students, filterInstrument]);

  // Students with no schedule set
  const unassignedStudents = useMemo(() => {
    return students.filter((s) => !s.lessonDay);
  }, [students]);

  // Unique instruments for filtering
  const instruments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.instrument) set.add(s.instrument);
    });
    return Array.from(set).sort();
  }, [students]);

  const studentsForSelectedDay = studentsByDay[selectedDay] || [];

  return (
    <div className="space-y-6">
      {/* Header & Sub-tab switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-petrol font-bold text-xs">
              <CalendarCheck2 className="h-3.5 w-3.5 text-petrol" />
              {school?.name || 'Scuola'}
            </span>
            <span className="text-xs text-slate-400 font-medium">• A.S. {school?.academicYear || '2025/2026'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Orario Lezioni & Registro della Giornata
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Visualizza gli alunni previsti per la giornata, segna la presenza in tempo reale e consulta la griglia settimanale completa.
          </p>
        </div>

        {/* Sub-tab view switch and Print */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveSubTab('giornata')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'giornata'
                  ? 'bg-white text-petrol shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Oggi / Giornata
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('settimana')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'settimana'
                  ? 'bg-white text-petrol shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Griglia Settimana
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            title="Stampa Orario"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Stampa</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/70 p-3 rounded-xl border border-slate-200/60 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-semibold text-slate-700">Filtra Strumento / Materia:</span>
          <select
            value={filterInstrument}
            onChange={(e) => setFilterInstrument(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 outline-none focus:border-petrol"
          >
            <option value="all">Tutti gli strumenti ({students.length})</option>
            {instruments.map((ins) => (
              <option key={ins} value={ins}>
                {ins}
              </option>
            ))}
          </select>
        </div>

        {unassignedStudents.length > 0 && (
          <div className="text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 text-xs font-medium">
            ⚠️ <strong>{unassignedStudents.length}</strong> alunni senza orario impostato nella scheda
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 1. GIORNATA VIEW (DAILY FOCUS) */}
      {/* ============================================================ */}
      {activeSubTab === 'giornata' && (
        <div className="space-y-4">
          {/* Day selection pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {DAYS_OF_WEEK.map((day) => {
              const count = studentsByDay[day.id].length;
              const isSelected = selectedDay === day.id;
              const isToday = currentItalianDay === day.id;

              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDay(day.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? 'bg-petrol text-white border-petrol shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{day.name}</span>
                  {isToday && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md uppercase font-black ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-petrol-light text-petrol'
                      }`}
                    >
                      Oggi
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[11px] ${
                      isSelected ? 'bg-white text-petrol font-bold' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Date and Context */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-petrol-light flex items-center justify-center text-petrol font-bold">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 capitalize">
                  Lezioni di {selectedDay} ({studentsForSelectedDay.length} alunni)
                </h3>
                <p className="text-xs text-slate-500">
                  Ordine orario dal primo all'ultimo slot della giornata
                </p>
              </div>
            </div>

            {/* Date Picker for quick attendance linking */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <label className="text-xs font-semibold text-slate-600">Data Appello:</label>
              <input
                type="date"
                value={selectedDateStr}
                onChange={(e) => setSelectedDateStr(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-petrol"
              />
            </div>
          </div>

          {/* List of lessons for the selected day */}
          {studentsForSelectedDay.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">Nessuna lezione programmata di {selectedDay}</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Non ci sono alunni registrati per questo giorno. Puoi impostare il giorno e l'orario di lezione cliccando su ciascun alunno nella scheda "Alunni".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {studentsForSelectedDay.map((student, index) => {
                const currentStatus = quickAttendance[student.id];

                return (
                  <div
                    key={student.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Time & Basic Info */}
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Time badge */}
                      <div className="rounded-xl bg-petrol/10 border border-petrol/20 px-3 py-2 text-center shrink-0 min-w-[90px]">
                        <span className="block text-sm font-black text-petrol">
                          {student.lessonStartTime || '--:--'}
                        </span>
                        <span className="block text-[11px] font-semibold text-slate-500">
                          {student.lessonEndTime ? `fino alle ${student.lessonEndTime}` : ''}
                        </span>
                      </div>

                      {/* Student info */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900">
                            {student.lastName} {student.firstName}
                          </h4>
                          {student.instrument && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                              <Sparkles className="h-3 w-3 text-amber-600" />
                              {student.instrument}
                            </span>
                          )}
                          <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {student.level} • {student.academicYear}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                          {student.lessonRoom && (
                            <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                              <MapPin className="h-3 w-3" />
                              {student.lessonRoom}
                            </span>
                          )}
                          {student.phone && (
                            <span className="text-slate-600">Tel: {student.phone}</span>
                          )}
                          {student.attendsMusicTheory && (
                            <span className="text-amber-700 font-medium">
                              Teoria Musicale {student.musicTheoryTeacher ? `(${student.musicTheoryTeacher})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Attendance & Action buttons */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {/* Quick Attendance Buttons */}
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleSetAttendance(student.id, 'presente')}
                          title="Segna Presente"
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentStatus === 'presente'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>P</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetAttendance(student.id, 'assente')}
                          title="Segna Assente"
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentStatus === 'assente'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>A</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetAttendance(student.id, 'giustificato')}
                          title="Segna Giustificato"
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentStatus === 'giustificato'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>G</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetAttendance(student.id, 'ritardo')}
                          title="Segna Ritardo"
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentStatus === 'ritardo'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>R</span>
                        </button>
                      </div>

                      {/* Open Student Diary or Edit Schedule */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(student)}
                          className="inline-flex items-center gap-1 rounded-xl bg-petrol px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#23584F] transition cursor-pointer"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Diario & Voti</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditStudent(student)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Modifica Orario o Dati Alunno"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. SETTIMANA VIEW (FULL WEEKLY GRID) */}
      {/* ============================================================ */}
      {activeSubTab === 'settimana' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DAYS_OF_WEEK.filter((d) => d.id !== 'domenica').map((day) => {
              const dayStudents = studentsByDay[day.id];
              const isToday = currentItalianDay === day.id;

              return (
                <div
                  key={day.id}
                  className={`bg-white rounded-2xl border ${
                    isToday ? 'border-petrol ring-1 ring-petrol/30' : 'border-slate-200/80'
                  } shadow-xs overflow-hidden flex flex-col`}
                >
                  {/* Day Header */}
                  <div
                    className={`px-4 py-3 border-b flex items-center justify-between ${
                      isToday ? 'bg-petrol text-white border-petrol' : 'bg-slate-50 text-slate-800 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{day.name}</span>
                      {isToday && (
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold uppercase">
                          Oggi
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isToday ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {dayStudents.length}
                    </span>
                  </div>

                  {/* Day Student Slots */}
                  <div className="p-3 space-y-2 flex-1">
                    {dayStudents.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        Nessuna lezione
                      </div>
                    ) : (
                      dayStudents.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => onSelectStudent(s)}
                          className="group p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-petrol/40 hover:shadow-xs transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-petrol">
                              {s.lessonStartTime || '--:--'} - {s.lessonEndTime || ''}
                            </span>
                            {s.lessonRoom && (
                              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 truncate max-w-[80px]">
                                {s.lessonRoom}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-petrol transition mt-1">
                            {s.lastName} {s.firstName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                            <span>{s.instrument || 'Corso'}</span>
                            <span className="text-[10px] text-slate-400">{s.level}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unassigned Students Section */}
          {unassignedStudents.length > 0 && (
            <div className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-5 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h4 className="text-sm font-bold text-amber-950">
                  Alunni senza orario settimanale assegnato ({unassignedStudents.length})
                </h4>
              </div>
              <p className="text-xs text-amber-800 mb-3">
                Clicca su un alunno per assegnargli giorno, orario e aula di lezione:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {unassignedStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onEditStudent(s)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200 text-left hover:border-amber-400 transition cursor-pointer shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {s.lastName} {s.firstName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {s.instrument || 'Strumento'}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      + Assegna
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
