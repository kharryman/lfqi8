import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from './menu';

@NgModule({  
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  declarations: [MenuComponent],
  exports: [MenuComponent]
})
export class MenuModule {}
