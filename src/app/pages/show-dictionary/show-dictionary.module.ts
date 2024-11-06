import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ShowDictionaryPage } from './show-dictionary';
import { MenuModule } from 'src/app/components/menu/menu.module';


@NgModule({
  imports: [
    MenuModule,
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [ShowDictionaryPage]
})
export class ShowDictionaryPageModule {}
