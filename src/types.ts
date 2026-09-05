export type AttendanceStatus = 'presente' | 'assente' | 'giustificato' | 'ritardo';

export interface School {
  id: string;
  name: string;
  city: string;
  academicYear: string;
  address?: string;
  phone?: string;
  notes?: string;
}

export interface Student {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  level: string; // e.g., 'Base', 'Intermedio', 'Avanzato', 'Grado 1-5'
  academicYear: string; // e.g., '1° Anno', '2° Anno', '3° Anno'
  attendsMusicTheory: boolean;
  musicTheoryTeacher?: string;
  instrument?: string;
  email?: string;
  phone?: string;
  notes?: string;
  enrollmentDate: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  minutesLate?: number;
  notes?: string;
}

export interface LessonEntry {
  id: string;
  studentId: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  progress: string; // "progressi fatti"
  exercisesDone: string; // "esercizi e compiti svolti durante la lezione"
  homeworkAssigned: string; // "compiti ed esercizi da fare a casa"
  rating?: number; // 1-10 daily check (optional)
  teacherNotes?: string;
}

export interface DetailedGrade {
  technique?: number; // 1-10
  readingRhythm?: number; // 1-10
  musicality?: number; // 1-10
  dedication?: number; // 1-10
  theory?: number; // 1-10
}

export interface PeriodicEvaluation {
  id: string;
  studentId: string;
  schoolId: string;
  type: 'meta_anno' | 'fine_anno';
  date: string; // YYYY-MM-DD
  overallGrade: number; // 1-10
  detailedGrades?: DetailedGrade;
  description: string; // Detailed text evaluation
  recommendations?: string;
  teacherName?: string;
}

export interface IntermediateTest {
  id: string;
  studentId: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  subject: string; // e.g. "Studio op. 599", "Scale maggiori", "Dettato ritmico"
  grade: number; // 1-10
  notes?: string;
}

export interface ReportLayoutConfig {
  headerStyle: 'modern' | 'classic' | 'minimal';
  reportTitle: string;
  schoolSubtitle: string;
  teacherName: string;
  showAttendanceChart: boolean;
  showGradeProgressionChart: boolean;
  showMonthlyAbsenceTable: boolean;
  showRecentLessons: boolean;
  showTheoryDetails: boolean;
  showTeacherSignature: boolean;
  showPrincipalSignature: boolean;
  showParentSignature: boolean;
  fontScale: 'compact' | 'standard' | 'spacious';
  colorTheme: 'navy' | 'emerald' | 'burgundy' | 'slate';
  customFooterNote?: string;
}

export type ReportScope = 'meta_anno' | 'fine_anno' | 'entrambe' | 'anno_completo';

export interface AppDatabaseState {
  schools: School[];
  activeSchoolId: string;
  students: Student[];
  attendance: AttendanceRecord[];
  lessons: LessonEntry[];
  evaluations: PeriodicEvaluation[];
  tests: IntermediateTest[];
  layoutConfig: ReportLayoutConfig;
}

export type CloudSyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
