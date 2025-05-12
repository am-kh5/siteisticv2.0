import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admingrades',
  imports: [CommonModule, FormsModule],
  templateUrl: './admingrades.component.html',
  styleUrls: ['./admingrades.component.css']
})
export class AdmingradesComponent implements OnInit {
  students: any[] = [];
  groupedStudents: { [key: string]: any[] } = {};
  error: string | null = null;
  isLoading: boolean = true;
  editingStudent: any = null;
  editFormData: any = {};
  subjects: any[] = [];
  availableSubjects: any[] = [];
  selectedSubject: any = null;
  newGrade: number | null = null;

  constructor(private authService: AuthService) {}

  async ngOnInit() {
    await this.loadStudents();
    await this.loadSubjects();
  }

  async loadStudents() {
    try {
      this.students = await this.authService.authenticatedRequest<any[]>(
        'GET',
        '/admin/students'
      );
      // Load grades for each student
      for (const student of this.students) {
        student.grades = await this.getStudentGrades(student.user_id);
      }
      this.groupStudentsByClass();
    } catch (error) {
      this.error = 'Failed to load students. Please try again later.';
      console.error('Students loading error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadSubjects() {
    try {
      this.subjects = await this.authService.authenticatedRequest<any[]>(
        'GET',
        '/admin/subjects'
      );
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  }

  async getStudentGrades(studentId: number): Promise<any[]> {
    try {
      return await this.authService.authenticatedRequest<any[]>(
        'GET',
        `/admin/students/${studentId}/grades`
      );
    } catch (error) {
      console.error('Error loading grades:', error);
      return [];
    }
  }

  groupStudentsByClass() {
    this.groupedStudents = {};
    this.students.forEach(student => {
      const classe = student.classe || 'No Class';
      if (!this.groupedStudents[classe]) {
        this.groupedStudents[classe] = [];
      }
      this.groupedStudents[classe].push(student);
    });
  }

  getClasses(): string[] {
    return Object.keys(this.groupedStudents);
  }

  startEdit(student: any) {
    this.editingStudent = student;
    this.editFormData = { ...student };
    this.updateAvailableSubjects(student);
  }

  updateAvailableSubjects(student: any) {
    // Get subjects that the student doesn't have grades for
    const gradedSubjectIds = student.grades.map((grade: any) => grade.subject_id);
    this.availableSubjects = this.subjects.filter(
      subject => !gradedSubjectIds.includes(subject.subject_id)
    );
    this.selectedSubject = this.availableSubjects.length > 0 ? this.availableSubjects[0] : null;
  }

  cancelEdit() {
    this.editingStudent = null;
    this.editFormData = {};
    this.selectedSubject = null;
    this.newGrade = null;
  }

  async addGrade() {
    if (!this.selectedSubject || this.newGrade === null || this.newGrade < 0 || this.newGrade > 20) {
      this.error = 'Please select a subject and enter a valid grade (0-20)';
      return;
    }

    try {
      this.isLoading = true;
      
      const gradeData = {
        student_id: this.editingStudent.user_id,
        subject_id: this.selectedSubject.subject_id,
        grade: this.newGrade
      };

      await this.authService.authenticatedRequest(
        'POST',
        '/admin/grades',
        gradeData
      );
      
      // Refresh the student's grades
      this.editingStudent.grades = await this.getStudentGrades(this.editingStudent.user_id);
      this.updateAvailableSubjects(this.editingStudent);
      this.newGrade = null;
    } catch (error: any) {
      this.error = error.message || 'Failed to add grade. Please try again later.';
      console.error('Add grade error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async updateGrade(grade: any) {
    if (grade.grade < 0 || grade.grade > 20) {
      this.error = 'Please enter a valid grade (0-20)';
      return;
    }

    try {
      this.isLoading = true;
      
      const gradeData = {
        grade: grade.grade
      };

      await this.authService.authenticatedRequest(
        'PUT',
        `/admin/grades/${grade.grade_id}`,
        gradeData
      );
      
      // Refresh the student's grades
      this.editingStudent.grades = await this.getStudentGrades(this.editingStudent.user_id);
    } catch (error: any) {
      this.error = error.message || 'Failed to update grade. Please try again later.';
      console.error('Update grade error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteGrade(gradeId: number) {
    if (!confirm('Are you sure you want to delete this grade?')) {
      return;
    }

    try {
      this.isLoading = true;
      
      await this.authService.authenticatedRequest(
        'DELETE',
        `/admin/grades/${gradeId}`
      );
      
      // Refresh the student's grades
      this.editingStudent.grades = await this.getStudentGrades(this.editingStudent.user_id);
      this.updateAvailableSubjects(this.editingStudent);
    } catch (error: any) {
      this.error = error.message || 'Failed to delete grade. Please try again later.';
      console.error('Delete grade error:', error);
    } finally {
      this.isLoading = false;
    }
  }
}