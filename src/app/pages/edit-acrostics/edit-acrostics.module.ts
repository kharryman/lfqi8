import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { EditAcrosticsPage } from './edit-acrostics';
import {PipesModule} from '../../pipes/pipes.module';
import { MenuModule } from 'src/app/components/menu/menu.module';


@NgModule({
  imports: [
    MenuModule,
    CommonModule,
    FormsModule,
    IonicModule,
    PipesModule
  ],
  declarations: [EditAcrosticsPage]
})
export class EditAcrosticsPageModule {}
