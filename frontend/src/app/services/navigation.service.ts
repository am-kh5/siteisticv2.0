import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  constructor(private authService: AuthService) {}

  getNavItems() {
    const userId = this.authService.get_user_id();
    return [
      {
        label: 'Profile',
        path: `/dashboard/profile/${userId}`,
        icon: 'person'
      },
      {
        label: 'Grades',
        path: `/dashboard/grades/${userId}`,
        icon: 'grade'
      },
      {
        label: 'Absences',
        path: `/dashboard/absences/${userId}`,
        icon: 'event_busy'
      },
      {
        label: 'Requests',
        path: `/dashboard/requests/${userId}`,
        icon: 'description'
      },
      {
        label: 'Admin Panel',
        path: '/dashboard/adminprofile',
        icon: 'admin_panel_settings'
      },
      {
        label: 'Students',
        path: '/dashboard/students',
        icon: 'people'
      },
      {
        label: 'Manage Grades',
        path: '/dashboard/admingrades',
        icon: 'school'
      },
      {
        label: 'Manage Requests',
        path: '/dashboard/adminrequests',
        icon: 'assignment'
      }
    ];
  }
}


