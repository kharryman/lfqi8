import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
   name: 'localDate',
})
export class LocalDatePipe implements PipeTransform {
   transform(value: number, ...args:any) {
      console.log("PIPE date created = " + value);
      var startTime:any;
      if(args[0] && args[0]===true){//args[0] = isMS
         console.log("PIPE using DATE IN MS!");
        startTime = new Date(value);
      }else{
         startTime = new Date(value * 1000);
      }      
      //startTime = new Date(startTime.getTime() + (startTime.getTimezoneOffset() * 60000));
      return startTime.toLocaleDateString() + " " + startTime.toLocaleTimeString();
   }
}
