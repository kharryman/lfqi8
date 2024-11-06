import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { EditPeglistPage } from './edit-peglist';
import { MenuModule } from 'src/app/components/menu/menu.module';
import {PipesModule} from '../../pipes/pipes.module';


@NgModule({
  imports: [
    MenuModule,
    PipesModule,
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [EditPeglistPage]
})
export class EditPeglistPageModule {}
