import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule,FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
objregister:any={
  "username": "",
  "email": "",
  "password": "",
  "classe": ""
}
errorMessage:string=''
constructor(
  private http: HttpClient,
  private router: Router
) { }
navigatetologin(){
  this.router.navigateByUrl('login')
}
onSubmit(form :any){
  if (form.invalid) {
    this.errorMessage = 'Please fill all fields correctly';
    return;
  }
  this.http.post("http://localhost:8000/register",this.objregister).subscribe((res:any)=>{
    if (res.user_id){
      console.log(res.user_id);
      debugger
      this.router.navigateByUrl('login')
    }
    else{
      this.errorMessage='registration failed retry'
    }


  })
}

}
