import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
   name: 'prettify',
})
export class PrettifyPipe implements PipeTransform {
   /**
    * Takes a value and makes it lowercase.
    */
   transform(value: string, ...args:any) {
      value = String(value).replace(/_/g,' ');
      var valueArr = value.split(" ");
      var retArr = [];
      for(var i=0;i<valueArr.length;i++){
         retArr.push(valueArr[i].substring(0,1).toUpperCase() + valueArr[i].substring(1).toLowerCase());
      }
      //startTime = new Date(startTime.getTime() + (startTime.getTimezoneOffset() * 60000));
      return retArr.join(" ");
   }
}
