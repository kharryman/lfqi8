import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ShowNewWordsPage } from './show-new-words';
import { MenuModule } from 'src/app/components/menu/menu.module';


@NgModule({
  imports: [
    MenuModule,
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [ShowNewWordsPage]
})
export class ShowNewWordsPageModule {}
