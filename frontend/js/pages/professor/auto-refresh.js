/**
 * 🔄 AUTO-REFRESH - Sincronização Automática Simplificada
 * 
 * Padrão: Fetcha → Compara → Atualiza → UI Reage
 * Sem múltiplas responsabilidades misturadas
 */

import { store, setClassrooms } from "./store.js";
import { classroomRenderer } from "./classroom-renderer.js";
import { getState } from "../../store.js";
import { API_V1_URL } from "../../core/config.js";

const getAuthToken = () => getState().token;

let autoRefreshInterval = null;
let isFirstRefresh = true;

/**
 * 🚀 INICIAR AUTO-REFRESH
 */
export function startAutoRefresh(intervalMs = 5000) {
  console.log('[AUTO-REFRESH] Starting with interval:', intervalMs);
  
  stopAutoRefresh(); // Limpar anterior se existir
  
  // Fazer primeira atualização imediatamente (sem await)
  refresh().catch(err => console.error('[AUTO-REFRESH] Error in first refresh:', err));
  
  autoRefreshInterval = setInterval(async () => {
    await refresh();
  }, intervalMs);
}

/**
 * 🛑 PARAR AUTO-REFRESH
 */
export function stopAutoRefresh() {
  if (autoRefreshInterval) {
    console.log('[AUTO-REFRESH] Stopping');
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

/**
 * 🔄 EXECUTAR CICLO DE REFRESH
 */
async function refresh() {
  try {
    const token = getAuthToken();
    if (!token) {
      console.log('[REFRESH] No token, stopping');
      stopAutoRefresh();
      return;
    }

    // 📡 FASE 1: FETCH DATA
    const newClassrooms = await fetchClassrooms(token);
    if (!newClassrooms) return;

    // 📝 ATUALIZA SEM DIFF (full re-render via subscribers)
    setClassrooms(newClassrooms);

    // 📊 SINCRONIZAR KPIs JUNTO DO REFRESH
    await refreshMetrics(token);

    // 🎨 UI reage via renderAll inscrito no store (sem diff)

    isFirstRefresh = false;

  } catch (error) {
    console.error('[REFRESH] Error:', error);
  }
}

/**
 * 📡 FASE 1: FETCH CLASSROOMS
 */
async function fetchClassrooms(token) {
  try {
    const res = await fetch(`${API_V1_URL}/classrooms`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });

    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('auth-error'));
      return null;
    }

    if (!res.ok) {
      console.error('[FETCH] Response not ok:', res.status);
      return null;
    }

    const data = await res.json();
    return Array.isArray(data) ? data : (data.items || []);

  } catch (error) {
    console.error('[FETCH] Error:', error);
    return null;
  }
}

// 📊 Atualiza KPIs para manter UI consistente com backend
async function refreshMetrics(token) {
  try {
    const res = await fetch(`${API_V1_URL}/auth/me/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('METRICS RESPONSE STATUS:', res.status);

    if (!res.ok) {
      console.debug('[METRICS] Failed to load stats during auto-refresh:', res.status);
      return;
    }

    const metrics = await res.json();
    const totalClassroomsEl = document.getElementById('total-classrooms');
    const totalStudentsEl = document.getElementById('total-students');
    const totalPendingEl = document.getElementById('total-pending-requests');

    const classroomCount = metrics?.classroom_count ?? metrics?.classrooms ?? 0;
    const studentCount = metrics?.student_count ?? metrics?.students ?? 0;
    const pendingCount = metrics?.pending_requests_count ?? metrics?.pending ?? 0;

    if (totalClassroomsEl) totalClassroomsEl.textContent = classroomCount;
    if (totalStudentsEl) totalStudentsEl.textContent = studentCount;
    if (totalPendingEl) totalPendingEl.textContent = pendingCount;

  } catch (error) {
    console.debug('[METRICS] Error during auto-refresh metrics:', error?.message || error);
  }
}

/**
 * 📊 FORÇAR ATUALIZAÇÃO (manual trigger)
 */
export async function forceRefresh() {
  console.log('[AUTO-REFRESH] Force refresh triggered');
  await refresh();
}

// Exportar função interna para testes
export { refresh as _refresh };
