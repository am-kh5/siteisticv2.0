import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private token :string | null = null
  private helper = new JwtHelperService();
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    //we get the token from the local storage if it exists
    this.token = localStorage.getItem('token');
  }
  gettoken(): string | null {
    if (!this.token){
      this.token=localStorage.getItem('token');
    }
    return this.token
  }
  isloggedin():boolean{
    const token=this.gettoken();
    if(!token){return false}
    else{
      try {
        const isExpired = this.helper.isTokenExpired(token);
        console.log('Token expired?', isExpired);
        return !isExpired;
      } catch (e) {
        console.error('Error validating token:', e);
        // If there's an error parsing the token, consider the user not logged in
        return false;
      }
    }
  }
  get_user_id(): number | null {
    const token = this.gettoken();
    if (!token) return null;
    
    try {
      const decodedToken = this.helper.decodeToken(token);
      return decodedToken?.sub || null;
    } catch (e) {
      console.error('Error decoding token for user ID:', e);
      return null;
    }
  }
  get_user_role(): string | null {
    const token = this.gettoken();
    if (!token) return null;
    
    try {
      const decodedToken = this.helper.decodeToken(token);
      return decodedToken?.role || null;
    } catch (e) {
      console.error('Error decoding token for role:', e);
      return null;
    }
  }
  logout():void {
    this.token=null;
    localStorage.removeItem('token');
    this.router.navigateByUrl('login');
  }
  // <T> allows us to work with diffrent types of response data and the usual type is specified when you call the function 
  // a promise in angular a guarantee that you will get a result from some work that is happening asynchronously (meaning not immediately).
  // the result can be a success or a faillure 
  async authenticatedRequest<T>(method: string, url: string, body?: any): Promise<T> {
    const token = this.gettoken();debugger
    if (!token) throw new Error('No token');
    const response = await fetch(`${environment.apiUrl}${url}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined
    }); debugger
    if (!response.ok) {
      if (response.status === 401) this.logout();
      throw new Error(await response.text());
    } debugger
    return response.json();
  }

}
