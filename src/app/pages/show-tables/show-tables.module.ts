import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ShowTablesPage } from './show-tables';
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
  declarations: [ShowTablesPage]
})
export class ShowTablesPageModule {}
