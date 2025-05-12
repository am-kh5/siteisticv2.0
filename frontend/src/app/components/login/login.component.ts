import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule,FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
objlogin:any={
  username:'',
  password:''
};
errorMessage:string='';
constructor(
  private http:HttpClient,
  private router:Router
){}
navigatetoregister(){
  this.router.navigateByUrl('register')
}
onSubmit(form:any){
  this.errorMessage=''; //initialization de message d'erreur
  if (form.invalid) {
    this.errorMessage = 'Please fill all fields correctly';
    return;
  }
  const formData = new FormData(); //form data used to pass x-www-form format (this is the format we are required to pass to our api (because of the OAuth2PasswordRequestForm specification))
    formData.append('username', this.objlogin.username);
    formData.append('password', this.objlogin.password);
  
  this.http.post('http://localhost:8000/token',formData).subscribe((res:any)=>{
    if(res.access_token)
    {
      localStorage.setItem('token',res.access_token);
      this.router.navigateByUrl('dashboard');
    }
    else{
      this.errorMessage='reponse de serveur invalide '
    }
  },
  (err)=>{
    if (err.status === 401) {
      this.errorMessage = 'Invalid username or password';
    } else {
      this.errorMessage = 'Login failed. Please try again later.';
    }
  }

);
}

}
