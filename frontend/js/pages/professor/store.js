/**
 * 🎯 STORE CENTRAL - Gerenciador de Estado
 * 
 * Padrão: Store centralizado + Listeners reativos
 * Toda mudança passa por funções específicas que notificam listeners
 */

export const store = {
  // 📊 ESTADO DO APP
  classrooms: [],
  students: [],
  pendingStudents: {},    // Map por classroom: { classroomId: [...students] }
  selectedClassroom: null,
  metrics: {
    totalStudents: 0,
    totalClassrooms: 0,
    totalPendingRequests: 0,
  },
  
  // 🚀 ESTADO DE CARREGAMENTO
  isLoading: false,
  isAutoRefreshing: false,
  
  // 🔄 ESTADO DE UI
  lastAutoRefreshTime: null,
  lastStateSnapshot: null,  // Para comparar mudanças
};

// 📡 LISTENERS - Funções que reagem a mudanças
const listeners = {
  onStateChange: [],
  onClassroomsChange: [],
  onMetricsChange: [],
  onLoadingChange: [],
  onPendingStudentsChange: [],
};

/**
 * 🔔 REGISTRAR LISTENERS
 */
export function subscribe(eventType, callback) {
  if (!listeners[eventType]) {
    console.warn(`Unknown event type: ${eventType}`);
    return;
  }
  listeners[eventType].push(callback);
  
  // Retornar função para desinscrever
  return () => {
    listeners[eventType] = listeners[eventType].filter(cb => cb !== callback);
  };
}

/**
 * 🔥 DISPARAR EVENTO
 */
function notify(eventType, data = null) {
  console.log(`[STORE] Event: ${eventType}`, data);
  if (listeners[eventType]) {
    listeners[eventType].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in listener for ${eventType}:`, error);
      }
    });
  }
}

/**
 * 📋 ATUALIZAR TURMAS
 */
export function setClassrooms(newClassrooms) {
  store.classrooms = Array.isArray(newClassrooms) ? newClassrooms : [];
  store.lastStateSnapshot = JSON.parse(JSON.stringify(store.classrooms));
  notify('onClassroomsChange', store.classrooms);
  notify('onStateChange', 'classrooms');
}

/**
 * ➕ ADICIONAR TURMA
 */
export function addClassroom(classroom, { sortDescById = false } = {}) {
  // Inserir no topo para aparecer imediatamente
  store.classrooms = [classroom, ...store.classrooms];

  // Manter ordem decrescente por id para alinhar com backend
  if (sortDescById) {
    store.classrooms.sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  updateMetrics();
  notify('onClassroomsChange', store.classrooms);
  notify('onStateChange', 'add-classroom');
}

/**
 * 🗑️ REMOVER TURMA
 */
export function removeClassroom(classroomId) {
  store.classrooms = store.classrooms.filter(c => c.id !== classroomId);
  updateMetrics();
  notify('onClassroomsChange', store.classrooms);
  notify('onStateChange', 'remove-classroom');
}

/**
 * ✏️ ATUALIZAR TURMA ESPECÍFICA (merge)
 */
export function updateClassroom(classroomId, updates) {
  const classroom = store.classrooms.find(c => c.id === classroomId);
  if (classroom) {
    Object.assign(classroom, updates);
    updateMetrics();
    notify('onClassroomsChange', store.classrooms);
    notify('onStateChange', 'update-classroom');
  }
}

/**
 * 👥 ADICIONAR ALUNO À TURMA
 */
export function addStudentToClassroom(classroomId, student) {
  const classroom = store.classrooms.find(c => c.id === classroomId);
  if (classroom) {
    if (!classroom.students) classroom.students = [];
    classroom.students.push(student);
    updateMetrics();
    notify('onClassroomsChange', store.classrooms);
    notify('onStateChange', 'add-student');
  }
}

/**
 * 🚫 REMOVER ALUNO DA TURMA
 */
export function removeStudentFromClassroom(classroomId, studentId) {
  const classroom = store.classrooms.find(c => c.id === classroomId);
  if (classroom) {
    classroom.students = (classroom.students || []).filter(s => s.id !== studentId);
    classroom.pending_students = (classroom.pending_students || []).filter(s => s.id !== studentId);
    updateMetrics();
    notify('onClassroomsChange', store.classrooms);
    notify('onStateChange', 'remove-student');
  }
}

/**
 * 📝 ATUALIZAR ALUNOS PENDENTES
 */
export function setPendingStudents(classroomId, students) {
  store.pendingStudents[classroomId] = students;
  const classroom = store.classrooms.find(c => c.id === classroomId);
  if (classroom) {
    classroom.pending_students = students;
    updateMetrics();
  }
  notify('onPendingStudentsChange', { classroomId, students });
  notify('onStateChange', 'pending-students');
}

/**
 * 👥 ATUALIZAR LISTA DE ALUNOS
 */
export function setStudents(students) {
  store.students = Array.isArray(students) ? students : [];
  updateMetrics();
  notify('onStateChange', 'students');
}

/**
 * 📊 ATUALIZAR MÉTRICAS
 */
export function setMetrics(metrics) {
  store.metrics = { ...store.metrics, ...metrics };
  updateMetrics();
  notify('onMetricsChange', store.metrics);
}

/**
 * 🔄 CALCULAR MÉTRICAS AUTOMATICAMENTE
 */
function updateMetrics() {
  store.metrics.totalClassrooms = store.classrooms.length;
  store.metrics.totalStudents = store.classrooms.reduce((acc, c) => acc + (c.students || []).length, 0);
  store.metrics.totalPendingRequests = store.classrooms.reduce((acc, c) => acc + (c.pending_students || []).length, 0);
}

/**
 * 🎯 SELECIONAR TURMA
 */
export function selectClassroom(classroom) {
  store.selectedClassroom = classroom;
  notify('onStateChange', 'selected-classroom');
}

/**
 * 🚀 SET LOADING STATE
 */
export function setLoading(isLoading) {
  store.isLoading = isLoading;
  notify('onLoadingChange', isLoading);
}

/**
 * 🔄 SET AUTO-REFRESH STATE
 */
export function setAutoRefreshing(isRefreshing) {
  store.isAutoRefreshing = isRefreshing;
}

/**
 * 📸 TOMAR SNAPSHOT PARA COMPARAÇÃO
 */
export function takeSnapshot() {
  return JSON.parse(JSON.stringify(store.classrooms));
}

/**
 * 🔍 COMPARAR ESTADO ANTERIOR COM NOVO
 * Retorna objeto com as mudanças detectadas
 */
export function detectStateChanges(oldState, newState) {
  const changes = {
    added: [],
    removed: [],
    updated: [],
    newPendingRequests: [],
    approvedStudents: [],
  };

  if (!oldState || oldState.length === 0) {
    return changes;
  }

  const oldMap = Object.fromEntries(oldState.map(c => [c.id, c]));
  const newMap = Object.fromEntries(newState.map(c => [c.id, c]));

  // Detectar noves turmas
  newState.forEach(newClass => {
    if (!oldMap[newClass.id]) {
      changes.added.push(newClass);
    }
  });

  // Detectar turmas removidas
  oldState.forEach(oldClass => {
    if (!newMap[oldClass.id]) {
      changes.removed.push(oldClass.id);
    }
  });

  // Detectar mudanças e alunos
  newState.forEach(newClass => {
    const oldClass = oldMap[newClass.id];
    if (!oldClass) return;

    // Detectar turmas atualizadas (nome, etc)
    if (JSON.stringify(oldClass) !== JSON.stringify(newClass)) {
      changes.updated.push(newClass);
    }

    // Detectar NOVAS solicitações (alunos em pending mas não estavam)
    const oldPendingIds = (oldClass.pending_students || []).map(s => s.id);
    const newPendingIds = (newClass.pending_students || []).map(s => s.id);
    const oldApprovedIds = (oldClass.students || []).map(s => s.id);

    const newRequests = newPendingIds.filter(
      id => !oldPendingIds.includes(id) && !oldApprovedIds.includes(id)
    );

    newRequests.forEach(studentId => {
      const student = (newClass.pending_students || []).find(s => s.id === studentId);
      if (student) {
        changes.newPendingRequests.push({ classroom: newClass, student });
      }
    });

    // Detectar alunos aprovados (saíram de pending)
    const newlyApproved = (newClass.students || []).filter(s =>
      oldPendingIds.includes(s.id)
    );

    newlyApproved.forEach(student => {
      changes.approvedStudents.push({ classroom: newClass, student });
    });
  });

  return changes;
}

/**
 * 📊 GET ESTADO ATUAL (read-only view)
 */
export function getState() {
  return {
    classrooms: [...store.classrooms],
    students: [...store.students],
    selectedClassroom: store.selectedClassroom,
    metrics: { ...store.metrics },
    isLoading: store.isLoading,
  };
}

/**
 * 🔄 RESET STORE (para logout)
 */
export function resetStore() {
  store.classrooms = [];
  store.students = [];
  store.pendingStudents = {};
  store.selectedClassroom = null;
  store.metrics = {
    totalStudents: 0,
    totalClassrooms: 0,
    totalPendingRequests: 0,
  };
  notify('onStateChange', 'reset');
}
