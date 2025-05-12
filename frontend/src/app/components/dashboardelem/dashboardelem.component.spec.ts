import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardelemComponent } from './dashboardelem.component';

describe('DashboardelemComponent', () => {
  let component: DashboardelemComponent;
  let fixture: ComponentFixture<DashboardelemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardelemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardelemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
