import { AttendanceRecord, IntermediateTest, PeriodicEvaluation } from '../types';

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  presenceRate: number; // e.g. 92.5 (%)
  absenceRate: number; // e.g. 7.5 (%)
}

export interface MonthlyAttendanceData {
  monthKey: string; // "2025-10"
  monthName: string; // "Ott 2025"
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number;
}

export interface GradeTimelinePoint {
  date: string; // YYYY-MM-DD
  label: string; // "Ott - Scale", "Mid-Term", etc.
  grade: number; // 1-10
  type: 'verifica' | 'valutazione_periodica';
  description?: string;
}

const MONTH_NAMES_IT = [
  'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
  'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
];

export function calculateAttendanceStats(records: AttendanceRecord[]): AttendanceStats {
  const total = records.length;
  if (total === 0) {
    return {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      presenceRate: 100,
      absenceRate: 0,
    };
  }

  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  for (const r of records) {
    if (r.status === 'presente') present++;
    else if (r.status === 'assente') absent++;
    else if (r.status === 'ritardo') {
      late++;
      present++; // late counts towards presence in typical school registries
    } else if (r.status === 'giustificato') {
      excused++;
    }
  }

  const presenceRate = Number(((present / total) * 100).toFixed(1));
  const absenceRate = Number(((absent / total) * 100).toFixed(1));

  return {
    total,
    present,
    absent,
    late,
    excused,
    presenceRate,
    absenceRate,
  };
}

export function getMonthlyAttendanceBreakdown(records: AttendanceRecord[]): MonthlyAttendanceData[] {
  const map: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};

  records.forEach((r) => {
    if (!r.date) return;
    const monthKey = r.date.substring(0, 7); // "YYYY-MM"
    if (!map[monthKey]) {
      map[monthKey] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    }
    map[monthKey].total++;
    if (r.status === 'presente') map[monthKey].present++;
    else if (r.status === 'assente') map[monthKey].absent++;
    else if (r.status === 'ritardo') {
      map[monthKey].late++;
      map[monthKey].present++;
    } else if (r.status === 'giustificato') {
      map[monthKey].excused++;
    }
  });

  const sortedKeys = Object.keys(map).sort();
  return sortedKeys.map((key) => {
    const [year, monthStr] = key.split('-');
    const mIdx = parseInt(monthStr, 10) - 1;
    const monthName = `${MONTH_NAMES_IT[mIdx]} ${year}`;
    const stats = map[key];
    const rate = stats.total > 0 ? Number(((stats.present / stats.total) * 100).toFixed(1)) : 0;
    return {
      monthKey: key,
      monthName,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      excused: stats.excused,
      total: stats.total,
      rate,
    };
  });
}

export function buildGradeTimeline(
  tests: IntermediateTest[],
  evaluations: PeriodicEvaluation[]
): GradeTimelinePoint[] {
  const points: GradeTimelinePoint[] = [];

  tests.forEach((t) => {
    points.push({
      date: t.date,
      label: t.subject,
      grade: t.grade,
      type: 'verifica',
      description: t.notes,
    });
  });

  evaluations.forEach((e) => {
    points.push({
      date: e.date,
      label: e.type === 'meta_anno' ? 'Valutazione 1° Quadrimestre' : 'Valutazione Finale',
      grade: e.overallGrade,
      type: 'valutazione_periodica',
      description: e.description,
    });
  });

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export function formatDateItalian(dateStr?: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  const mIdx = parseInt(month, 10) - 1;
  return `${day} ${MONTH_NAMES_IT[mIdx]} ${year}`;
}
