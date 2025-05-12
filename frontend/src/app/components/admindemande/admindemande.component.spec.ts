import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmindemandeComponent } from './admindemande.component';

describe('AdmindemandeComponent', () => {
  let component: AdmindemandeComponent;
  let fixture: ComponentFixture<AdmindemandeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmindemandeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdmindemandeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
