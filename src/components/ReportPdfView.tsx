import React from 'react';
import {
  Student,
  School,
  PeriodicEvaluation,
  AttendanceRecord,
  LessonEntry,
  IntermediateTest,
  ReportLayoutConfig,
  ReportScope,
} from '../types';
import {
  calculateAttendanceStats,
  getMonthlyAttendanceBreakdown,
  formatDateItalian,
  buildGradeTimeline,
} from '../utils/statistics';
import {
  Music,
  CheckCircle,
  XCircle,
  Award,
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

interface Props {
  student: Student;
  school: School;
  scope: ReportScope;
  layoutConfig: ReportLayoutConfig;
  evaluations: PeriodicEvaluation[];
  attendance: AttendanceRecord[];
  lessons: LessonEntry[];
  tests: IntermediateTest[];
  id?: string;
}

export const ReportPdfView: React.FC<Props> = ({
  student,
  school,
  scope,
  layoutConfig,
  evaluations,
  attendance,
  lessons,
  tests,
  id = 'printable-report-doc',
}) => {
  const stats = calculateAttendanceStats(attendance);
  const monthlyData = getMonthlyAttendanceBreakdown(attendance);
  const gradeTimeline = buildGradeTimeline(tests, evaluations);

  const evalMeta = evaluations.find((e) => e.type === 'meta_anno');
  const evalFine = evaluations.find((e) => e.type === 'fine_anno');

  // Theme styling definitions
  const themeColors = {
    navy: {
      primary: 'bg-slate-900 text-white',
      accentText: 'text-indigo-900',
      accentBg: 'bg-indigo-50',
      borderAccent: 'border-indigo-600',
      badgeBg: 'bg-indigo-100 text-indigo-800',
      headerBorder: 'border-slate-800',
    },
    emerald: {
      primary: 'bg-emerald-900 text-white',
      accentText: 'text-emerald-900',
      accentBg: 'bg-emerald-50',
      borderAccent: 'border-emerald-600',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      headerBorder: 'border-emerald-800',
    },
    burgundy: {
      primary: 'bg-rose-950 text-white',
      accentText: 'text-rose-950',
      accentBg: 'bg-rose-50',
      borderAccent: 'border-rose-700',
      badgeBg: 'bg-rose-100 text-rose-800',
      headerBorder: 'border-rose-900',
    },
    slate: {
      primary: 'bg-slate-800 text-white',
      accentText: 'text-slate-900',
      accentBg: 'bg-slate-100',
      borderAccent: 'border-slate-600',
      badgeBg: 'bg-slate-200 text-slate-800',
      headerBorder: 'border-slate-700',
    },
  }[layoutConfig.colorTheme || 'navy'];

  // Font scale styles
  const fontSizes = {
    compact: 'text-xs',
    standard: 'text-sm',
    spacious: 'text-base',
  }[layoutConfig.fontScale || 'standard'];

  const getScopeTitle = () => {
    switch (scope) {
      case 'meta_anno':
        return 'Scheda di Valutazione - 1° Quadrimestre / Metà Anno';
      case 'fine_anno':
        return 'Scheda di Valutazione Finale - 2° Quadrimestre';
      case 'entrambe':
        return 'Quadro Comparativo Valutazioni Periodiche (Metà e Fine Anno)';
      case 'anno_completo':
      default:
        return 'Dossier e Report Generale dell\'Anno Scolastico';
    }
  };

  return (
    <div
      id={id}
      className={`mx-auto w-full max-w-[920px] bg-white p-8 sm:p-12 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] ${fontSizes} leading-relaxed shadow-lg print:shadow-none print:p-6 print:max-w-none`}
    >
      {/* HEADER SECTION - CUSTOMIZABLE */}
      {layoutConfig.headerStyle === 'modern' && (
        <div className={`rounded-xl ${themeColors.primary} p-6 mb-8 text-white shadow-xs`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider opacity-80 font-medium">
                {school.name} • {school.city}
              </span>
              <h1 className="text-2xl font-bold mt-1 tracking-tight">{layoutConfig.reportTitle}</h1>
              <p className="text-sm opacity-90 mt-0.5">{getScopeTitle()}</p>
            </div>
            <div className="text-right sm:border-l sm:border-white/20 sm:pl-5">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                A.S. {school.academicYear}
              </span>
              <p className="text-xs opacity-80 mt-1.5">Docente: {layoutConfig.teacherName}</p>
            </div>
          </div>
        </div>
      )}

      {layoutConfig.headerStyle === 'classic' && (
        <div className="border-b-4 border-double border-slate-700 pb-4 mb-8 text-center">
          <p className="text-xs uppercase tracking-widest font-serif text-slate-600">
            {school.name} • {school.city}
          </p>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mt-1 uppercase tracking-wider">
            {layoutConfig.reportTitle}
          </h1>
          <p className="text-sm font-medium text-slate-700 italic mt-0.5">{getScopeTitle()}</p>
          <div className="flex justify-center gap-8 mt-2 text-xs text-slate-600">
            <span>Anno Scolastico: {school.academicYear}</span>
            <span>•</span>
            <span>Docente Titolare: {layoutConfig.teacherName}</span>
          </div>
        </div>
      )}

      {layoutConfig.headerStyle === 'minimal' && (
        <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{layoutConfig.reportTitle}</h1>
            <p className="text-xs text-slate-500">
              {school.name} — {getScopeTitle()}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <span className="font-semibold">A.S. {school.academicYear}</span>
            <p>Docente: {layoutConfig.teacherName}</p>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE SUMMARY CARD */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 mb-6 print-break-inside-avoid">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
              Alunno / Studente
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {student.firstName} {student.lastName}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
              Livello e Anno
            </span>
            <span className="font-semibold text-slate-800">
              {student.level} • {student.academicYear}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
              Disciplina / Strumento
            </span>
            <span className="font-semibold text-slate-800">
              {student.instrument || 'Corso Musicale'}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
              Teoria Musicale
            </span>
            <div className="flex items-center gap-1.5 font-medium">
              {student.attendsMusicTheory ? (
                <>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                    <CheckCircle className="h-3.5 w-3.5" /> Frequenta
                  </span>
                  {student.musicTheoryTeacher && (
                    <span className="text-slate-500 text-xs">({student.musicTheoryTeacher})</span>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                  <XCircle className="h-3.5 w-3.5" /> Non iscritto
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: ATTENDANCE & FREQUENCY STATISTICS (if enabled & relevant) */}
      {(scope === 'anno_completo' || layoutConfig.showAttendanceChart) && (
        <div className="mb-8 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
            <h2 className={`text-base font-bold flex items-center gap-2 ${themeColors.accentText}`}>
              <Calendar className="h-4 w-4" />
              Statistiche Frequenza e Riepilogo Presenze
            </h2>
            <span className="text-xs text-slate-500">Totale lezioni registrate: {stats.total}</span>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
              <span className="text-xs text-slate-500 font-medium block">Tasso di Presenza</span>
              <span className="text-xl font-extrabold text-emerald-600">{stats.presenceRate}%</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{stats.present} lezioni</span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
              <span className="text-xs text-slate-500 font-medium block">Assenze Registrate</span>
              <span className="text-xl font-extrabold text-rose-600">{stats.absent}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {stats.absenceRate}% del totale
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
              <span className="text-xs text-slate-500 font-medium block">Ritardi Rilevati</span>
              <span className="text-xl font-extrabold text-amber-600">{stats.late}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">giustificati con ritardo</span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
              <span className="text-xs text-slate-500 font-medium block">Assenze Giustificate</span>
              <span className="text-xl font-extrabold text-indigo-600">{stats.excused}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">con certificato/motivo</span>
            </div>
          </div>

          {/* Monthly Breakdown Table / Bars */}
          {layoutConfig.showMonthlyAbsenceTable && monthlyData.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Distribuzione Mensile Presenze & Assenze
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {monthlyData.map((m) => (
                  <div key={m.monthKey} className="rounded-lg bg-slate-50 p-2.5 text-center border border-slate-100">
                    <span className="text-xs font-bold text-slate-800 block">{m.monthName}</span>
                    <div className="mt-1 flex items-center justify-center gap-1.5 text-xs">
                      <span className="text-emerald-700 font-semibold">{m.present} pres.</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-rose-600 font-semibold">{m.absent} ass.</span>
                    </div>
                    {/* Visual mini bar */}
                    <div className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${m.rate}%` }}
                        className="bg-emerald-500 h-full rounded-full"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {m.rate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: VALUTAZIONI PERIODICHE */}
      <div className="mb-8">
        {/* Metà Anno */}
        {(scope === 'meta_anno' || scope === 'entrambe' || scope === 'anno_completo') && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 print-break-inside-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Valutazione di Metà Anno (1° Quadrimestre)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Data verbalizzazione: {formatDateItalian(evalMeta?.date || '2026-01-30')}
                  </span>
                </div>
              </div>

              {evalMeta ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Voto Complessivo
                    </span>
                    <span className="text-2xl font-black text-indigo-700 font-mono">
                      {evalMeta.overallGrade.toFixed(1)} / 10
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-amber-600 font-medium italic">
                  Non ancora compilata
                </span>
              )}
            </div>

            {evalMeta ? (
              <div className="mt-4 space-y-4">
                {/* Detailed Criteria Scores */}
                {evalMeta.detailedGrades && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Tecnica</span>
                      <span className="text-sm font-bold text-slate-800">
                        {evalMeta.detailedGrades.technique || '-'}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Lettura/Ritmo</span>
                      <span className="text-sm font-bold text-slate-800">
                        {evalMeta.detailedGrades.readingRhythm || '-'}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Musicalità</span>
                      <span className="text-sm font-bold text-slate-800">
                        {evalMeta.detailedGrades.musicality || '-'}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Impegno</span>
                      <span className="text-sm font-bold text-slate-800">
                        {evalMeta.detailedGrades.dedication || '-'}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Teoria</span>
                      <span className="text-sm font-bold text-slate-800">
                        {evalMeta.detailedGrades.theory || '-'}/10
                      </span>
                    </div>
                  </div>
                )}

                {/* Written Evaluation Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Giudizio Analitico e Descrizione Competenze:
                  </h4>
                  <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200/80 whitespace-pre-wrap">
                    {evalMeta.description}
                  </p>
                </div>

                {evalMeta.recommendations && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Obiettivi per il secondo periodo didattico:
                    </h4>
                    <p className="text-slate-700 italic bg-amber-50/40 p-3 rounded-lg border border-amber-200/60">
                      {evalMeta.recommendations}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic mt-3">
                Nessuna valutazione registrata per il primo periodo.
              </p>
            )}
          </div>
        )}

        {/* Fine Anno */}
        {(scope === 'fine_anno' || scope === 'entrambe' || scope === 'anno_completo') && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 print-break-inside-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Valutazione di Fine Anno (2° Quadrimestre / Esito Finale)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Data verbalizzazione: {formatDateItalian(evalFine?.date || '2026-06-05')}
                  </span>
                </div>
              </div>

              {evalFine ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Voto Finale
                    </span>
                    <span className="text-2xl font-black text-emerald-700 font-mono">
                      {evalFine.overallGrade.toFixed(1)} / 10
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-amber-600 font-medium italic">
                  In attesa di compilazione
                </span>
              )}
            </div>

            {evalFine ? (
              <div className="mt-4 space-y-4">
                {/* Detailed Criteria Scores */}
                {evalFine.detailedGrades && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Tecnica</span>
                      <span className="text-sm font-bold text-slate-800">
                        {evalFine.detailedGrades.technique || '-'}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Lettura/Ritmo</span>
                      <span className="text-sm font-bold text-slate-800">
                        {evalFine.detailedGrades.readingRhythm || '-'}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Musicalità</span>
                      <span className="text-sm font-bold text-slate-800">
                        {evalFine.detailedGrades.musicality || '-'}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Impegno</span>
                      <span className="text-sm font-bold text-slate-800">
                        {evalFine.detailedGrades.dedication || '-'}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Teoria</span>
                      <span className="text-sm font-bold text-slate-800">
                        {evalFine.detailedGrades.theory || '-'}/10
                      </span>
                    </div>
                  </div>
                )}

                {/* Written Evaluation Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Giudizio Globale di Fine Anno Scolastico:
                  </h4>
                  <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200/80 whitespace-pre-wrap">
                    {evalFine.description}
                  </p>
                </div>

                {evalFine.recommendations && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Indicazioni per l'anno successivo / Proposta di livello:
                    </h4>
                    <p className="text-slate-700 italic bg-emerald-50/40 p-3 rounded-lg border border-emerald-200/60">
                      {evalFine.recommendations}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic mt-3">
                Nessuna valutazione registrata per il secondo periodo.
              </p>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: ACADEMIC PERFORMANCE PROGRESSION (Rendimento nel tempo) */}
      {(scope === 'anno_completo' || layoutConfig.showGradeProgressionChart) && gradeTimeline.length > 0 && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h3 className={`text-base font-bold flex items-center gap-2 ${themeColors.accentText}`}>
              <TrendingUp className="h-4 w-4" />
              Monitoraggio del Rendimento Accademico nel Tempo
            </h3>
            <span className="text-xs text-slate-500">
              Media complessiva verifiche: {(gradeTimeline.reduce((acc, p) => acc + p.grade, 0) / gradeTimeline.length).toFixed(1)} / 10
            </span>
          </div>

          {/* Timeline visualization */}
          <div className="space-y-2 mt-3">
            {gradeTimeline.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/70"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500 font-semibold w-24">
                    {formatDateItalian(item.date)}
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-slate-900 block">
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="text-xs text-slate-500">{item.description}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-32 hidden sm:block">
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(item.grade / 10) * 100}%` }}
                        className={`h-full rounded-full ${
                          item.grade >= 8 ? 'bg-emerald-500' : item.grade >= 6 ? 'bg-indigo-500' : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                  <span
                    className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded-md ${
                      item.grade >= 8
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.grade >= 6
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.grade.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: RECENT LESSONS SUMMARY (Diario progressi e compiti) */}
      {scope === 'anno_completo' && layoutConfig.showRecentLessons && lessons.length > 0 && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h3 className={`text-base font-bold flex items-center gap-2 ${themeColors.accentText}`}>
              <BookOpen className="h-4 w-4" />
              Estratto del Diario Didattico (Lezioni, Esercizi e Compiti)
            </h3>
            <span className="text-xs text-slate-500">Ultime lezioni annotate</span>
          </div>

          <div className="space-y-3 mt-3">
            {lessons.slice(0, 4).map((les) => (
              <div
                key={les.id}
                className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-slate-400" />
                    Lezione del {formatDateItalian(les.date)}
                  </span>
                  {les.rating && (
                    <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Voto lezione: {les.rating}/10
                    </span>
                  )}
                </div>
                {les.progress && (
                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900 font-medium">Progressi: </strong>
                    {les.progress}
                  </p>
                )}
                {les.exercisesDone && (
                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900 font-medium">Esercizi svolti: </strong>
                    {les.exercisesDone}
                  </p>
                )}
                {les.homeworkAssigned && (
                  <p className="text-xs text-indigo-900 bg-indigo-50/80 p-2 rounded border border-indigo-100">
                    <strong className="font-semibold">Compiti assegnati: </strong>
                    {les.homeworkAssigned}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER & SIGNATURES SECTION */}
      <div className="pt-6 border-t border-slate-200 mt-8 print-break-inside-avoid">
        {layoutConfig.customFooterNote && (
          <p className="text-xs text-slate-500 italic text-center mb-8">
            {layoutConfig.customFooterNote}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-center">
          {layoutConfig.showTeacherSignature && (
            <div>
              <p className="text-xs text-slate-500 mb-10">Firma del Docente Titolare</p>
              <div className="border-t border-slate-400 mx-6 pt-1">
                <span className="text-xs font-semibold text-slate-800">
                  {layoutConfig.teacherName}
                </span>
              </div>
            </div>
          )}

          {layoutConfig.showPrincipalSignature && (
            <div>
              <p className="text-xs text-slate-500 mb-10">Il Dirigente Scolastico / Direttore</p>
              <div className="border-t border-slate-400 mx-6 pt-1">
                <span className="text-xs font-semibold text-slate-800">
                  Direzione Didattica
                </span>
              </div>
            </div>
          )}

          {layoutConfig.showParentSignature && (
            <div>
              <p className="text-xs text-slate-500 mb-10">Firma per presa visione del Genitore</p>
              <div className="border-t border-slate-400 mx-6 pt-1">
                <span className="text-xs font-semibold text-slate-800">Firma Genitore / Tutore</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
