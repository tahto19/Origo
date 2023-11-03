import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { XDashBaseModule } from './x-dash-base/x-dash-base.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    XDashBaseModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
