import { NgModule } from '@angular/core';
import { LocalDatePipe } from './local-date/local-date';
import { PrettifyPipe } from './prettify/prettify';
import { DeprettifyPipe } from './deprettify/deprettify';
@NgModule({
	declarations: [LocalDatePipe,
    PrettifyPipe,
    DeprettifyPipe],
	imports: [],
	exports: [LocalDatePipe,
    PrettifyPipe,
    DeprettifyPipe]
})
export class PipesModule {}
