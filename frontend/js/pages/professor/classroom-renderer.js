/**
 * 🎨 CLASSROOM RENDERER - Renderizador com Suporte a Diff
 * 
 * Padrão: Detecta mudanças e atualiza apenas o que foi alterado
 * Não re-renderiza tudo sempre
 */

import { store, getState, subscribe } from "./store.js";
import { toast } from "../../ui/toast.js";

export class ClassroomRenderer {
  constructor() {
    this.cache = new Map(); // Cache de HTML por ID de turma
    this.containerSelector = '#classrooms-grid';
  }

  /**
   * 🎯 RENDERIZAR TUDO (primeira carga ou reset)
   */
  renderAll(classrooms = null) {
    const container = document.querySelector(this.containerSelector);
    if (!container) return;

    const toRender = classrooms || store.classrooms;

    console.log(`[RENDERER] Rendering ${toRender.length} classrooms (full re-render)`);

    if (toRender.length === 0) {
      container.innerHTML = this._getEmptyStateHTML();
      return;
    }

    container.innerHTML = toRender
      .map(c => this._getClassroomCardHTML(c))
      .join('');

    this._attachEventHandlers(container);
    this._updateCache(toRender);
  }

  /**
   * 🔄 ATUALIZAÇÃO INTELIGENTE (apenas o que mudou)
   */
  updateFromChanges(changes) {
    const container = document.querySelector(this.containerSelector);
    if (!container) return;

    console.log('[RENDERER] Smart update from changes:', changes);

    // 🗑️ REMOVER TURMAS
    changes.removed.forEach(classroomId => {
      const element = container.querySelector(`[data-id="${classroomId}"]`);
      if (element) {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.95)';
        setTimeout(() => element.remove(), 200);
      }
      this.cache.delete(classroomId);
    });

    // ➕ ADICIONAR TURMAS
    changes.added.forEach(classroom => {
      const html = this._getClassroomCardHTML(classroom);
      const newElement = document.createElement('div');
      newElement.innerHTML = html;
      container.appendChild(newElement.firstElementChild);
      this.cache.set(classroom.id, html);
    });

    // ✏️ ATUALIZAR TURMAS
    changes.updated.forEach(classroom => {
      const oldHTML = this.cache.get(classroom.id);
      const newHTML = this._getClassroomCardHTML(classroom);

      if (oldHTML !== newHTML) {
        const element = container.querySelector(`[data-id="${classroom.id}"]`);
        if (element) {
          const newElement = document.createElement('div');
          newElement.innerHTML = newHTML;
          element.replaceWith(newElement.firstElementChild);
          this.cache.set(classroom.id, newHTML);
        }
      }
    });

    // Re-attach handlers (já que pode ter novos elementos)
    this._attachEventHandlers(container);

    // Se ficou vazio, mostrar estado vazio
    if (container.children.length === 0 && store.classrooms.length > 0) {
      this.renderAll();
    }
  }

  /**
   * ⚡ ATUALIZAR CONTADOR DE ALUNOS (otimizado)
   */
  updateStudentCount(classroomId, newCount) {
    const element = document.querySelector(
      `[data-id="${classroomId}"] [data-student-count]`
    );
    if (element) {
      // Simplesmente atualizar o contador
      const studentText = `${newCount} alunos`;
      if (element.textContent !== studentText) {
        element.textContent = studentText;
        element.classList.add('pulse');
        setTimeout(() => element.classList.remove('pulse'), 500);
      }
    }
  }

  /**
   * 📄 GERAR HTML DE TURMA (Design Original)
   */
  _getClassroomCardHTML(classroom) {
    const studentCount = (classroom.student_count ?? (classroom.students || []).length) || 0;
    const classCode = classroom.classroom_code || classroom.code || 'N/A';

    return `
      <div class="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm card-hover" data-id="${classroom.id}">
        <div class="flex items-start justify-between mb-3">
          <h3 class="font-semibold text-lg">${this._escapeHTML(classroom.name)}</h3>
          <div class="flex gap-1">
            <button class="open-classroom-btn p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400" title="Abrir turma" data-id="${classroom.id}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </button>
            <button class="settings-classroom-btn p-1.5 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400" title="Configurações" data-id="${classroom.id}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <div class="text-sm text-gray-600 dark:text-gray-400">Código da turma:</div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-lg bg-gray-100 dark:bg-gray-900 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700">${classCode}</span>
            <button class="copy-code-btn text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1" data-code="${classCode}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Copiar
            </button>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span class="flex items-center gap-1" data-student-count>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
            </svg>
            ${studentCount} alunos
          </span>
        </div>
      </div>
    `;
  }

  /**
   * 📭 HTML ESTADO VAZIO
   */
  _getEmptyStateHTML() {
    return `
      <div class="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
        <svg class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <p class="mb-2">Nenhuma turma criada ainda</p>
        <p class="text-sm">Clique em "Nova turma" para começar</p>
      </div>
    `;
  }

  /**
   * 🎯 ATRIBUIR EVENT HANDLERS
   */
  _attachEventHandlers(container) {
    // Copy code buttons
    container.querySelectorAll('.copy-code-btn').forEach(btn => {
      btn.removeEventListener('click', this._handleCopyCode);
      btn.addEventListener('click', this._handleCopyCode);
    });

    // Open classroom buttons
    container.querySelectorAll('.open-classroom-btn').forEach(btn => {
      btn.removeEventListener('click', this._handleOpenClassroom);
      btn.addEventListener('click', this._handleOpenClassroom);
    });

    // Settings buttons
    container.querySelectorAll('.settings-classroom-btn').forEach(btn => {
      btn.removeEventListener('click', this._handleSettingsClick);
      btn.addEventListener('click', this._handleSettingsClick);
    });
  }

  /**
   * 🔧 EVENT HANDLERS
   */
  _handleCopyCode = async (e) => {
    e.stopPropagation();
    const code = e.currentTarget.dataset.code;
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Código copiado!', 'Código da turma');
    } catch (error) {
      console.error('[COPY CODE] Failed to copy classroom code:', error);
      toast.error('Não foi possível copiar o código.', 'Erro ao copiar');
    }
  };

  _handleOpenClassroom = (e) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    window.location.href = `../sala/index.html?id=${id}`;
  };

  _handleSettingsClick = (e) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    window.dispatchEvent(new CustomEvent('open-classroom-settings', {
      detail: { classroomId: parseInt(id) }
    }));
  };

  /**
   * 🛡️ ESCAPAR HTML
   */
  _escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 💾 ATUALIZAR CACHE
   */
  _updateCache(classrooms) {
    classrooms.forEach(classroom => {
      this.cache.set(classroom.id, this._getClassroomCardHTML(classroom));
    });
  }
}

// 📦 EXPORT SINGLETON
export const classroomRenderer = new ClassroomRenderer();

/**
 * 🎧 CONFIGURAR LISTENER DO STORE
 * O renderer reage automaticamente quando as classrooms mudam
 */
subscribe('onClassroomsChange', (classrooms) => {
  console.log('[RENDERER] Store changed, rendering all classrooms:', classrooms.length);
  classroomRenderer.renderAll(classrooms);
});
