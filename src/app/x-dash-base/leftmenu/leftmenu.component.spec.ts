import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeftmenuComponent } from './leftmenu.component';

describe('LeftmenuComponent', () => {
  let component: LeftmenuComponent;
  let fixture: ComponentFixture<LeftmenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LeftmenuComponent]
    });
    fixture = TestBed.createComponent(LeftmenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
