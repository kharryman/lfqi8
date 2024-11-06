import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'deprettify',
})
export class DeprettifyPipe implements PipeTransform {
  /**
   * Takes a value and makes it lowercase.
   */
  transform(value: string, ...args:any) {
   value = String(value.toLowerCase()).replace(/ /g,'_');
   return value;
  }
}
