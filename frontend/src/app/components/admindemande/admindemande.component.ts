import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-demandes',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: 'admindemande.component.html'
  
})
export class AdmindemandeComponent implements OnInit  {
  requests: any[] | null = null;
  error: string | null = null;
  isLoading: boolean = true;
  selectedRequest: any | null = null;
  statusUpdate: { status: string } = { status: 'pending' };

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadRequests();
    debugger;
  }

  async loadRequests() {
    try {
      this.isLoading = true;
      this.requests = await this.authService.authenticatedRequest<any[]>(
        'GET',
        '/admin/requests'
      );
      debugger;
    } catch (error) {
      this.error = 'Failed to load requests. Please try again later.';
      console.error('Requests loading error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  selectRequest(request: any): void {
    this.selectedRequest = request;
    this.statusUpdate.status = request.status;
  }

  async updateRequestStatus() {
    if (!this.selectedRequest) return;

    try {
      this.isLoading = true;
      const updatedRequest = await this.authService.authenticatedRequest<any>(
        'PUT',
        `/admin/requests/${this.selectedRequest.request_id}/status`,
        this.statusUpdate
      );

      // on fait un update de cette facon pour ne pas appeler la  fonction loadrequuests une autre fois 
      //aide avec la performance si on a un tres grand nombre de requets dans la bd 
      if (this.requests) {
        const index = this.requests.findIndex(r => r.request_id === updatedRequest.request_id);
        if (index !== -1) {
          this.requests[index] = updatedRequest;
        }
      }

      this.selectedRequest = null;
    } catch (error) {
      this.error = 'Failed to update request status. Please try again later.';
      console.error('Status update error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved': return 'text-success';
      case 'rejected': return 'text-danger';
      case 'pending': return 'text-warning';
      case 'in_review': return 'text-info';
      case 'ready': return 'text-primary';
      default: return '';
    }
  }

  getStatusDisplay(status: string): string {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending';
      case 'in_review': return 'In Review';
      case 'ready': return 'Ready';
      default: return status;
    }
  }

  getRequestTypeDisplay(type: string): string {
    return type === 'attestation de presence' ? 'Presence Attestation' : 'Success Attestation';
  }
}

