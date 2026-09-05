import React, { useState } from 'react';
import {
  Student,
  School,
  LessonEntry,
  AttendanceRecord,
  PeriodicEvaluation,
  IntermediateTest,
  ReportLayoutConfig,
  ReportScope,
  AttendanceStatus,
} from '../types';
import { StorageService } from '../services/storage';
import {
  calculateAttendanceStats,
  getMonthlyAttendanceBreakdown,
  formatDateItalian,
  buildGradeTimeline,
} from '../utils/statistics';
import { exportElementToPdf, printElement } from '../utils/pdfGenerator';
import { ReportPdfView } from './ReportPdfView';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  BookOpen,
  FileDown,
  Printer,
  Sliders,
  Plus,
  Trash2,
  Save,
  Music,
  TrendingUp,
  Sparkles,
  Edit3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

interface Props {
  student: Student;
  school: School;
  onBack: () => void;
  onEditStudent: (student: Student) => void;
}

export const StudentDetailView: React.FC<Props> = ({
  student,
  school,
  onBack,
  onEditStudent,
}) => {
  // Navigation tabs inside student page
  const [activeTab, setActiveTab] = useState<'diario' | 'presenze' | 'valutazioni' | 'report'>('diario');

  // Local data states
  const [lessons, setLessons] = useState<LessonEntry[]>(
    StorageService.getLessons(student.id, school.id)
  );
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    StorageService.getAttendance(student.id, school.id)
  );
  const [evaluations, setEvaluations] = useState<PeriodicEvaluation[]>(
    StorageService.getEvaluations(student.id, school.id)
  );
  const [tests, setTests] = useState<IntermediateTest[]>(
    StorageService.getTests(student.id, school.id)
  );
  const [layoutConfig, setLayoutConfig] = useState<ReportLayoutConfig>(
    StorageService.getLayoutConfig()
  );

  // Selected date for diary & calendar
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Lesson entry form for the selected date
  const existingLessonForDate = lessons.find((l) => l.date === selectedDate);
  const [lessonForm, setLessonForm] = useState<{
    progress: string;
    exercisesDone: string;
    homeworkAssigned: string;
    rating?: number;
  }>({
    progress: existingLessonForDate?.progress || '',
    exercisesDone: existingLessonForDate?.exercisesDone || '',
    homeworkAssigned: existingLessonForDate?.homeworkAssigned || '',
    rating: existingLessonForDate?.rating || 8,
  });

  // When selected date changes, populate form if entry exists
  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = lessons.find((l) => l.date === dateStr);
    if (existing) {
      setLessonForm({
        progress: existing.progress,
        exercisesDone: existing.exercisesDone,
        homeworkAssigned: existing.homeworkAssigned,
        rating: existing.rating || 8,
      });
    } else {
      setLessonForm({
        progress: '',
        exercisesDone: '',
        homeworkAssigned: '',
        rating: 8,
      });
    }
  };

  // Save lesson entry
  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    const newLesson: LessonEntry = {
      id: existingLessonForDate ? existingLessonForDate.id : `les-${Date.now()}`,
      studentId: student.id,
      schoolId: school.id,
      date: selectedDate,
      progress: lessonForm.progress.trim(),
      exercisesDone: lessonForm.exercisesDone.trim(),
      homeworkAssigned: lessonForm.homeworkAssigned.trim(),
      rating: lessonForm.rating,
    };

    StorageService.upsertLesson(newLesson);
    const updated = StorageService.getLessons(student.id, school.id);
    setLessons(updated);
    alert('Diario di lezione aggiornato con successo!');
  };

  const handleDeleteLesson = (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa voce del diario?')) return;
    StorageService.deleteLesson(id);
    setLessons(StorageService.getLessons(student.id, school.id));
  };

  // Quick attendance toggle for the selected date
  const currentAttendance = attendance.find((a) => a.date === selectedDate);
  const handleSetAttendance = (status: AttendanceStatus) => {
    const record: AttendanceRecord = {
      id: currentAttendance ? currentAttendance.id : `att-${Date.now()}`,
      studentId: student.id,
      schoolId: school.id,
      date: selectedDate,
      status,
    };
    StorageService.recordAttendance(record);
    setAttendance(StorageService.getAttendance(student.id, school.id));
  };

  const handleClearAttendance = () => {
    StorageService.removeAttendance(student.id, selectedDate);
    setAttendance(StorageService.getAttendance(student.id, school.id));
  };

  // Evaluations editing states
  const evalMeta = evaluations.find((e) => e.type === 'meta_anno');
  const evalFine = evaluations.find((e) => e.type === 'fine_anno');

  const [metaForm, setMetaForm] = useState<Partial<PeriodicEvaluation>>({
    overallGrade: evalMeta?.overallGrade || 8,
    description: evalMeta?.description || '',
    recommendations: evalMeta?.recommendations || '',
    date: evalMeta?.date || '2026-01-30',
    detailedGrades: evalMeta?.detailedGrades || {
      technique: 8,
      readingRhythm: 8,
      musicality: 8,
      dedication: 8,
      theory: 8,
    },
  });

  const [fineForm, setFineForm] = useState<Partial<PeriodicEvaluation>>({
    overallGrade: evalFine?.overallGrade || 8.5,
    description: evalFine?.description || '',
    recommendations: evalFine?.recommendations || '',
    date: evalFine?.date || '2026-06-05',
    detailedGrades: evalFine?.detailedGrades || {
      technique: 8.5,
      readingRhythm: 8.5,
      musicality: 8.5,
      dedication: 9,
      theory: 8.5,
    },
  });

  const handleSaveEvaluation = (type: 'meta_anno' | 'fine_anno') => {
    const form = type === 'meta_anno' ? metaForm : fineForm;
    const existing = type === 'meta_anno' ? evalMeta : evalFine;

    const record: PeriodicEvaluation = {
      id: existing ? existing.id : `eval-${Date.now()}`,
      studentId: student.id,
      schoolId: school.id,
      type,
      date: form.date || (type === 'meta_anno' ? '2026-01-30' : '2026-06-05'),
      overallGrade: Number(form.overallGrade) || 8,
      description: form.description || '',
      recommendations: form.recommendations || '',
      detailedGrades: form.detailedGrades,
      teacherName: layoutConfig.teacherName,
    };

    StorageService.upsertEvaluation(record);
    setEvaluations(StorageService.getEvaluations(student.id, school.id));
    alert(`Valutazione di ${type === 'meta_anno' ? 'Metà Anno' : 'Fine Anno'} salvata!`);
  };

  // Intermediate test form state
  const [testForm, setTestForm] = useState({
    date: todayStr,
    subject: '',
    grade: 8.0,
    notes: '',
  });

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.subject.trim()) return;

    const newTest: IntermediateTest = {
      id: `test-${Date.now()}`,
      studentId: student.id,
      schoolId: school.id,
      date: testForm.date,
      subject: testForm.subject.trim(),
      grade: Number(testForm.grade) || 8,
      notes: testForm.notes.trim(),
    };

    StorageService.upsertTest(newTest);
    setTests(StorageService.getTests(student.id, school.id));
    setTestForm({ date: todayStr, subject: '', grade: 8.0, notes: '' });
  };

  const handleDeleteTest = (id: string) => {
    StorageService.deleteTest(id);
    setTests(StorageService.getTests(student.id, school.id));
  };

  // Report Export Config State
  const [reportScope, setReportScope] = useState<ReportScope>('anno_completo');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    const filename = `Report_${student.lastName}_${student.firstName}_${reportScope}.pdf`;
    const success = await exportElementToPdf('printable-report-doc', filename);
    setIsExportingPdf(false);
    if (!success) {
      alert('Si è verificato un errore durante la generazione automatica del PDF. Puoi utilizzare il pulsante Stampa per salvare il file.');
    }
  };

  const handleSaveConfig = (cfg: ReportLayoutConfig) => {
    setLayoutConfig(cfg);
    StorageService.saveLayoutConfig(cfg);
  };

  // Calculated stats for cards & charts
  const stats = calculateAttendanceStats(attendance);
  const monthlyData = getMonthlyAttendanceBreakdown(attendance);
  const gradeTimeline = buildGradeTimeline(tests, evaluations);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Torna all'elenco alunni"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {student.firstName} {student.lastName}
              </h1>
              <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-800">
                {student.instrument || 'Strumento'}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
              <span>🏫 {school.name}</span>
              <span>🎓 {student.level} ({student.academicYear})</span>
              {student.attendsMusicTheory ? (
                <span className="text-amber-700 font-medium inline-flex items-center gap-1">
                  <Music className="h-3.5 w-3.5" /> Teoria: {student.musicTheoryTeacher || 'Sì'}
                </span>
              ) : (
                <span className="text-slate-400">Teoria: No</span>
              )}
            </div>
          </div>
        </div>

        {/* Action button to edit student */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditStudent(student)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Edit3 className="h-4 w-4 text-slate-500" />
            Modifica Scheda
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-terracotta px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-terracotta-hover transition cursor-pointer"
          >
            <FileDown className="h-4 w-4" />
            Esporta PDF
          </button>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500 block">Tasso di Presenza</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {stats.presenceRate}%
            </span>
            <span className="text-xs text-slate-400 font-medium">({stats.present}/{stats.total})</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500 block">Assenze Registrate</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 font-mono">
              {stats.absent}
            </span>
            <span className="text-xs text-slate-400 font-medium">giorni ({stats.absenceRate}%)</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500 block">Valutazione 1° Quad.</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700 font-mono">
              {evalMeta ? `${evalMeta.overallGrade.toFixed(1)}/10` : '-'}
            </span>
            <span className="text-xs text-slate-400 font-medium">Metà anno</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500 block">Valutazione Fine Anno</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {evalFine ? `${evalFine.overallGrade.toFixed(1)}/10` : '-'}
            </span>
            <span className="text-xs text-slate-400 font-medium">Esito finale</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4">
          <button
            onClick={() => setActiveTab('diario')}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'diario'
                ? 'border-petrol text-petrol font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Diario & Calendario Lezioni
          </button>

          <button
            onClick={() => setActiveTab('presenze')}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'presenze'
                ? 'border-petrol text-petrol font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            Presenze & Report Mensili
          </button>

          <button
            onClick={() => setActiveTab('valutazioni')}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'valutazioni'
                ? 'border-petrol text-petrol font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="h-4 w-4" />
            Valutazioni Periodiche & Rendimento
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'report'
                ? 'border-petrol text-petrol font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileDown className="h-4 w-4" />
            Generatore Report & PDF
          </button>
        </nav>
      </div>

      {/* TAB 1: DIARIO & CALENDARIO LEZIONI */}
      {activeTab === 'diario' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Date selector + fast attendance bar + form */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">Seleziona Data Lezione</h2>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateSelect(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Attendance Quick Picker for selected date */}
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    Stato Presenza del {formatDateItalian(selectedDate)}:
                  </span>
                  {currentAttendance && (
                    <button
                      type="button"
                      onClick={handleClearAttendance}
                      className="text-[11px] text-slate-400 hover:text-rose-600"
                    >
                      Rimuovi
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetAttendance('presente')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                      currentAttendance?.status === 'presente'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    ✓ Presente
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAttendance('assente')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                      currentAttendance?.status === 'assente'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    ✕ Assente
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAttendance('ritardo')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                      currentAttendance?.status === 'ritardo'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    ⏱ Ritardo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAttendance('giustificato')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                      currentAttendance?.status === 'giustificato'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    📋 Giustificato
                  </button>
                </div>
              </div>

              {/* Form Diario Lezione */}
              <form onSubmit={handleSaveLesson} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800">
                    Diario Didattico: Progressi & Compiti
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-semibold text-slate-500">Voto lezione:</label>
                    <select
                      value={lessonForm.rating || 8}
                      onChange={(e) =>
                        setLessonForm({ ...lessonForm, rating: Number(e.target.value) })
                      }
                      className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-mono font-bold text-slate-800"
                    >
                      {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Progressi riscontrati durante la lezione
                  </label>
                  <textarea
                    rows={3}
                    value={lessonForm.progress}
                    onChange={(e) => setLessonForm({ ...lessonForm, progress: e.target.value })}
                    placeholder="es. Migliorata articolazione mano sinistra, buona resa espressiva nel cantabile..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Esercizi e brani svolti durante la giornata
                  </label>
                  <textarea
                    rows={3}
                    value={lessonForm.exercisesDone}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, exercisesDone: e.target.value })
                    }
                    placeholder="es. Scale a mani unite a 4 ottave, Studio n. 12 di Czerny battute 1-16..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 text-indigo-900">
                    Compiti ed esercizi da fare a casa per la prossima volta
                  </label>
                  <textarea
                    rows={3}
                    value={lessonForm.homeworkAssigned}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, homeworkAssigned: e.target.value })
                    }
                    placeholder="es. Ripetere lo studio n. 12 con metronomo a 72; studiare a mani separate le battute 17-32..."
                    className="w-full rounded-lg border border-indigo-200 bg-indigo-50/20 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-terracotta px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-terracotta-hover transition cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    Salva Diario di Oggi
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right column: Chronological history of lessons */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Storico Lezioni e Compiti ({lessons.length})
              </h3>
              <span className="text-xs text-slate-500">Ordine cronologico inverso</span>
            </div>

            {lessons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-slate-400">
                <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium">Nessuna lezione ancora registrata</p>
                <p className="text-xs">Seleziona una data nel form per iniziare il diario.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                {lessons.map((les) => (
                  <div
                    key={les.id}
                    className={`rounded-xl border p-4 transition bg-white shadow-2xs ${
                      les.date === selectedDate
                        ? 'border-indigo-500 ring-1 ring-indigo-400'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          📅 {formatDateItalian(les.date)}
                        </span>
                        {les.rating && (
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                            Voto: {les.rating}/10
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDateSelect(les.date)}
                          className="text-xs text-indigo-600 hover:underline font-medium px-2 py-1"
                        >
                          Modifica
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(les.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Elimina voce"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 text-xs">
                      {les.progress && (
                        <div>
                          <span className="font-semibold text-slate-700 block">
                            🎯 Progressi:
                          </span>
                          <p className="text-slate-600 mt-0.5">{les.progress}</p>
                        </div>
                      )}

                      {les.exercisesDone && (
                        <div>
                          <span className="font-semibold text-slate-700 block">
                            🎹 Esercizi svolti a lezione:
                          </span>
                          <p className="text-slate-600 mt-0.5">{les.exercisesDone}</p>
                        </div>
                      )}

                      {les.homeworkAssigned && (
                        <div className="rounded-lg bg-indigo-50/70 p-2.5 border border-indigo-100">
                          <span className="font-bold text-indigo-900 block">
                            📝 Compiti ed esercizi da fare a casa:
                          </span>
                          <p className="text-indigo-950 mt-0.5">{les.homeworkAssigned}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRESENZE & REPORT MENSILI */}
      {activeTab === 'presenze' && (
        <div className="space-y-6">
          {/* Monthly Comparison Bar Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Report Mensile Presenze vs Assenze
                </h3>
                <p className="text-xs text-slate-500">
                  Confronto mese per mese per verificare la regolarità di frequenza dell'alunno
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" /> Presenze
                </span>
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="h-3 w-3 rounded-full bg-rose-500" /> Assenze
                </span>
              </div>
            </div>

            {monthlyData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Nessun dato di presenza registrato
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${val} lezioni`,
                        name === 'present' ? 'Presenze' : 'Assenze',
                      ]}
                      labelFormatter={(label) => `Mese di ${label}`}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="present" name="present" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" name="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Breakdown table of all months */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Dettaglio Mensile Assenze e Tasso Percentuale
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Mese</th>
                    <th className="py-2.5 px-3">Lezioni Totali</th>
                    <th className="py-2.5 px-3 text-emerald-700">Presenze</th>
                    <th className="py-2.5 px-3 text-rose-700">Assenze</th>
                    <th className="py-2.5 px-3 text-amber-700">Ritardi</th>
                    <th className="py-2.5 px-3 text-indigo-700">Giustificate</th>
                    <th className="py-2.5 px-3">Tasso Presenza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyData.map((m) => (
                    <tr key={m.monthKey} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{m.monthName}</td>
                      <td className="py-2.5 px-3 font-mono">{m.total}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{m.present}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-600">{m.absent}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-600">{m.late}</td>
                      <td className="py-2.5 px-3 font-mono text-indigo-600">{m.excused}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{m.rate}%</span>
                          <div className="h-1.5 w-16 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${m.rate}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VALUTAZIONI PERIODICHE (METÀ ANNO & FINE ANNO & VERIFICHE) */}
      {activeTab === 'valutazioni' && (
        <div className="space-y-8">
          {/* Academic Performance Progression Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Andamento del Rendimento Accademico nel Tempo
                </h3>
                <p className="text-xs text-slate-500">
                  Grafico riassuntivo delle verifiche intermedie e delle valutazioni periodiche (scala 1 - 10)
                </p>
              </div>
            </div>

            {gradeTimeline.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
                Nessuna verifica o valutazione registrata per il grafico
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gradeTimeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => formatDateItalian(val).substring(0, 6)}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis domain={[4, 10]} ticks={[4, 5, 6, 7, 8, 9, 10]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} / 10`, 'Voto']}
                      labelFormatter={(val) => `Data: ${formatDateItalian(String(val))}`}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="grade"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* SECTION: Due Valutazioni Periodiche (Metà Anno & Fine Anno) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1) Valutazione di Metà Anno */}
            <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl bg-indigo-100 p-2 text-indigo-700">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Valutazione di Metà Anno
                      </h3>
                      <p className="text-xs text-slate-500">1° Quadrimestre</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Voto (1-10):</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      step={0.5}
                      value={metaForm.overallGrade || 8}
                      onChange={(e) =>
                        setMetaForm({ ...metaForm, overallGrade: parseFloat(e.target.value) })
                      }
                      className="w-16 rounded-lg border border-indigo-300 bg-indigo-50/40 px-2 py-1 text-sm font-black font-mono text-indigo-900 text-center outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Data di Registrazione
                    </label>
                    <input
                      type="date"
                      value={metaForm.date || '2026-01-30'}
                      onChange={(e) => setMetaForm({ ...metaForm, date: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  {/* Voti di dettaglio */}
                  <div>
                    <span className="block font-semibold text-slate-700 mb-1.5">
                      Voti Criteri Specifici (1 - 10)
                    </span>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Tecnica</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={metaForm.detailedGrades?.technique || 8}
                          onChange={(e) =>
                            setMetaForm({
                              ...metaForm,
                              detailedGrades: {
                                ...metaForm.detailedGrades,
                                technique: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded border border-slate-200 text-center font-mono py-1 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Lettura</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={metaForm.detailedGrades?.readingRhythm || 8}
                          onChange={(e) =>
                            setMetaForm({
                              ...metaForm,
                              detailedGrades: {
                                ...metaForm.detailedGrades,
                                readingRhythm: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded border border-slate-200 text-center font-mono py-1 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Musicalità</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={metaForm.detailedGrades?.musicality || 8}
                          onChange={(e) =>
                            setMetaForm({
                              ...metaForm,
                              detailedGrades: {
                                ...metaForm.detailedGrades,
                                musicality: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded border border-slate-200 text-center font-mono py-1 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Impegno</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={metaForm.detailedGrades?.dedication || 8}
                          onChange={(e) =>
                            setMetaForm({
                              ...metaForm,
                              detailedGrades: {
                                ...metaForm.detailedGrades,
                                dedication: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded border border-slate-200 text-center font-mono py-1 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Teoria</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={metaForm.detailedGrades?.theory || 8}
                          onChange={(e) =>
                            setMetaForm({
                              ...metaForm,
                              detailedGrades: {
                                ...metaForm.detailedGrades,
                                theory: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded border border-slate-200 text-center font-mono py-1 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Descrizione e Giudizio Analitico *
                    </label>
                    <textarea
                      rows={4}
                      value={metaForm.description}
                      onChange={(e) =>
                        setMetaForm({ ...metaForm, description: e.target.value })
                      }
                      placeholder="Scrivi il giudizio sul rendimento dell'alunno per il primo quadrimestre..."
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Obiettivi e raccomandazioni
                    </label>
                    <input
                      type="text"
                      value={metaForm.recommendations || ''}
                      onChange={(e) =>
                        setMetaForm({ ...metaForm, recommendations: e.target.value })
                      }
                      placeholder="es. Perfezionare la rilassatezza del polso e l'interpretazione cantabile..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setReportScope('meta_anno');
                    setActiveTab('report');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <FileDown className="h-3.5 w-3.5" /> Anteprima PDF Metà Anno
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEvaluation('meta_anno')}
                  className="rounded-xl bg-terracotta px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-terracotta-hover transition cursor-pointer"
                >
                  Salva Metà Anno
                </button>
              </div>
            </div>

            {/* 2) Valutazione di Fine Anno */}
            <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Valutazione di Fine Anno
                      </h3>
                      <p className="text-xs text-slate-500">2° Quadrimestre / Finale</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Voto (1-10):</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      step={0.5}
                      value={fineForm.overallGrade || 8.5}
                      onChange={(e) =>
                        setFineForm({ ...fineForm, overallGrade: parseFloat(e.target.value) })
                      }
                      className="w-16 rounded-lg border border-emerald-300 bg-emerald-50/40 px-2 py-1 text-sm font-black font-mono text-emerald-900 text-center outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Data di Registrazione
                    </label>
                    <input
                      type="date"
                      value={fineForm.date || '2026-06-05'}
                      onChange={(e) => setFineForm({ ...fineForm, date: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  {/* Voti di dettaglio */}
                  <div>
                    <span className="block font-semibold text-slate-700 mb-1.5">
                      Voti Criteri Specifici (1 - 10)
                    </span>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Tecnica</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={fineForm.detailedGrades?.technique || 8.5}
                          onChange={(e) =>
                            setFineForm({
                              ...fineForm,
                              detailedGrades: {
                                ...fineForm.detailedGrades,
                                technique: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded border border-slate-200 text-center font-mono py-1 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Lettura</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={fineForm.detailedGrades?.readingRhythm || 8.5}
                          onChange={(e) =>
                            setFineForm({
                              ...fineForm,
                              detailedGrades: {
                                ...fineForm.detailedGrades,
                                readingRhythm: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded border border-slate-200 text-center font-mono py-1 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Musicalità</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={fineForm.detailedGrades?.musicality || 8.5}
                          onChange={(e) =>
                            setFineForm({
                              ...fineForm,
                              detailedGrades: {
                                ...fineForm.detailedGrades,
                                musicality: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded border border-slate-200 text-center font-mono py-1 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Impegno</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={fineForm.detailedGrades?.dedication || 9}
                          onChange={(e) =>
                            setFineForm({
                              ...fineForm,
                              detailedGrades: {
                                ...fineForm.detailedGrades,
                                dedication: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded border border-slate-200 text-center font-mono py-1 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Teoria</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          value={fineForm.detailedGrades?.theory || 8.5}
                          onChange={(e) =>
                            setFineForm({
                              ...fineForm,
                              detailedGrades: {
                                ...fineForm.detailedGrades,
                                theory: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded border border-slate-200 text-center font-mono py-1 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Descrizione e Giudizio Finale di Rendimento *
                    </label>
                    <textarea
                      rows={4}
                      value={fineForm.description}
                      onChange={(e) =>
                        setFineForm({ ...fineForm, description: e.target.value })
                      }
                      placeholder="Scrivi il giudizio conclusivo dell'anno scolastico..."
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Proposta passaggio di livello / Note per il futuro
                    </label>
                    <input
                      type="text"
                      value={fineForm.recommendations || ''}
                      onChange={(e) =>
                        setFineForm({ ...fineForm, recommendations: e.target.value })
                      }
                      placeholder="es. Promosso al livello Intermedio con merito. Repertorio consigliato..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setReportScope('fine_anno');
                    setActiveTab('report');
                  }}
                  className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <FileDown className="h-3.5 w-3.5" /> Anteprima PDF Fine Anno
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEvaluation('fine_anno')}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                >
                  Salva Fine Anno
                </button>
              </div>
            </div>
          </div>

          {/* SECTION: Verifiche Intermedie / Test formative */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Registro Verifiche e Prove Intermedie ({tests.length})
            </h3>

            {/* Quick add form */}
            <form
              onSubmit={handleAddTest}
              className="mb-6 grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200"
            >
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={testForm.date}
                  onChange={(e) => setTestForm({ ...testForm, date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Materia / Oggetto della verifica *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. Verifica scale, brano a prima vista..."
                  value={testForm.subject}
                  onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Voto (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  step={0.5}
                  required
                  value={testForm.grade}
                  onChange={(e) => setTestForm({ ...testForm, grade: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-800 text-center"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-terracotta py-2 px-3 text-xs font-bold text-white shadow-xs hover:bg-terracotta-hover transition cursor-pointer"
                >
                  + Aggiungi Voto
                </button>
              </div>
            </form>

            {/* List of tests */}
            {tests.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">
                Nessuna verifica registrata. Aggiungi verifiche per arricchire il grafico del rendimento accademico.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {tests.map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400 font-semibold w-24">
                        {formatDateItalian(t.date)}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{t.subject}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-700">
                        {t.grade.toFixed(1)} / 10
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTest(t.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Rimuovi"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GENERATORE REPORT & ESPORTAZIONE PDF */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Controls Bar for teachers with layout customization */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 no-print">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-600" />
                  Personalizzazione Layout & Esportazione PDF
                </h3>
                <p className="text-xs text-slate-500">
                  Scegli quali valutazioni includere, personalizza l'intestazione e genera il documento ufficiale in PDF
                </p>
              </div>

              {/* PDF & Print Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => printElement('printable-report-doc')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  Stampa / Salva Browser
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-2 rounded-xl bg-terracotta px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-terracotta-hover disabled:opacity-50 transition cursor-pointer"
                >
                  <FileDown className="h-4 w-4" />
                  {isExportingPdf ? 'Generazione PDF in corso...' : 'Esporta Automatico in PDF'}
                </button>
              </div>
            </div>

            {/* Scope Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Seleziona Contenuto da Esportare:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setReportScope('meta_anno')}
                  className={`p-3 rounded-xl border text-left transition ${
                    reportScope === 'meta_anno'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">Valutazione Singola</span>
                  <span className="text-[11px] text-slate-500">Solo Metà Anno (1° Quad.)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportScope('fine_anno')}
                  className={`p-3 rounded-xl border text-left transition ${
                    reportScope === 'fine_anno'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">Valutazione Singola</span>
                  <span className="text-[11px] text-slate-500">Solo Fine Anno (2° Quad.)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportScope('entrambe')}
                  className={`p-3 rounded-xl border text-left transition ${
                    reportScope === 'entrambe'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">Entrambe Valutazioni</span>
                  <span className="text-[11px] text-slate-500">Metà + Fine Anno combinati</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportScope('anno_completo')}
                  className={`p-3 rounded-xl border text-left transition ${
                    reportScope === 'anno_completo'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">Report Anno Completo</span>
                  <span className="text-[11px] text-slate-500">Statistiche + Grafici + Dossier</span>
                </button>
              </div>
            </div>

            {/* Layout Customization Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
              {/* Header style and color theme */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">Stile Intestazione</label>
                <select
                  value={layoutConfig.headerStyle}
                  onChange={(e) =>
                    handleSaveConfig({
                      ...layoutConfig,
                      headerStyle: e.target.value as any,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                >
                  <option value="modern">Moderno (Bicolore con badge)</option>
                  <option value="classic">Istituzionale Classico (Bordo doppio formale)</option>
                  <option value="minimal">Minimale Pulito</option>
                </select>

                <label className="block text-xs font-bold text-slate-700">Palette Cromatica</label>
                <select
                  value={layoutConfig.colorTheme}
                  onChange={(e) =>
                    handleSaveConfig({
                      ...layoutConfig,
                      colorTheme: e.target.value as any,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                >
                  <option value="navy">Blu Notte Istituzionale</option>
                  <option value="emerald">Verde Smeraldo Accademico</option>
                  <option value="burgundy">Bordeaux Tradizionale</option>
                  <option value="slate">Ardesia Neutro</option>
                </select>
              </div>

              {/* Title and Teacher Name */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Titolo del Documento
                  </label>
                  <input
                    type="text"
                    value={layoutConfig.reportTitle}
                    onChange={(e) =>
                      handleSaveConfig({ ...layoutConfig, reportTitle: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Docente Responsabile
                  </label>
                  <input
                    type="text"
                    value={layoutConfig.teacherName}
                    onChange={(e) =>
                      handleSaveConfig({ ...layoutConfig, teacherName: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Section inclusion toggles */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Elementi da includere
                </label>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layoutConfig.showAttendanceChart}
                      onChange={(e) =>
                        handleSaveConfig({
                          ...layoutConfig,
                          showAttendanceChart: e.target.checked,
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    Grafico & Statistiche Presenze
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layoutConfig.showGradeProgressionChart}
                      onChange={(e) =>
                        handleSaveConfig({
                          ...layoutConfig,
                          showGradeProgressionChart: e.target.checked,
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    Grafico Rendimento Voti nel Tempo
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layoutConfig.showRecentLessons}
                      onChange={(e) =>
                        handleSaveConfig({
                          ...layoutConfig,
                          showRecentLessons: e.target.checked,
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    Estratto Compiti & Lezioni
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layoutConfig.showTeacherSignature}
                      onChange={(e) =>
                        handleSaveConfig({
                          ...layoutConfig,
                          showTeacherSignature: e.target.checked,
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    Blocco Firme Ufficiali
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE PRINTABLE / PDF PREVIEW CONTAINER */}
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 sm:p-8 overflow-x-auto shadow-inner">
            <div className="text-center mb-4 no-print">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                — Anteprima Esatta di Stampa e Download PDF —
              </span>
            </div>

            <ReportPdfView
              id="printable-report-doc"
              student={student}
              school={school}
              scope={reportScope}
              layoutConfig={layoutConfig}
              evaluations={evaluations}
              attendance={attendance}
              lessons={lessons}
              tests={tests}
            />
          </div>
        </div>
      )}
    </div>
  );
};
