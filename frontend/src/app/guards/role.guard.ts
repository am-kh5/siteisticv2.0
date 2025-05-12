import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Handle both singular and plural role specifications
    let expectedRoles: string[] = [];
    
    if (route.data['expectedRoles']) {
      expectedRoles = route.data['expectedRoles'];    
    } else if (route.data['expectedRole']) {
      expectedRoles = [route.data['expectedRole']];
    }
    
    const currentRole = this.authService.get_user_role();
    
    if (!this.authService.isloggedin()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Allow access if no specific role required
    if (expectedRoles.length === 0) {
      return true;
    }
    
    // Check if user has matching role (handle null case)
    if (currentRole !== null && expectedRoles.includes(currentRole)) {
      return true;
    }

    this.router.navigate(['/dashboard/dashboardelem']); // Redirect to a valid route
    return false;
  }
}