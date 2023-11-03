import { NgFor } from '@angular/common';
import {
  Component,
  Output,
  Input,
  OnChanges,
  SimpleChanges,
  EventEmitter,
} from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.css'],
  standalone: true,
  imports: [NgbDropdownModule, NgFor],
})
export class DropdownComponent implements OnChanges {
  active = 'Viridis Ag - Alcheringa';
  @Input() tenants: any;
  @Output()
  update: EventEmitter<any> = new EventEmitter();
  listOfTenants: any = [];
  ngOnChanges(changes: SimpleChanges): void {
    this.listOfTenants = this.tenants;
  }
  handleGetStations(tenant: any): void {
    this.active = tenant.name;
    this.update.emit(tenant);
  }
}
