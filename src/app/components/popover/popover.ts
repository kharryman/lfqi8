import { Component, ElementRef, OnInit } from '@angular/core';
import { NavController, NavParams, PopoverController  } from '@ionic/angular';
//import { Storage } from '@ionic/storage';
import { Storage } from '@capacitor/storage';
//import { ShareService} from '../services/share.service';
import { HomePage } from '../../../../../lfqi8_old/src/app/pages/home/home';

@Component({
  selector: 'popover',
  templateUrl: 'popover.html'
})


export class PopoverComponent implements OnInit {

   popoverCtrl: PopoverController | null = null;
   colors: any;
   buttons: any;
   message = '';
   buttonColor:any;
   homePageContent:ElementRef | null = null;
   autoSync:any;
   isAutoSync:Boolean = false;
   //myStorage:Storage;
   //myShared:any;

   //public viewCtrl: ViewController, 
    constructor(public navParams: NavParams, public nav: NavController, public storage: Storage) {
      //this.formGroup = autoSyncForm;
      //this.myStorage = storage;
      //this.myShared = shared;
      //this.buttonColor = this.myShared.getButtonColor();
      //this.buttonColor = navParams.get("buttonColor");
      //this.popoverCtrl = this.sharedService.getPopoverCtrl();

    }

    close() {
      //this.viewCtrl.dismiss();
    }

    changeBackgroundColor(item:any){
      console.log("changeBackgroundColor called item=" + JSON.stringify(item));
      //this.homePageContent.nativeElement.style.backgroundColor = item.hex;
    }

    changeButtonColor(item:any){
      console.log("changeButtonColor called item=" + JSON.stringify(item));
      this.buttonColor = item.value;
      //this.myShared.setButtonColor(this.buttonColor);
      //this.myStorage.set("button_color", item.value);
      Storage.set({key:"BUTTON_COLOR", value:item.value});
      //this.nav.push(HomePage);
      //this.sharedService.setButtonColor(item.value);
    }

    sync(isSync:any){
      this.isAutoSync = isSync;
      console.log("sync called isSync=" + isSync);
    }

  ngOnInit() {
    //this.homePageContent = this.sharedService.getHomePageDiv();
    //this.message = this.sharedService.getPopoverMessage();
    console.log("Passed homePageContent=" + JSON.stringify(this.homePageContent));
    this.isAutoSync = false;
    this.autoSync = "AUTO SYNC OFF";
    this.colors=[
      {color:'BLACK', hex:"#000000"},
      {color:'CYAN', hex:"#00FFFF"},
      {color:'GREEN', hex:"#00FF00"},
      {color:'GRAY', hex:"#E1E1E1"},
      {color:'MAGENTA', hex:"#FF00FF"},
      {color:'RED', hex:"#FF0000"},
      {color:'WHITE', hex:"#FFFFFF"},
      {color:'YELLOW', hex:"#FFFF00"},
    ];
    this.buttons=[
      {color:'GREEN', value:"secondary"},
      {color:'RED', value:"danger"},
      {color:'LIGHT GRAY', value:"light"},
    ];
  }

}
