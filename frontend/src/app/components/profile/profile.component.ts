// profile.component.ts - Updated version
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [CommonModule,FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('changeFileInput') changeFileInput!: ElementRef; //acces au fichier input dom elements pour les reinitialize si on a besoin de faire ca
  timestamp: number = Date.now();
  currentUserId: number | null = null;
  error: string | null = null;
  profile: any = null;
  profilePicUrl: string | null = null;
  selectedFile: File | null = null;
  isUploading = false;
  uploadSuccess: boolean = false;
  successMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.get_user_id();
    const userId = this.route.snapshot.params['userId'];
    if (!userId) {
      this.error = 'No user ID provided';
      return;
    }
    this.loadProfile(+userId);
    this.loadProfilePic(+userId); //on  charge le profile et la photo de profile si les ids sont corrects
  }

  async loadProfile(userId: number) {
    try {
      this.profile = await this.authService.authenticatedRequest<any>(
        'GET',
        `/student/profile/${userId}`
      );
    } catch (error) {
      console.error('Failed to load profile:', error);
      this.error = 'Failed to load profile';
    }
  }  // usage de methode authenticated request pour afficher le profile

  async loadProfilePic(userId: number) {
    try {
      const token = this.authService.gettoken();
      if (!token) {
        throw new Error('No authentication token');
      }// on prend notre token  
  

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      }); // on a besoin d'un token de type bearer pour qu'on travail avec un user authentifié
  
      //making the request
      const response = await this.http.get<any>(
        `${environment.apiUrl}/student/${userId}/profile-pic`,
        { headers }
      ).toPromise();// retour de type promise (pour soiyez consistant)
  
      if (response?.picture_url) {
        if (response.picture_url.startsWith('/assets/default-profile.jpg')) {
          this.profilePicUrl = `${environment.apiUrl}${response.picture_url}`; // cas de image par defaut
        } else if (!response.picture_url.startsWith('http')) {
          this.profilePicUrl = `${environment.apiUrl}${response.picture_url}`;//cas normal
          debugger
        } else {
          this.profilePicUrl = response.picture_url;
        }
        // Add cache-busting parameter (pour assurer que on  afficeh une img fresh)
        this.profilePicUrl += `?t=${Date.now()}`;
      } else {
        this.profilePicUrl = `${environment.apiUrl}/assets/default-profile.jpg`; //si on n'a pas d'image on utilise une image par defaut
      } 
    } catch (error: any) {
      console.error('Profile picture load error:', error);
      this.profilePicUrl = `${environment.apiUrl}/assets/default-profile.jpg`;
      if (error.status !== 404) {
        this.error = 'Failed to load profile picture';
      } // error handeling
    }
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      // Fallback to default image
      imgElement.src = `${environment.apiUrl}/assets/default-profile.jpg`;
      imgElement.onerror = null; // Prevent infinite loop
      
      // Alternative: Show the placeholder from your template
      const container = imgElement.closest('.current-pic');
      if (container) {
        const placeholder = container.querySelector('.no-picture-content');
        if (placeholder) {
          placeholder.classList.remove('hidden');
        }
        imgElement.style.display = 'none';
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // on prend que les fichier de type image 
      if (!file.type.startsWith('image/')) {
        this.error = 'Please select an image file';
        this.clearSelection();
        return;
      }
      
      // validation de lla taille
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'Image size should be less than 5MB';
        this.clearSelection();
        return;
      }
      
      this.selectedFile = file;
      this.error = null;
    }
  }
  /*il est impoatant d'utiliser les ligne suivant pour faire le clearselection 
    @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('changeFileInput') changeFileInput!: ElementRef;  */
  clearSelection() {
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    if (this.changeFileInput) {
      this.changeFileInput.nativeElement.value = '';
    }
  }

  onUploadSubmit() {
    if (this.profilePicUrl) {
      this.error = "You already have a profile picture. Contact admin to change it.";
      return;
    }
    
    if (this.selectedFile) {
      this.uploadProfilePic();
    }
  }

  async uploadProfilePic() {
    if (!this.selectedFile || !this.currentUserId) {
      this.error = 'No file selected or user not authenticated';
      return;
    } //error handeling
  
    this.isUploading = true;
    this.error = null;
    this.successMessage = null;
  
    try {
      const formData = new FormData(); //usage de form data pour faire l'upload
      formData.append('file', this.selectedFile, this.selectedFile.name);
  
      //ajout de l'entete (plustot creation)
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.authService.gettoken()}`
      });
  
      const response = await this.http.post<{ picture_url: string }>(
        `${environment.apiUrl}/student/${this.currentUserId}/upload-profile-pic`,
        formData, //on passera le form data dans  notre requete
        { headers }
      ).toPromise();
      //api call de plus le type de retour est un promise
      if (response?.picture_url) {
        
        this.profilePicUrl = `${environment.apiUrl}${response.picture_url}?t=${Date.now()}`; //ajput de time stamp 
        
        this.uploadSuccess = true;
        this.successMessage = 'Profile picture uploaded successfully!';
        
        setTimeout(() => {
          this.uploadSuccess = false;
          this.successMessage = null;
        }, 3000);
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      this.error = error.error?.detail || error.message || 'Failed to upload profile picture';
    } finally {
      this.isUploading = false;
    }
  }
}