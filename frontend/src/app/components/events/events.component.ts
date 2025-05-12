import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event',
  imports: [CommonModule],
  templateUrl: './events.component.html'
})
export class EventComponent implements OnInit {
  events: any[] = [];
  error: string = '';
  eventPicUrl: string = '';

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  async loadEvents(): Promise<void> {
    try {
      const token = this.authService.gettoken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      
      const response = await this.http.get<any[]>(
        `${environment.apiUrl}/events/`,
        { headers }
      ).toPromise();

      // Loop through events and set the image URLs
      if (response) {
        this.events = response.map(event => {
          let imgUrl = event.img_url;
          if (!imgUrl.startsWith('http')) {
            imgUrl = `${environment.apiUrl}${imgUrl}`;
          }
          imgUrl += `?t=${Date.now()}`; // parametre cash_busting
          return { ...event, full_img_url: imgUrl };
        });
      }
    } catch (error: any) {
      console.error('Event load error:', error);
      this.error = 'Failed to load events';
      this.events = []; 
    }
  }
}

