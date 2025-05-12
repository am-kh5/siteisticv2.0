import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {
  private router = inject(Router);
  currentRole: string | null = null;
  userId: number | null = null;

  constructor(public authService: AuthService) { // Changed to public for template access
    this.currentRole = this.authService.get_user_role();
    this.userId = this.authService.get_user_id();
  }

  ngOnInit(): void {
    this.defaultpage();
  }

  defaultpage() {
    this.router.navigateByUrl('dashboard/dashboardelem');
  }

  navigateToProfile() {
    if (this.userId) {
      this.router.navigate(['/dashboard/profile', this.userId]);
    }
  }
  

  logout() {
    this.authService.logout();
  }
}