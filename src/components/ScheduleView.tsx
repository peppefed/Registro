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
  Users,
  Building2,
} from 'lucide-react';

interface Props {
  school: School | null;
  students: Student[];
  schools?: School[];
  allStudents?: Student[];
  onSelectSchool?: (schoolId: string) => void;
  onSelectStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
}

const SCHOOL_THEMES = [
  {
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    tag: 'bg-teal-600 text-white',
    dot: 'bg-teal-500',
    border: 'border-teal-500',
    light: 'bg-teal-50/50',
    name: 'Teal',
  },
  {
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    tag: 'bg-indigo-600 text-white',
    dot: 'bg-indigo-500',
    border: 'border-indigo-500',
    light: 'bg-indigo-50/50',
    name: 'Indigo',
  },
  {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    tag: 'bg-amber-600 text-white',
    dot: 'bg-amber-500',
    border: 'border-amber-500',
    light: 'bg-amber-50/50',
    name: 'Amber',
  },
  {
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    tag: 'bg-purple-600 text-white',
    dot: 'bg-purple-500',
    border: 'border-purple-500',
    light: 'bg-purple-50/50',
    name: 'Purple',
  },
];

function getSchoolTheme(schoolId?: string, list?: School[]) {
  if (!schoolId || !list || list.length === 0) return SCHOOL_THEMES[0];
  const idx = list.findIndex((s) => s.id === schoolId);
  return SCHOOL_THEMES[(idx >= 0 ? idx : 0) % SCHOOL_THEMES.length];
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
  schools,
  allStudents,
  onSelectSchool,
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

  // School filter: 'all' = Unified view of all schools, or specific school.id
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');

  // Resolve schools and students list
  const schoolsList = useMemo(() => {
    if (schools && schools.length > 0) return schools;
    if (school) return [school];
    return StorageService.getSchools();
  }, [schools, school]);

  const allStudentsList = useMemo(() => {
    if (allStudents && allStudents.length > 0) return allStudents;
    return StorageService.getStudents();
  }, [allStudents]);

  // Effective students based on school filter
  const effectiveStudents = useMemo(() => {
    if (selectedSchoolFilter === 'all') {
      return allStudentsList;
    }
    return allStudentsList.filter((s) => s.schoolId === selectedSchoolFilter);
  }, [allStudentsList, selectedSchoolFilter]);

  // School calendar days from storage (all schools loaded)
  const [calendarDays, setCalendarDays] = useState<SchoolCalendarDay[]>(() => {
    return StorageService.getCalendarDays();
  });

  // Scheduled lessons from storage (all schools loaded)
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>(() => {
    return StorageService.getScheduledLessons();
  });

  // Filtered scheduled lessons based on selected school
  const filteredScheduledLessons = useMemo(() => {
    if (selectedSchoolFilter === 'all') return scheduledLessons;
    return scheduledLessons.filter((l) => {
      const student = allStudentsList.find((s) => s.id === l.studentId);
      return (l.schoolId || student?.schoolId) === selectedSchoolFilter;
    });
  }, [scheduledLessons, selectedSchoolFilter, allStudentsList]);

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

  // Action feedback banner (e.g. after batch adding lessons)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Modal for generating full month lessons
  const [isGenerateMonthModalOpen, setIsGenerateMonthModalOpen] = useState(false);
  const [generateAvoidDuplicates, setGenerateAvoidDuplicates] = useState(true);
  const [generateSetCalendarDays, setGenerateSetCalendarDays] = useState(true);

  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  // Reload calendar data from StorageService
  useEffect(() => {
    const reload = () => {
      setCalendarDays(StorageService.getCalendarDays());
      setScheduledLessons(StorageService.getScheduledLessons());
    };
    reload();
    return StorageService.subscribe(reload);
  }, []);

  // When top active school changes externally, align filter if single-school mode
  useEffect(() => {
    if (school && selectedSchoolFilter !== 'all' && selectedSchoolFilter !== school.id) {
      setSelectedSchoolFilter(school.id);
    }
  }, [school]);

  // Load attendance for current selectedDateStr
  useEffect(() => {
    const targetSchoolId = selectedSchoolFilter !== 'all' ? selectedSchoolFilter : (school?.id || undefined);
    const records = StorageService.getAttendanceForDate(selectedDateStr, targetSchoolId);
    const map: Record<string, AttendanceStatus> = {};
    records.forEach((r) => {
      map[r.studentId] = r.status;
    });
    setQuickAttendance(map);
  }, [selectedDateStr, selectedSchoolFilter, school]);

  // Quick attendance toggle
  const handleSetAttendance = (studentId: string, status: AttendanceStatus) => {
    const student = allStudentsList.find((s) => s.id === studentId);
    const targetSchoolId = student?.schoolId || school?.id;
    if (!targetSchoolId) return;

    const newStatus = quickAttendance[studentId] === status ? undefined : status;

    if (newStatus) {
      StorageService.setAttendance(studentId, targetSchoolId, selectedDateStr, newStatus);
      setQuickAttendance((prev) => ({ ...prev, [studentId]: newStatus }));
    } else {
      const existing = StorageService.getAttendanceForDate(selectedDateStr, targetSchoolId).find(
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
    calendarDays
      .filter((d) => selectedSchoolFilter === 'all' || d.schoolId === selectedSchoolFilter)
      .forEach((d) => {
        map[d.date] = d;
      });
    return map;
  }, [calendarDays, selectedSchoolFilter]);

  // School filter switcher that also syncs the active school at the top
  const handleSelectSchoolFilter = (filterId: string) => {
    setSelectedSchoolFilter(filterId);
    if (filterId !== 'all' && onSelectSchool) {
      onSelectSchool(filterId);
    }
  };

  // Select date AND automatically synchronize the active school at the top
  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);

    // Find all lessons on this date to determine the school
    const lessonsOnDate = scheduledLessons.filter((l) => l.date === dateStr);
    if (lessonsOnDate.length > 0) {
      const counts: Record<string, number> = {};
      lessonsOnDate.forEach((l) => {
        const student = allStudentsList.find((s) => s.id === l.studentId);
        const sId = l.schoolId || student?.schoolId;
        if (sId) counts[sId] = (counts[sId] || 0) + 1;
      });
      const dominantSchoolId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      if (dominantSchoolId && onSelectSchool && dominantSchoolId !== school?.id) {
        onSelectSchool(dominantSchoolId);
      }
    } else {
      // If no lesson scheduled yet, check regular students assigned to that day of week
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const dayOfWeek = getItalianDayOfWeek(dObj);
        const regularForDay = allStudentsList.filter((s) => s.lessonDay === dayOfWeek);
        if (regularForDay.length > 0) {
          const counts: Record<string, number> = {};
          regularForDay.forEach((s) => {
            if (s.schoolId) counts[s.schoolId] = (counts[s.schoolId] || 0) + 1;
          });
          const dominantSchoolId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
          if (dominantSchoolId && onSelectSchool && dominantSchoolId !== school?.id) {
            onSelectSchool(dominantSchoolId);
          }
        }
      }
    }
  };

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
    if (!dayModalDate) return;
    const targetSchoolId = selectedSchoolFilter !== 'all' ? selectedSchoolFilter : (school?.id || schoolsList[0]?.id);
    if (!targetSchoolId) return;

    const dayObj: SchoolCalendarDay = {
      id: `cal-${targetSchoolId}-${dayModalDate}`,
      schoolId: targetSchoolId,
      date: dayModalDate,
      type: dayModalType,
      title: dayModalTitle.trim() || undefined,
      notes: dayModalNotes.trim() || undefined,
    };
    StorageService.upsertCalendarDay(dayObj);
    setCalendarDays(StorageService.getCalendarDays());
    setDayModalDate(null);
  };

  // Remove calendar day designation
  const handleRemoveCalendarDay = (dateStr: string) => {
    const targetSchoolId = selectedSchoolFilter !== 'all' ? selectedSchoolFilter : (school?.id || schoolsList[0]?.id);
    if (!targetSchoolId) return;
    StorageService.removeCalendarDay(targetSchoolId, dateStr);
    setCalendarDays(StorageService.getCalendarDays());
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
    if (!addLessonStudentId || !addLessonDate) return;
    const student = allStudentsList.find((s) => s.id === addLessonStudentId);
    const lessonSchoolId = student?.schoolId || (selectedSchoolFilter !== 'all' ? selectedSchoolFilter : school?.id) || schoolsList[0]?.id;
    if (!lessonSchoolId) return;

    if (editingLesson) {
      const updated: ScheduledLesson = {
        ...editingLesson,
        schoolId: lessonSchoolId,
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
        schoolId: lessonSchoolId,
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

    setScheduledLessons(StorageService.getScheduledLessons());

    // Ensure this date is marked in the calendar as a lesson day if not already marked
    if (!calendarDayMap[addLessonDate]) {
      StorageService.upsertCalendarDay({
        id: `cal-${lessonSchoolId}-${addLessonDate}`,
        schoolId: lessonSchoolId,
        date: addLessonDate,
        type: addLessonIsRecupero ? 'recupero' : 'lezione',
        title: addLessonIsRecupero ? 'Lezione di Recupero' : 'Giornata di Lezione',
      });
      setCalendarDays(StorageService.getCalendarDays());
    }

    // Synchronize school at the top navbar
    if (onSelectSchool && lessonSchoolId !== school?.id) {
      onSelectSchool(lessonSchoolId);
    }

    if (addLessonDate !== selectedDateStr) {
      handleSelectDate(addLessonDate);
    }

    setIsAddLessonModalOpen(false);
    setEditingLesson(null);
    setAddLessonStudentId('');
    setAddLessonNotes('');
  };

  // Delete a scheduled lesson
  const handleDeleteScheduledLesson = (id: string) => {
    StorageService.deleteScheduledLesson(id);
    const remaining = StorageService.getScheduledLessons();
    setScheduledLessons(remaining);
    const remainingOnDate = remaining.filter((l) => l.date === selectedDateStr);
    if (remainingOnDate.length === 0 && calendarDayMap[selectedDateStr]?.type === 'lezione') {
      const targetSchoolId = selectedSchoolFilter !== 'all' ? selectedSchoolFilter : (school?.id || schoolsList[0]?.id);
      if (targetSchoolId) {
        StorageService.removeCalendarDay(targetSchoolId, selectedDateStr);
        setCalendarDays(StorageService.getCalendarDays());
      }
    }
    setActionFeedback('Lezione rimossa con successo.');
  };

  // Quick insert a registered student to this day
  const handleQuickAddStudent = (student: Student) => {
    const studentSchoolId = student.schoolId || school?.id || schoolsList[0]?.id || 'default';
    const newLesson: ScheduledLesson = {
      id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      schoolId: studentSchoolId,
      studentId: student.id,
      date: selectedDateStr,
      startTime: student.lessonStartTime || '15:00',
      endTime: student.lessonEndTime || undefined,
      room: student.lessonRoom || undefined,
      isRecupero: false,
    };
    StorageService.upsertScheduledLesson(newLesson);
    setScheduledLessons(StorageService.getScheduledLessons());

    if (!calendarDayMap[selectedDateStr]) {
      StorageService.upsertCalendarDay({
        id: `cal-${studentSchoolId}-${selectedDateStr}`,
        schoolId: studentSchoolId,
        date: selectedDateStr,
        type: 'lezione',
        title: 'Giornata di Lezione',
      });
      setCalendarDays(StorageService.getCalendarDays());
    }

    // Auto-select school at the top
    if (onSelectSchool && studentSchoolId !== school?.id) {
      onSelectSchool(studentSchoolId);
    }
  };

  // Quick insert all regular students of this weekday to selectedDateStr
  const handleAddAllRegularStudentsForDay = (targetDateStr?: string) => {
    const dateToUse = targetDateStr || selectedDateStr;
    const parts = dateToUse.split('-');
    const dObj = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) : new Date();
    const italianDay = getItalianDayOfWeek(dObj);
    const italianDayName = DAYS_OF_WEEK.find((x) => x.id === italianDay)?.name || italianDay;

    const dayStudents = effectiveStudents.filter((s) => s.lessonDay === italianDay);
    if (dayStudents.length === 0) {
      setActionFeedback(`Nessun allievo ha ${italianDayName} impostato come giorno abituale di lezione.`);
      return;
    }

    const currentScheduled = StorageService.getScheduledLessons();
    const alreadyScheduledIds = new Set(
      currentScheduled.filter((l) => l.date === dateToUse).map((l) => l.studentId)
    );

    const toAdd = dayStudents.filter((s) => !alreadyScheduledIds.has(s.id));
    if (toAdd.length === 0) {
      setActionFeedback(`Tutti gli allievi previsti per ${italianDayName} (${dayStudents.length}) sono già inseriti per la data ${dateToUse}.`);
      return;
    }

    toAdd.forEach((st, idx) => {
      const stSchoolId = st.schoolId || school?.id || schoolsList[0]?.id || 'default';
      StorageService.upsertScheduledLesson({
        id: `sched-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        schoolId: stSchoolId,
        studentId: st.id,
        date: dateToUse,
        startTime: st.lessonStartTime || '15:00',
        endTime: st.lessonEndTime || undefined,
        room: st.lessonRoom || undefined,
        isRecupero: false,
      });
    });

    setScheduledLessons(StorageService.getScheduledLessons());

    if (!calendarDayMap[dateToUse]) {
      const firstSchoolId = dayStudents[0]?.schoolId || school?.id || schoolsList[0]?.id || 'default';
      StorageService.upsertCalendarDay({
        id: `cal-${firstSchoolId}-${dateToUse}`,
        schoolId: firstSchoolId,
        date: dateToUse,
        type: 'lezione',
        title: 'Giornata di Lezione',
      });
      setCalendarDays(StorageService.getCalendarDays());
    }

    // Auto-sync school at the top navbar
    const counts: Record<string, number> = {};
    dayStudents.forEach((s) => {
      if (s.schoolId) counts[s.schoolId] = (counts[s.schoolId] || 0) + 1;
    });
    const dominantSchoolId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    if (dominantSchoolId && onSelectSchool && dominantSchoolId !== school?.id) {
      onSelectSchool(dominantSchoolId);
    }

    setActionFeedback(`Aggiunte con successo ${toAdd.length} lezioni di ${italianDayName} per il ${dateToUse}!`);
  };

  // Execute generation of all scheduled lessons and lesson days for the entire current month
  const executeGenerateMonthLessons = () => {
    const monthName = MONTH_NAMES[currentMonth];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Target students according to school filter
    const targetStudents = effectiveStudents;
    const studentsWithDays = targetStudents.filter((s) => Boolean(s.lessonDay));
    if (studentsWithDays.length === 0) {
      setActionFeedback("Nessun allievo ha un giorno di lezione abituale configurato nell'anagrafica.");
      setIsGenerateMonthModalOpen(false);
      return;
    }

    const currentScheduled = StorageService.getScheduledLessons();
    const existingLessonsKeySet = new Set(
      currentScheduled.map((l) => `${l.date}_${l.studentId}`)
    );

    let addedLessonsCount = 0;
    let addedDaysCount = 0;

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dObj = new Date(currentYear, currentMonth, dayNum);
      const dateStr = formatDateToIso(dObj);
      const italianDay = getItalianDayOfWeek(dObj);

      // Don't overwrite if day is marked as festivo
      const existingDay = calendarDayMap[dateStr];
      if (existingDay?.type === 'festivo') {
        continue;
      }

      // Find students who have lessons on this weekday
      const dayStudents = targetStudents.filter((s) => s.lessonDay === italianDay);
      if (dayStudents.length === 0) continue;

      let addedForThisDay = 0;
      dayStudents.forEach((st, idx) => {
        const key = `${dateStr}_${st.id}`;
        if (!generateAvoidDuplicates || !existingLessonsKeySet.has(key)) {
          const stSchoolId = st.schoolId || school?.id || schoolsList[0]?.id || 'default';
          StorageService.upsertScheduledLesson({
            id: `sched-${Date.now()}-${dayNum}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            schoolId: stSchoolId,
            studentId: st.id,
            date: dateStr,
            startTime: st.lessonStartTime || '15:00',
            endTime: st.lessonEndTime || undefined,
            room: st.lessonRoom || undefined,
            isRecupero: false,
          });
          existingLessonsKeySet.add(key);
          addedLessonsCount++;
          addedForThisDay++;
        }
      });

      // Mark day in school calendar as 'lezione' if enabled and not already marked
      if (generateSetCalendarDays && !existingDay && (dayStudents.length > 0 || addedForThisDay > 0)) {
        const firstStudentSchoolId = dayStudents[0]?.schoolId || school?.id || schoolsList[0]?.id || 'default';
        StorageService.upsertCalendarDay({
          id: `cal-${firstStudentSchoolId}-${dateStr}`,
          schoolId: firstStudentSchoolId,
          date: dateStr,
          type: 'lezione',
          title: 'Giornata di Lezione',
        });
        addedDaysCount++;
      }
    }

    // Refresh state
    setScheduledLessons(StorageService.getScheduledLessons());
    setCalendarDays(StorageService.getCalendarDays());
    setIsGenerateMonthModalOpen(false);

    if (addedLessonsCount > 0) {
      setActionFeedback(`Generate con successo ${addedLessonsCount} lezioni per ${monthName} ${currentYear}!`);
    } else {
      setActionFeedback(`Tutte le lezioni per ${monthName} ${currentYear} risultavano già presenti nel calendario.`);
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
    return effectiveStudents.filter((s) => s.lessonDay === selectedItalianDay);
  }, [effectiveStudents, selectedItalianDay]);

  // Regular students that have NOT yet been scheduled for this date
  const unaddedRegularStudents = useMemo(() => {
    const scheduledStudentIds = new Set(
      filteredScheduledLessons.filter((l) => l.date === selectedDateStr).map((l) => l.studentId)
    );
    return regularStudentsForDay.filter((s) => !scheduledStudentIds.has(s.id));
  }, [regularStudentsForDay, filteredScheduledLessons, selectedDateStr]);

  // Lessons for selected date: ONLY explicitly added / scheduled lessons
  const lessonsForSelectedDate = useMemo(() => {
    const list: Array<{
      student: Student;
      schoolObj?: School;
      startTime: string;
      endTime?: string;
      room?: string;
      isRecupero: boolean;
      customScheduledId: string;
      notes?: string;
      scheduledLesson: ScheduledLesson;
    }> = [];

    filteredScheduledLessons
      .filter((sl) => sl.date === selectedDateStr)
      .forEach((sl) => {
        const student = allStudentsList.find((s) => s.id === sl.studentId);
        if (!student) return;
        if (filterInstrument !== 'all' && student.instrument !== filterInstrument) return;

        const schoolObj = schoolsList.find((sc) => sc.id === (sl.schoolId || student.schoolId));

        list.push({
          student,
          schoolObj,
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
  }, [allStudentsList, schoolsList, filteredScheduledLessons, selectedDateStr, filterInstrument]);

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
      schoolBreakdown: Array<{ schoolId: string; schoolName: string; count: number; theme: any }>;
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
        schoolBreakdown: [],
      });
    }

    // Days of this month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(currentYear, currentMonth, dayNum);
      const iso = formatDateToIso(d);

      // Count explicitly scheduled lessons on this date
      const dayLessons = filteredScheduledLessons.filter((s) => s.date === iso);
      const effectiveCount = dayLessons.length;
      const calDay = calendarDayMap[iso];

      // School breakdown for multi-school visualization
      const schoolCounts: Record<string, number> = {};
      dayLessons.forEach((l) => {
        const student = allStudentsList.find((st) => st.id === l.studentId);
        const sId = l.schoolId || student?.schoolId || 'default';
        schoolCounts[sId] = (schoolCounts[sId] || 0) + 1;
      });

      const schoolBreakdown = Object.entries(schoolCounts).map(([sId, count]) => {
        const sc = schoolsList.find((s) => s.id === sId);
        return {
          schoolId: sId,
          schoolName: sc?.name || 'Scuola',
          count,
          theme: getSchoolTheme(sId, schoolsList),
        };
      });

      days.push({
        dateStr: iso,
        dayNumber: dayNum,
        isCurrentMonth: true,
        calendarDay: calDay,
        isToday: iso === todayIso,
        lessonsCount: effectiveCount,
        schoolBreakdown,
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
        schoolBreakdown: [],
      });
    }

    return days;
  }, [currentYear, currentMonth, calendarDayMap, filteredScheduledLessons, allStudentsList, schoolsList, todayIso]);

  // Instruments list
  const instruments = useMemo(() => {
    const set = new Set<string>();
    effectiveStudents.forEach((s) => {
      if (s.instrument) set.add(s.instrument);
    });
    return Array.from(set).sort();
  }, [effectiveStudents]);

  // Month stats (based strictly on explicitly scheduled lessons and configured calendar days)
  const monthStats = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const lessonsThisMonth = filteredScheduledLessons.filter((l) => l.date.startsWith(prefix));
    const daysThisMonth = calendarDays.filter((d) => {
      const matchesPrefix = d.date.startsWith(prefix);
      const matchesSchool = selectedSchoolFilter === 'all' || d.schoolId === selectedSchoolFilter;
      return matchesPrefix && matchesSchool;
    });
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
  }, [calendarDays, filteredScheduledLessons, selectedSchoolFilter, currentYear, currentMonth]);

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
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Calendario & Giornata
          </h1>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-petrol font-bold text-xs">
              <CalendarCheck2 className="h-3 w-3 text-petrol" />
              {school?.name || 'Scuola'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">• A.S. {school?.academicYear || '2025/2026'}</span>
          </div>
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

      {/* School Integration / Filter Toolbar (when multiple schools exist) */}
      {schoolsList.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Filtro Scuola Calendario:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleSelectSchoolFilter('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedSchoolFilter === 'all'
                  ? 'bg-petrol text-white shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Tutte le Scuole (Unificato)</span>
            </button>

            {schoolsList.map((sc) => {
              const theme = getSchoolTheme(sc.id, schoolsList);
              const isFilterSelected = selectedSchoolFilter === sc.id;
              const isTopActive = school?.id === sc.id;

              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectSchoolFilter(sc.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isFilterSelected
                      ? `${theme.badge} ring-2 ring-current font-black`
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title={`Clicca per filtrare il calendario e selezionare ${sc.name} nella pagina in alto`}
                >
                  <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
                  <span>{sc.name}</span>
                  {isTopActive && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1 rounded ml-0.5">
                      ✓ In alto
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action feedback notification banner */}
      {actionFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

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
                onClick={() => handleAddAllRegularStudentsForDay()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
                title={`Aggiungi tutte le lezioni degli allievi del ${selectedItalianDay} (${regularStudentsForDay.length} allievi) per la data selezionata (${selectedDateStr})`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Aggiungi Giornata</span>
              </button>

              <button
                type="button"
                onClick={() => setIsGenerateMonthModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-petrol transition cursor-pointer shadow-2xs"
                title={`Genera automaticamente tutte le lezioni di ${MONTH_NAMES[currentMonth]} ${currentYear} in base ai giorni abituali degli allievi`}
              >
                <CalendarDays className="h-3.5 w-3.5 text-petrol" />
                <span>Genera Giornate del Mese</span>
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
                    onClick={() => handleSelectDate(cell.dateStr)}
                    className={`min-h-[95px] sm:min-h-[115px] p-2 flex flex-col justify-between transition cursor-pointer relative group ${
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
                          title="Aggiungi singola lezione a questo giorno"
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

                    {/* Middle: Day type tag & School breakdown or count */}
                    <div className="my-1 space-y-1">
                      {typeCfg && (
                        <div
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border truncate ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
                          title={cell.calendarDay?.title || typeCfg.label}
                        >
                          {cell.calendarDay?.title || typeCfg.label}
                        </div>
                      )}

                      {/* Multi-school breakdown pills */}
                      {cell.schoolBreakdown && cell.schoolBreakdown.length > 1 ? (
                        <div className="space-y-0.5">
                          {cell.schoolBreakdown.map((sb) => (
                            <div
                              key={sb.schoolId}
                              className={`flex items-center justify-between text-[9px] font-bold px-1.5 py-0.5 rounded border ${sb.theme.badge}`}
                              title={`${sb.schoolName}: ${sb.count} lezioni`}
                            >
                              <span className="truncate max-w-[55px]">{sb.schoolName}</span>
                              <span className="font-extrabold ml-1 shrink-0">{sb.count}</span>
                            </div>
                          ))}
                        </div>
                      ) : cell.schoolBreakdown && cell.schoolBreakdown.length === 1 ? (
                        <div
                          className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${cell.schoolBreakdown[0].theme.badge}`}
                          title={`${cell.schoolBreakdown[0].schoolName}: ${cell.schoolBreakdown[0].count} lezioni`}
                        >
                          <Clock className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{cell.schoolBreakdown[0].schoolName}</span>
                          <span className="ml-auto font-black">({cell.schoolBreakdown[0].count})</span>
                        </div>
                      ) : cell.lessonsCount > 0 ? (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-petrol bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                          <Clock className="h-2.5 w-2.5 text-petrol shrink-0" />
                          <span>{cell.lessonsCount} {cell.lessonsCount === 1 ? 'lezione' : 'lezioni'}</span>
                        </div>
                      ) : null}
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
              <div className="h-10 w-10 rounded-xl bg-petrol text-white flex items-center justify-center font-bold shrink-0">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900">
                    Data selezionata: {selectedDateStr} ({DAYS_OF_WEEK.find((x) => x.id === selectedItalianDay)?.name})
                  </h4>
                  {school && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-teal-300 text-petrol">
                      <Building2 className="h-3 w-3 text-petrol" />
                      {school.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
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
                onClick={() => handleAddAllRegularStudentsForDay()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition cursor-pointer shadow-xs"
                title={`Aggiungi tutte le lezioni degli allievi con orario abituale di ${selectedItalianDay} (${regularStudentsForDay.length} allievi)`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Aggiungi Giornata</span>
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
                  onChange={(e) => handleSelectDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddLesson(selectedDateStr)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-petrol px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#23584F] transition cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Aggiungi Lezione</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddAllRegularStudentsForDay()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
                title={`Aggiungi tutte le lezioni degli allievi con orario abituale di ${selectedItalianDay} (${regularStudentsForDay.length} allievi)`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Aggiungi Giornata</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenDayModal(selectedDateStr)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <Tag className="h-3.5 w-3.5 text-slate-500" />
                <span>Tipo Giornata</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/70 p-3 rounded-xl border border-slate-200/60 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-semibold text-slate-700">Filtra Strumento:</span>
                <select
                  value={filterInstrument}
                  onChange={(e) => setFilterInstrument(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 outline-none focus:border-petrol"
                >
                  <option value="all">Tutti gli strumenti ({effectiveStudents.length})</option>
                  {instruments.map((ins) => (
                    <option key={ins} value={ins}>
                      {ins}
                    </option>
                  ))}
                </select>
              </div>

              {schoolsList.length > 1 && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <span className="font-semibold text-slate-500">Scuola:</span>
                  <button
                    type="button"
                    onClick={() => handleSelectSchoolFilter('all')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                      selectedSchoolFilter === 'all'
                        ? 'bg-petrol text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Tutte
                  </button>
                  {schoolsList.map((sc) => {
                    const theme = getSchoolTheme(sc.id, schoolsList);
                    const isSelected = selectedSchoolFilter === sc.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => handleSelectSchoolFilter(sc.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                          isSelected
                            ? `${theme.badge} ring-1 ring-current font-black`
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                        <span>{sc.name}</span>
                        {school?.id === sc.id && (
                          <span className="text-[9px] text-emerald-700 font-extrabold ml-0.5">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
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
                Il calendario per questa data è vuoto. Le lezioni compaiono solo quando le inserisci. Clicca su "+ Aggiungi Lezione" per una singola lezione o "Aggiungi Giornata" per tutti gli allievi previsti.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenAddLesson(selectedDateStr)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-petrol px-4 py-2 text-xs font-bold text-white hover:bg-[#23584F] transition cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Aggiungi Singola Lezione</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddAllRegularStudentsForDay()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
                >
                  <Users className="h-4 w-4" />
                  <span>Aggiungi Giornata</span>
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
                          {item.schoolObj && (
                            <button
                              type="button"
                              onClick={() => onSelectSchool?.(item.schoolObj!.id)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                                school?.id === item.schoolObj.id
                                  ? `${getSchoolTheme(item.schoolObj.id, schoolsList).badge} ring-1 ring-current`
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                              title={`Scuola: ${item.schoolObj.name}. Clicca per selezionare in alto.`}
                            >
                              <Building2 className="h-3 w-3" />
                              <span>{item.schoolObj.name}</span>
                              {school?.id === item.schoolObj.id && (
                                <span className="text-[9px] font-extrabold text-emerald-700">✓ In alto</span>
                              )}
                            </button>
                          )}
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
              const dayStudents = effectiveStudents
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
                      dayStudents.map((s) => {
                        const sSchool = schoolsList.find((sc) => sc.id === s.schoolId);
                        const sTheme = s.schoolId ? getSchoolTheme(s.schoolId, schoolsList) : null;

                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (s.schoolId && s.schoolId !== school?.id) {
                                onSelectSchool?.(s.schoolId);
                              }
                              onSelectStudent(s);
                            }}
                            className="group p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-petrol/40 hover:shadow-xs transition cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1">
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
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between gap-1 flex-wrap">
                              <span>{s.instrument || 'Corso'}</span>
                              {sSchool && schoolsList.length > 1 && sTheme && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${sTheme.badge}`}>
                                  {sSchool.name}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
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
                    const s = effectiveStudents.find((st) => st.id === e.target.value);
                    if (s) {
                      if (!editingLesson) {
                        if (s.lessonStartTime) setAddLessonStartTime(s.lessonStartTime);
                        if (s.lessonEndTime) setAddLessonEndTime(s.lessonEndTime);
                        if (s.lessonRoom) setAddLessonRoom(s.lessonRoom);
                      }
                      if (s.schoolId && s.schoolId !== school?.id) {
                        onSelectSchool?.(s.schoolId);
                      }
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-petrol"
                >
                  <option value="">-- Scegli un allievo --</option>
                  {effectiveStudents.map((st) => {
                    const stSchool = schoolsList.find((sc) => sc.id === st.schoolId);
                    return (
                      <option key={st.id} value={st.id}>
                        {st.lastName} {st.firstName} ({st.instrument || 'Senza strumento'})
                        {schoolsList.length > 1 && stSchool ? ` • [${stSchool.name}]` : ''}
                      </option>
                    );
                  })}
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

      {/* ============================================================ */}
      {/* MODAL: GENERA GIORNATE DEL MESE */}
      {/* ============================================================ */}
      {isGenerateMonthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-petrol border border-teal-100">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Genera Giornate e Lezioni del Mese
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mese di {MONTH_NAMES[currentMonth]} {currentYear} • {school?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateMonthModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Students count and status */}
            {students.filter((s) => Boolean(s.lessonDay)).length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Nessun allievo ha un giorno di lezione assegnato</span>
                </div>
                <p className="text-amber-700">
                  Per generare automaticamente le lezioni, devi prima assegnare il giorno abituale di lezione (es. Lunedì, Martedì, ecc.) e l'orario nella scheda dei tuoi allievi.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Questa operazione programma automaticamente nel calendario tutte le lezioni per ogni data del mese di <strong>{MONTH_NAMES[currentMonth]} {currentYear}</strong>, associando ciascun allievo al proprio giorno abituale e orario.
                </p>

                {/* Day of week breakdown */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Allievi configurati per giorno della settimana:</span>
                    <span className="text-petrol font-bold">
                      {students.filter((s) => Boolean(s.lessonDay)).length} allievi totali
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                    {DAYS_OF_WEEK.map((d) => {
                      const count = students.filter((s) => s.lessonDay === d.id).length;
                      return (
                        <div
                          key={d.id}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border ${
                            count > 0
                              ? 'bg-white border-teal-200 text-slate-800 font-semibold shadow-2xs'
                              : 'bg-slate-100/60 border-slate-200 text-slate-400'
                          }`}
                        >
                          <span>{d.name}:</span>
                          <span className={count > 0 ? 'text-teal-700 font-bold' : ''}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={generateAvoidDuplicates}
                      onChange={(e) => setGenerateAvoidDuplicates(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-petrol focus:ring-petrol"
                    />
                    <span>
                      <strong>Evita duplicati:</strong> Non inserire lezioni se l'allievo è già programmato per quella specifica data.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={generateSetCalendarDays}
                      onChange={(e) => setGenerateSetCalendarDays(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-petrol focus:ring-petrol"
                    />
                    <span>
                      <strong>Contrassegna giornate:</strong> Imposta le date generate come "Giornata di Lezione" nel calendario mensile.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsGenerateMonthModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition"
              >
                Annulla
              </button>
              {students.filter((s) => Boolean(s.lessonDay)).length > 0 && (
                <button
                  type="button"
                  onClick={executeGenerateMonthLessons}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-petrol text-xs font-bold text-white hover:bg-[#23584F] cursor-pointer shadow-xs transition"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Conferma e Genera Mese</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
