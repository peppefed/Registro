import React, { useState, useMemo, useEffect } from 'react';
import {
  School,
  Student,
  DayOfWeek,
  AttendanceStatus,
  SchoolCalendarDay,
  CalendarDayType,
  ScheduledLesson,
} from '../types';
import { StorageService } from '../services/storage';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  BookOpen,
  Printer,
  ChevronRight,
  ChevronLeft,
  Filter,
  CalendarDays,
  Sparkles,
  MapPin,
  CalendarCheck2,
  Trash2,
  Check,
  Edit2,
  Tag,
  Info,
  Layers,
  CheckSquare,
} from 'lucide-react';

interface Props {
  school: School | null;
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
}

const DAYS_OF_WEEK: { id: DayOfWeek; name: string; shortName: string; index: number }[] = [
  { id: 'lunedi', name: 'Lunedì', shortName: 'Lun', index: 1 },
  { id: 'martedi', name: 'Martedì', shortName: 'Mar', index: 2 },
  { id: 'mercoledi', name: 'Mercoledì', shortName: 'Mer', index: 3 },
  { id: 'giovedi', name: 'Giovedì', shortName: 'Gio', index: 4 },
  { id: 'venerdi', name: 'Venerdì', shortName: 'Ven', index: 5 },
  { id: 'sabato', name: 'Sabato', shortName: 'Sab', index: 6 },
  { id: 'domenica', name: 'Domenica', shortName: 'Dom', index: 0 },
];

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const DAY_TYPE_CONFIG: Record<CalendarDayType, { label: string; bg: string; text: string; border: string; badge: string; dot: string }> = {
  lezione: {
    label: 'Lezione Effettiva',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    badge: 'bg-emerald-600 text-white',
    dot: 'bg-emerald-500',
  },
  recupero: {
    label: 'Recupero / Straordinaria',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    badge: 'bg-amber-600 text-white',
    dot: 'bg-amber-500',
  },
  saggio: {
    label: 'Saggio / Concerto / Evento',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-300',
    badge: 'bg-purple-600 text-white',
    dot: 'bg-purple-500',
  },
  festivo: {
    label: 'Festività / Chiusura',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-300',
    badge: 'bg-rose-600 text-white',
    dot: 'bg-rose-500',
  },
  sospensione: {
    label: 'Sospensione Didattica',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    badge: 'bg-slate-600 text-white',
    dot: 'bg-slate-400',
  },
};

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

function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const ScheduleView: React.FC<Props> = ({
  school,
  students,
  onSelectStudent,
  onEditStudent,
}) => {
  const today = new Date();
  const todayIso = formatDateToIso(today);

  // Main navigation tabs inside Calendario & Giornata
  const [activeSubTab, setActiveSubTab] = useState<'calendario' | 'giornata' | 'orario_settimanale'>('calendario');

  // Month navigation for the calendar
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-11

  // Selected date for "Giornata" view
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayIso);

  // Quick attendance map for selected date
  const [quickAttendance, setQuickAttendance] = useState<Record<string, AttendanceStatus>>({});

  // Filter by instrument
  const [filterInstrument, setFilterInstrument] = useState<string>('all');

  // School calendar days from storage
  const [calendarDays, setCalendarDays] = useState<SchoolCalendarDay[]>(() => {
    return StorageService.getCalendarDays(school?.id);
  });

  // Scheduled lessons (extra/recuperi) from storage
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>(() => {
    return StorageService.getScheduledLessons(school?.id);
  });

  // Modal / drawer state for setting day type
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [dayModalType, setDayModalType] = useState<CalendarDayType>('lezione');
  const [dayModalTitle, setDayModalTitle] = useState<string>('');
  const [dayModalNotes, setDayModalNotes] = useState<string>('');

  // Modal for adding / editing a specific lesson on a date
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<ScheduledLesson | null>(null);
  const [addLessonDate, setAddLessonDate] = useState<string>(todayIso);
  const [addLessonStudentId, setAddLessonStudentId] = useState<string>('');
  const [addLessonStartTime, setAddLessonStartTime] = useState<string>('15:00');
  const [addLessonEndTime, setAddLessonEndTime] = useState<string>('15:45');
  const [addLessonRoom, setAddLessonRoom] = useState<string>('');
  const [addLessonIsRecupero, setAddLessonIsRecupero] = useState<boolean>(false);
  const [addLessonNotes, setAddLessonNotes] = useState<string>('');

  // Reload calendar data when school changes or external storage updates
  useEffect(() => {
    const reload = () => {
      if (school) {
        setCalendarDays(StorageService.getCalendarDays(school.id));
        setScheduledLessons(StorageService.getScheduledLessons(school.id));
      }
    };
    reload();
    return StorageService.subscribe(reload);
  }, [school]);

  // Load attendance for current selectedDateStr
  useEffect(() => {
    if (!school) return;
    const records = StorageService.getAttendanceForDate(selectedDateStr, school.id);
    const map: Record<string, AttendanceStatus> = {};
    records.forEach((r) => {
      map[r.studentId] = r.status;
    });
    setQuickAttendance(map);
  }, [selectedDateStr, school]);

  // Quick attendance toggle
  const handleSetAttendance = (studentId: string, status: AttendanceStatus) => {
    if (!school) return;
    const newStatus = quickAttendance[studentId] === status ? undefined : status;

    if (newStatus) {
      StorageService.setAttendance(studentId, school.id, selectedDateStr, newStatus);
      setQuickAttendance((prev) => ({ ...prev, [studentId]: newStatus }));
    } else {
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

  // Map of calendar days by date string for quick lookup
  const calendarDayMap = useMemo(() => {
    const map: Record<string, SchoolCalendarDay> = {};
    calendarDays.forEach((d) => {
      map[d.date] = d;
    });
    return map;
  }, [calendarDays]);

  // Open modal to mark/edit a day in the calendar
  const handleOpenDayModal = (dateStr: string) => {
    const existing = calendarDayMap[dateStr];
    setDayModalDate(dateStr);
    if (existing) {
      setDayModalType(existing.type);
      setDayModalTitle(existing.title || '');
      setDayModalNotes(existing.notes || '');
    } else {
      setDayModalType('lezione');
      setDayModalTitle('Giornata di Lezione');
      setDayModalNotes('');
    }
  };

  // Save calendar day definition
  const handleSaveCalendarDay = () => {
    if (!school || !dayModalDate) return;
    const dayObj: SchoolCalendarDay = {
      id: `cal-${school.id}-${dayModalDate}`,
      schoolId: school.id,
      date: dayModalDate,
      type: dayModalType,
      title: dayModalTitle.trim() || undefined,
      notes: dayModalNotes.trim() || undefined,
    };
    StorageService.upsertCalendarDay(dayObj);
    setCalendarDays(StorageService.getCalendarDays(school.id));
    setDayModalDate(null);
  };

  // Remove calendar day designation
  const handleRemoveCalendarDay = (dateStr: string) => {
    if (!school) return;
    StorageService.removeCalendarDay(school.id, dateStr);
    setCalendarDays(StorageService.getCalendarDays(school.id));
    setDayModalDate(null);
  };

  // Open modal to add a new lesson for a date
  const handleOpenAddLesson = (date?: string) => {
    const targetDate = date || selectedDateStr;
    setEditingLesson(null);
    setAddLessonDate(targetDate);
    setAddLessonStudentId('');
    setAddLessonStartTime('15:00');
    setAddLessonEndTime('15:45');
    setAddLessonRoom('');
    setAddLessonIsRecupero(false);
    setAddLessonNotes('');
    setIsAddLessonModalOpen(true);
  };

  // Open modal to edit an existing scheduled lesson
  const handleOpenEditLesson = (lesson: ScheduledLesson) => {
    setEditingLesson(lesson);
    setAddLessonDate(lesson.date);
    setAddLessonStudentId(lesson.studentId);
    setAddLessonStartTime(lesson.startTime);
    setAddLessonEndTime(lesson.endTime || '');
    setAddLessonRoom(lesson.room || '');
    setAddLessonIsRecupero(lesson.isRecupero ?? false);
    setAddLessonNotes(lesson.notes || '');
    setIsAddLessonModalOpen(true);
  };

  // Save an individual scheduled lesson (create new or update existing)
  const handleSaveScheduledLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !addLessonStudentId || !addLessonDate) return;

    if (editingLesson) {
      const updated: ScheduledLesson = {
        ...editingLesson,
        studentId: addLessonStudentId,
        date: addLessonDate,
        startTime: addLessonStartTime,
        endTime: addLessonEndTime || undefined,
        room: addLessonRoom.trim() || undefined,
        isRecupero: addLessonIsRecupero,
        notes: addLessonNotes.trim() || undefined,
      };
      StorageService.upsertScheduledLesson(updated);
    } else {
      const newLesson: ScheduledLesson = {
        id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        schoolId: school.id,
        studentId: addLessonStudentId,
        date: addLessonDate,
        startTime: addLessonStartTime,
        endTime: addLessonEndTime || undefined,
        room: addLessonRoom.trim() || undefined,
        isRecupero: addLessonIsRecupero,
        notes: addLessonNotes.trim() || undefined,
      };
      StorageService.upsertScheduledLesson(newLesson);
    }

    setScheduledLessons(StorageService.getScheduledLessons(school.id));

    // Ensure this date is marked in the calendar as a lesson day if not already marked
    if (!calendarDayMap[addLessonDate]) {
      StorageService.upsertCalendarDay({
        id: `cal-${school.id}-${addLessonDate}`,
        schoolId: school.id,
        date: addLessonDate,
        type: addLessonIsRecupero ? 'recupero' : 'lezione',
        title: addLessonIsRecupero ? 'Lezione di Recupero' : 'Giornata di Lezione',
      });
      setCalendarDays(StorageService.getCalendarDays(school.id));
    }

    if (addLessonDate !== selectedDateStr) {
      setSelectedDateStr(addLessonDate);
    }

    setIsAddLessonModalOpen(false);
    setEditingLesson(null);
    setAddLessonStudentId('');
    setAddLessonNotes('');
  };

  // Delete a scheduled lesson
  const handleDeleteScheduledLesson = (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa lezione da questa giornata?')) return;
    StorageService.deleteScheduledLesson(id);
    if (school) {
      const remaining = StorageService.getScheduledLessons(school.id);
      setScheduledLessons(remaining);
      const remainingOnDate = remaining.filter((l) => l.date === selectedDateStr);
      if (remainingOnDate.length === 0 && calendarDayMap[selectedDateStr]?.type === 'lezione') {
        StorageService.removeCalendarDay(school.id, selectedDateStr);
        setCalendarDays(StorageService.getCalendarDays(school.id));
      }
    }
  };

  // Quick insert a registered student to this day
  const handleQuickAddStudent = (student: Student) => {
    if (!school) return;
    const newLesson: ScheduledLesson = {
      id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      schoolId: school.id,
      studentId: student.id,
      date: selectedDateStr,
      startTime: student.lessonStartTime || '15:00',
      endTime: student.lessonEndTime || undefined,
      room: student.lessonRoom || undefined,
      isRecupero: false,
    };
    StorageService.upsertScheduledLesson(newLesson);
    setScheduledLessons(StorageService.getScheduledLessons(school.id));

    if (!calendarDayMap[selectedDateStr]) {
      StorageService.upsertCalendarDay({
        id: `cal-${school.id}-${selectedDateStr}`,
        schoolId: school.id,
        date: selectedDateStr,
        type: 'lezione',
        title: 'Giornata di Lezione',
      });
      setCalendarDays(StorageService.getCalendarDays(school.id));
    }
  };

  // Quick insert all regular students of this weekday to selectedDateStr
  const handleAddAllRegularStudentsForDay = () => {
    if (!school || unaddedRegularStudents.length === 0) return;
    unaddedRegularStudents.forEach((st) => {
      StorageService.upsertScheduledLesson({
        id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        schoolId: school.id,
        studentId: st.id,
        date: selectedDateStr,
        startTime: st.lessonStartTime || '15:00',
        endTime: st.lessonEndTime || undefined,
        room: st.lessonRoom || undefined,
        isRecupero: false,
      });
    });
    setScheduledLessons(StorageService.getScheduledLessons(school.id));

    if (!calendarDayMap[selectedDateStr]) {
      StorageService.upsertCalendarDay({
        id: `cal-${school.id}-${selectedDateStr}`,
        schoolId: school.id,
        date: selectedDateStr,
        type: 'lezione',
        title: 'Giornata di Lezione',
      });
      setCalendarDays(StorageService.getCalendarDays(school.id));
    }
  };

  // Calculate day-of-week for selected date
  const selectedDateObj = useMemo(() => {
    const parts = selectedDateStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date();
  }, [selectedDateStr]);

  const selectedItalianDay = useMemo(() => {
    return getItalianDayOfWeek(selectedDateObj);
  }, [selectedDateObj]);

  const selectedDayConfig = calendarDayMap[selectedDateStr];

  // Regular students registered for this weekday (used for quick-add suggestions only)
  const regularStudentsForDay = useMemo(() => {
    return students.filter((s) => s.lessonDay === selectedItalianDay);
  }, [students, selectedItalianDay]);

  // Regular students that have NOT yet been scheduled for this date
  const unaddedRegularStudents = useMemo(() => {
    const scheduledStudentIds = new Set(
      scheduledLessons.filter((l) => l.date === selectedDateStr).map((l) => l.studentId)
    );
    return regularStudentsForDay.filter((s) => !scheduledStudentIds.has(s.id));
  }, [regularStudentsForDay, scheduledLessons, selectedDateStr]);

  // Lessons for selected date: ONLY explicitly added / scheduled lessons
  const lessonsForSelectedDate = useMemo(() => {
    const list: Array<{
      student: Student;
      startTime: string;
      endTime?: string;
      room?: string;
      isRecupero: boolean;
      customScheduledId: string;
      notes?: string;
      scheduledLesson: ScheduledLesson;
    }> = [];

    scheduledLessons
      .filter((sl) => sl.date === selectedDateStr)
      .forEach((sl) => {
        const student = students.find((s) => s.id === sl.studentId);
        if (!student) return;
        if (filterInstrument !== 'all' && student.instrument !== filterInstrument) return;

        list.push({
          student,
          startTime: sl.startTime,
          endTime: sl.endTime,
          room: sl.room || student.lessonRoom,
          isRecupero: sl.isRecupero ?? false,
          customScheduledId: sl.id,
          notes: sl.notes,
          scheduledLesson: sl,
        });
      });

    return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [students, scheduledLessons, selectedDateStr, filterInstrument]);

  // Calendar grid computation
  const calendarMonthGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Day of week of 1st day (0 is Sun, 1 is Mon...)
    // Shift so Monday = 0, Sunday = 6
    let startDayCol = firstDay.getDay() - 1;
    if (startDayCol < 0) startDayCol = 6;

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      calendarDay?: SchoolCalendarDay;
      isToday: boolean;
      lessonsCount: number;
    }> = [];

    // Leading empty / previous month cells
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayCol - 1; i >= 0; i--) {
      const prevDate = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      const iso = formatDateToIso(prevDate);
      days.push({
        dateStr: iso,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        calendarDay: calendarDayMap[iso],
        isToday: iso === todayIso,
        lessonsCount: 0,
      });
    }

    // Days of this month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(currentYear, currentMonth, dayNum);
      const iso = formatDateToIso(d);

      // ONLY count explicitly scheduled lessons on this date
      const effectiveCount = scheduledLessons.filter((s) => s.date === iso).length;
      const calDay = calendarDayMap[iso];

      days.push({
        dateStr: iso,
        dayNumber: dayNum,
        isCurrentMonth: true,
        calendarDay: calDay,
        isToday: iso === todayIso,
        lessonsCount: effectiveCount,
      });
    }

    // Trailing days to fill the 7-column grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      const iso = formatDateToIso(nextDate);
      days.push({
        dateStr: iso,
        dayNumber: i,
        isCurrentMonth: false,
        calendarDay: calendarDayMap[iso],
        isToday: iso === todayIso,
        lessonsCount: 0,
      });
    }

    return days;
  }, [currentYear, currentMonth, calendarDayMap, scheduledLessons, todayIso]);

  // Instruments list
  const instruments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.instrument) set.add(s.instrument);
    });
    return Array.from(set).sort();
  }, [students]);

  // Month stats (based strictly on explicitly scheduled lessons and configured calendar days)
  const monthStats = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const lessonsThisMonth = scheduledLessons.filter((l) => l.date.startsWith(prefix));
    const daysThisMonth = calendarDays.filter((d) => d.date.startsWith(prefix));
    const countRecuperi = lessonsThisMonth.filter((l) => l.isRecupero).length;
    const countSaggi = daysThisMonth.filter((d) => d.type === 'saggio').length;
    const countFestivi = daysThisMonth.filter((d) => d.type === 'festivo' || d.type === 'sospensione').length;

    return {
      totalLessons: lessonsThisMonth.length,
      countRecuperi,
      countSaggi,
      countFestivi,
      totalMarked: daysThisMonth.length,
    };
  }, [calendarDays, scheduledLessons, currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(todayIso);
    setActiveSubTab('giornata');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
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
            Calendario & Giornata
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Inserisci e gestisci le date effettive di lezione, segna saggi e recuperi, e gestisci il tabellone giorno per giorno.
          </p>
        </div>

        {/* View Switcher: Calendario Mensile vs Registro della Giornata */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveSubTab('calendario')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'calendario'
                  ? 'bg-white text-petrol shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Calendario Mensile
            </button>
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
              Giornata Selezionata
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('orario_settimanale')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'orario_settimanale'
                  ? 'bg-white text-petrol shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Orario Settimanale
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoToToday}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <span>Oggi</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            title="Stampa Calendario o Tabellone"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Stampa</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. CALENDARIO MENSILE VIEW */}
      {/* ============================================================ */}
      {activeSubTab === 'calendario' && (
        <div className="space-y-4">
          {/* Month Header and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 min-w-[200px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Actions for this month */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenAddLesson(selectedDateStr)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-petrol px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#23584F] transition cursor-pointer shadow-xs"
                title="Aggiungi una nuova lezione al calendario per il giorno selezionato"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Aggiungi Lezione</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenDayModal(selectedDateStr)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                title="Imposta se la data è una giornata di lezione, festivo o saggio"
              >
                <Tag className="h-3.5 w-3.5 text-slate-500" />
                <span>Tipo Giornata</span>
              </button>
            </div>
          </div>

          {/* Month Summary Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="text-slate-500 font-semibold mr-1">Riepilogo {MONTH_NAMES[currentMonth]}:</span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <strong>{monthStats.totalLessons}</strong> {monthStats.totalLessons === 1 ? 'Lezione Inserita' : 'Lezioni Inserite'}
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <strong>{monthStats.countRecuperi}</strong> Recuperi
            </span>
            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <strong>{monthStats.countSaggi}</strong> Saggi/Eventi
            </span>
            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <strong>{monthStats.countFestivi}</strong> Festività/Chiusure
            </span>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d.id} className="py-2.5 text-xs font-bold text-slate-700">
                  <span className="hidden sm:inline">{d.name}</span>
                  <span className="sm:hidden">{d.shortName}</span>
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
              {calendarMonthGrid.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const typeCfg = cell.calendarDay?.type ? DAY_TYPE_CONFIG[cell.calendarDay.type] : null;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`min-h-[90px] sm:min-h-[110px] p-2 flex flex-col justify-between transition cursor-pointer relative group ${
                      !cell.isCurrentMonth ? 'bg-slate-50/50 text-slate-300' : 'bg-white'
                    } ${
                      isSelected
                        ? 'ring-2 ring-petrol ring-inset bg-teal-50/20'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Top row: day number & action buttons */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-bold rounded-lg h-6 w-6 flex items-center justify-center ${
                          cell.isToday
                            ? 'bg-petrol text-white shadow-xs'
                            : cell.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Quick action buttons on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddLesson(cell.dateStr);
                          }}
                          className="text-slate-400 hover:text-petrol transition p-0.5 rounded hover:bg-teal-50"
                          title="Aggiungi lezione a questo giorno"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDayModal(cell.dateStr);
                          }}
                          className="text-slate-400 hover:text-petrol transition p-0.5 rounded hover:bg-teal-50"
                          title="Configura tipo giornata"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Day type tag */}
                    <div className="my-1 space-y-1">
                      {typeCfg && (
                        <div
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border truncate ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
                          title={cell.calendarDay?.title || typeCfg.label}
                        >
                          {cell.calendarDay?.title || typeCfg.label}
                        </div>
                      )}

                      {/* Lesson counter badge - only shows if lessons have actually been added */}
                      {cell.lessonsCount > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-petrol bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                          <Clock className="h-2.5 w-2.5 text-petrol" />
                          <span>{cell.lessonsCount} {cell.lessonsCount === 1 ? 'lezione' : 'lezioni'}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Quick action to jump to day details */}
                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5 border-t border-slate-50">
                      {cell.dateStr === selectedDateStr ? (
                        <span className="font-bold text-petrol flex items-center gap-0.5">
                          <Check className="h-2.5 w-2.5" /> Selezionato
                        </span>
                      ) : (
                        <span className="opacity-0 group-hover:opacity-100 transition">
                          Apri
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prompt to open the selected day */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-teal-50/60 border border-teal-200/80 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-petrol text-white flex items-center justify-center font-bold">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Data selezionata: {selectedDateStr} ({DAYS_OF_WEEK.find((x) => x.id === selectedItalianDay)?.name})
                </h4>
                <p className="text-xs text-slate-600">
                  {selectedDayConfig ? (
                    <span>Contrassegnata come: <strong>{DAY_TYPE_CONFIG[selectedDayConfig.type].label}</strong> {selectedDayConfig.title ? `(${selectedDayConfig.title})` : ''}</span>
                  ) : (
                    <span>Nessuna configurazione speciale. Clicca su "+ Aggiungi Lezione" per inserire una lezione.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenAddLesson(selectedDateStr)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-petrol text-white text-xs font-bold hover:bg-[#23584F] transition cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Aggiungi Lezione</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenDayModal(selectedDateStr)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-teal-300 bg-white text-xs font-bold text-petrol hover:bg-teal-50 transition cursor-pointer shadow-2xs"
              >
                <Tag className="h-3.5 w-3.5" />
                <span>Tipo Giornata</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('giornata')}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-petrol/30 bg-teal-50/80 text-petrol text-xs font-bold hover:bg-teal-100 transition cursor-pointer"
              >
                <span>Tabellone Giornata</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. GIORNATA VIEW (DAILY FOCUS) */}
      {/* ============================================================ */}
      {activeSubTab === 'giornata' && (
        <div className="space-y-4">
          {/* Day selection and context header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-petrol-light flex items-center justify-center text-petrol font-bold shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 capitalize">
                    {DAYS_OF_WEEK.find((x) => x.id === selectedItalianDay)?.name} {selectedDateStr}
                  </h2>
                  {selectedDayConfig ? (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${DAY_TYPE_CONFIG[selectedDayConfig.type].bg} ${DAY_TYPE_CONFIG[selectedDayConfig.type].text} border ${DAY_TYPE_CONFIG[selectedDayConfig.type].border}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${DAY_TYPE_CONFIG[selectedDayConfig.type].dot}`} />
                      {selectedDayConfig.title || DAY_TYPE_CONFIG[selectedDayConfig.type].label}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      Giorno ordinario
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lessonsForSelectedDate.length} {lessonsForSelectedDate.length === 1 ? 'lezione inserita' : 'lezioni inserite'} • Segna l'appello con un tocco o apri il diario dell'alunno
                </p>
              </div>
            </div>

            {/* Date Picker & Add Lesson Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                <label className="text-xs font-semibold text-slate-600">Cambia Data:</label>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => setSelectedDateStr(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => handleOpenDayModal(selectedDateStr)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <Tag className="h-3.5 w-3.5 text-slate-500" />
                <span>Tipo Giornata</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddLesson(selectedDateStr)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-petrol px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#23584F] transition cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Aggiungi Lezione</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/70 p-3 rounded-xl border border-slate-200/60 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700">Filtra Strumento:</span>
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

            {selectedDayConfig?.notes && (
              <div className="text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-petrol" />
                <span><strong>Nota giornata:</strong> {selectedDayConfig.notes}</span>
              </div>
            )}
          </div>

          {/* List of lessons for the day */}
          {lessonsForSelectedDate.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
              <CalendarIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">
                Nessuna lezione inserita per {selectedDateStr}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                Il calendario per questa data è vuoto. Le lezioni compaiono solo quando le inserisci. Clicca su "+ Aggiungi Lezione" per programmarne una.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddLesson(selectedDateStr)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-petrol px-4 py-2 text-xs font-bold text-white hover:bg-[#23584F] transition cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Aggiungi Lezione a questa Giornata</span>
                </button>
              </div>

              {/* Quick-add shortcuts from students registry */}
              {unaddedRegularStudents.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100 max-w-lg mx-auto">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                    Suggerimento rapido: allievi con orario abituale di {selectedItalianDay} ({unaddedRegularStudents.length}):
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {unaddedRegularStudents.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleQuickAddStudent(st)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-petrol hover:border-teal-300 transition cursor-pointer"
                        title={`Aggiungi ${st.lastName} ${st.firstName} (${st.lessonStartTime || '15:00'})`}
                      >
                        <Plus className="h-3 w-3 text-petrol" />
                        <span>{st.lastName} {st.firstName}</span>
                        {st.lessonStartTime && <span className="text-[10px] text-slate-400">({st.lessonStartTime})</span>}
                      </button>
                    ))}
                    {unaddedRegularStudents.length > 1 && (
                      <button
                        type="button"
                        onClick={handleAddAllRegularStudentsForDay}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-xs font-bold text-petrol hover:bg-teal-100 transition cursor-pointer ml-1"
                      >
                        <CheckSquare className="h-3 w-3 text-petrol" />
                        <span>Aggiungi tutti ({unaddedRegularStudents.length})</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {lessonsForSelectedDate.map((item, index) => {
                const student = item.student;
                const currentStatus = quickAttendance[student.id];

                return (
                  <div
                    key={`${student.id}-${item.customScheduledId || index}`}
                    className={`bg-white rounded-2xl border ${
                      item.isRecupero ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200/80'
                    } p-4 sm:p-5 shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4`}
                  >
                    {/* Time & Basic Info */}
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Time badge */}
                      <div className={`rounded-xl px-3 py-2 text-center shrink-0 min-w-[90px] border ${
                        item.isRecupero ? 'bg-amber-100/70 border-amber-300 text-amber-900' : 'bg-petrol/10 border-petrol/20 text-petrol'
                      }`}>
                        <span className="block text-sm font-black">
                          {item.startTime}
                        </span>
                        <span className="block text-[11px] font-semibold text-slate-500">
                          {item.endTime ? `fino alle ${item.endTime}` : ''}
                        </span>
                      </div>

                      {/* Student info */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900">
                            {student.lastName} {student.firstName}
                          </h4>
                          {item.isRecupero && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-bold">
                              Recupero / Straordinaria
                            </span>
                          )}
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
                          {item.room && (
                            <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                              <MapPin className="h-3 w-3" />
                              {item.room}
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
                          {item.notes && (
                            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-normal">
                              Nota: {item.notes}
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

                      {/* Open Student Diary / Edit / Delete extra */}
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
                          onClick={() => handleOpenEditLesson(item.scheduledLesson)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                          title="Modifica orario, aula o note di questa lezione"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteScheduledLesson(item.customScheduledId)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                          title="Rimuovi lezione da questo giorno"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditStudent(student)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Modifica anagrafica allievo"
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
      {/* 3. ORARIO SETTIMANALE (WEEKLY GRID) */}
      {/* ============================================================ */}
      {activeSubTab === 'orario_settimanale' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DAYS_OF_WEEK.filter((d) => d.id !== 'domenica').map((day) => {
              const dayStudents = students
                .filter((s) => s.lessonDay === day.id)
                .filter((s) => (filterInstrument === 'all' ? true : s.instrument === filterInstrument))
                .sort((a, b) => (a.lessonStartTime || '99:99').localeCompare(b.lessonStartTime || '99:99'));

              return (
                <div
                  key={day.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col"
                >
                  <div className="px-4 py-3 border-b flex items-center justify-between bg-slate-50 text-slate-800 border-slate-100">
                    <span className="font-bold text-sm">{day.name}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {dayStudents.length}
                    </span>
                  </div>

                  <div className="p-3 space-y-2 flex-1">
                    {dayStudents.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        Nessuna lezione ordinaria
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
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CONFIGURA GIORNATA NEL CALENDARIO */}
      {/* ============================================================ */}
      {dayModalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-petrol" />
                Configura Giornata: {dayModalDate}
              </h3>
              <button
                type="button"
                onClick={() => setDayModalDate(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipo di Giornata:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(DAY_TYPE_CONFIG) as CalendarDayType[]).map((typeKey) => {
                    const cfg = DAY_TYPE_CONFIG[typeKey];
                    const isSelected = dayModalType === typeKey;

                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => setDayModalType(typeKey)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                          isSelected
                            ? `${cfg.bg} ${cfg.border} ${cfg.text} ring-1 ring-petrol`
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                          <span>{cfg.label}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-petrol" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titolo / Descrizione Breve (opzionale):
                </label>
                <input
                  type="text"
                  value={dayModalTitle}
                  onChange={(e) => setDayModalTitle(e.target.value)}
                  placeholder="es. Lezioni Ordinarie, Festa della Scuola, Saggio di Natale"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-petrol"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note aggiuntive della giornata (opzionale):
                </label>
                <textarea
                  value={dayModalNotes}
                  onChange={(e) => setDayModalNotes(e.target.value)}
                  placeholder="es. Portare programma di sala per il concerto"
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-petrol"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {calendarDayMap[dayModalDate] ? (
                <button
                  type="button"
                  onClick={() => handleRemoveCalendarDay(dayModalDate)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Rimuovi
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDayModalDate(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSaveCalendarDay}
                  className="px-4 py-1.5 rounded-xl bg-petrol text-xs font-bold text-white hover:bg-[#23584F] cursor-pointer shadow-xs"
                >
                  Salva nel Calendario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: AGGIUNGI / MODIFICA LEZIONE AL GIORNO */}
      {/* ============================================================ */}
      {isAddLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form onSubmit={handleSaveScheduledLesson} className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {editingLesson ? (
                  <>
                    <Edit2 className="h-5 w-5 text-petrol" />
                    <span>Modifica Lezione</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-petrol" />
                    <span>Aggiungi Lezione al Calendario</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddLessonModalOpen(false);
                  setEditingLesson(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data Lezione: *
                </label>
                <input
                  type="date"
                  required
                  value={addLessonDate}
                  onChange={(e) => setAddLessonDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-petrol"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seleziona Alunno: *
                </label>
                <select
                  required
                  value={addLessonStudentId}
                  onChange={(e) => {
                    setAddLessonStudentId(e.target.value);
                    const s = students.find((st) => st.id === e.target.value);
                    if (s && !editingLesson) {
                      if (s.lessonStartTime) setAddLessonStartTime(s.lessonStartTime);
                      if (s.lessonEndTime) setAddLessonEndTime(s.lessonEndTime);
                      if (s.lessonRoom) setAddLessonRoom(s.lessonRoom);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-petrol"
                >
                  <option value="">-- Scegli un allievo --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.lastName} {st.firstName} ({st.instrument || 'Senza strumento'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Orario Inizio: *
                  </label>
                  <input
                    type="time"
                    required
                    value={addLessonStartTime}
                    onChange={(e) => setAddLessonStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-petrol"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Orario Fine:
                  </label>
                  <input
                    type="time"
                    value={addLessonEndTime}
                    onChange={(e) => setAddLessonEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-petrol"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aula / Sala:
                </label>
                <input
                  type="text"
                  value={addLessonRoom}
                  onChange={(e) => setAddLessonRoom(e.target.value)}
                  placeholder="es. Aula 3 (Pianoforte)"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-petrol"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-recupero"
                  checked={addLessonIsRecupero}
                  onChange={(e) => setAddLessonIsRecupero(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-petrol focus:ring-petrol"
                />
                <label htmlFor="chk-recupero" className="text-xs font-bold text-amber-900 cursor-pointer">
                  Contrassegna come Recupero / Lezione Straordinaria
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note per questa lezione:
                </label>
                <input
                  type="text"
                  value={addLessonNotes}
                  onChange={(e) => setAddLessonNotes(e.target.value)}
                  placeholder="es. Recupero assenza del 5 ottobre"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-petrol"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsAddLessonModalOpen(false);
                  setEditingLesson(null);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-petrol text-xs font-bold text-white hover:bg-[#23584F] cursor-pointer shadow-xs"
              >
                {editingLesson ? 'Salva Modifiche' : 'Inserisci Lezione'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
