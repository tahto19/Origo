/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { XDashMapComponent } from './x-dash-map.component';

describe('XDashMapComponent', () => {
  let component: XDashMapComponent;
  let fixture: ComponentFixture<XDashMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ XDashMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(XDashMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
