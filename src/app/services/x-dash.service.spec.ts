/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { XDashService } from './x-dash.service';

describe('Service: XDash', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [XDashService]
    });
  });

  it('should ...', inject([XDashService], (service: XDashService) => {
    expect(service).toBeTruthy();
  }));
});
