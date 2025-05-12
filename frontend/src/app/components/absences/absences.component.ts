import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-absences',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './absences.component.html',
  styleUrl: './absences.component.css'
})
export class AbsencesComponent implements OnInit {
  userId!: number;
  absences: any[] | null = null;
  error: string | null = null;
  isLoading: boolean = true;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userId = +this.route.snapshot.params['userId'];
    this.loadAbsences();
  }

  async loadAbsences() {
    try {
      this.isLoading = true;
      this.absences = await this.authService.authenticatedRequest<any[]>(
        'GET',
        `/student/${this.userId}/absences`
      );
    } catch (error) {
      this.error = 'Failed to load absences. Please try again later.';
      console.error('Absences loading error:', error);
    } finally {
      this.isLoading = false;
    }
  }
} 