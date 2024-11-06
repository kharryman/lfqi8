import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { EditAlphabetPage } from './edit-alphabet';
import { MenuModule } from 'src/app/components/menu/menu.module';
import { ModalListPageModule } from '../modal-list/modal-list.module';


@NgModule({
  imports: [
    MenuModule,
    ModalListPageModule,
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [EditAlphabetPage]
})
export class EditAlphabetPageModule {}
