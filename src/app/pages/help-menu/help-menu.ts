import { Component } from '@angular/core';
import { NavController, NavParams } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Helpers } from '../../providers/helpers/helpers';
//import { SQLiteObject } from '@ionic-native/sqlite';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Component({
  selector: 'help-menu',
  templateUrl: 'help-menu.html',
})
export class HelpMenuPage {
  public pageName: string = "Help Menu";

  private helpMenu: any;

  menus: any;
  //@ViewChild('helpPageContent') helpPageContent:ElementRef;
  background_color: any;
  button_color: string = "";
  button_gradient: string = "";
  public database_misc: SQLiteDBConnection;
  user: any;

  constructor(public navCtrl: NavController, public helpers: Helpers, public storage: Storage) {
    this.database_misc = this.helpers.getDatabaseMisc();
  }

  async ngOnInit() {
    this.helpMenu = {};    
    Helpers.currentPageName = this.pageName;
    this.user = Helpers.User;
    await this.storage.create();
    this.menus = [
      { name: "GENERAL", isShow: false },
      {
        name: "EDIT", isShow: false,
        edits: [
          { name: "EDIT ACROSTICS", isShow: false },
          { name: "EDIT ALPHABET", isShow: false },
          { name: "EDIT DICTIONARY", isShow: false },
          { name: "EDIT EVENTS", isShow: false },
          { name: "EDIT MNEMONICS", isShow: false },
          { name: "EDIT NUMBERS", isShow: false },
          { name: "EDIT TABLES", isShow: false },
          { name: "EDIT NEWWORDS", isShow: false },
          { name: "EDIT PEGLIST", isShow: false },
          { name: "EDIT CELEBRITIES", isShow: false }
        ]
      },
      {
        name: "SHOW", isShow: false,
        shows: [
          { name: "ACROSTIC TABLES", isShow: false },
          { name: "SHOW NEWWORDS", isShow: false },
          { name: "SHOW MNEMONICS", isShow: false },
          { name: "SHOW NUMBERS", isShow: false },
          { name: "TIMELINE", isShow: false }
        ]
      },
      {
        name: "TOOLS", isShow: false,
        tools: [
          { name: "MAJOR SYSTEM", isShow: false },
          { name: "CELEBRITY NUMBERS", isShow: false },
          { name: "ANAGRAMS", isShow: false },
          { name: "MNEMONIC GENERATOR", isShow: false },
          { name: "DICTIONARY", isShow: false }
        ]
      }
    ];
    this.storage.get('BACKGROUND_COLOR').then((val) => {
      console.log('BACKGROUND_COLOR=' + val);
      if (val != null) {
        console.log("this.storage.get('BACKGROUND_COLOR') NOT NULL!=" + val);
        //this.helpPageContent.nativeElement.style.backgroundColor = val;
        this.background_color = val;
      } else {
        console.log("this.storage.get('BACKGROUND_COLOR') IS NULL");
      }
      this.helpMenu.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
        this.background_color = bgColor;
      });
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.helpMenu.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
        this.button_color = buttonColor.value;
        this.button_gradient = buttonColor.gradient;
      });
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HelpMenuPage');
    //var isTestAppPurchase:Boolean = true;
    if (Helpers.User.Username === "keif") {//keif is tester...
      var date_now = new Date();
      var date_installed = new Date(date_now.getTime() - (7 * 24 * 60 * 60 * 1000) - 50);
      var timestamp = this.helpers.getTimestamp(date_installed);
      var sql_string = "UPDATE " + Helpers.TABLES_MISC.userdata + " SET DATE_INSTALLED='" + timestamp + "', IS_PAID='0' WHERE User_ID='" + Helpers.User.ID + "'";
      this.helpers.query(this.database_misc, sql_string, 'execute', []).then((data) => {
        console.log("UPDATED " + Helpers.User.Username + " DATE_INSTALLED = " + timestamp);
      });
    }
  }

  ionViewWillLeave(){
    this.helpMenu.subscribedBackgroundColorEvent.unsubscribe();
    this.helpMenu.subscribedButtonColorEvent.unsubscribe();
  }

  expand(item:any) {
    item.isShow = !item.isShow;
  }

}
