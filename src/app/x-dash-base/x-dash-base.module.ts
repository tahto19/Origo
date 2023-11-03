import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { XDashMapComponent } from './x-dash-map/x-dash-map.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { HttpClientModule } from '@angular/common/http';
import { XDashService } from '../services/x-dash.service';
import { BreadcrumbsComponent } from './breadcrumbs/breadcrumbs.component';
import { LeftmenuComponent } from './leftmenu/leftmenu.component';
import { DropdownComponent } from './dropdown/dropdown.component';
import { SpinnerLComponent } from './spinner-l/spinner-l.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [XDashMapComponent, SpinnerLComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    LeafletModule,
    BreadcrumbsComponent,
    LeftmenuComponent,
    DropdownComponent,
    FormsModule,
  ],
  exports: [XDashMapComponent],
  providers: [XDashService],
})
export class XDashBaseModule {}
