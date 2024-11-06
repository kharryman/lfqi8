import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IonApp, Platform } from '@ionic/angular';
import { Helpers } from '../helpers/helpers';
//import { AdMob } from '@admob-plus/ionic';

/*
  Generated class for the AdsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
export enum AdEvents {
   INTERSTITIAL_LOAD = "load",
   INTERSTITIAL_SHOW = "show",
   INTERSTITIAL_LOAD_FAIL = "loadfail",
   INTERSTITIAL_CLOSE = "dismiss",
   INTERSTITIAL_SHOW_FAIL = "showfail"
}

@Injectable()
export class AdsProvider {
   //currentView: string;
   myInterstistial: any;
   isInterstialReady: boolean = false;
   //2-3 minutes:
   //adStartTime: number = 120000;//2 mins
   //randomAddTime: number = 60000;//add up to 1 min to 2 mins
   adStartTime: number = 120000;//2 mins
   randomAddTime: number = 90000;//add up to 1 min to 2 mins   
   isAdFailed: boolean = false;
   isAdClosed: boolean = false;
   isAdLeftApp: boolean = false;
   // private adMob: AdMob
   //public app: IonApp, 
   constructor(public http: HttpClient, public helpers: Helpers, private platform: Platform) {
      console.log('Hello AdsProvider Provider');
      var self = this;
      self.platform.ready().then(async () => {
         if (self.helpers.isApp()) {
            /*
            self.myInterstistial = new self.adMob.InterstitialAd({
               adUnitId: 'ca-app-pub-8514966468184377/8285748542',
            });
            document.addEventListener('admob.ad.dismiss', async () => {
               console.log("Ad Closed!");
               Helpers.IS_SHOWING_AD = false;
               Helpers.IS_AD_STOPPED = true;
               self.runAds();
            });
            */
         }

         //this.adMobFree.on(this.adMobFree.events.INTERSTITIAL_OPEN).subscribe(() => {
         //   console.log("Ad Opened!");
         //});      
      });
   }

   ngOnDestroy() {
      console.log("AdsProvider ngOnDestroy called, removing admob.ad.dismiss listener...");
      document.removeEventListener('admob.ad.dismiss', () => {
         console.log("AdsProvider ngOnDestroy called, admob.ad.dismiss listener removed.");
      });
   }

   runAds() {
      console.log("runAds called");
      var self = this;
      if (!self.helpers.isApp()) return;
      /*
      self.myInterstistial.load().then(() => {
         self.currentView = this.app.getActiveNav().getActive().instance["pageName"];
         console.log("INTERSTITIAL_LOAD called currentView = " + self.currentView);
         var randomAdDelay = self.adStartTime + (Math.floor(Math.random() * self.randomAddTime));
         setTimeout(() => {
            if (Helpers.IS_SHOWING_AD === false && self.currentView !== "Login" && !Helpers.IS_DO_HTTP_REQUEST && !Helpers.IS_DO_QUERY) {
               Helpers.IS_SHOWING_AD = true;
               console.log("INTERSTITIAL_LOAD, NEXT WILL SHOW AD!");
               self.myInterstistial.show().then(() => {
                  console.log("Showing Ad!");
               }, (error: any) => {
                  console.log("Showing Ad Failed!");
                  Helpers.IS_SHOWING_AD = false;
                  Helpers.IS_AD_STOPPED = true;
                  self.runAds();
               });
            } else {
               self.runAds();
            }
         }, randomAdDelay);
      }, (error: any) => {
         console.log("Loading Ad Failed, error: " + JSON.stringify(error));
         Helpers.IS_SHOWING_AD = false;
         Helpers.IS_AD_STOPPED = true;
         self.runAds();
      });
      */
   }


}
