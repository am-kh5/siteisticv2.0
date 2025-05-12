import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-demande',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande.component.html',
  styleUrls: ['./demande.component.css']
})
export class DemandeComponent implements OnInit {
  userId!: number;
  requests: any[] | null = null;
  error: string | null = null;
  isLoading: boolean = true;
  
  // pour creere
  showCreateForm: boolean = false;
  newRequest: any = {
    request_type: '',
    motive: '',
    justification: ''
  };
  createError: string | null = null;
  isCreating: boolean = false;

  // pour editer
  editingRequest: any = null;
  editMotive: string = '';
  editJustification: string = '';
  editError: string | null = null;
  isEditing: boolean = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = +this.route.snapshot.params['userId'];
    this.loadRequests();
  }

  async loadRequests() {
    try {
      this.isLoading = true;
      this.requests = await this.authService.authenticatedRequest<any[]>(
        'GET',
        `/student/${this.userId}/requests`
      );
    } catch (error) {
      this.error = 'Failed to load requests. Please try again later.';
      console.error('Requests loading error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Request creation methods
  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetCreateForm();
    }
  }

  resetCreateForm() {
    this.newRequest = {
      request_type: '',
      motive: '',
      justification: ''
    };
    this.createError = null;
  }

  async createRequest() {
    if (!this.newRequest.request_type || !this.newRequest.motive || !this.newRequest.justification) {
      this.createError = 'All fields are required';
      return;
    }

    try {
      this.isCreating = true;
      await this.authService.authenticatedRequest(
        'POST',
        `/student/${this.userId}/requests`,
        this.newRequest
      );
      
      // pour afficher lanouvelle requets ajoute 
      this.loadRequests();
      this.resetCreateForm();
      this.showCreateForm = false;
    } catch (error) {
      this.createError = 'Failed to create request. Please try again later.';
      console.error('Request creation error:', error);
    } finally {
      this.isCreating = false;
    }
  }

  
  editRequest(request: any) {
    this.editingRequest = request;
    this.editMotive = request.motive;
    this.editJustification = request.justification;
  }

  cancelEdit() {
    this.editingRequest = null;
    this.editError = null;
  }

  async saveEdit() {
    if (!this.editingRequest) return;

    try {
      this.isEditing = true;
      await this.authService.authenticatedRequest(
        'PUT',
        `/student/requests/${this.editingRequest.request_id}`,
        {
          motive: this.editMotive,
          justification: this.editJustification
        }
      );
      
      this.editingRequest = null;
      this.loadRequests(); // Refresh the list
    } catch (error) {
      this.editError = 'Failed to update request. Please try again later.';
      console.error('Request update error:', error);
    } finally {
      this.isEditing = false;
    }
  }


  async deleteRequest(requestId: number) {
    if (!confirm('Are you sure you want to delete this request?')) return; //alert pour la confirmation

    try {
      await this.authService.authenticatedRequest(
        'DELETE',
        `/student/requests/${requestId}`
      );
      this.loadRequests(); // on affiche les requete un autre fois
    } catch (error) {
      this.error = 'Failed to delete request. Please try again later.';
      console.error('Request deletion error:', error);
    }
  }

 //fonction pour l'affichage des type  de requetes
  getRequestTypeDisplay(type: string): string {
    switch(type) {
      case 'attestation de presence': return 'Attestation de Presence';
      case 'attestation de reussite': return 'Attestation de Reussite';
      default: return type;
    }
  }
}
