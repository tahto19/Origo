import { Component, Input, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-spinner-l',
  templateUrl: './spinner-l.component.html',
  styleUrls: ['./spinner-l.component.css'],
})
export class SpinnerLComponent {
  @Input('showLoading') showLoading: Boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    this.showLoading = this.showLoading;
  }
}
