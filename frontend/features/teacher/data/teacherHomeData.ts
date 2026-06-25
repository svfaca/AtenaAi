export type TeacherStat = {
  id: string;
  label: string;
  value: number;
  tone: 'blue' | 'green' | 'orange';
};

export type TeacherClassroom = {
  id: string;
  name: string;
  code: string;
  students: number;
  pendingRequests: number;
};

export type TeacherStudent = {
  id: string;
  name: string;
  classroom: string;
  initials: string;
};

export const teacherHomeData = {
  stats: [
    { id: 'classrooms', label: 'Total de Turmas', value: 5, tone: 'blue' },
    { id: 'students', label: 'Total de Alunos', value: 124, tone: 'green' },
    { id: 'pending', label: 'Solicitacoes pendentes', value: 6, tone: 'orange' },
  ] as TeacherStat[],
  classrooms: [
    { id: 'c1', name: '1A - Matematica', code: 'MAT-1A', students: 28, pendingRequests: 2 },
    { id: 'c2', name: '2B - Fisica', code: 'FIS-2B', students: 25, pendingRequests: 1 },
    { id: 'c3', name: '3C - Quimica', code: 'QUI-3C', students: 22, pendingRequests: 3 },
    { id: 'c4', name: 'Reforco ENEM', code: 'ENEM-R1', students: 31, pendingRequests: 0 },
    { id: 'c5', name: 'Projeto Ciencias', code: 'CIE-PJ', students: 18, pendingRequests: 0 },
  ] as TeacherClassroom[],
  students: [
    { id: 's1', name: 'Ana Clara', classroom: '1A - Matematica', initials: 'AC' },
    { id: 's2', name: 'Bruno Lima', classroom: '2B - Fisica', initials: 'BL' },
    { id: 's3', name: 'Carla Souza', classroom: '3C - Quimica', initials: 'CS' },
    { id: 's4', name: 'Diego Santos', classroom: 'Reforco ENEM', initials: 'DS' },
    { id: 's5', name: 'Elisa Rocha', classroom: 'Projeto Ciencias', initials: 'ER' },
    { id: 's6', name: 'Felipe Costa', classroom: '1A - Matematica', initials: 'FC' },
    { id: 's7', name: 'Giovana Melo', classroom: '2B - Fisica', initials: 'GM' },
    { id: 's8', name: 'Henrique Nunes', classroom: '3C - Quimica', initials: 'HN' },
  ] as TeacherStudent[],
};
