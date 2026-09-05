import React, { useState, useEffect } from 'react';
import { School, Student } from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { StudentList } from './components/StudentList';
import { StudentDetailView } from './components/StudentDetailView';
import { StudentModal } from './components/StudentModal';
import { SchoolManagerModal } from './components/SchoolManagerModal';
import { ClassRegisterView } from './components/ClassRegisterView';
import { MonthlyReportsView } from './components/MonthlyReportsView';
import { DatabaseBackupModal } from './components/DatabaseBackupModal';

export default function App() {
  const [schools, setSchools] = useState<School[]>(() => {
    StorageService.init();
    return StorageService.getSchools();
  });

  const [activeSchoolId, setActiveSchoolId] = useState<string>(() => {
    return StorageService.getActiveSchoolId();
  });

  const [students, setStudents] = useState<Student[]>(() => {
    return StorageService.getStudents();
  });

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<'alunni' | 'appello' | 'statistiche'>('alunni');

  // Modals
  const [isSchoolManagerOpen, setIsSchoolManagerOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const refreshAllData = () => {
    const updatedSchools = StorageService.getSchools();
    const currentActiveId = StorageService.getActiveSchoolId();
    setSchools(updatedSchools);
    setActiveSchoolId(currentActiveId);
    setStudents(StorageService.getStudents());

    setSelectedStudent((prev) => {
      if (!prev) return null;
      const refreshed = StorageService.getStudents().find((s) => s.id === prev.id);
      return refreshed || null;
    });
  };

  // Initialize storage & subscribe to changes
  useEffect(() => {
    StorageService.init();
    const cleanupStorage = StorageService.subscribe(() => {
      refreshAllData();
    });

    return () => {
      cleanupStorage();
    };
  }, []);

  // Active School Object
  const activeSchool = schools.find((s) => s.id === activeSchoolId) || schools[0];
  const activeStudents = students.filter((s) => s.schoolId === activeSchool?.id);

  const handleSelectSchool = (schoolId: string) => {
    setActiveSchoolId(schoolId);
    StorageService.setActiveSchoolId(schoolId);
    setSelectedStudent(null);
  };

  const handleSaveStudent = (student: Student) => {
    StorageService.upsertStudent(student);
    refreshAllData();
    if (selectedStudent?.id === student.id) {
      setSelectedStudent(student);
    }
  };

  const handleDeleteStudent = (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo alunno e tutti i suoi dati associati?')) {
      return;
    }
    StorageService.deleteStudent(id);
    refreshAllData();
    if (selectedStudent?.id === id) {
      setSelectedStudent(null);
    }
  };

  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar with School Switcher */}
      <Navbar
        schools={schools}
        activeSchool={activeSchool}
        onSelectSchool={handleSelectSchool}
        onOpenSchoolManager={() => setIsSchoolManagerOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        activeMainTab={activeMainTab}
        onChangeMainTab={(tab) => {
          setActiveMainTab(tab);
          setSelectedStudent(null);
        }}
        totalStudentsInActiveSchool={activeStudents.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {selectedStudent ? (
          /* Student Detail Page: Diary, Attendance, Periodic Evaluations, PDF Report */
          <StudentDetailView
            student={selectedStudent}
            school={activeSchool}
            onBack={() => setSelectedStudent(null)}
            onEditStudent={handleOpenEditStudent}
          />
        ) : (
          /* Primary Views based on Main Tab */
          <>
            {activeMainTab === 'alunni' && (
              <StudentList
                school={activeSchool}
                students={activeStudents}
                onSelectStudent={(s) => setSelectedStudent(s)}
                onAddStudent={handleOpenAddStudent}
                onEditStudent={handleOpenEditStudent}
                onDeleteStudent={handleDeleteStudent}
              />
            )}

            {activeMainTab === 'appello' && (
              <ClassRegisterView
                school={activeSchool}
                students={activeStudents}
                onSelectStudent={(s) => setSelectedStudent(s)}
              />
            )}

            {activeMainTab === 'statistiche' && (
              <MonthlyReportsView
                school={activeSchool}
                students={activeStudents}
                onSelectStudent={(s) => setSelectedStudent(s)}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <SchoolManagerModal
        isOpen={isSchoolManagerOpen}
        onClose={() => setIsSchoolManagerOpen(false)}
        activeSchoolId={activeSchoolId}
        onSelectSchool={handleSelectSchool}
        onSchoolsChanged={refreshAllData}
      />

      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
        schoolId={activeSchoolId}
        studentToEdit={studentToEdit}
      />

      <DatabaseBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataReset={refreshAllData}
      />
    </div>
  );
}
