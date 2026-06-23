/**
 * 🎓 PROFESSOR PAGE - REFATORIZADO
 * 
 * Arquitetura:
 * - Store Central (state.js) → Estado
 * - ClassroomRenderer (classroom-renderer.js) → UI
 * - AutoRefresh (auto-refresh.js) → Sincronização
 * - Professor Page (este arquivo) → Orquestração + Modais
 */

import { API_V1_URL } from "../../core/config.js";
import { notificationService } from "../../services/notification-service.js";
import { getState, setState, logout as storeLogout } from "../../store.js";

// 🏛️ IMPORTAR NOVOS MÓDULOS
import { store, setClassrooms, removeClassroom, updateClassroom, addClassroom, subscribe, detectStateChanges, takeSnapshot } from "./store.js";
import { classroomRenderer } from "./classroom-renderer.js";
import { startAutoRefresh, stopAutoRefresh } from "./auto-refresh.js";

const getAuthToken = () => getState().token;
const getUser = () => getState().user;
const setUser = (user) => setState({ user, role: user?.role || null });
const logout = () => storeLogout();

function updateAvatarUI() {
  const user = getUser();
  if (!user) return;

  const els = {
    avatarImage: document.getElementById("avatar-image"),
    avatarInitial: document.getElementById("avatar-initial"),
    userName: document.getElementById("user-name"),
    userRole: document.getElementById("user-role"),
    headerImg: document.getElementById("header-avatar-image"),
    headerInitial: document.getElementById("header-avatar-initial")
  };

  if (els.userName) {
    els.userName.textContent = user.nickname || user.full_name || "Minha Conta";
  }

  if (els.userRole) {
    els.userRole.textContent = user.role || user.account_type || "Aluno";
  }

  const setAvatar = (imgEl, initEl) => {
    if (!imgEl || !initEl) return;

    if (user.profile_image) {
      imgEl.src = user.profile_image;
      imgEl.classList.remove("hidden");
      initEl.classList.add("hidden");
    } else {
      initEl.textContent = (user.full_name || "U")[0].toUpperCase();
      imgEl.classList.add("hidden");
      initEl.classList.remove("hidden");
    }
  };

  setAvatar(els.avatarImage, els.avatarInitial);
  setAvatar(els.headerImg, els.headerInitial);
}

async function loadUserDataFromServer() {
  const token = getAuthToken();
  if (!token) return null;

  const res = await fetch(`${API_V1_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return null;
  const data = await res.json();
  setUser(data);
  return data;
}

// ========================================================
// 🔧 STATE MANAGEMENT - MODALS & UI
// ========================================================

let pendingDeleteId = null;
let lastShownEntranceRequest = null;
let previousPendingStudents = {};
let firstLoadComplete = false;

// ========================================================
// 🎯 INIT - QUANDO PAGE CARREGA
// ========================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[INIT] Professor page loading...');
  
  try {
    // ✅ Verificar autenticação
    const token = getAuthToken();
    if (!token) {
      redirectToLogin();
      return;
    }

    // ✅ Carregar dados do usuário
    await loadUserDataFromServer();
  import { API_V1_URL } from "../../core/config.js";
  import { getState, setState, logout as storeLogout } from "../../store.js";
    // ✅ Carregar dados iniciais
    await loadInitialData();
    
    // ✅ Configurar listeners do store
    setupStoreListeners();

  const getAuthToken = () => getState().token;
  const getUser = () => getState().user;
  const setUser = (user) => setState({ user, role: user?.role || null });
  const logout = () => storeLogout();

  function updateAvatarUI() {
    const user = getUser();
    if (!user) return;

    const els = {
      avatarImage: document.getElementById("avatar-image"),
      avatarInitial: document.getElementById("avatar-initial"),
      userName: document.getElementById("user-name"),
      userRole: document.getElementById("user-role"),
      headerImg: document.getElementById("header-avatar-image"),
      headerInitial: document.getElementById("header-avatar-initial")
    };

    if (els.userName) {
      els.userName.textContent = user.nickname || user.full_name || "Minha Conta";
    }

    if (els.userRole) {
      els.userRole.textContent = user.role || user.account_type || "Aluno";
    }

    const setAvatar = (imgEl, initEl) => {
      if (!imgEl || !initEl) return;

      if (user.profile_image) {
        imgEl.src = user.profile_image;
        imgEl.classList.remove("hidden");
        initEl.classList.add("hidden");
      } else {
        initEl.textContent = (user.full_name || "U")[0].toUpperCase();
        imgEl.classList.add("hidden");
        initEl.classList.remove("hidden");
      }
    };

    setAvatar(els.avatarImage, els.avatarInitial);
    setAvatar(els.headerImg, els.headerInitial);
  }

  async function loadUserDataFromServer() {
    const token = getAuthToken();
    if (!token) return null;

    const res = await fetch(`${API_V1_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return null;
    const data = await res.json();
    setUser(data);
    return data;
  }
    
    // ✅ Iniciar sincronização automática
    startAutoRefresh(5000);
    
    // ✅ Refrescar ao ganhar foco
    window.addEventListener('focus', () => {
      console.log('[FOCUS] Window focused, refreshing...');
      loadInitialData();
    });
    
    // ✅ Configurar event listeners globais
    setupGlobalEventListeners();
    
    // ✅ Configurar modal event listeners (unified setup)
    setupModalEventListeners();
    setupCreateClassroomModal();
    
    console.log('[INIT] Professor page ready');
    
  } catch (error) {
    console.error('[INIT] Error:', error);
    showToast('Erro ao inicializar página', 'error');
  }
});

/**
 * 📊 CARREGAR DADOS INICIAIS
 */
async function loadInitialData() {
  try {
    // 🔥 Load classrooms AND metrics (KPI consistency)
    await Promise.all([
      loadClassrooms(),
      loadDashboardMetrics(),
      loadStudents(),
    ]);
    // ✅ Store subscribers (classroomRenderer) handle rendering
  } catch (error) {
    console.error('[LOAD] Error:', error);
  }
}

/**
 * 📋 CARREGAR TURMAS DO SERVIDOR
 */
async function loadClassrooms() {
  const token = getAuthToken();
  if (!token) {
    redirectToLogin();
    return null;
  }

  try {
    const res = await fetch(`${API_V1_URL}/classrooms`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
      redirectToLogin();
      return null;
    }

    if (!res.ok) return null;

    const data = await res.json();
    const classroomsData = Array.isArray(data) ? data : (data.items || []);

    // Diagnóstico de consistência: backend vs store antes de aplicar novo estado
    try {
      console.log("[LOAD CLASSROOMS] BACKEND:", classroomsData.map(c => c.id));
      console.log("[LOAD CLASSROOMS] STORE BEFORE:", store.classrooms.map(c => c.id));
    } catch (_) { /* noop para ambientes sem console */ }

    setClassrooms(classroomsData);
    return classroomsData;

  } catch (error) {
    console.error('[LOAD CLASSROOMS] Error:', error);
    return null;
  }
}

/**
 * 👥 CARREGAR ALUNOS
 */
async function loadStudents() {
  const token = getAuthToken();
  const container = document.getElementById('students-list');

  if (!container) return;
  container.innerHTML = `
    <div class="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
      <svg class="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      Carregando alunos...
    </div>
  `;

  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const res = await fetch(`${API_V1_URL}/teacher/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
      redirectToLogin();
      return;
    }

    if (!res.ok) throw new Error('Falha ao carregar alunos');

    const data = await res.json();
    const students = Array.isArray(data) ? data : (data.items || []);

    // Guardar último payload para fallbacks
    window.__studentsPayload = students;

    renderStudentsList(students, container);

  } catch (error) {
    console.error('[LOAD STUDENTS] Error:', error);
    container.innerHTML = `
      <div class="col-span-full text-center py-8 text-red-500">
        Não foi possível carregar os alunos.
      </div>
    `;
  }
}

function renderStudentsList(students, container) {
  if (!students || students.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
        <svg class="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20h12a6 6 0 00-12 0z"/>
        </svg>
        Nenhum aluno nas suas turmas.
      </div>
    `;
    return;
  }

  container.innerHTML = students.map(student => {
    const name = student.full_name || 'Aluno';
    const avatarInitial = name.charAt(0).toUpperCase();
    const classroomName = student.classroom_name || 'Sem turma';
    // Alguns alunos podem retornar múltiplas turmas; priorizamos a primeira
    const classroomId = student.classroom_id || (Array.isArray(student.classroom_ids) ? student.classroom_ids[0] : undefined);
    const lastActivity = student.last_activity
      ? new Date(student.last_activity).toLocaleString('pt-BR')
      : 'Sem atividades recentes';

    const classroomIdsAttr = student.classroom_ids ? ` data-classroom-ids='${JSON.stringify(student.classroom_ids)}'` : '';

    return `
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex gap-3 items-center" data-student-id="${student.id}" data-classroom-id="${classroomId || ''}"${classroomIdsAttr}>
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold overflow-hidden">
          ${student.profile_image ? `<img src="${student.profile_image}" alt="${name}" class="w-full h-full object-cover">` : avatarInitial}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">${name}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${classroomName}</p>
          <p class="text-[11px] text-gray-400 dark:text-gray-500 truncate">Última atividade: ${lastActivity}</p>
        </div>
        <button type="button" class="all-students-remove p-2 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 flex-shrink-0" title="Remover da turma">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `;
  }).join('');

  // Actions: remover aluno diretamente da lista geral
  container.querySelectorAll('.all-students-remove').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const card = e.currentTarget.closest('[data-student-id]');
      const studentId = parseInt(card?.dataset.studentId);
      // fallback: tenta pegar classroom_ids embutido em data-classroom-id ou atributo data-classroom-ids (string JSON)
      let classroomId = parseInt(card?.dataset.classroomId);
      if (!classroomId && card?.dataset.classroomIds) {
        try {
          const ids = JSON.parse(card.dataset.classroomIds);
          classroomId = Array.isArray(ids) ? parseInt(ids[0]) : classroomId;
        } catch (_) {
          /* noop */
        }
      }

      // fallback 2: descobrir pela store (primeira turma que contém o aluno)
      if (!classroomId && window.store?.classrooms?.length) {
        const ownerClassroom = window.store.classrooms.find(c => Array.isArray(c.students) && c.students.some(s => s.id === studentId));
        if (ownerClassroom) classroomId = ownerClassroom.id;
      }

      // fallback 3: usar último payload bruto de alunos
      if (!classroomId && Array.isArray(window.__studentsPayload)) {
        const studentData = window.__studentsPayload.find(s => s.id === studentId);
        if (studentData) {
          if (studentData.classroom_id) classroomId = studentData.classroom_id;
          if (!classroomId && Array.isArray(studentData.classroom_ids) && studentData.classroom_ids.length) {
            classroomId = studentData.classroom_ids[0];
          }
        }
      }
      const studentName = card?.querySelector('.font-semibold')?.textContent || 'este aluno';

      if (!classroomId || !studentId) {
        showToast('Dados da turma/aluno ausentes para remoção', 'error');
        return;
      }

      if (confirm(`Remover ${studentName} da turma?`)) {
        const success = await removeStudentFromClassroom(classroomId, studentId);
        if (success) {
          await loadStudents();
          await loadDashboardMetrics();
        }
      }
    });
  });
}

/**
 * 📊 CARREGAR MÉTRICAS DO DASHBOARD
 */
async function loadDashboardMetrics() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_V1_URL}/auth/me/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      console.debug('[METRICS] Failed to load stats:', res.status);
      return;
    }
    
    const metrics = await res.json();
    
    // Atualizar UI com métricas
    updateMetricsUI(metrics);
    
  } catch (error) {
    console.debug('[METRICS] Metrics fetch skipped:', error.message);
  }
}

/**
 * 🎨 ATUALIZAR UI COM MÉTRICAS
 */
function updateMetricsUI(metrics) {
  const totalClassroomsEl = document.getElementById('total-classrooms');
  const totalStudentsEl = document.getElementById('total-students');
  const totalPendingEl = document.getElementById('total-pending-requests');

  // Backend pode responder classroom_count/student_count/pending_requests_count ou variantes curtas
  const classroomCount = metrics?.classroom_count ?? metrics?.classrooms ?? 0;
  const studentCount = metrics?.student_count ?? metrics?.students ?? 0;
  const pendingCount = metrics?.pending_requests_count ?? metrics?.pending ?? 0;

  if (totalClassroomsEl) {
    totalClassroomsEl.textContent = classroomCount;
  }
  if (totalStudentsEl) {
    totalStudentsEl.textContent = studentCount;
  }
  if (totalPendingEl) {
    totalPendingEl.textContent = pendingCount;
  }
}

/**
 * 🎯 CONFIGURAR UI INICIAL
 */
function setupUI() {
  const userAvatar = document.getElementById('user-avatar');
  if (userAvatar) {
    userAvatar.addEventListener('click', openSettings);
  }
}

/**
 * 🎧 CONFIGURAR LISTENERS DO STORE
 */
function setupStoreListeners() {
  subscribe('onClassroomsChange', (classrooms) => {
    console.log('[STORE] Classrooms changed:', classrooms.length);
    // Listeners de eventos customizados já cuidam disso
  });
}

/**
 * 🎧 CONFIGURAR EVENT LISTENERS GLOBAIS
 */
function setupGlobalEventListeners() {
  // Abrir settings de turma
  window.addEventListener('open-classroom-settings', (e) => {
    const classroomId = e.detail.classroomId;
    const classroom = store.classrooms.find(c => c.id === classroomId);
    if (classroom) {
      openClassroomSettingsModal(classroom);
    }
  });

  // Nova solicitação de entrada
  window.addEventListener('new-entrance-request', (e) => {
    const { classroom, student } = e.detail;
    handleNewEntranceRequest(classroom, student);
  });

  // Aluno aprovado
  window.addEventListener('student-approved', (e) => {
    const { classroom, student } = e.detail;
    showToast({
      title: 'Aluno aprovado',
      message: `${student.full_name || 'Aluno'} foi aprovado em "${classroom.name}"`,
      type: 'success'
    });
  });

  // Erro de autenticação
  window.addEventListener('auth-error', () => {
    redirectToLogin();
  });

  // Toast customizado
  window.addEventListener('show-toast', (e) => {
    showToast(e.detail.message, e.detail.type || 'info');
  });
}

// ========================================================
// 🗑️ DELETE CLASSROOM
// ========================================================

function showDeleteConfirmModal(classroomId, classroomName) {
  pendingDeleteId = classroomId;
  
  const modal = document.getElementById('delete-classroom-modal');
  const overlay = document.getElementById('delete-classroom-overlay');
  const nameSpan = document.getElementById('delete-classroom-name');
  const confirmBtn = document.getElementById('delete-classroom-confirm');
  const cancelBtn = document.getElementById('delete-classroom-cancel');
  
  if (!modal || !overlay) return;
  
  nameSpan.textContent = classroomName;
  
  // Clone buttons para remover handlers antigos
  const newConfirmBtn = confirmBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  confirmBtn.parentNode?.replaceChild(newConfirmBtn, confirmBtn);
  cancelBtn.parentNode?.replaceChild(newCancelBtn, cancelBtn);
  
  // Mostrar modal
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.remove('opacity-0', 'scale-95');
    overlay.classList.remove('opacity-0');
  }, 10);
  
  // Handlers
  newConfirmBtn.addEventListener('click', async () => {
    newConfirmBtn.disabled = true;
    closeDeleteConfirmModal();
    await deleteClassroomPermanently(pendingDeleteId);
    newConfirmBtn.disabled = false;
  });
  
  newCancelBtn.addEventListener('click', closeDeleteConfirmModal);
  overlay.addEventListener('click', closeDeleteConfirmModal);
}

function closeDeleteConfirmModal() {
  const modal = document.getElementById('delete-classroom-modal');
  const overlay = document.getElementById('delete-classroom-overlay');
  
  if (!modal || !overlay) return;
  
  modal.classList.add('opacity-0', 'scale-95');
  overlay.classList.add('opacity-0');
  
  setTimeout(() => {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    pendingDeleteId = null;
  }, 200);
}

async function deleteClassroomPermanently(classroomId) {
  const token = getAuthToken();
  if (!token) {
    redirectToLogin();
    return false;
  }

  try {
    stopAutoRefresh(); // 🔥 PAUSA REFRESH

    const res = await fetch(`${API_V1_URL}/classrooms/${classroomId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Falha ao deletar turma');

    removeClassroom(classroomId); // 🔥 OTIMISTA

    showToast({
      title: 'Turma excluída',
      message: 'Todos os dados foram removidos',
      type: 'success'
    });

    closeClassroomSettingsModal(); // 🔥 FECHA MODAL

    // 🔄 REATIVA AUTO-REFRESH COM DELAY
    setTimeout(() => {
      startAutoRefresh(5000);
    }, 1500);

    return true;

  } catch (error) {
    console.error('[DELETE] Error:', error);
    showToast('Erro ao deletar turma', 'error');
    return false;
  }
}

// ========================================================
// ➕ CREATE CLASSROOM
// ========================================================

async function createClassroom(name) {
  const token = getAuthToken();
  if (!token) {
    redirectToLogin();
    return false;
  }

  if (!name.trim()) {
    showToast('Digite um nome para a turma', 'error');
    return false;
  }

  try {
    const res = await fetch(`${API_V1_URL}/classrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: name.trim() })
    });

    if (res.status === 401) {
      redirectToLogin();
      return false;
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Falha ao criar turma');
    }

    const newClassroom = await res.json();
    // Coloca a nova turma no topo e mantém ordenação igual ao backend (id desc)
    addClassroom(newClassroom, { sortDescById: true });
    
    // 🔥 Update KPIs after classroom creation
    await loadDashboardMetrics();
    
    showToast({
      title: 'Turma criada',
      message: `"${newClassroom.name}" foi criada com sucesso`,
      type: 'success'
    });

    return true;

  } catch (error) {
    console.error('[CREATE] Error:', error);
    showToast(error.message || 'Erro ao criar turma', 'error');
    return false;
  }
}

// ========================================================
// ⚙️ UPDATE CLASSROOM
// ========================================================

async function updateClassroomName(classroomId, newName) {
  const token = getAuthToken();
  if (!token) {
    redirectToLogin();
    return false;
  }

  if (!newName.trim()) {
    showToast('Digite um nome para a turma', 'error');
    return false;
  }

  try {
    const res = await fetch(`${API_V1_URL}/classrooms/${classroomId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: newName.trim() })
    });

    if (res.status === 401) {
      redirectToLogin();
      return false;
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Falha ao atualizar turma');
    }

    const updatedClassroom = await res.json();
    updateClassroom(classroomId, { name: updatedClassroom.name });

    return true;

  } catch (error) {
    console.error('[UPDATE] Error:', error);
    showToast(error.message || 'Erro ao atualizar turma', 'error');
    return false;
  }
}

// ========================================================
// 👥 CLASSROOM STUDENTS MANAGEMENT
// ========================================================

async function loadClassroomParticipants(classroomId, container) {
  const token = getAuthToken();
  if (!token) {
    container.innerHTML = '<p class="text-center text-red-500">Erro ao carregar participantes</p>';
    return;
  }

  try {
    const res = await fetch(`${API_V1_URL}/classrooms/${classroomId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to load classroom data');
    
    const classroomData = await res.json();
    const students = classroomData.students || [];
    const pendingStudents = classroomData.pending_students || [];
    const allStudents = [
      ...students.map(s => ({ ...s, status: 'approved' })),
      ...pendingStudents.map(s => ({ ...s, status: 'pending' }))
    ];
    
    if (allStudents.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-gray-500 dark:text-gray-400">
          <svg class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
          </svg>
          <p class="text-sm">Nenhum aluno ainda</p>
        </div>
      `;
      return;
    }

    container.innerHTML = allStudents.map(student => {
      const isPending = student.status === 'pending';
      return `
      <div class="flex items-center justify-between p-3 rounded-lg border ${isPending ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700'} hover:shadow-sm transition-all" data-student-id="${student.id}">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div class="w-8 h-8 rounded-full ${isPending ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'} flex items-center justify-center flex-shrink-0">
            <span class="text-white text-sm font-semibold">
              ${student.full_name ? student.full_name.charAt(0).toUpperCase() : 'A'}
            </span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                ${student.full_name || 'Sem nome'}
              </p>
              ${isPending ? `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Aguardando
              </span>
              ` : ''}
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
              ${student.email || 'Sem email'}
            </p>
          </div>
        </div>
        <div class="flex gap-1 flex-shrink-0">
          ${isPending ? `
          <button type="button" class="approve-student-btn p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors" data-student-id="${student.id}" title="Aprovar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </button>
          <button type="button" class="reject-student-btn p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors" data-student-id="${student.id}" title="Rejeitar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          ` : `
          <button type="button" class="remove-student-btn p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 flex-shrink-0 transition-colors" data-student-id="${student.id}" title="Remover aluno">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          `}
        </div>
      </div>
      `;
    }).join('');

    // Attach event listeners
    container.querySelectorAll('.remove-student-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const studentId = parseInt(btn.dataset.studentId);
        const studentElement = btn.closest('[data-student-id]');
        const studentName = studentElement?.querySelector('.font-medium')?.textContent || 'este aluno';
        
        if (confirm(`Tem certeza que deseja remover ${studentName} da turma?`)) {
          const success = await removeStudentFromClassroom(classroomId, studentId);
          if (success) {
            await loadClassroomParticipants(classroomId, container);
            await loadDashboardMetrics();
          }
        }
      });
    });

    container.querySelectorAll('.approve-student-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const studentId = parseInt(btn.dataset.studentId);
        const success = await approveStudent(classroomId, studentId);
        if (success) {
          await loadClassroomParticipants(classroomId, container);
          await loadDashboardMetrics();
        }
      });
    });

    container.querySelectorAll('.reject-student-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const studentId = parseInt(btn.dataset.studentId);
        const success = await rejectStudent(classroomId, studentId);
        if (success) {
          await loadClassroomParticipants(classroomId, container);
          await loadDashboardMetrics();
        }
      });
    });

  } catch (error) {
    console.error('[LOAD PARTICIPANTS] Error:', error);
    container.innerHTML = '<p class="text-center text-red-500">Erro ao carregar participantes</p>';
  }
}

async function removeStudentFromClassroom(classroomId, studentId) {
  const token = getAuthToken();
  if (!token) {
    redirectToLogin();
    return false;
  }

  try {
    const url = `${API_V1_URL}/classrooms/${classroomId}/students/${studentId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
      redirectToLogin();
      return false;
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Falha ao remover aluno');
    }

    showToast({
      title: 'Aluno removido',
      message: 'O acesso foi revogado',
      type: 'success'
    });

    // 🔥 Update KPIs after student removal
    await loadDashboardMetrics();
    await loadStudents();

    return true;

  } catch (error) {
    console.error('[REMOVE STUDENT] Error:', error);
    showToast(error.message || 'Erro ao remover aluno', 'error');
    return false;
  }
}

async function approveStudent(classroomId, studentId) {
  const token = getAuthToken();
  if (!token) {
    redirectToLogin();
    return false;
  }

  try {
    const res = await fetch(`${API_V1_URL}/classrooms/${classroomId}/students/${studentId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
      redirectToLogin();
      return false;
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Falha ao aprovar aluno');
    }

    showToast({
      title: 'Aluno aprovado',
      message: 'Acesso concedido',
      type: 'success'
    });

    // 🔥 Update KPIs after student approval
    await loadDashboardMetrics();
    await loadStudents();

    return true;

  } catch (error) {
    console.error('[APPROVE STUDENT] Error:', error);
    showToast(error.message || 'Erro ao aprovar aluno', 'error');
    return false;
  }
}

async function rejectStudent(classroomId, studentId) {
  const token = getAuthToken();
  if (!token) {
    redirectToLogin();
    return false;
  }

  try {
    const res = await fetch(`${API_V1_URL}/classrooms/${classroomId}/students/${studentId}/reject`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
      redirectToLogin();
      return false;
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Falha ao rejeitar aluno');
    }

    showToast({
      title: 'Solicitação recusada',
      message: 'O aluno foi notificado',
      type: 'info'
    });

    // 🔥 Update KPIs after student rejection
    await loadDashboardMetrics();
    await loadStudents();

    return true;

  } catch (error) {
    console.error('[REJECT STUDENT] Error:', error);
    showToast(error.message || 'Erro ao rejeitar aluno', 'error');
    return false;
  }
}

// ========================================================
// ⚙️ CLASSROOM SETTINGS MODAL
// ========================================================

let originalClassroomName = '';

async function openClassroomSettingsModal(classroom) {
  const modal = document.getElementById('classroom-settings-modal');
  const overlay = document.getElementById('classroom-settings-overlay');
  const nameInput = document.getElementById('classroom-name-input');
  const participantsContainer = document.getElementById('classroom-participants');
  
  if (!modal || !overlay) return;
  
  originalClassroomName = classroom.name;
  nameInput.value = classroom.name;
  
  const saveBtn = document.getElementById('save-classroom-settings');
  if (saveBtn) {
    saveBtn.classList.add('hidden');
  }
  
  participantsContainer.innerHTML = `
    <div class="text-center py-4 text-gray-500 dark:text-gray-400">
      <svg class="w-8 h-8 mx-auto mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      Carregando participantes...
    </div>
  `;
  
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
  
  window.currentClassroomSettingsId = parseInt(classroom.id);
  
  await loadClassroomParticipants(parseInt(classroom.id), participantsContainer);
}

function closeClassroomSettingsModal() {
  const modal = document.getElementById('classroom-settings-modal');
  const overlay = document.getElementById('classroom-settings-overlay');
  
  if (!modal || !overlay) return;
  
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
  window.currentClassroomSettingsId = null;
}

function toggleSaveButton() {
  const nameInput = document.getElementById('classroom-name-input');
  const saveBtn = document.getElementById('save-classroom-settings');
  if (!nameInput || !saveBtn) return;
  
  const hasChanges = nameInput.value.trim() !== originalClassroomName;
  
  if (hasChanges) {
    saveBtn.classList.remove('hidden');
  } else {
    saveBtn.classList.add('hidden');
  }
}

// ========================================================
// 🔔 ENTRANCE REQUEST MODAL
// ========================================================

function handleNewEntranceRequest(classroom, student) {
  if (!firstLoadComplete) {
    firstLoadComplete = true;
    return;
  }

  const requestKey = `${classroom.id}-${student.id}`;
  if (lastShownEntranceRequest === requestKey) {
    return;
  }

  lastShownEntranceRequest = requestKey;
  
  showToast({
    title: 'Nova solicitação',
    message: `${student.full_name || 'Novo aluno'} quer entrar em "${classroom.name}"`,
    type: 'info'
  });

  showEntranceRequestModal(student, classroom);
}

function showEntranceRequestModal(student, classroom) {
  const modal = document.getElementById('entrance-request-modal');
  const overlay = document.getElementById('entrance-request-overlay');
  const approveBtn = document.getElementById('entrance-request-approve');
  const rejectBtn = document.getElementById('entrance-request-reject');

  if (!modal || !overlay) return;

  const studentName = student.full_name || student.name || 'Aluno Pendente';
  const studentEmail = student.email || 'email@example.com';
  
  document.getElementById('entrance-request-name').textContent = studentName;
  document.getElementById('entrance-request-email').textContent = studentEmail;
  document.getElementById('entrance-request-classroom').textContent = `Sala: ${classroom.name}`;
  document.getElementById('entrance-request-avatar').textContent = studentName.charAt(0).toUpperCase();
  
  // Clone buttons para remover handlers
  const newApproveBtn = approveBtn.cloneNode(true);
  const newRejectBtn = rejectBtn.cloneNode(true);
  approveBtn.parentNode?.replaceChild(newApproveBtn, approveBtn);
  rejectBtn.parentNode?.replaceChild(newRejectBtn, rejectBtn);
  
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
  
  newApproveBtn.addEventListener('click', async () => {
    newApproveBtn.disabled = true;
    const success = await approveStudent(classroom.id, student.id);
    if (success) {
      closeEntranceRequestModal();
      await loadClassrooms();
      await loadDashboardMetrics();
    }
    newApproveBtn.disabled = false;
  });

  newRejectBtn.addEventListener('click', async () => {
    newRejectBtn.disabled = true;
    const success = await rejectStudent(classroom.id, student.id);
    if (success) {
      closeEntranceRequestModal();
      await loadClassrooms();
      await loadDashboardMetrics();
    }
    newRejectBtn.disabled = false;
  });

  overlay.addEventListener('click', closeEntranceRequestModal);
}

function closeEntranceRequestModal() {
  const modal = document.getElementById('entrance-request-modal');
  const overlay = document.getElementById('entrance-request-overlay');
  
  if (!modal || !overlay) return;
  
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
}

// ========================================================
// ⚙️ SETTINGS MODAL (USER)
// ========================================================

function openSettings() {
  const user = getUser();
  const settingsModal = document.getElementById('settings-modal');
  const settingsOverlay = document.getElementById('settings-modal-overlay');
  
  if (user && settingsModal) {
    const settingName = document.getElementById('setting-name');
    const settingNickname = document.getElementById('setting-nickname');
    const settingBirthdate = document.getElementById('setting-birthdate');
    const settingGender = document.getElementById('setting-gender');
    const settingEmail = document.getElementById('setting-email');
    
    if (settingName) settingName.value = user.full_name || '';
    if (settingNickname) settingNickname.value = user.nickname || '';
    if (settingBirthdate) settingBirthdate.value = user.birth_date || '';
    if (settingGender) settingGender.value = user.gender || '';
    if (settingEmail) settingEmail.value = user.email || '';
  }
  
  settingsModal?.classList.remove('hidden');
  settingsOverlay?.classList.remove('hidden');
}

function closeSettings() {
  const settingsModal = document.getElementById('settings-modal');
  const settingsOverlay = document.getElementById('settings-modal-overlay');
  
  settingsModal?.classList.add('hidden');
  settingsOverlay?.classList.add('hidden');
}

// ========================================================
// 🔐 AUTH HELPERS
// ========================================================

function redirectToLogin() {
  console.log('[AUTH] Redirecting to login...');
  stopAutoRefresh();
  window.location.href = '../login/index.html';
}

// ========================================================
// 🎯 SHOW TOAST
// ========================================================

function showToast(messageOrObj, type = 'info') {
  let message = '';
  let title = '';
  
  if (typeof messageOrObj === 'string') {
    message = messageOrObj;
  } else if (typeof messageOrObj === 'object') {
    message = messageOrObj.message || '';
    title = messageOrObj.title || '';
    type = messageOrObj.type || type;
  }

  console.log('[TOAST]', { title, message, type });
  
  // Use notificationService se disponível, senão fallback para alert simples
  if (notificationService && notificationService.show) {
    notificationService.show({ title, message, type });
  } else if (message) {
    alert(title ? `${title}: ${message}` : message);
  }
}

// ========================================================
// 🎯 SETUP MODAL EVENT LISTENERS
// ========================================================

function setupModalEventListeners() {
  // Classroom settings modal
  const closeClassroomSettingsBtn = document.getElementById('close-classroom-settings');
  const classroomSettingsOverlay = document.getElementById('classroom-settings-overlay');
  const classroomNameInput = document.getElementById('classroom-name-input');
  const saveClassroomSettingsBtn = document.getElementById('save-classroom-settings');
  const deleteClassroomBtn = document.getElementById('delete-classroom-from-settings-btn');

  if (closeClassroomSettingsBtn) {
    closeClassroomSettingsBtn.addEventListener('click', closeClassroomSettingsModal);
  }

  if (classroomSettingsOverlay) {
    classroomSettingsOverlay.addEventListener('click', closeClassroomSettingsModal);
  }

  if (classroomNameInput) {
    classroomNameInput.addEventListener('input', toggleSaveButton);
  }

  if (saveClassroomSettingsBtn) {
    saveClassroomSettingsBtn.addEventListener('click', async () => {
      const nameInput = document.getElementById('classroom-name-input');
      const newName = nameInput.value.trim();
      const classroomId = window.currentClassroomSettingsId;

      if (!newName) {
        showToast('Digite um nome para a turma', 'error');
        return;
      }

      saveClassroomSettingsBtn.disabled = true;

      const success = await updateClassroomName(classroomId, newName);
      if (success) {
        showToast({
          title: 'Turma atualizada',
          message: 'Alterações salvas',
          type: 'success'
        });
        closeClassroomSettingsModal();
      }

      saveClassroomSettingsBtn.disabled = false;
    });
  }

  if (deleteClassroomBtn) {
    deleteClassroomBtn.addEventListener('click', () => {
      const classroomId = window.currentClassroomSettingsId;
      const nameInput = document.getElementById('classroom-name-input');
      const classroomName = nameInput.value || 'esta turma';

      if (!classroomId) {
        showToast('Erro ao identificar turma', 'error');
        return;
      }

      showDeleteConfirmModal(classroomId, classroomName);
    });
  }

  // Settings modal
  const closeSettingsBtn = document.getElementById('close-settings');
  const cancelSettingsBtn = document.getElementById('cancel-settings');
  const settingsOverlay = document.getElementById('settings-modal-overlay');
  const settingsLogoutBtn = document.getElementById('settings-logout-btn');

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', closeSettings);
  }

  if (cancelSettingsBtn) {
    cancelSettingsBtn.addEventListener('click', closeSettings);
  }

  if (settingsOverlay) {
    settingsOverlay.addEventListener('click', closeSettings);
  }

  if (settingsLogoutBtn) {
    settingsLogoutBtn.addEventListener('click', () => {
      logout();
      redirectToLogin();
    });
  }

  // Entrance request modal
  const entranceRequestOverlay = document.getElementById('entrance-request-overlay');
  if (entranceRequestOverlay) {
    entranceRequestOverlay.addEventListener('click', closeEntranceRequestModal);
  }
}

// ========================================================
// ➕ CREATE CLASSROOM MODAL (módulo único)
// ========================================================

function setupCreateClassroomModal() {
  const createClassroomBtn = document.getElementById('create-classroom-btn');
  const createClassroomModal = document.getElementById('create-classroom-modal');
  const createClassroomOverlay = document.getElementById('create-classroom-modal-overlay');
  const cancelCreateClassroom = document.getElementById('cancel-create-classroom');
  const createClassroomForm = document.getElementById('create-classroom-form');
  const nameInput = document.getElementById('create-classroom-name-input');

  if (!createClassroomModal || !createClassroomOverlay || !createClassroomForm) {
    return;
  }

  const showModal = () => {
    createClassroomModal.classList.remove('hidden');
    createClassroomOverlay.classList.remove('hidden');
    nameInput?.focus();
  };

  const hideModal = () => {
    createClassroomModal.classList.add('hidden');
    createClassroomOverlay.classList.add('hidden');
    if (nameInput) nameInput.value = '';
  };

  createClassroomBtn?.addEventListener('click', showModal);
  cancelCreateClassroom?.addEventListener('click', hideModal);
  createClassroomOverlay?.addEventListener('click', hideModal);

  createClassroomForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput?.value?.trim() || '';
    if (!name) {
      showToast('Digite o nome da turma', 'error');
      return;
    }

    const submitBtn = createClassroomForm.querySelector('button[type="submit"]');
    submitBtn?.setAttribute('disabled', 'true');

    const success = await createClassroom(name);

    submitBtn?.removeAttribute('disabled');

    if (success) {
      hideModal();
    }
  });
}
