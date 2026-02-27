/**
 * Serviço de Classroom - AtenaAI
 * Gerencia turmas, alunos e relatórios
 */

import { apiClient } from "../core/api-client.js";
import { toast } from "../ui/toast.js";
import { Logger } from "../core/error-handler.js";

export class ClassroomService {
  constructor() {
    this.classrooms = [];
    this.currentClassroomId = null;
  }

  /**
   * Carrega turmas do usuário
   */
  async loadClassrooms() {
    try {
      const data = await apiClient.get('/classrooms');
      this.classrooms = data || [];
      return this.classrooms;
    } catch (error) {
      Logger.error('ClassroomService', error);
      toast.error(error.message, 'Erro ao carregar turmas');
      throw error;
    }
  }

  /**
   * Cria nova turma
   */
  async createClassroom(classroomData) {
    try {
      const data = await apiClient.post('/classrooms', classroomData);
      this.classrooms.push(data);
      toast.success('Turma criada com sucesso');
      return data;
    } catch (error) {
      Logger.error('ClassroomService', error);
      toast.error(error.message, 'Erro ao criar turma');
      throw error;
    }
  }

  /**
   * Obtém detalhes da turma
   */
  async getClassroomDetails(classroomId) {
    try {
      const data = await apiClient.get(`/classrooms/${classroomId}`);
      return data;
    } catch (error) {
      Logger.error('ClassroomService', error);
      throw error;
    }
  }

  /**
   * Carrega alunos da turma
   */
  async loadStudents(classroomId) {
    try {
      const data = await apiClient.get(`/classrooms/${classroomId}/students`);
      return data?.students || [];
    } catch (error) {
      Logger.error('ClassroomService', error);
      throw error;
    }
  }

  /**
   * Adiciona aluno à turma
   */
  async addStudent(classroomId, studentId) {
    try {
      const data = await apiClient.post(
        `/classrooms/${classroomId}/students`,
        { student_id: studentId }
      );
      toast.success('Aluno adicionado');
      return data;
    } catch (error) {
      Logger.error('ClassroomService', error);
      toast.error(error.message, 'Erro ao adicionar aluno');
      throw error;
    }
  }

  /**
   * Remove aluno da turma
   */
  async removeStudent(classroomId, studentId) {
    try {
      await apiClient.delete(`/classrooms/${classroomId}/students/${studentId}`);
      toast.success('Aluno removido');
      return true;
    } catch (error) {
      Logger.error('ClassroomService', error);
      toast.error(error.message, 'Erro ao remover aluno');
      throw error;
    }
  }

  /**
   * Carrega relatórios de alunos
   */
  async loadStudentReports(classroomId) {
    try {
      const data = await apiClient.get(`/classrooms/${classroomId}/reports`);
      return data?.reports || [];
    } catch (error) {
      Logger.error('ClassroomService', error);
      throw error;
    }
  }

  /**
   * Deleta turma
   */
  async deleteClassroom(classroomId) {
    try {
      await apiClient.delete(`/classrooms/${classroomId}`);
      this.classrooms = this.classrooms.filter(c => c.id !== classroomId);
      toast.success('Turma deletada');
      return true;
    } catch (error) {
      Logger.error('ClassroomService', error);
      toast.error(error.message, 'Erro ao deletar turma');
      throw error;
    }
  }

  /**
   * Entra em uma turma usando código
   */
  async joinClassroom(classCode) {
    try {
      const data = await apiClient.post('/classrooms/join', { class_code: classCode });
      this.classrooms.push(data);
      toast.success('Turma adicionada com sucesso');
      return data;
    } catch (error) {
      Logger.error('ClassroomService', error);
      toast.error(error.message, 'Código inválido ou turma não encontrada');
      throw error;
    }
  }
}

export const classroomService = new ClassroomService();
export default classroomService;
