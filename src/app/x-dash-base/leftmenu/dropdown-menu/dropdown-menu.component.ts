import { Component, Input, SimpleChange } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-dropdown-menu',
  templateUrl: './dropdown-menu.component.html',
  styleUrls: ['./dropdown-menu.component.css'],
  standalone: true,
  imports: [NgFor, FormsModule],
})
export class DropdownMenuComponent {
  expanded: Boolean = false;
  @Input()
  data: any;
  selected: any = 'Please Choose';
  checkboxes: any = Math.random().toString() + '_checbobx';
  showCheckboxes(e: any) {
    let checkboxes: any = document.getElementById(this.checkboxes);
    if (!this.expanded) {
      checkboxes.style.display = 'block';
      this.expanded = true;
    } else {
      checkboxes.style.display = 'none';
      this.expanded = false;
    }
  }
  ItemSelected(a: any) {
    this.selected = a;
  }
  ngOnInit() {
    console.log(this.data);
  }
  ngOnChanges(change: SimpleChange) {
    console.log(this.expanded);
  }
}
