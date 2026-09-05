import {
  School,
  Student,
  AttendanceRecord,
  LessonEntry,
  PeriodicEvaluation,
  IntermediateTest,
  ReportLayoutConfig,
  AppDatabaseState,
} from '../types';

const changeListeners = new Set<() => void>();

function notifyChange(): void {
  changeListeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
}

const STORAGE_KEYS = {
  SCHOOLS: 'registro_scuole_v1',
  ACTIVE_SCHOOL_ID: 'registro_active_school_id_v1',
  STUDENTS: 'registro_alunni_v1',
  ATTENDANCE: 'registro_presenze_v1',
  LESSONS: 'registro_lezioni_v1',
  EVALUATIONS: 'registro_valutazioni_v1',
  TESTS: 'registro_verifiche_v1',
  LAYOUT_CONFIG: 'registro_layout_config_v1',
};

export const DEFAULT_LAYOUT_CONFIG: ReportLayoutConfig = {
  headerStyle: 'modern',
  reportTitle: 'Scheda di Valutazione e Rendimento Annuale',
  schoolSubtitle: 'Anno Scolastico 2025/2026 - Registro di Classe',
  teacherName: 'Prof. Alessandro Morandi',
  showAttendanceChart: true,
  showGradeProgressionChart: true,
  showMonthlyAbsenceTable: true,
  showRecentLessons: true,
  showTheoryDetails: true,
  showTeacherSignature: true,
  showPrincipalSignature: true,
  showParentSignature: true,
  fontScale: 'standard',
  colorTheme: 'navy',
  customFooterNote: 'Documento ufficiale redatto a norma del piano dell\'offerta formativa.',
};

// Initial Seed Data for immediate realistic preview
const INITIAL_SCHOOLS: School[] = [
  {
    id: 'school-1',
    name: 'Accademia Musicale G. Verdi',
    city: 'Milano (MI)',
    academicYear: '2025/2026',
    address: 'Via Conservatorio 12',
    phone: '02 8765432',
    notes: 'Corsi accademici e pre-accademici pomeridiani',
  },
  {
    id: 'school-2',
    name: 'I.C. Dante Alighieri - Sez. Musicale',
    city: 'Bologna (BO)',
    academicYear: '2025/2026',
    address: 'Piazza Carducci 4',
    phone: '051 4321098',
    notes: 'Scuola Secondaria di Primo Grado ad Indirizzo Musicale',
  },
];

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stud-1',
    schoolId: 'school-1',
    firstName: 'Chiara',
    lastName: 'Ferrari',
    level: 'Intermedio',
    academicYear: '2° Anno',
    attendsMusicTheory: true,
    musicTheoryTeacher: 'Prof.ssa Rossana Bellini',
    instrument: 'Pianoforte',
    email: 'famiglia.ferrari@example.com',
    phone: '+39 347 1234567',
    notes: 'Ottima predisposizione musicale, buona disciplina nello studio.',
    enrollmentDate: '2024-09-15',
  },
  {
    id: 'stud-2',
    schoolId: 'school-1',
    firstName: 'Lorenzo',
    lastName: 'Russo',
    level: 'Avanzato',
    academicYear: '3° Anno',
    attendsMusicTheory: true,
    musicTheoryTeacher: 'Prof.ssa Rossana Bellini',
    instrument: 'Violino',
    email: 'lorenzo.russo.fam@example.com',
    phone: '+39 348 2345678',
    notes: 'Preparazione per concorsi giovanili di musica da camera.',
    enrollmentDate: '2023-09-10',
  },
  {
    id: 'stud-3',
    schoolId: 'school-1',
    firstName: 'Matteo',
    lastName: 'Bianchi',
    level: 'Base',
    academicYear: '1° Anno',
    attendsMusicTheory: false,
    instrument: 'Chitarra Classica',
    email: 'bianchi.genitori@example.com',
    phone: '+39 340 9876543',
    notes: 'Primo approccio allo strumento, molto motivato.',
    enrollmentDate: '2025-09-20',
  },
  {
    id: 'stud-4',
    schoolId: 'school-1',
    firstName: 'Sofia',
    lastName: 'Esposito',
    level: 'Intermedio',
    academicYear: '2° Anno',
    attendsMusicTheory: true,
    musicTheoryTeacher: 'Prof. Marco Trevisan',
    instrument: 'Flauto Traverso',
    email: 'esposito.musica@example.com',
    phone: '+39 339 5544332',
    notes: 'Suono pulito, lavorare su respirazione e appoggio diaframmatico.',
    enrollmentDate: '2024-09-18',
  },
  {
    id: 'stud-5',
    schoolId: 'school-2',
    firstName: 'Leonardo',
    lastName: 'Conti',
    level: 'Base',
    academicYear: '1° Anno',
    attendsMusicTheory: true,
    musicTheoryTeacher: 'Prof.ssa Elena Valenti',
    instrument: 'Pianoforte',
    email: 'conti.scuola@example.com',
    phone: '+39 333 1122334',
    notes: 'Buon ritmo e impostazione della mano.',
    enrollmentDate: '2025-09-12',
  },
  {
    id: 'stud-6',
    schoolId: 'school-2',
    firstName: 'Giulia',
    lastName: 'Marino',
    level: 'Avanzato',
    academicYear: '3° Anno',
    attendsMusicTheory: true,
    musicTheoryTeacher: 'Prof.ssa Elena Valenti',
    instrument: 'Clarinetto',
    email: 'marino.famiglia@example.com',
    phone: '+39 320 8899776',
    notes: 'Prime parti orchestra della scuola.',
    enrollmentDate: '2023-09-15',
  },
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  // Student 1 (Chiara) history
  { id: 'att-1-1', studentId: 'stud-1', schoolId: 'school-1', date: '2025-10-06', status: 'presente' },
  { id: 'att-1-2', studentId: 'stud-1', schoolId: 'school-1', date: '2025-10-13', status: 'presente' },
  { id: 'att-1-3', studentId: 'stud-1', schoolId: 'school-1', date: '2025-10-20', status: 'presente' },
  { id: 'att-1-4', studentId: 'stud-1', schoolId: 'school-1', date: '2025-10-27', status: 'ritardo', minutesLate: 10 },
  { id: 'att-1-5', studentId: 'stud-1', schoolId: 'school-1', date: '2025-11-03', status: 'presente' },
  { id: 'att-1-6', studentId: 'stud-1', schoolId: 'school-1', date: '2025-11-10', status: 'assente', notes: 'Influenza stagionale' },
  { id: 'att-1-7', studentId: 'stud-1', schoolId: 'school-1', date: '2025-11-17', status: 'giustificato', notes: 'Visita medica' },
  { id: 'att-1-8', studentId: 'stud-1', schoolId: 'school-1', date: '2025-11-24', status: 'presente' },
  { id: 'att-1-9', studentId: 'stud-1', schoolId: 'school-1', date: '2025-12-01', status: 'presente' },
  { id: 'att-1-10', studentId: 'stud-1', schoolId: 'school-1', date: '2025-12-08', status: 'presente' },
  { id: 'att-1-11', studentId: 'stud-1', schoolId: 'school-1', date: '2025-12-15', status: 'presente' },
  { id: 'att-1-12', studentId: 'stud-1', schoolId: 'school-1', date: '2026-01-12', status: 'presente' },
  { id: 'att-1-13', studentId: 'stud-1', schoolId: 'school-1', date: '2026-01-19', status: 'presente' },
  { id: 'att-1-14', studentId: 'stud-1', schoolId: 'school-1', date: '2026-01-26', status: 'assente', notes: 'Gita scolastica' },
  { id: 'att-1-15', studentId: 'stud-1', schoolId: 'school-1', date: '2026-02-02', status: 'presente' },
  { id: 'att-1-16', studentId: 'stud-1', schoolId: 'school-1', date: '2026-02-09', status: 'presente' },
  { id: 'att-1-17', studentId: 'stud-1', schoolId: 'school-1', date: '2026-02-16', status: 'presente' },
  { id: 'att-1-18', studentId: 'stud-1', schoolId: 'school-1', date: '2026-02-23', status: 'presente' },

  // Student 2 (Lorenzo)
  { id: 'att-2-1', studentId: 'stud-2', schoolId: 'school-1', date: '2025-10-07', status: 'presente' },
  { id: 'att-2-2', studentId: 'stud-2', schoolId: 'school-1', date: '2025-10-14', status: 'presente' },
  { id: 'att-2-3', studentId: 'stud-2', schoolId: 'school-1', date: '2025-10-21', status: 'presente' },
  { id: 'att-2-4', studentId: 'stud-2', schoolId: 'school-1', date: '2025-11-04', status: 'presente' },
  { id: 'att-2-5', studentId: 'stud-2', schoolId: 'school-1', date: '2025-11-18', status: 'assente', notes: 'Malattia' },
  { id: 'att-2-6', studentId: 'stud-2', schoolId: 'school-1', date: '2025-12-02', status: 'presente' },
  { id: 'att-2-7', studentId: 'stud-2', schoolId: 'school-1', date: '2026-01-13', status: 'presente' },
  { id: 'att-2-8', studentId: 'stud-2', schoolId: 'school-1', date: '2026-02-10', status: 'presente' },
];

const INITIAL_LESSONS: LessonEntry[] = [
  {
    id: 'les-1',
    studentId: 'stud-1',
    schoolId: 'school-1',
    date: '2026-02-23',
    progress: 'Migliorata l\'articolazione delle terzine a mani unite. Buon controllo dinamico nel cantabile.',
    exercisesDone: 'Scale di Sol maggiore e Mi minore a 4 ottave; Cesi-Marciano n. 18 battute 1-32; Clementi Sonatina op. 36 n. 1 primo tempo.',
    homeworkAssigned: 'Ripassare Clementi a tempo con metronomo a 80 alla semiminima; iniziare le battute 33-56 con diteggiatura segnata; studio scale con ritmo puntato.',
    rating: 9,
    teacherNotes: 'Ottima concentrazione durante l\'intera ora di lezione.',
  },
  {
    id: 'les-2',
    studentId: 'stud-1',
    schoolId: 'school-1',
    date: '2026-02-16',
    progress: 'Impostazione corretta del tocco nel piano e pianissimo. Risolto l\'incaglio ritmico alla misura 14.',
    exercisesDone: 'Hanon esercizi 1-5; Cesi-Marciano n. 18 lettura prime 16 battute.',
    homeworkAssigned: 'Hanon 1-5 variando le dinamiche (crescendo e diminuendo); completare la lettura del Cesi-Marciano n. 18 a mani separate.',
    rating: 8,
    teacherNotes: 'Sollecitare l\'attenzione sui pollici in passaggio.',
  },
  {
    id: 'les-3',
    studentId: 'stud-1',
    schoolId: 'school-1',
    date: '2026-02-09',
    progress: 'Buona scioltezza generale, ottima risposta alle indicazioni interpretative.',
    exercisesDone: 'Beyer Studi 80 e 85; arpeggi di Do maggiore e La minore.',
    homeworkAssigned: 'Beyer 85 a memoria; iniziare Clementi Sonatina op. 36 n. 1.',
    rating: 8,
  },
  {
    id: 'les-4',
    studentId: 'stud-2',
    schoolId: 'school-1',
    date: '2026-02-24',
    progress: 'Cambi di posizione fluidi (3ª e 4ª posizione), ottima intonazione sul registro acuto.',
    exercisesDone: 'Sevcik op. 1 fasc. 1; Kreutzer studio n. 2.',
    homeworkAssigned: 'Kreutzer n. 2 con diversi colpi d\'arco (martellato e staccato); Vivaldi Concerto in La minore.',
    rating: 9,
  },
];

const INITIAL_EVALUATIONS: PeriodicEvaluation[] = [
  {
    id: 'eval-1',
    studentId: 'stud-1',
    schoolId: 'school-1',
    type: 'meta_anno',
    date: '2026-01-30',
    overallGrade: 8.5,
    detailedGrades: {
      technique: 8,
      readingRhythm: 9,
      musicality: 8.5,
      dedication: 9,
      theory: 8.5,
    },
    description: 'L\'alunna Chiara ha dimostrato un impegno costante e una viva passione durante il primo quadrimestre. Ha acquisito una buona indipendenza delle dita e una consapevolezza ritmica solida. La partecipazione alle lezioni è attiva e proficua, con un rispetto scrupoloso dei compiti assegnati.',
    recommendations: 'Continuare a perfezionare il rilassamento del polso nei passaggi veloci e incrementare il lavoro sull\'interpretazione espressiva.',
    teacherName: 'Prof. Alessandro Morandi',
  },
  {
    id: 'eval-2',
    studentId: 'stud-1',
    schoolId: 'school-1',
    type: 'fine_anno',
    date: '2026-06-05',
    overallGrade: 9.0,
    detailedGrades: {
      technique: 9,
      readingRhythm: 9.5,
      musicality: 9,
      dedication: 9.5,
      theory: 9,
    },
    description: 'Chiara conclude l\'anno scolastico con risultati eccellenti. Ha superato con maturità tutte le difficoltà tecniche previste per il programma del 2° anno, dimostrando una spiccata sensibilità interpretativa durante il saggio di fine anno. Il percorso in teoria musicale ha supportato egregiamente la lettura a prima vista.',
    recommendations: 'Pronta per il passaggio al livello Avanzato (3° anno) con repertorio classico e romantico.',
    teacherName: 'Prof. Alessandro Morandi',
  },
  {
    id: 'eval-3',
    studentId: 'stud-2',
    schoolId: 'school-1',
    type: 'meta_anno',
    date: '2026-01-30',
    overallGrade: 9.0,
    detailedGrades: {
      technique: 9,
      readingRhythm: 9,
      musicality: 9.5,
      dedication: 9,
      theory: 9,
    },
    description: 'Lorenzo mantiene un rendimento di altissimo livello. La cura del suono e l\'intonazione al violino sono di notevole caratura per la sua fascia d\'età. Studio rigoroso e continuativo.',
    recommendations: 'Intensificare la preparazione del concerto per l\'esibizione al concorso regionale.',
    teacherName: 'Prof. Alessandro Morandi',
  },
];

const INITIAL_TESTS: IntermediateTest[] = [
  {
    id: 'test-1',
    studentId: 'stud-1',
    schoolId: 'school-1',
    date: '2025-10-27',
    subject: 'Verifica scale maggiori e arpeggi',
    grade: 8.0,
    notes: 'Scale fluide, curare il ritorno.',
  },
  {
    id: 'test-2',
    studentId: 'stud-1',
    schoolId: 'school-1',
    date: '2025-11-24',
    subject: 'Studio Beyer n. 80 e lettura a prima vista',
    grade: 8.5,
    notes: 'Ottima prontezza di lettura.',
  },
  {
    id: 'test-3',
    studentId: 'stud-1',
    schoolId: 'school-1',
    date: '2025-12-15',
    subject: 'Brano di Natale e articolazione a due mani',
    grade: 8.5,
    notes: 'Espressione musicale convincente.',
  },
  {
    id: 'test-4',
    studentId: 'stud-1',
    schoolId: 'school-1',
    date: '2026-01-19',
    subject: 'Verifica pre-quadrimestrale Clementi',
    grade: 9.0,
    notes: 'Ottima esecuzione a memoria.',
  },
  {
    id: 'test-5',
    studentId: 'stud-1',
    schoolId: 'school-1',
    date: '2026-02-23',
    subject: 'Studi Cesi-Marciano e scale minori',
    grade: 9.0,
    notes: 'Precisione metronomica eccellente.',
  },
  {
    id: 'test-6',
    studentId: 'stud-2',
    schoolId: 'school-1',
    date: '2025-11-15',
    subject: 'Studi Sevcik e colpi d\'arco',
    grade: 9.0,
    notes: 'Arco stabile e pulito.',
  },
  {
    id: 'test-7',
    studentId: 'stud-2',
    schoolId: 'school-1',
    date: '2026-01-20',
    subject: 'Kreutzer n. 2 e Vivaldi tempo 1',
    grade: 9.5,
    notes: 'Suono vibrante e maturo.',
  },
];

// Helper safe JSON reader
function getJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setJson<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export const StorageService = {
  // Initialization
  init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SCHOOLS)) {
      setJson(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID, INITIAL_SCHOOLS[0].id);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      setJson(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      setJson(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LESSONS)) {
      setJson(STORAGE_KEYS.LESSONS, INITIAL_LESSONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVALUATIONS)) {
      setJson(STORAGE_KEYS.EVALUATIONS, INITIAL_EVALUATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TESTS)) {
      setJson(STORAGE_KEYS.TESTS, INITIAL_TESTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LAYOUT_CONFIG)) {
      setJson(STORAGE_KEYS.LAYOUT_CONFIG, DEFAULT_LAYOUT_CONFIG);
    }
  },

  // Schools
  getSchools(): School[] {
    return getJson<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
  },
  saveSchools(schools: School[]): void {
    setJson(STORAGE_KEYS.SCHOOLS, schools);
    notifyChange();
  },
  getActiveSchoolId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID) || INITIAL_SCHOOLS[0].id;
  },
  setActiveSchoolId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID, id);
    notifyChange();
  },

  // Students
  getStudents(schoolId?: string): Student[] {
    const all = getJson<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    return schoolId ? all.filter((s) => s.schoolId === schoolId) : all;
  },
  saveStudents(students: Student[]): void {
    setJson(STORAGE_KEYS.STUDENTS, students);
    notifyChange();
  },
  upsertStudent(student: Student): void {
    const all = this.getStudents();
    const idx = all.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      all[idx] = student;
    } else {
      all.push(student);
    }
    this.saveStudents(all);
  },
  deleteStudent(id: string): void {
    const all = this.getStudents().filter((s) => s.id !== id);
    this.saveStudents(all);
  },

  // Attendance
  getAttendance(studentId?: string, schoolId?: string): AttendanceRecord[] {
    let all = getJson<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    if (studentId) all = all.filter((a) => a.studentId === studentId);
    if (schoolId) all = all.filter((a) => a.schoolId === schoolId);
    return all;
  },
  saveAttendance(records: AttendanceRecord[]): void {
    setJson(STORAGE_KEYS.ATTENDANCE, records);
    notifyChange();
  },
  recordAttendance(record: AttendanceRecord): void {
    const all = this.getAttendance();
    const idx = all.findIndex(
      (a) => a.studentId === record.studentId && a.date === record.date
    );
    if (idx >= 0) {
      all[idx] = record;
    } else {
      all.push(record);
    }
    this.saveAttendance(all);
  },
  removeAttendance(studentId: string, date: string): void {
    const all = this.getAttendance().filter(
      (a) => !(a.studentId === studentId && a.date === date)
    );
    this.saveAttendance(all);
  },

  // Lessons / Diary
  getLessons(studentId?: string, schoolId?: string): LessonEntry[] {
    let all = getJson<LessonEntry[]>(STORAGE_KEYS.LESSONS, INITIAL_LESSONS);
    if (studentId) all = all.filter((l) => l.studentId === studentId);
    if (schoolId) all = all.filter((l) => l.schoolId === schoolId);
    return all.sort((a, b) => b.date.localeCompare(a.date));
  },
  saveLessons(lessons: LessonEntry[]): void {
    setJson(STORAGE_KEYS.LESSONS, lessons);
    notifyChange();
  },
  upsertLesson(lesson: LessonEntry): void {
    const all = this.getLessons();
    const idx = all.findIndex((l) => l.id === lesson.id);
    if (idx >= 0) {
      all[idx] = lesson;
    } else {
      all.unshift(lesson);
    }
    this.saveLessons(all);
  },
  deleteLesson(id: string): void {
    const all = this.getLessons().filter((l) => l.id !== id);
    this.saveLessons(all);
  },

  // Evaluations
  getEvaluations(studentId?: string, schoolId?: string): PeriodicEvaluation[] {
    let all = getJson<PeriodicEvaluation[]>(STORAGE_KEYS.EVALUATIONS, INITIAL_EVALUATIONS);
    if (studentId) all = all.filter((e) => e.studentId === studentId);
    if (schoolId) all = all.filter((e) => e.schoolId === schoolId);
    return all;
  },
  saveEvaluations(evals: PeriodicEvaluation[]): void {
    setJson(STORAGE_KEYS.EVALUATIONS, evals);
    notifyChange();
  },
  upsertEvaluation(evalRecord: PeriodicEvaluation): void {
    const all = this.getEvaluations();
    const idx = all.findIndex((e) => e.id === evalRecord.id);
    if (idx >= 0) {
      all[idx] = evalRecord;
    } else {
      all.push(evalRecord);
    }
    this.saveEvaluations(all);
  },

  // Intermediate Tests
  getTests(studentId?: string, schoolId?: string): IntermediateTest[] {
    let all = getJson<IntermediateTest[]>(STORAGE_KEYS.TESTS, INITIAL_TESTS);
    if (studentId) all = all.filter((t) => t.studentId === studentId);
    if (schoolId) all = all.filter((t) => t.schoolId === schoolId);
    return all.sort((a, b) => a.date.localeCompare(b.date));
  },
  saveTests(tests: IntermediateTest[]): void {
    setJson(STORAGE_KEYS.TESTS, tests);
    notifyChange();
  },
  upsertTest(test: IntermediateTest): void {
    const all = this.getTests();
    const idx = all.findIndex((t) => t.id === test.id);
    if (idx >= 0) {
      all[idx] = test;
    } else {
      all.push(test);
    }
    this.saveTests(all);
  },
  deleteTest(id: string): void {
    const all = this.getTests().filter((t) => t.id !== id);
    this.saveTests(all);
  },

  // Layout Config
  getLayoutConfig(): ReportLayoutConfig {
    return getJson<ReportLayoutConfig>(STORAGE_KEYS.LAYOUT_CONFIG, DEFAULT_LAYOUT_CONFIG);
  },
  saveLayoutConfig(cfg: ReportLayoutConfig): void {
    setJson(STORAGE_KEYS.LAYOUT_CONFIG, cfg);
    notifyChange();
  },

  // State Subscription and Cloud Sync helpers
  subscribe(listener: () => void): () => void {
    changeListeners.add(listener);
    return () => {
      changeListeners.delete(listener);
    };
  },
  getFullDatabaseObject(): AppDatabaseState {
    return {
      schools: this.getSchools(),
      activeSchoolId: this.getActiveSchoolId(),
      students: this.getStudents(),
      attendance: this.getAttendance(),
      lessons: this.getLessons(),
      evaluations: this.getEvaluations(),
      tests: this.getTests(),
      layoutConfig: this.getLayoutConfig(),
    };
  },
  applyCloudState(data: Partial<AppDatabaseState>, notify: boolean = true): void {
    if (data.schools && Array.isArray(data.schools)) {
      setJson(STORAGE_KEYS.SCHOOLS, data.schools);
    }
    if (data.activeSchoolId && typeof data.activeSchoolId === 'string') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID, data.activeSchoolId);
    }
    if (data.students && Array.isArray(data.students)) {
      setJson(STORAGE_KEYS.STUDENTS, data.students);
    }
    if (data.attendance && Array.isArray(data.attendance)) {
      setJson(STORAGE_KEYS.ATTENDANCE, data.attendance);
    }
    if (data.lessons && Array.isArray(data.lessons)) {
      setJson(STORAGE_KEYS.LESSONS, data.lessons);
    }
    if (data.evaluations && Array.isArray(data.evaluations)) {
      setJson(STORAGE_KEYS.EVALUATIONS, data.evaluations);
    }
    if (data.tests && Array.isArray(data.tests)) {
      setJson(STORAGE_KEYS.TESTS, data.tests);
    }
    if (data.layoutConfig) {
      setJson(STORAGE_KEYS.LAYOUT_CONFIG, data.layoutConfig);
    }
    if (notify) {
      notifyChange();
    }
  },

  // Full Database Export & Import
  exportFullDatabaseJson(): string {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      ...this.getFullDatabaseObject(),
    };
    return JSON.stringify(payload, null, 2);
  },
  importFullDatabaseJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      this.applyCloudState(data, true);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },
  resetToDefaults(): void {
    localStorage.clear();
    this.init();
    notifyChange();
  },
};
