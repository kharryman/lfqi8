//declare var ldb;
import { AppComponent } from '../../../../../lfqi8/src/app/app.component';
import { Component, ChangeDetectorRef } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

import { NavController, Platform, LoadingController, AlertController} from '@ionic/angular';

//import { BehaviorSubject } from 'rxjs/Rx';
import { NgZone } from '@angular/core';

//IMPORT OTHER PAGES FOR NAVIGATION:
import { LoginPage } from '../../../../../lfqi8/src/app/pages/login/login';

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
//import { MnemonicGeneratorPage } from '../mnemonic-generator/mnemonic-generator';
import { ShowDictionaryPage } from '../show-dictionary/show-dictionary';
import { ShowMnemonicsPage } from '../show-mnemonics/show-mnemonics';
import { ShowNewWordsPage } from '../show-new-words/show-new-words';
import { ShowNumbersPage } from '../show-numbers/show-numbers';
//import { ShowTablesPage } from '../show-tables/show-tables';
//import { ShowTimelinePage } from '../show-timeline/show-timeline';
import { ShowWorldMapPage } from '../show-world-map/show-world-map';
import { AlphabetAcrosticsPage } from '../alphabet-acrostics/alphabet-acrostics';

import { SearchPage } from '../search/search';
import { RequestsPage } from '../requests/requests';

import { MenuComponent } from '../../components/menu/menu';


import { Helpers } from '../../providers/helpers/helpers';
import { Network } from '@capacitor/network';


@Component({
   selector: 'page-home',
   templateUrl: 'home.html',
   styleUrls: ['./home.scss']
})
export class HomePage {
   //@ViewChild('homePageContent') homePageContent: ElementRef;
   pageName: string = "Home";
   home: any;
   myShared: any;
   //public counter : number = 0;
   //public appCtrl: AppComponent;
   button_color: any;
   button_gradient: any;
   background_color: any;
   progressLoader: any;
   httpJson: any;
   callback: any;
   params: any;
   user: any;
   isSyncTesting: Boolean = true;

   isOnline: any;
   connectSubscription: any;
   disconnectSubscription: any;

   //public sqlitePorter: SQLitePorter
   //private network: Network
   //public app: IonApp
   constructor(public nav: NavController, public platform: Platform, public progress: LoadingController, public storage: Storage, public ngZone: NgZone, public helpers: Helpers, private chRef: ChangeDetectorRef, private alertCtrl: AlertController) {
      //this.app.getActiveNav()._setComponentName();
      this.platform.ready().then(() => {
         if (this.helpers.isApp() === false) {
           this.isOnline = true;
         } else {
           this.isOnline = navigator.onLine === true;
         }
       });
   }

   async ngOnInit() {      
      this.user = Helpers.User;
      this.home = {};
      await this.storage.create();
      //this.home.appPrice = Helpers.AppPrice;
      //this.home.isAppPaid = Helpers.isAppPaid;
      //ID, Timestamp, Device_ID, User_ID, DB_Type_ID, Table_name, Act_Type_ID, Cols, Vals, Wheres
      // APP SYNC_TABLE HAS IS_APP COLUMN BECAUSE: NEED TO KNOW ON WEBSITE IF TO EXECUTE OR NOT!======================>


      Network.addListener('networkStatusChange', (status:any) => {
         console.log('Network status changed:', status.connected ? 'Connected' : 'Disconnected');      
         setTimeout(() => {
           console.log('we got a Connection = ' + status.connectionType);        
           this.isOnline = status.connected? true: false;
         }, 100);
      });   
      
   }


   ngAfterViewInit() {
   }

   ionViewWillEnter(){
      console.log('HOME ionViewWillEnter called');
      this.storage.get('BUTTON_COLOR').then((val:any) => {
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
         this.storage['get']('BACKGROUND_COLOR').then((val:any) => {
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
      this.home.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
         this.background_color = bgColor;
      });
      this.home.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
         console.log("SUBSCRIBE this.button_gradient = " + this.button_gradient);
      });
      //this.nav.bac = this.helpers.rateMe;
   }

   ionViewDidLeave() {
      //var activePage = this.nav.getActive().name;
      //console.log("HOME ionViewDidLeave called. ACTIVE PAGE=" + activePage);
   }

   ionViewDidLoad() {
      console.log("HomePage ionViewDidLoad called!");
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave HomePage');
      this.home.subscribedBackgroundColorEvent.unsubscribe();
      this.home.subscribedButtonColorEvent.unsubscribe();
      Network.removeAllListeners();
      //this.connectSubscription.unsubscribe();
      //this.disconnectSubscription.unsubscribe();
   }


   goEditAcrostics() {
      //this.nav.setRoot('Acrostics');
      console.log("goAcrostics called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('edit-acrostics');
      });
   }
   goAcrosticsTables() {
      console.log("goAcrosticsTables called.");
      this.helpers.rateMe(() => {
         //this.nav.push(ShowTablesPage);
      });
   }
   goEditAlphabet() {
      console.log("goAlphabet called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('edit-alphabet');
      });
   }
   goMajorSystem() {
      console.log("goMajorSystem called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('major-system');
      });
   }
   goEditNewWords() {
      console.log("goEditNewWords called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('edit-new-words');
      });
   }
   goCelebrityNumbers() {
      console.log("goCelebrityNumbers called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('celebrity-numbers');
      });
   }
   goEditDictionary() {
      console.log("goDictionary called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('edit-dictionary');
      });
   }
   goEditMnemonics() {
      console.log("goMnemonics called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('edit-mnemonics');
      });
   }
   goAnagramGenerator() {
      console.log("goAnagramGenerator called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('anagram-generator');
      });
   }
   goEditEvents() {
      console.log("goEvents called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('edit-events');
      });
   }
   goEditNumbers() {
      console.log("goNumbers called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('edit-numbers');
      });
   }
   goShowWorldMap() {
      console.log("goShowWorldMap called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('show-world-map');
      });
   }
   goMnemonicGenerator() {
      console.log("goMnemonicGenerator called.");
      this.helpers.rateMe(() => {
         //this.nav.push(MnemonicGeneratorPage);
      });
   }
   goShowMnemonics() {
      console.log("goShowMnemonics called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('show-mnemonics');
      });
   }
   goTimeline() {
      console.log("goTimeline called.");
      this.helpers.rateMe(() => {
         //this.nav.push(ShowTimelinePage);
      });
   }
   goShowDictionary() {
      console.log("goShowDictionary called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('show-dictionary');
      });
   }
   goShowNumbers() {
      console.log("goShowNumbers called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('show-numbers');
      });
   }
   goAlphabetAcrostics() {
      console.log("goAlphabetAcrostics called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('alphabet-acrostics');
      });
   }
   goTables() {
      console.log("goTables called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('edit-tables');
      });
   }
   goShowNewWords() {
      console.log("goShowNewWords called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('show-new-words');
      });
   }
   goHelp() {
      console.log("goHelp called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('help-menu');
      });
   }
   goSearch() {
      console.log("goSearch called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('search');
      });
   }
   goRequests() {
      console.log("goRequests called.");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('requests');
      });
   }

   goLogin() {
      console.log("goLogin called");
      this.helpers.rateMe(() => {
         //this.nav.push(LoginPage);
      });
   }
   goEditPeglist() {
      console.log("goEditPeglist called");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('edit-peglist');
      });
   }
   goEditCelebrityNumbers() {
      console.log("goEditCelebrityNumbers called");
      this.helpers.rateMe(() => {
         this.nav.navigateForward('edit-celebrity-numbers');
      });
   }



}

interface myObject {
   [key: string]: any;
}
