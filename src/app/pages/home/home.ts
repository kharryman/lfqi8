declare var ldb;
import { MyApp } from '../../app/app.component';
import { Component, ChangeDetectorRef } from '@angular/core';
import { Storage } from '@ionic/storage';

import { IonicPage, NavController, Platform, LoadingController, AlertController, App } from 'ionic-angular';

import { BehaviorSubject } from 'rxjs/Rx';
import { NgZone } from '@angular/core';
import { Network } from '@ionic-native/network';

//IMPORT OTHER PAGES FOR NAVIGATION:
import { LoginPage } from '../login/login';
import { CelebrityNumbersPage } from '../celebrity-numbers/celebrity-numbers';
import { AnagramGeneratorPage } from '../anagram-generator/anagram-generator';
import { EditAcrosticsPage } from '../edit-acrostics/edit-acrostics';
import { EditAlphabetPage } from '../edit-alphabet/edit-alphabet';
import { EditDictionaryPage } from '../edit-dictionary/edit-dictionary';
import { EditEventsPage } from '../edit-events/edit-events';
import { EditMnemonicsPage } from '../edit-mnemonics/edit-mnemonics';
import { EditNewWordsPage } from '../edit-new-words/edit-new-words';
import { EditNumbersPage } from '../edit-numbers/edit-numbers';
import { EditTablesPage } from '../edit-tables/edit-tables';
import { EditPeglistPage } from '../edit-peglist/edit-peglist';
import { EditCelebrityNumbersPage } from '../edit-celebrity-numbers/edit-celebrity-numbers';
import { HelpMenuPage } from '../help-menu/help-menu';
import { MajorSystemPage } from '../major-system/major-system';
import { MnemonicGeneratorPage } from '../mnemonic-generator/mnemonic-generator';
import { ShowDictionaryPage } from '../show-dictionary/show-dictionary';
import { ShowMnemonicsPage } from '../show-mnemonics/show-mnemonics';
import { ShowNewWordsPage } from '../show-new-words/show-new-words';
import { ShowNumbersPage } from '../show-numbers/show-numbers';
import { ShowTablesPage } from '../show-tables/show-tables';
import { ShowTimelinePage } from '../show-timeline/show-timeline';
import { ShowWorldMapPage } from '../show-world-map/show-world-map';
import { AlphabetAcrosticsPage } from '../alphabet-acrostics/alphabet-acrostics';
import { SearchPage } from '../search/search';
import { RequestsPage } from '../requests/requests';

import { MenuComponent } from '../../components/menu/menu';




import { SQLiteObject } from '@ionic-native/sqlite';
import { SQLitePorter } from '@ionic-native/sqlite-porter';

//import { Push, PushObject, PushOptions } from '@ionic-native/push';

import { Helpers } from '../../providers/helpers/helpers';



@IonicPage()
@Component({
   selector: 'page-home',
   templateUrl: 'home.html'
})
export class HomePage {
   //@ViewChild('homePageContent') homePageContent: ElementRef;
   pageName: string = "Home";
   home: any;
   myShared: any;
   public animals: Array<Object>;
   //public counter : number = 0;
   public appCtrl: MyApp;
   button_color: any;
   button_gradient: any;
   background_color: any;
   progressLoader: any;
   httpJson: any;
   callback: any;
   params: any;
   user: any;
   isSyncTesting: Boolean = true;
   //@ViewChild('nav') nav: NavController;

   isOnline: any;
   connectSubscription: any;
   disconnectSubscription: any;

   constructor(public app: App, public nav: NavController, public platform: Platform, public progress: LoadingController, public storage: Storage, public sqlitePorter: SQLitePorter, public ngZone: NgZone, public helpers: Helpers, private chRef: ChangeDetectorRef, private alertCtrl: AlertController, public menu: MenuComponent, private network: Network) {
      this.app.getActiveNav()._setComponentName();
      this.platform.ready().then(() => {
         if (this.helpers.isApp() === false) {
           this.isOnline = true;
         } else {
           this.isOnline = navigator.onLine === true;
         }
       });
   }

   ngOnInit() {      
      this.user = Helpers.User;
      this.home = {};
      //this.home.appPrice = Helpers.AppPrice;
      //this.home.isAppPaid = Helpers.isAppPaid;
      //ID, Timestamp, Device_ID, User_ID, DB_Type_ID, Table_name, Act_Type_ID, Cols, Vals, Wheres
      // APP SYNC_TABLE HAS IS_APP COLUMN BECAUSE: NEED TO KNOW ON WEBSITE IF TO EXECUTE OR NOT!======================>
      this.connectSubscription = this.network.onConnect().subscribe(() => {
         setTimeout(() => {
           this.isOnline = true;
         }, 3000);
       });
       this.disconnectSubscription = this.network.onDisconnect().subscribe(() => {
         setTimeout(() => {
           this.isOnline = false;
         }, 100);
       });      
   }


   ngAfterViewInit() {
   }

   ionViewWillEnter(){
      console.log('HOME ionViewWillEnter called');
      this.storage.get('BUTTON_COLOR').then((val) => {
         console.log('BUTTON_COLOR=' + val);
         if (val != null) {
            var buttonColor = JSON.parse(val);
            this.button_color = buttonColor.value;
            this.button_gradient = buttonColor.gradient;
            Helpers.button_color = buttonColor.value;
            Helpers.button_gradient = buttonColor.gradient;
            console.log("GOT this.button_color = " + this.button_color + ", this.button_gradient = " + this.button_gradient);
         } else {
            Helpers.button_color = Helpers.button_colors[0].value;
            Helpers.button_gradient = Helpers.button_colors[0].gradient;
            this.button_color = Helpers.button_colors[0].value;
            this.button_gradient = Helpers.button_colors[0].gradient;
            
         }
         this.storage.get('BACKGROUND_COLOR').then((val) => {
            if (val != null) {
               Helpers.background_color = val;
               this.background_color = val;
            } else {
               this.storage.set('BACKGROUND_COLOR', "GREEN").then(() => {
                  Helpers.background_color = "GREEN";
                  this.background_color = "GREEN";
               });
            }
         });
      });
   }

   ionViewDidEnter() {
      console.log('HOME ionViewDidEnter called');
      this.home.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor) => {
         this.background_color = bgColor;
      });
      this.home.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
         console.log("SUBSCRIBE this.button_gradient = " + this.button_gradient);
      });
      //this.nav.bac = this.helpers.rateMe;
   }

   ionViewDidLeave() {
      var activePage = this.nav.getActive().name;
      console.log("HOME ionViewDidLeave called. ACTIVE PAGE=" + activePage);
   }

   ionViewDidLoad() {
      console.log("HomePage ionViewDidLoad called!");
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave HomePage');
      this.home.subscribedBackgroundColorEvent.unsubscribe();
      this.home.subscribedButtonColorEvent.unsubscribe();
      this.connectSubscription.unsubscribe();
      this.disconnectSubscription.unsubscribe();
   }


   goEditAcrostics() {
      //this.nav.setRoot('Acrostics');
      console.log("goAcrostics called.");
      this.helpers.rateMe(() => {
         this.nav.push(EditAcrosticsPage);
      });
   }
   goAcrosticsTables() {
      console.log("goAcrosticsTables called.");
      this.helpers.rateMe(() => {
         this.nav.push(ShowTablesPage);
      });
   }
   goEditAlphabet() {
      console.log("goAlphabet called.");
      this.helpers.rateMe(() => {
         this.nav.push(EditAlphabetPage);
      });
   }
   goMajorSystem() {
      console.log("goMajorSystem called.");
      this.helpers.rateMe(() => {
         this.nav.push(MajorSystemPage);
      });
   }
   goEditNewWords() {
      console.log("goEditNewWords called.");
      this.helpers.rateMe(() => {
         this.nav.push(EditNewWordsPage);
      });
   }
   goCelebrityNumbers() {
      console.log("goCelebrityNumbers called.");
      this.helpers.rateMe(() => {
         this.nav.push(CelebrityNumbersPage);
      });
   }
   goEditDictionary() {
      console.log("goDictionary called.");
      this.helpers.rateMe(() => {
         this.nav.push(EditDictionaryPage);
      });
   }
   goEditMnemonics() {
      console.log("goMnemonics called.");
      this.helpers.rateMe(() => {
         this.nav.push(EditMnemonicsPage);
      });
   }
   goAnagramGenerator() {
      console.log("goAnagramGenerator called.");
      this.helpers.rateMe(() => {
         this.nav.push(AnagramGeneratorPage);
      });
   }
   goEditEvents() {
      console.log("goEvents called.");
      this.helpers.rateMe(() => {
         this.nav.push(EditEventsPage);
      });
   }
   goEditNumbers() {
      console.log("goNumbers called.");
      this.helpers.rateMe(() => {
         this.nav.push(EditNumbersPage);
      });
   }
   goShowWorldMap() {
      console.log("goShowWorldMap called.");
      this.helpers.rateMe(() => {
         this.nav.push(ShowWorldMapPage);
      });
   }
   goMnemonicGenerator() {
      console.log("goMnemonicGenerator called.");
      this.helpers.rateMe(() => {
         this.nav.push(MnemonicGeneratorPage);
      });
   }
   goShowMnemonics() {
      console.log("goShowMnemonics called.");
      this.helpers.rateMe(() => {
         this.nav.push(ShowMnemonicsPage);
      });
   }
   goTimeline() {
      console.log("goTimeline called.");
      this.helpers.rateMe(() => {
         this.nav.push(ShowTimelinePage);
      });
   }
   goShowDictionary() {
      console.log("goShowDictionary called.");
      this.helpers.rateMe(() => {
         this.nav.push(ShowDictionaryPage);
      });
   }
   goShowNumbers() {
      console.log("goShowNumbers called.");
      this.helpers.rateMe(() => {
         this.nav.push(ShowNumbersPage);
      });
   }
   goAlphabetAcrostics() {
      console.log("goAlphabetAcrostics called.");
      this.helpers.rateMe(() => {
         this.nav.push(AlphabetAcrosticsPage);
      });
   }
   goTables() {
      console.log("goTables called.");
      this.helpers.rateMe(() => {
         this.nav.push(EditTablesPage);
      });
   }
   goShowNewWords() {
      console.log("goShowNewWords called.");
      this.helpers.rateMe(() => {
         this.nav.push(ShowNewWordsPage);
      });
   }
   goHelp() {
      console.log("goHelp called.");
      this.helpers.rateMe(() => {
         this.nav.push(HelpMenuPage);
      });
   }
   goSearch() {
      console.log("goSearch called.");
      this.helpers.rateMe(() => {
         this.nav.push(SearchPage);
      });
   }
   goRequests() {
      console.log("goRequests called.");
      this.helpers.rateMe(() => {
         this.nav.push(RequestsPage);
      });
   }

   goLogin() {
      console.log("goLogin called");
      this.helpers.rateMe(() => {
         this.nav.push(LoginPage);
      });
   }
   goEditPeglist() {
      console.log("goEditPeglist called");
      this.helpers.rateMe(() => {
         this.nav.push(EditPeglistPage);
      });
   }
   goEditCelebrityNumbers() {
      console.log("goEditCelebrityNumbers called");
      this.helpers.rateMe(() => {
         this.nav.push(EditCelebrityNumbersPage);
      });
   }



}

interface myObject {
   [key: string]: any;
}
