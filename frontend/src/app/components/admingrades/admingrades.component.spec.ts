import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmingradesComponent } from './admingrades.component';

describe('AdmingradesComponent', () => {
  let component: AdmingradesComponent;
  let fixture: ComponentFixture<AdmingradesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmingradesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdmingradesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
