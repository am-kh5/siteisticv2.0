import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent implements OnInit {
  students: any[] = [];
  groupedStudents: { [key: string]: any[] } = {};
  error: string | null = null;
  isLoading: boolean = true;
  editingStudent: any = null; // pour qu'on a une idee usr quelle etudiant on fait des modification
  editFormData: any = {}; //les donnees de form

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  async loadStudents() {
    try {
      this.students = await this.authService.authenticatedRequest<any[]>(
        'GET',
        '/admin/students'
      );
      this.groupStudentsByClass();
    } catch (error) {
      this.error = 'Failed to load students. Please try again later.';
      console.error('Students loading error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  groupStudentsByClass() {
    this.groupedStudents = {}; //groupedStudents: { [key: string]: any[] } = {}; on groupe les etudiant par leur classe (we are resetting this object in this line )
    this.students.forEach(student => {
      const classe = student.classe || 'No Class';
      if (!this.groupedStudents[classe]) {
        this.groupedStudents[classe] = [];
      }
      this.groupedStudents[classe].push(student);
    });
  }
  /*example de grouped students 
  groupedStudents = {
  '1A': [
    { user_id: 1, username: 'alice', classe: '1A' },
    { user_id: 2, username: 'bob', classe: '1A' }
  ],
  '2B': [
    { user_id: 3, username: 'charlie', classe: '2B' }
  ],
  'No Class': [
    { user_id: 4, username: 'diana', classe: null }
  ]
};*/

  getClasses(): string[] {
    return Object.keys(this.groupedStudents);
  }

  // methode pour editer un ed=tuddiant 
  startEdit(student: any) {
    this.editingStudent = student;
    this.editFormData = { ...student }; // Creation de copie des donnees de l'etudiant
  }

  cancelEdit() {
    this.editingStudent = null;
    this.editFormData = {}; //reanisialiser les donnees de l'objet de modification
  }

  async saveChanges() {
    try {
      this.isLoading = true;
  
      const updatedStudent = await this.authService.authenticatedRequest<any>(
        'PUT',
        `/admin/students/${this.editingStudent.user_id}`,
        this.editFormData //body de requete (passe en format json (il va etere transforme en json dans cette methode plutot))
      );
      
      
      Object.assign(this.editingStudent, updatedStudent); //va faire une copie de updated student dans editing student
      this.groupStudentsByClass(); //regroupement des etudiant par classe
      this.cancelEdit(); // reinitialisation de editing data
    } catch (error: any) {
      this.error = error.message || 'Failed to update student. Please try again later.';
      console.error('Update error:', error);
    } finally {
      this.isLoading = false;
    }
  }
  // methode pour effacer etudiant
async deleteStudent(student: any) {
  if (!confirm(`Are you sure you want to delete ${student.username}?`)) {//affiche alert de confirmation 
    return; 
  }

  try {
    this.isLoading = true;
    await this.authService.authenticatedRequest(
      'DELETE',
      `/admin/students/${student.user_id}`
    );
    
    
    this.students = this.students.filter(s => s.user_id !== student.user_id); //en efface un etudiant de la liste des etidiant (en utilise son id )
    this.groupStudentsByClass(); // regroupement des etudiant une autre fois 
  } catch (error: any) {
    this.error = error.message || 'Failed to delete student. Please try again later.';
    console.error('Delete error:', error);
  } finally {
    this.isLoading = false;
  }
}
}