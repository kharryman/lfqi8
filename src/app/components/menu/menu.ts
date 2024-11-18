import { AppComponent } from '../../app.component';
import { ApplicationRef, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Inject, Injectable, Output, ViewChild } from '@angular/core';
import { Helpers } from '../../providers/helpers/helpers';
import { Storage } from '@ionic/storage-angular';
import { AlertController, NavController, Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
//import { SQLiteObject } from '@ionic-native/sqlite';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { LoginPage } from '../../pages/login/login';
import { Network } from '@capacitor/network';


import { ClickOutsideDirective } from '../../directives/click-outside/click-outside';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: 'menu.html',
  styleUrl: 'menu.scss'
})

@Injectable()
export class MenuComponent {

  @ViewChild('menuHeader') menuHeader: ElementRef | undefined;

  @ViewChild('menuToolbar') menuToolbar: ElementRef | undefined;

  @HostListener('document:click', ['$event.target'])
  public onClick(targetElement:any) {
    //setTimeout(() => {
    let clickedHeader = (this.menuHeader && this.menuHeader.nativeElement && this.menuHeader.nativeElement.contains(targetElement));
    console.log("click DOM, clickedHeader = " + clickedHeader + ', this.isClickedBackground = ' + this.isClickedBackground + ", this.isClickedButton = " + this.isClickedButton + ", this.isClickedSync = " + this.isClickedSync);
    let clickedInside = (clickedHeader || (this.isClickedBackground === true || this.isClickedButton === true || this.isClickedSync === true));
    this.isClickedBackground = false;
    this.isClickedButton = false;
    this.isClickedSync = false;
    if (!clickedInside) {
      this.resetHome();
    }
    //}, 200);
  }


  @ViewChild('chRef') chRef: ChangeDetectorRef | undefined;
  public user: any;

  public menuObj: any;


  isChooseMenuOptions: any;
  isChooseSync: any;
  button_color: string = "";
  button_gradient: string = "";
  background_color: string = "";
  isChooseBackground: boolean = false;
  isChooseButton: boolean = false;
  isClickedBackground: boolean = false;
  isClickedButton: boolean = false;
  isClickedSync: boolean = false;

  database_tables: any;
  database_misc_tables: any;
  database_acrostics_tables: any;
  didClickRetryFillDatabase: any;
  databaseSize: any;
  public canWorkOffline: boolean = false;

  isWorkOffline: boolean = false;
  private databaseReady: BehaviorSubject<boolean> | null = null;

  public database_misc: SQLiteDBConnection | null = null;
  public database_acrostics: SQLiteDBConnection | null = null;
  which_db: any;
  table_sqls_array: any;
  countTables: number = 0;
  table_index: number = 0;
  table_count: number = 0;
  params: any;
  httpJson: any;

  connectSubscription: any;
  disconnectSubscription: any;

  isOnline: any;

  currentView: string = "";
  backRoute: string = "/home";
  //public app: App, 
  constructor(public nav: NavController, private router: Router, public platform: Platform, public helpers: Helpers, public storage: Storage, private alertCtrl: AlertController, public appRef: ApplicationRef) {
    console.log('Hello MenuComponent Component');

    this.menuObj = {};
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
    await this.storage.create();
    this.currentView = Helpers.currentPageName;    
    this.backRoute = this.currentView==="Home"? "/login":"/home";
    console.log("MenuComponent ngOnInit called, this.currentView = " + this.currentView + ", this.backRoute = " + this.backRoute);
    this.menuObj = {};
    this.menuObj.buttonColors = Helpers.button_colors;
    this.menuObj.backgroundColors = Helpers.background_colors;
    console.log("this.menuObj.buttonColors = " + JSON.stringify(this.menuObj.buttonColors));
    this.isChooseMenuOptions = false;
    this.countTables = 0;
    this.canWorkOffline = Helpers.canWorkOffline;
    this.databaseSize = Helpers.databaseSize;
    console.log("DATABASE SIZE = " + Helpers.databaseSize);
    this.isChooseSync = false;
    this.isChooseBackground = false;
    this.isChooseButton = false;

    //sync_operation: Timestamp, OP_Type_ID, Device_ID, User_ID
    this.menuObj.createSyncOpTableSQL = "CREATE TABLE IF NOT EXISTS sync_operation ";
    this.menuObj.createSyncOpTableSQL += "(ID integer PRIMARY KEY AUTOINCREMENT, ";
    this.menuObj.createSyncOpTableSQL += "Timestamp integer(20) NOT NULL DEFAULT (strftime('%s','now')), ";
    this.menuObj.createSyncOpTableSQL += "Op_Type_ID int(11) NOT NULL, ";
    this.menuObj.createSyncOpTableSQL += "Device_ID int(11) NULL, "
    this.menuObj.createSyncOpTableSQL += "User_ID int(11) NOT NULL, ";
    this.menuObj.createSyncOpTableSQL += "Image longblob NULL, ";
    this.menuObj.createSyncOpTableSQL += "FOREIGN KEY (User_ID) REFERENCES userdata(ID), ";
    this.menuObj.createSyncOpTableSQL += "FOREIGN KEY (OP_Type_ID) REFERENCES operation_types(ID));";

    //sync_table: IS_APP, DB_Type_ID, Table_name, Act_Type_ID, Cols, Vals, Wheres
    this.menuObj.createSyncTableSQL = "CREATE TABLE IF NOT EXISTS sync_table ";
    this.menuObj.createSyncTableSQL += "(ID integer PRIMARY KEY AUTOINCREMENT, ";
    this.menuObj.createSyncTableSQL += "Sync_Op_ID int(11) NOT NULL, ";
    this.menuObj.createSyncTableSQL += "IS_APP tinyint(1) NULL, ";
    this.menuObj.createSyncTableSQL += "DB_Type_ID int(1) NOT NULL, ";
    this.menuObj.createSyncTableSQL += "Table_name varchar(100) NOT NULL, ";
    this.menuObj.createSyncTableSQL += "Act_Type_ID int(11) NOT NULL, ";
    this.menuObj.createSyncTableSQL += "Cols varchar(2000) NULL, ";
    this.menuObj.createSyncTableSQL += "Vals text NULL, ";
    this.menuObj.createSyncTableSQL += "Wheres varchar(1100) NULL, ";
    this.menuObj.createSyncTableSQL += "FOREIGN KEY (Sync_Op_ID) REFERENCES sync_operation(ID), ";
    this.menuObj.createSyncTableSQL += "FOREIGN KEY (DB_Type_ID) REFERENCES db_types(ID), ";
    this.menuObj.createSyncTableSQL += "FOREIGN KEY (Act_Type_ID) REFERENCES operation_types(ID));";


    Network.addListener('networkStatusChange', (status) => {
      console.log('Network status changed:', status.connected ? 'Connected' : 'Disconnected');      
      setTimeout(() => {
        console.log('we got a Connection = ' + status.connectionType);        
        this.isOnline = status.connected? true: false;
        if (this.isOnline===false && Helpers.canWorkOffline === true) {
          this.isWorkOffline = true;
          Helpers.isWorkOffline = true;
        }
      }, 100);
    });    

    this.databaseReady = new BehaviorSubject(false);
    this.button_color = Helpers.button_color;
    this.button_gradient = Helpers.button_gradient;
    this.background_color = Helpers.background_color;


    this.storage.get("IS_WORK_OFFLINE").then((val:any) => {
      console.log("IS_WORK_OFFLINE = " + val);
      if (val != null) {
        this.isWorkOffline = val;
        Helpers.isWorkOffline = val;
      }
      this.storage.get("CAN_WORK_OFFLINE").then((val:any) => {
        console.log("STRORAGE CAN_WORK_OFFLINE = " + val);
        if (val != null) {
          Helpers.canWorkOffline = val;
        }
        //this.storage.get("TRIAL_PERIOD_DAYS").then((val) => {
        //   if (val != null) {
        //      Helpers.TRIAL_PERIOD_DAYS = val;
        //   }
        //this.storage.get("MIN_AD_CLICKS").then((val) => {
        //   if (val != null) {
        //      Helpers.MIN_AD_CLICKS = val;
        //   }
        //});
        //});
      });
    });
  }

  ngOnDestroy() {
    console.log('ngOnDestroy MenuComponent');
    Network.removeAllListeners();
    //this.connectSubscription.unsubscribe();
    //this.disconnectSubscription.unsubscribe();
  }

  clickMenu() {
    console.log("clickMenu  called, isChooseMenuOptions = " + this.isChooseMenuOptions);
    if (this.isChooseMenuOptions === true) {
      console.log("Closing choose Menus..");
      this.isChooseBackground = false;
      this.isChooseButton = false;
      this.isChooseSync = false;
      this.helpers.menuToolbarEvent.emit(false);
    } else {
      this.helpers.menuToolbarEvent.emit(true);
    }
    this.isChooseMenuOptions = !this.isChooseMenuOptions;
    console.log("clickMenu  end, isChooseMenuOptions = " + this.isChooseMenuOptions);
  }

  chooseSync() {
    console.log("chooseSync called.");
    this.isClickedSync = true;
    this.isChooseSync = true;
  }

  clearSyncTable() {
    console.log("clearSyncTable.");
    this.helpers.clearSyncTable();
  }
  chooseBackground() {
    console.log("chooseBackground called.");
    this.isClickedBackground = true;
    this.isChooseBackground = true;
  }

  chooseButton() {
    console.log("chooseButton called.");
    this.isClickedButton = true;
    this.isChooseButton = true;
  }

  changeBackgroundColor(item:any) {
    console.log("changeBackgroundColor called item=" + JSON.stringify(item));
    //this.homePageContent.nativeElement.style.backgroundColor = item.hex;
    this.storage.set("BACKGROUND_COLOR", item.hex).then(() => {
      Helpers.background_color = item.hex;
      this.background_color = item.hex;
      this.helpers.backgroundColorEvent.emit(item.hex);
      this.isChooseBackground = false;
    });
  }

  changeButtonColor(item:any) {
    console.log("changeButtonColor called item=" + JSON.stringify(item));
    //this.myShared.setButtonColor(this.buttonColor);
    //this.myStorage.set("button_color", item.value);
    this.storage.set("BUTTON_COLOR", JSON.stringify(item)).then(() => {
      //this.nav.push(HomePage);
      this.button_color = item.value;
      this.button_gradient = item.gradient;
      Helpers.button_color = item.value;
      Helpers.button_gradient = item.gradient;
      this.helpers.buttonColorEvent.emit(item);
      this.isChooseButton = false;
    });
    //this.sharedService.setButtonColor(item.value);
  }

  doSyncing() {
    console.log("doSyncing called");
    this.isClickedSync = true;
    this.helpers.syncFromTo(false).then(() => {
      this.isClickedSync = true;
      this.isChooseSync = false;
    });
  }

  resetHome() {
    console.log("MenuCompnent resetHome  called, this.isChooseMenuOptions = " + this.isChooseMenuOptions);
    if (this.isChooseMenuOptions === true) {
      this.isChooseMenuOptions = false;
      this.isChooseBackground = false;
      this.isChooseButton = false;
      this.isChooseSync = false;
      this.helpers.menuToolbarEvent.emit(false);
      this.appRef.tick();
    }
  }

  chooseFillDatabase(){
    this.helpers.confirmPopup("Download Database?", "Cancel", "OK", (res:boolean)=>{
        if(res){
            this.doFillDatabase();
        }
    });
  }

  //DOWNLOAD DATABASE FUNCTIONS:---------------------------------------------------------------------------->

  doFillDatabase() {
    this.helpers.setProgress("Creating database files on server ,please wait...", false, false).then(() => {
      this.fillDatabase().then(async (res) => {
        this.didClickRetryFillDatabase = false;
        if (res) {
          console.log("FILLED ALL THE DATABASE DUDE!!!!!!!!!!");
          this.helpers.setDatabaseMisc(this.database_misc);
          this.storage.set("CAN_WORK_OFFLINE", true).then((val:any) => {
            console.log("CAN_WORK_OFFLINE SET TO TRUE!!!");
            this.canWorkOffline = true;
            Helpers.canWorkOffline = true;
            //this.chRef.detectChanges();
            this.helpers.dismissProgress();
          });
        } else {
          this.helpers.dismissProgress();
          console.log("ERROR FILLING DATABASE!!!!!!!!!!");
          var isCancel = false;
          let alert = await this.alertCtrl.create({
            //title: "Alert",
            //subTitle: "<b>Database not filled. Please check your connection or...<br />Clear LFQ cache or storage<br />And try again.</b>",
            buttons: [
              {
                text: 'Cancel',
                cssClass: 'cancelButton',
                handler: () => {
                  console.log('Database download failed, Cancel clicked');
                  isCancel = true;
                  return true;
                }
              },
              {
                text: 'Retry',
                cssClass: 'confirmButton',
                handler: () => {
                  console.log('Database download failed, Retry button clicked');
                  return true;
                }
              }
            ]
          });
          await alert.present();
          alert.onDidDismiss().then((res:any) => {
            console.log("Database download failed, alert dismissed, res = " + res);
            if (isCancel===false) {
              this.storage.get('CAN_WORK_OFFLINE').then((val:any) => {
                if (val == null || val === false) {
                  this.doFillDatabase();
                }
              });
            }
          });          
        }
      });
    });
  }//END doFillDatabase

  fillDatabase(): Promise<any> {
    return new Promise((resolve, reject) => {
      //ldb.set("current_db", "misc.db");
      this.helpers.deleteDB("misc.db").then(() => {
        this.helpers.deleteDB("acrostics.db").then(() => {
          //if (this.helpers.isApp()) {
          this.fetchDatabases((res:any) => {
            this.databaseReady?.next(true);
            if (res) {
              console.log("FILLED THE ENTIRE DATABASE DUDE!!!!");
            } else {
              console.log("ERROR FILLING THE DATABASE!!!!");
            }
            resolve(res);
          });
        });
      });
    });
  }

  fetchDatabases(callback:Function) {
    var url = "/lfq_app_php/synchronize_from_lfq_database_ionic_stats.php";
    try {
      this.params = {};
      this.helpers.makeHttpRequest(url, "POST", this.params).then((json) => {
        //console.log("BACK FROM makeHttpRequest, json=" + JSON.stringify(json));
        if (json == null) {
          callback(false);
          return;
        }
        this.which_db = "acrostics";
        this.helpers.setProgress("Loading database " + this.which_db + "<br />Server tables created, next downloading and importing...", true, false).then(() => {
          this.httpJson = json;
          //{"DATABASES":[{"TABLES":[[]],"DATABASE_NAME":"psy6ms3b_acrostics"},{"TABLES":[[]],"DATABASE_NAME":"psy6ms3b_misc"}]}
          this.database_misc_tables = [];
          this.database_acrostics_tables = [];
          var table_obj: any = {};
          console.log("this.httpJson[DATABASES].length=" + this.httpJson["DATABASES"].length);
          var db_misc_name = Helpers.db_prefix + "misc";
          var db_acrostics_name = Helpers.db_prefix + "acrostics";
          console.log("db_misc_name=" + db_misc_name + ", db_acrostics_name=" + db_acrostics_name);
          for (var i = 0; i < this.httpJson["DATABASES"].length; i++) {
            console.log(this.httpJson["DATABASES"][i]["DATABASE_NAME"] + " tables length=" + this.httpJson["DATABASES"][i]["TABLES"][0].length);
            for (var j = 0; j < this.httpJson["DATABASES"][i]["TABLES"][0].length; j++) {
              table_obj = {};
              table_obj.Size = this.httpJson["DATABASES"][i]["TABLES"][0][j]["SIZE"];
              table_obj.Name = this.httpJson["DATABASES"][i]["TABLES"][0][j]["TABLE_NAME"];
              if (this.httpJson["DATABASES"][i]["DATABASE_NAME"] === db_misc_name) {
                this.database_misc_tables.push(table_obj);
              }
              if (this.httpJson["DATABASES"][i]["DATABASE_NAME"] === db_acrostics_name) {
                this.database_acrostics_tables.push(table_obj);
              }
            }
          }
          //var d = new Date();
          //MYSQL TIMESTAMP = 2019-06-12 16:58:00
          //var timestamp = d.getFullYear() + "-" + ("00" + (d.getMonth() + 1)).slice(-2) + "-" + ("00" + d.getDate()).slice(-2) + " ";
          //timestamp += ("00" + d.getHours()).slice(-2) + ":" + ("00" + d.getMinutes()).slice(-2) + ":" + ("00" + d.getSeconds()).slice(-2);

          //ADD SYNC TABLE:-----------------
          //table_obj = {};
          //table_obj.Size = 0;
          //table_obj.Name = "lfq_app_tables";
          //this.database_misc_tables.push(table_obj);
          //-------------------------------------------------------
          //console.log("this.database_tables=" + JSON.stringify(this.database_tables));
          console.log("SET TIME_SYNCED=" + this.httpJson["TIME_SYNCED_FROM"]);
          this.storage.set("TIME_SYNCED", this.httpJson["TIME_SYNCED_FROM"]).then(() => {
            this.table_index = 0;
            this.database_tables = this.database_acrostics_tables;
            console.log("this.database_tables.length=" + this.database_tables.length);
            this.helpers.createDatabase('acrostics.db').then((acrostics_db) => {
              this.database_acrostics = acrostics_db;
              this.importTable(this.table_index, callback);
            });
          });
        });
      }, (error:any)=>{
        callback(false);
        return;
      });
    } catch (e) {
      console.log("doDatabase ERROR=" + JSON.stringify(e));
    }
  }

  importTable(table_index:any, callback:Function) {
    console.log("importTable called, table_index=" + table_index + ", this.database_tables.length=" + this.database_tables.length);
    if (table_index < this.database_tables.length) {
      this.countTables++;
      var table = this.database_tables[table_index].Name;
      console.log(table_index + ") table=" + table);
      var text = "";
      var url = "/lfq_app_php/get_sql_file.php";
      this.helpers.setProgress("Loading database<br />Loading table " + table + "...", true, false).then(() => {
        var params = { "TABLE": table };
        this.helpers.makeHttpRequest(url, "POST", params).then((res) => {
          var sql = res.SQL;
          console.log("GOT BACK " + url + "!!!!!!");
          this.helpers.setProgress("Loading database " + this.which_db + "<br />Downloaded table " + table + ". Importing", true, false).then(() => {
            if (this.which_db === "acrostics") {
              this.helpers.importSql(this.database_acrostics, sql).then((res) => {
                //this.database_acrostics.sqlBatch(statements).then((data)=>{
                //this.sqlitePorter.importSqlToDb(this.database_acrostics, sql).then(data => {
                if (res === true) {
                  this.helpers.setProgress("Loading database " + this.which_db + "<br />Imported table " + table + ".", true, false).then(() => {
                    table_index++;
                    this.importTable(table_index, callback);
                  });
                } else {
                  callback(false);
                }
              }).catch(e => console.log("LFQ ACROSTICS DB ERROR:" + JSON.stringify(e)));
            }
            if (this.which_db === "misc") {
              this.helpers.importSql(this.database_misc, sql).then((res) => {
                //this.sqlitePorter.importSqlToDb(this.database_misc, sql).then(data => {
                if (res === true) {
                  this.helpers.setProgress("Loading database " + this.which_db + "<br />Imported table " + table + ".", true, false).then(() => {
                    table_index++;
                    this.importTable(table_index, callback);
                  });
                } else {
                  callback(false);
                }
              }).catch(e => console.log("LFQ ACROSTICS DB ERROR:" + JSON.stringify(e)));
            }
          });
        }, (error) => {
          callback(false);
        });
      });
    } else {
      console.log("IMPORTING " + this.which_db + " DONE.");
      if (this.which_db === "acrostics") {
        this.which_db = "misc";
        this.helpers.setDatabaseAcrostics(this.database_acrostics);
        this.database_tables = this.database_misc_tables;
        this.helpers.createDatabase('misc.db').then((db_misc) => {
          this.database_misc = db_misc;
          this.helpers.setDatabaseMisc(this.database_misc);
          //this.importTable(this.table_index, callback);
          this.table_index = 0;
          this.helpers.setProgress("Loading database " + this.which_db + "<br />Next downloading and importing...", true, false).then(() => {
            this.importTable(this.table_index, callback);
            //}).catch(e => console.log("CREATE SYNC TABLE ERROR:" + e));
          });
        });
      } else {
        console.log("IMPORTING " + this.which_db + " DONE. NEXT CALLING callback....::: ");
        this.helpers.query(this.database_misc, this.menuObj.createSyncTableSQL, []).then((data) => {
          this.helpers.query(this.database_misc, this.menuObj.createSyncOpTableSQL, []).then((data) => {
            this.helpers.enableForeignKeys().then(() => {
              callback(true);
            }, (error) => {
              console.log("ERROR SETTING PRAGMA KEYS ON: " + JSON.stringify(error));
              this.menuObj.loginStatus = "ERROR SETTING PRAGMA KEYS ON: " + JSON.stringify(error);
              callback(true);
            });
          }, error => {
            console.log("sql:" + this.menuObj.createSyncOpTableSQL + ", ERROR:" + error.message);
            this.menuObj.loginStatus = "Sorry. Create sync operation table error."
            callback(false);
          });
        }, error => {
          console.log("sql:" + this.menuObj.createSyncTableSQL + ", ERROR:" + error.message);
          this.menuObj.loginStatus = "Sorry. Create sync table error."
          callback(false);
        });
      }
    }
  }//END importTable

  setWorkOffline(isWorkOffline:any) {
    console.log("setWorkOffline called");
    this.isWorkOffline = isWorkOffline;
    Helpers.isWorkOffline = isWorkOffline;
    console.log("Helpers.isWorkOffline = " + Helpers.isWorkOffline);
    this.storage.set("IS_WORK_OFFLINE", Helpers.isWorkOffline);
    if (isWorkOffline === true) {
      this.helpers.offlineEvent.emit();
    } else {
      this.helpers.onlineEvent.emit();
    }
  }

  /*
  buyApp() {
     console.log("buyApp called");
     if (this.helpers.isApp()) {
        this.helpers.purchase();
     } else {
        this.helpers.saveProductOwnedLfq();
     }
  }
  */


  logout() {
    console.log("logout called.");
    this.helpers.logout().then(() => {
      console.log("Going to login...");
      this.nav.navigateRoot('login');
    });
  }

  logoutAndGoogle() {
    console.log("logoutAndGoogle called.");
    this.helpers.logoutAndGoogle().then(() => {
      this.nav.navigateRoot('login');
    });
  }

}

interface myObject {
  [key: string]: any;
}

