import { NgFor } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.css'],
  standalone: true,
  imports: [NgbAlert, NgFor],
})
export class BreadcrumbsComponent {
  @Input('breadCrumbsData') breadCrumbsData: any;
  breadCrumbs: any = ['Waiting for Observation'];
  ngOnChanges(changes: SimpleChanges): void {
    this.changeBreadCrumbs();
  }
  private changeBreadCrumbs(): void {
    this.breadCrumbs = [];

    this.breadCrumbs = this.breadCrumbsData;
  }
  ngOnInit() {
    console.log(this.breadCrumbsData);
  }
  width = 100 / this.breadCrumbs.length;
}
