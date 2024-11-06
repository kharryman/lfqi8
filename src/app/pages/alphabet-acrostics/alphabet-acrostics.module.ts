import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AlphabetAcrosticsPage } from './alphabet-acrostics';
import { MenuModule } from 'src/app/components/menu/menu.module';


@NgModule({
  imports: [
    MenuModule,
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [AlphabetAcrosticsPage]
})
export class AlphabetAcrosticsPageModule {}
