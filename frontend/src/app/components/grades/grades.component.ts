import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
 
@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.css']
})
export class GradesComponent implements OnInit {
  userId!: number;
  grades: any[] | null = null;
  error: string | null = null;
  isLoading: boolean = true;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userId = +this.route.snapshot.params['userId'];
    this.loadGrades();
    debugger
    }

  async loadGrades() {
    try {
      this.isLoading = true;
      this.grades = await this.authService.authenticatedRequest<any[]>(
        'GET',
        `/student/${this.userId}/grades`
      );
      debugger;
    } catch (error) {
      this.error = 'Failed to load grades. Please try again later.';
      console.error('Grades loading error:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
