import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { EditEventsPage } from './edit-events';
import { MenuModule } from 'src/app/components/menu/menu.module';


@NgModule({
  imports: [
    MenuModule,
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [EditEventsPage]
})
export class EditEventsPageModule {}
