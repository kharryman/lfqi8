import { Component } from '@angular/core';
import { NavController, AlertController, Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Helpers } from '../../providers/helpers/helpers';
import { Subscription } from 'rxjs';


@Component({
   selector: 'page-celebrity-numbers',
   templateUrl: 'celebrity-numbers.html',
})
export class CelebrityNumbersPage {
   public pageName:string = "Celebrity Numbers";
   celebrities: any;
   isAllCelebrities: Boolean;
   isAbreviateCelebrities: Boolean;
   namenums: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   user: any;
   private onPauseSubscription: Subscription;

   constructor(public navCtrl: NavController, private platform: Platform, private alertCtrl: AlertController, public storage: Storage, public helpers: Helpers) {
      this.celebrities = {};
      this.isAllCelebrities = false;
      this.isAbreviateCelebrities = false;
      this.onPauseSubscription = this.platform.pause.subscribe(() => {
         this.saveStorage();
      });
   }

   ngOnDestroy() {
      this.saveStorage();
      this.onPauseSubscription.unsubscribe();
   }

   async ngOnInit() {
      this.celebrities = {};
      this.user = Helpers.User;
      await this.storage.create();
      this.isAllCelebrities = false;
      this.isAbreviateCelebrities = false;
      this.celebrities.celebrityNumbers = 0;
      this.celebrities.color = "secondary";
      this.storage.get('CELEBRITY_NUMBERS_INPUT').then((val) => {
         if (val != null) {
            this.celebrities.celebrityNumbers = val;
         }
         this.storage.get('CELEBRITY_NUMBERS_ENTIRE_LIST').then((val) => {
            if (val != null) {
               this.isAllCelebrities = val;
            }
            this.storage.get('CELEBRITY_NUMBERS_ABBREVIATE_RESULTS').then((val) => {
               if (val != null) {
                  this.isAbreviateCelebrities = val;
               }
               this.background_color = Helpers.background_color;
               this.button_color = Helpers.button_color;
               this.button_gradient = Helpers.button_gradient;
               this.celebrities.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
                  this.background_color = bgColor;
               });
               this.celebrities.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
                  this.button_color = buttonColor.value;
                  this.button_gradient = buttonColor.gradient;
               });               
               this.helpers.getCelebrityNumbers().then((celebrities) => {
                  if (celebrities) {
                     Helpers.celebrities = celebrities;
                  }
               });               
            });
         });
      });
   }

   ionViewDidLoad() {
      console.log('ionViewWillLeave CelebrityNumbersPage');
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave CelebrityNumbersPage');
      this.celebrities.subscribedBackgroundColorEvent.unsubscribe();
      this.celebrities.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   saveStorage() {
      console.log("saveStorage called");
      this.storage.set('CELEBRITY_NUMBERS_INPUT', this.celebrities.celebrityNumbers).then(() => {
         this.storage.set('CELEBRITY_NUMBERS_ENTIRE_LIST', this.isAllCelebrities).then(() => {
            this.storage.set('CELEBRITY_NUMBERS_ABBREVIATE_RESULTS', this.isAbreviateCelebrities).then(() => {
            });
         });
      });
   }

   getCelebrityNumbers() {
      console.log("getCelebrityNumbers called.");
      this.helpers.convertNumbersToNames(null, this.isAllCelebrities, this.isAbreviateCelebrities, this.celebrities.celebrityNumbers).then((celebrityNumbers) => {
         if (celebrityNumbers) {
            this.celebrities.celebritiesArray = celebrityNumbers.celebritiesArray;
         }
      });
   }

}