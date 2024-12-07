//operation_type : ID, Op varchar(50)
//operations : ID, Op_Type_ID
//  INSERT REQUEST: 1) INSERT INTO OPERATION AS op (Op_Type_ID) SELECT ID FROM operation_type WHERE Op='' RETURNING op.ID ID
//  2) INSERT INTO REQUEST ... opID...

//Jan 22 Ayla BD
//Jan 31 Emma BD
//July 16th Darcy BD


//declare var Forge: any;
//CALL THE SHOTS TRACKING NUMBER: 964910314
import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { Platform, LoadingController, AlertController, IonApp, NavController, ToastController, IonicSafeString } from '@ionic/angular';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
//import { SQLiteObject } from '@ionic-native/sqlite';
import { CapacitorSQLite, capSQLiteResult, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { defineCustomElements as jeepSqliteElements } from 'jeep-sqlite/loader';
import { Storage } from '@ionic/storage-angular';
import { NgZone } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
//import { SQLitePorter } from '@ionic-native/sqlite-porter';
//import { AppRate } from '@ionic-native/app-rate';
import { LoginPage } from '../../pages/login/login';
//import { AdMob } from '@admob-plus/ionic';
//import { IAPProduct, InAppPurchase2 } from '@ionic-native/in-app-purchase-2';
//import { FCM } from '@ionic-native/fcm';
//import { Forge } from 'node-forge';
import * as forge from 'node-forge';
import * as CryptoJS from 'crypto-js';
import { Capacitor } from '@capacitor/core';
//import { GooglePlus } from '@ionic-native/google-plus';
//import { HomePage } from '../../pages/home/home';
//import { LaunchReview } from '@ionic-native/launch-review';
//import { File } from '@ionic-native/file';
import { SQLiteService } from '../../services/sqlite.service';

export class SyncQuery {
   public IS_APP: Boolean | null;
   public Op_Type_ID: number | undefined;
   public Op_ID: number | undefined;
   public User_ID_Old: number | null;
   public DB_Type_ID: DB_Type_ID;
   public Table_name: string;
   public Act_Type_ID: Op_Type_ID;
   public Cols: Array<string>;
   public Vals: Array<any>;
   public Wheres: any;
   public User_Action: number | null;
   //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
   constructor(IS_APP: Boolean | null, User_ID_Old: number | null, DB_Type_ID: DB_Type_ID, Table_name: string, Act_Type_ID: Op_Type_ID, Cols: Array<string>, Vals: Array<any>, Wheres: any, User_Action?: number | null) {
      this.IS_APP = IS_APP;
      this.User_ID_Old = User_ID_Old;
      this.DB_Type_ID = DB_Type_ID;
      this.Table_name = Table_name;
      this.Act_Type_ID = Act_Type_ID;
      this.Cols = Cols;
      this.Vals = Vals;
      this.Wheres = Wheres;
      this.User_Action = User_Action != null ? User_Action : null;// CAN BE: null, 1(update user_id), 2(update_where_user_id)
   }
}

export class SyncOperation {
   //OP_Type_ID, Timestamp, Device_ID, User_ID
   public Op_Type_ID: number;
   public Timestamp: number;
   public Device_ID: number;
   public User_ID: number;
   public SYNCS: Array<SyncQuery> = [];
   public Image: Blob | null;
   //SyncOperation(Op_Type_ID,Timestamp,Device_ID,User_ID)
   constructor(Op_Type_ID: number, Timestamp: number, Device_ID: number, User_ID: number, Image: Blob | null) {
      this.Op_Type_ID = Op_Type_ID;
      this.Timestamp = Timestamp;
      this.Device_ID = Device_ID;
      this.User_ID = User_ID;
      this.Image = Image;
   }
}

export class OperationSync {
   //(Op_Type_ID, Timestamp, Device_ID, User_ID, User_ID_Old, Names, Entry_Old, Entry
   public Op_Type_ID: number;
   public Timestamp: number;
   public Device_ID: number;
   public User_ID: number;
   public User_ID_Old: number | null;
   public Names: object;
   public Entry_Old: object;
   public Entry: object;
   public REQUESTS: Array<SyncQuery> = [];
   public Image_Old: Blob | null;
   public Image: Blob | null;
   //OperationSync(Op_Type_ID,Timestamp,Device_ID,User_ID,User_ID_Old,Names,Entry_Old,Entry)
   constructor(Op_Type_ID: number, Timestamp: number, Device_ID: number, User_ID: number, User_ID_Old: number | null, Names: object, Entry_Old: object, Entry: object, Image_Old: Blob | null, Image: Blob | null) {
      this.Op_Type_ID = Op_Type_ID;
      this.Timestamp = Timestamp;
      this.Device_ID = Device_ID;
      this.User_ID = User_ID;
      this.User_ID_Old = User_ID_Old;
      this.Names = Names;
      this.Entry_Old = Entry_Old;
      this.Entry = Entry;
      this.Image_Old = Image_Old;
      this.Image = Image;
   }
}

export enum User_Action_Request {
   USER_ID_UPDATE = 1,
   USER_ID_INSERT = 2,
}


export enum MnemonicEntry {
   ID,
   User_ID,
   Mnemonic_Type_ID,
   Mnemonic_Category_ID,
   Is_Linebreak,
   Title,
   Number,
   Number_Power,
   Mnemonic_ID,
   Entry_Index,
   Entry,
   Entry_Mnemonic,
   Entry_Info,
   Category,
   Mnemonic_Type,
   Username
}

export enum DB_Type_ID {
   DB_ACROSTICS = 1,
   DB_MISC = 2
}

export enum Mnemonic_Type_ID {
   anagram = 1,
   mnemonic = 2,
   number_major = 3,
   peglist = 4,
   number_letters = 5
}

export enum Op_Type_ID {
   NO_ACTION = 1,
   INSERT = 2,
   INSERT_SELECT = 3,
   REPLACE = 4,
   UPDATE = 5,
   UPDATE_IN = 6,
   DELETE = 7,
   DELETE_IN = 8,
   CREATE = 9,
   RENAME_TABLE = 10,
   ALTER_TABLE = 11,
   DROP = 12,
   CREATE_INDEX = 13,
   DROP_INDEX = 14,
   CHANGE_COLUMN = 15,
   ADD_COLUMN = 16,
   DROP_COLUMN = 17,
   RENAME_COLUMN = 18,
   CREATE_TRIGGERS = 19,
   DROP_TRIGGERS = 20,
   ADVANCED_SQLS = 21,
   CREATE_USER = 22,
   RENAME_MNEMONIC_TABLE = 23,
   RENAME_MNEMONIC_TITLE = 24,
   RENAME_MNEMONIC_TABLE_AND_TITLE = 25,
   DELETE_INNER_JOIN = 26,
   DROP_COLUMNS = 27,
   ADD_COLUMNS = 28,
   INSERT_TYPES = 29,
   UPDATE_IMAGE = 30,
   INSERT_UPDATE = 31,
   UPDATE_NUMBERS = 32,
   GET_ID_INSERT_MANY = 33
};

export enum Op_Type {
   NO_ACTION = "NO_ACTION",
   INSERT = "ACTION_INSERT",
   INSERT_SELECT = "ACTION_INSERT_SELECT",
   REPLACE = "ACTION_REPLACE",
   UPDATE = "ACTION_UPDATE",
   UPDATE_IN = "ACTION_UPDATE_IN",
   DELETE = "ACTION_DELETE",
   DELETE_IN = "ACTION_DELETE_IN",
   CREATE = "ACTION_CREATE",
   RENAME_TABLE = "ACTION_RENAME_TABLE",
   ALTER_TABLE = "ACTION_ALTER_TABLE",
   DROP = "ACTION_DROP",
   CREATE_INDEX = "ACTION_CREATE_INDEX",
   DROP_INDEX = "ACTION_DROP_INDEX",
   CHANGE_COLUMN = "ACTION_CHANGE_COLUMN",
   ADD_COLUMN = "ACTION_ADD_COLUMN",
   DROP_COLUMN = "ACTION_DROP_COLUMN",
   RENAME_COLUMN = "ACTION_RENAME_COLUMN",
   CREATE_TRIGGERS = "ACTION_CREATE_TRIGGERS",
   DROP_TRIGGERS = "ACTION_DROP_TRIGGERS",
   ADVANCED_SQLS = "ACTION_ADVANCED_SQLS",
   CREATE_USER = "CREATE_USER",
   RENAME_MNEMONIC_TABLE = "RENAME_MNEMONIC_TABLE",
   RENAME_MNEMONIC_TITLE = "RENAME_MNEMONIC_TITLE",
   RENAME_MNEMONIC_TABLE_AND_TITLE = "RENAME_MNEMONIC_TABLE_AND_TITLE",
   DELETE_INNER_JOIN = "DELETE_INNER_JOIN",
   DROP_COLUMNS = "DROP_COLUMNS",
   ADD_COLUMNS = "ADD_COLUMNS",
   INSERT_TYPES = "INSERT_TYPES",
   UPDATE_IMAGE = "UPDATE_IMAGE",
   INSERT_UPDATE = "INSERT_UPDATE",
   UPDATE_NUMBERS = "UPDATE_NUMBERS",
   GET_ID_INSERT_MANY = "GET_ID_INSERT_MANY"
};

@Injectable()
export class Helpers {
   @Output() public onlineEvent = new EventEmitter<boolean>();
   @Output() public offlineEvent = new EventEmitter<boolean>();
   @Output() public backgroundColorEvent = new EventEmitter<string>();
   @Output() public buttonColorEvent = new EventEmitter<string>();
   @Output() public menuToolbarEvent = new EventEmitter<boolean>();

   public static currentPageName: string = "Login";

   public static IS_SHOWING_AD: boolean = false;
   public static IS_AD_STOPPED: boolean = false;

   public static IS_DO_HTTP_REQUEST: boolean = false;
   public static IS_DO_QUERY: boolean = false;

   public static databaseSize: String = "";
   private ENCRYPTION_KEY: string = "";
   public static LOGIN_METHOD: string | null = null;
   public static TRIAL_PERIOD_DAYS: number = 30;
   public static MIN_AD_CLICKS: number = 5;
   public static ADS_TO_CLICK: number = 5;
   public static isDebug: boolean = false;
   //public static AdMob: any;
   //public static adMobId: any = {};
   public static isShowAds: boolean = false;
   public static IS_CLICKED_ADS: boolean = false;
   //public static isInAppPurchase: boolean = true;
   public static isProductVerified = false;
   public static canWorkOffline: boolean = false;
   public static isWorkOffline: boolean = false;
   public static isForceSyncOnline: boolean = false;
   public static isAppPaid: boolean = false;
   public static AppPrice: any = "$4.99";
   //public static isUserAllowedUsedApp: boolean = true;
   public static googleProductId: String = "learn_facts_quick_app_1";
   //public static googleProductId: String = "learn_facts_quick_app_trial_1";
   public static appleProductId: String = "";
   public static inAppPurchaseProgramID: number = 0;
   public static isLfqHttp = true;
   public static sqlite: SQLiteConnection | null = null;
   public static database: SQLiteDBConnection | null;
   public static database_misc: SQLiteDBConnection;
   public static database_acrostics: SQLiteDBConnection;
   private static results: String;
   public static logged_in: boolean = false;
   public static User: any = { Username: "GUEST", ID: 1 };
   private static myPassword: String = "";
   public static db_prefix: String | null = "psy6ms3b_";
   private static is_dbprefix_set: boolean = false;
   public static isBrowserLfqDB = true;
   public static device: any = { "Device_Number": "" };
   //public static deviceID: String = "";
   private json_from_response: any;
   private json_to_response: any;
   //private storage;
   private progressLoader: HTMLIonLoadingElement | null = null;
   public static incompleteAcrosticMessage = "Please enter complete acrostic.<br />The number of upper case letters must equal to the number of letters of the word.<br />Only the beginning of words can have capitals in order of the word's letters.<br /> For example:<br />'barista'=><br />Boy ARound Inside STArbucks";
   public static isAppInitiated: Boolean = false;
   private ign_lets: String = "aeiouwxy";
   private dbl_lets: String = "cgpst";
   private statements: any;
   private currentDB: any;
   win: any = window;


   //AUTO SYNC CONSTANTS:
   public static DB_ACROSTICS: string = "acrostics";
   public static DB_MISC: string = "misc";
   public static rateMeRuns = 0;
   public static isAppRated = false;

   public static TABLES_MISC = {
      acrostic_table: "acrostic_table",
      ad_click: "ad_click",
      alphabet: "alphabet",
      alphabet_table: "alphabet_table",
      celebrity_number: "celebrity_number",
      dictionarya: "dictionarya",
      download_table_sql: "download_table_sql",
      event_table: "event_table",
      global_number: "global_number",
      global_number_entry: "global_number_entry",
      location: "location",
      map_city: "map_city",
      map_country: "map_country",
      map_place: "map_place",
      map_state: "map_state",
      mnemonic: "mnemonic",
      mnemonic_category: "mnemonic_category",
      mnemonic_combination: "mnemonic_combination",
      mnemonic_entry: "mnemonic_entry",
      mnemonic_type: "mnemonic_type",
      data_type: "data_type",
      operation: "operation",
      part_speech: "part_speech",
      peglist: "peglist",
      request: "request",
      sync_device_table: "sync_device_table",
      sync_operation: "sync_operation",
      sync_table: "sync_table",
      user_event: "user_event",
      user_new_word: "user_new_word",
      user_new_word_mnemonic: "user_new_word_mnemonic",
      user_number: "user_number",
      user_number_entry: "user_number_entry",
      user_review_time: "user_review_time",
      userdata: "userdata"
   };

   public static background_colors = [
      { color: 'Cyan', hex: "#dafdfd" },
      { color: 'Green', hex: "#e4f7e4" },
      { color: 'Gray', hex: "#f3f3f3" },
      { color: 'Magenta', hex: "#f6d7f6" },
      { color: 'Red', hex: "#f8dfdf" },
      { color: 'White', hex: "#FFFFFF" },
      { color: 'Yellow', hex: "#ffffcc" },
   ];
   public static button_colors = [
      { color: 'BLUE', value: "#aaaaff", gradient: "#eeeeef" },
      { color: 'GOLD', value: "#fffc55", gradient: "#fffecc" },
      { color: 'GREEN', value: "#55d555", gradient: "#aafaaa" },
      { color: 'LIGHT GRAY', value: "#d3d3d3", gradient: "#f8f8f8" },
      { color: 'ORANGE', value: "#fac86b", gradient: "#fffdbf" },
      { color: 'PINK', value: "#fff5ff", gradient: "#fffaff" },
      { color: 'RED', value: "#ffaaaa", gradient: "#ffeeee" },
      { color: 'VIOLET', value: "#ffdbff", gradient: "#ffedff" },
   ];

   //APP BACKGROUND/BUTTON COLOR: INITIALIZE TO GREEN, MY FAVORITE COLOR!:
   public static background_color = "#e4f7e4";
   public static button_color = "#55d555";
   public static button_gradient = "#aafaaa";

   private syncToResults: any;
   private syncFromResults: any;
   public static isInitAppPush: boolean = false;
   private imageFilenames: any;

   public static abcs = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
   public static celebrities: any = [];

   //private fcm: FCM
   //public store: InAppPurchase2
   //private nativeHttp: any;//HTTP
   //private googlePlus: GooglePlus
   //private adMob: AdMob
   //public sqlitePorter: SQLitePorter
   //private appRate: AppRate
   //public app: IonApp, 
   constructor(public nativeHttp: HTTP, public alertCtrl: AlertController, private sanitizer: DomSanitizer, public progress: LoadingController, public http: HttpClient, public storage: Storage, public platform: Platform, public ngZone: NgZone, private toastCtrl: ToastController, private sqliteService: SQLiteService) {
      console.log('Hello Helpers Constructor!');
      //this.fileTransfer = this.transfer.create();
      //this.setDatabases();
      // watch network for a connection
      //CALCULATE 
   }


   alertNotOnline() {
      console.log("alertNotOnline called");
      let alert = this.alertCtrl.create({
         //title: "ALERT",
         //subTitle: "<b>NOT ONLINE.</b>",
         buttons: ['Dismiss']
      });
      //alert.present();
   }

   alertNotOnlineGoHome() {
      console.log("alertNotOnlineGoHome called");
      //IonApp.getActiveNav().pop();
      this.alertNotOnline();
   }

   public async setDatabaseAcrostics() {
      console.log("setDatabaseAcrostics called");
      if (Helpers.database_acrostics == null) {
         Helpers.database = await this.createDatabase('acrostics.db');
         if (Helpers.database != null) {
            console.log("Helpers.setDatabaseAcrostics Helpers.database_acrostics NOT NULL, SETTING!");
            Helpers.database_acrostics = Helpers.database;
         }
      }
   }

   public getDatabaseAcrostics(): SQLiteDBConnection {
      return Helpers.database_acrostics;
   }

   public async setDatabaseMisc() {
      console.log("setDatabaseMisc called");
      if (Helpers.database_misc == null) {
         Helpers.database = await this.createDatabase('misc.db');
         if (Helpers.database != null) {
            console.log("Helpers.setDatabaseMisc Helpers.database_misc NOT NULL, SETTING!");
            Helpers.database_misc = Helpers.database;
         }
      }
   }

   public getDatabaseMisc(): SQLiteDBConnection {
      return Helpers.database_misc;
   }

   public logout(): Promise<void> {
      console.log("Helpers.logout called");
      return new Promise(async (resolve, reject) => {
         var progressLoader: HTMLIonLoadingElement = await this.progress.create({ message: "Logging out ,please wait..." });
         progressLoader.present().then(() => {
            Helpers.logged_in = false;
            Helpers.User = null;
            this.storage.set("IS_LOGGED_IN", false);
            this.storage.set("USERNAME", null);
            progressLoader.dismiss();
            resolve();
         });
      });
   }

   logoutAndGoogle(): Promise<void> {
      console.log("Helpers.logoutAndGoogle called");
      var self = this;
      return new Promise(async (resolve, reject) => {
         var progressLoader = await self.progress.create({ message: "Logging out of LFQ and Google ,please wait..." });
         progressLoader.present().then(() => {
            Helpers.logged_in = false;
            Helpers.User = null;
            this.storage.set("IS_LOGGED_IN", false);
            this.storage.set("USERNAME", null);
            //self.googlePlus.logout().then(() => {
            /*self.googlePlus.disconnect().then((googleLogoutRes:any) => {
               console.log("logoutAndGoogle googleLogoutRes = " + JSON.stringify(googleLogoutRes));
               progressLoader.dismiss();
               resolve();
            }, (error:any) => {
               console.log("logoutAndGoogle googleLogoutRes ERROR: " + JSON.stringify(error));
               progressLoader.dismiss();
               resolve();
            });
            */
            //});
         });
      });
   }

   public static getLoginStatus(): Boolean {
      return Helpers.logged_in;
   }

   public static setLoginStatus(isLoggedIn: any): void {
      Helpers.logged_in = isLoggedIn;
   }


   public static setDBPrefix() {
      var url = "https://www.learnfactsquick.com/lfq_app_php/set_db_prefix.php";
      //JSONObject json = Synchronize.makeHttpRequest(url, "POST", params);
      var json = null;
      if (json != null) {
         try {
            Helpers.db_prefix = null;//json.getString("DB_PREFIX");
         } catch (e: any) {
            e.printStackTrace();
         }
      }
   }

   public static isConnected() {
   }

   //onlineDoSyncTo(queries, opTypeId, userIdOld, names, entryOld, entry, imageOld, imageNew)
   public onlineDoSyncTo(queries: Array<SyncQuery>, opTypeId: number, userIdOld: number | null, names: object, entryOld: object, entry: object, imageOld: Blob | null, imageNew: Blob | null): Promise<any> {
      console.log("onlineDoSyncTo called, opTypeId=" + opTypeId + ", imageOld NULL? = " + (imageOld == null) + ", imageNew NULL? = " + (imageNew == null));
      return new Promise((resolve, reject) => {
         this.setProgress("Syncing to: Getting sync table entries, please wait...", false).then(() => {
            if (!navigator.onLine) {
               this.dismissProgress();
               resolve(false);
            } else {
               // PASS SYNC TO QUERIES:          
               if (!imageOld) imageOld = null;
               if (!imageNew) imageNew = null;
               //MAKE imageNewOld NULL For Update User ID request=>
               if (imageNew && (opTypeId !== Op_Type_ID.UPDATE_IMAGE || (queries && queries[0] && queries[0].Act_Type_ID !== Op_Type_ID.UPDATE_IMAGE))) {
                  imageNew = null;
               }
               var params: any = {};
               params.TIME_SYNCED = this.getCurrentTimestamp();
               params.USER_ID = Helpers.User.ID;
               params.Count_To_Sync_Queries = 0;
               params.Count_To_Request_Queries = 0;
               var timestamp = this.getCurrentTimestamp();
               if (this.isApp() === true) {
                  params.DEVICE_ID = Helpers.device.Device_Number;
                  console.log('Device UUID is: ' + Helpers.device.Device_Number);
               } else {
                  params.DEVICE_ID = "358583050470700";//SAMSUNG S4 GALAXY
               }
               var is_request = this.isRequest(userIdOld, Helpers.User.ID);
               if (is_request === false) {
                  params.Count_To_Sync_Queries = queries.length;
                  //sync_operation: Timestamp, OP_Type_ID, Device_ID, User_ID
                  var params_sync: Array<SyncOperation> = [new SyncOperation(
                     opTypeId, timestamp, Helpers.device.ID, Helpers.User.ID, imageNew
                  )];
                  for (var q = 0; q < queries.length; q++) {
                     params_sync[0].SYNCS.push(this.parseSyncQuery(queries[q]));
                  }
                  params.params_sync = params_sync;
               } else {
                  params.Count_To_Request_Queries = queries.length;
                  var params_request: Array<OperationSync> = [
                     new OperationSync(
                        opTypeId, timestamp, Helpers.device.ID, Helpers.User.ID, userIdOld, names, entryOld, entry, imageOld, imageNew
                     )
                  ];
                  for (var q = 0; q < queries.length; q++) {
                     params_request[0].REQUESTS.push(this.parseSyncQuery(queries[q]));
                  }
                  params.params_request = params_request;
               }
               console.log("SYNC TO PARAMS = " + JSON.stringify(params));
               //if (params.params_sync.length > 0 || params.params_request.length > 0) {
               var url = "/lfq_app_php/synchronize_to_ionic.php";
               //this.syncUploadImages(0, () => {
               this.setProgress("Syncing to: Posting sync entries to LFQ, please wait...", true).then(() => {
                  this.makeHttpRequest(url, "POST", params).then((res) => {
                     var json_to_response = res;
                     console.log("synchronize_to_ionic.php response = " + JSON.stringify(res));
                     var results = json_to_response["SUCCESS"] === true ? (is_request === true ? "Requested." : "Saved.") : json_to_response["ERROR"];
                     var response = { "isSuccess": json_to_response["SUCCESS"], "results": results };
                     if (json_to_response == null) {
                        console.log("this.json_to_response IS NULL.");
                        response["isSuccess"] = false;
                        response["results"] = "SERVER NOT RESPONDING.";
                        this.dismissProgress();
                        resolve(response);
                     } else {
                        resolve(response);
                     }
                  });
               });
            }
         });
      });
   }

   //@method: autoSync: OFFLINE METHOD!!!!!!!!!!------------->Bypasses using sync table, to synchronize with LFQ:   
   //return: Object: {isSuccess, error, result}
   //var queries = [{"DB":,"Table_name":,"Act_Type_ID":,"Cols":,"Vals":,"Wheres":,"Names":,"User_ID_Old":,"Entry":,"Entry_Old":}];
   //addSyncEntries($cols,$vals,$dbs,$actions,$tables,$wheres,$names,$entries, $entriesOld,$statuses, $device,$userId,$userIdOld,$dateCreated)   
   //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
   //addSyncEntries( $sqs, $opTypeID, $device, $userId, $userIdOld, $names, $entryOld, $entry, $status, $image )
   //autoSync(queries,opTypeId,userIdOld,names,entryOld,entry,imageOld,imageNew)
   public autoSync(queries: Array<SyncQuery>, opTypeId: number, userIdOld: number | null, names: any, entryOld: any, entry: any, imageOld?: Blob | null, imageNew?: Blob | null): Promise<any> {
      if (!imageOld) { imageOld = null };
      if (!imageNew) { imageNew = null };
      return new Promise((resolve, reject) => {
         if (Helpers.isWorkOffline === false) {
            console.log("Calling onlineDoSyncTo, imageOld NULL? = " + (imageOld == null) + ", imageNew NULL? = " + (imageNew == null));
            //onlineDoSyncTo(queries, opTypeId, userIdOld, names, entryOld, entry, imageOld, imageNew)
            this.onlineDoSyncTo(queries, opTypeId, userIdOld, names, entryOld, entry, imageOld, imageNew).then((res) => {
               resolve(res);
            });
         } else {
            console.log("AUTOSYNC TEST BEGINNING PROMISE queries.length=" + queries.length + ", queries=" + JSON.stringify(queries));
            var is_request = false;
            //ADD UPDATE USER ID REQUEST QUERIES TO SYNC QUEIRIES TO BE EXECUTED ALL TOGETHER:
            var syncs: any = [];
            var requests: any = [];
            var appQueries: Array<SyncQuery> = [];
            is_request = this.isRequest(userIdOld, Helpers.User.ID);//userIdOld != null && parseInt(Helpers.User.ID) !== parseInt(String(userIdOld));
            for (var i = 0; i < queries.length; i++) {
               //REQUEST ONLY IF OLD USER ID SET AND NOT EQUAL TO OLD USER ID:============>
               console.log("queries[i].User_ID_Old = " + queries[i].User_ID_Old + ", Helpers.User.ID=" + Helpers.User.ID);
               console.log("AUTOSYNC is_request=" + is_request);
               if (is_request === false) {
                  syncs.push(queries[i]);
                  if (queries[i].IS_APP == null || queries[i].IS_APP === true) {
                     appQueries.push(queries[i]);
                  }
               } else {
                  requests.push(queries[i]);
               }
            }
            console.log("autoSync appQueries.length = " + appQueries.length + ", appQueries = " + JSON.stringify(appQueries));
            //return;
            //EXECUTE QUERIES INTO DEVICE

            this.doAutoSyncQueries(0, appQueries, imageNew, { "isSuccess": true, "Error": "" }, (results: any) => {
               var isSuccess = results.isSuccess === true;
               if (isSuccess === false) {
                  resolve({ "isSuccess": false, "results": results.Error });
               } else {//INSERT QUEIRIES IN SYNC, REQUEST TABLE(TO SYNC LATER...):
                  var text = "";
                  this.setProgress("Clearing out old updated, please wait...", true).then(() => {
                     //DELETES OLD FROM sync_table, or requests table:
                     this.deleteOldSyncRequests(0, opTypeId, queries, { "isSuccess": true, "Error": "" }, (results: any) => {
                        //DO OFFLINE =>
                        var response = { isSuccess: true, results: "" };
                        this.insertAutoSyncEntries(syncs, opTypeId, imageNew, { isSuccess: true, text: "" }).then((results: any) => {
                           if (results.isSuccess === false) response.isSuccess = false;
                           text += results.text;
                           this.insertAutoRequestEntries(requests, opTypeId, userIdOld, names, entryOld, entry, imageOld, imageNew, { isSuccess: true, text: "" }).then((results: any) => {
                              if (results.isSuccess === false) response.isSuccess = false;;
                              text += results.text;
                              response.results = text;
                              resolve(response);
                           });
                        });
                     });
                  });
               }
            });
         }
      });
   }

   public insertAutoSyncEntries(syncs: Array<SyncQuery>, opTypeId: number, imageNew: Blob | null, response: any): Promise<any> {
      console.log("insertAutoSyncEntries called");
      var self = this;
      return new Promise((resolve, reject) => {
         if (syncs.length === 0) {
            response.text = "";
            resolve(response);
         } else {
            var cols = "";
            var sync_sql = "";
            var timestamp = this.getCurrentTimestamp();
            //insertProgress = "Inserting into sync table for syncing later, please wait...";
            //sync_operation: Timestamp, OP_Type_ID, Device_ID, User_ID
            var params = [
               timestamp, opTypeId, Helpers.device.ID, Helpers.User.ID
            ]
            if (imageNew != null) {
               sync_sql = "INSERT INTO " + Helpers.TABLES_MISC.sync_operation + "(Timestamp, Op_Type_ID, Device_ID, User_ID, Image) VALUES (?, ?, ?, ?, ?)";
               params.push(imageNew);
            } else {
               sync_sql = "INSERT INTO " + Helpers.TABLES_MISC.sync_operation + "(Timestamp, Op_Type_ID, Device_ID, User_ID) VALUES (?, ?, ?, ?)";
            }
            console.log("INSERT SYNC OP SQL = " + sync_sql + ", param = " + JSON.stringify(params));
            //sync_table: IS_APP, DB_Type_ID, Table_name, Act_Type_ID, Cols, Vals, Wheres
            self.query(Helpers.database_misc, sync_sql, 'execute', params).then((success) => {
               self.query(Helpers.database_misc, "SELECT MAX(ID) AS ID FROM " + Helpers.TABLES_MISC.sync_operation, 'query', []).then((success) => {
                  var syncOpID = null;
                  if (success.rows.length > 0) {
                     console.log("GOT syncOpID = " + success.rows.item(0).ID);
                     syncOpID = success.rows.item(0).ID;
                  }
                  var sync: any, is_app: string | null, valsPlaces: any = [], valsAll: any = [], values: any = [];
                  //sync_table: IS_APP, DB_Type_ID, Table_name, Act_Type_ID, Cols, Vals, Wheres
                  cols = "IS_APP, Sync_Op_ID, DB_Type_ID, Table_name, Act_Type_ID, Cols, Vals, Wheres";
                  sync_sql = "INSERT INTO " + Helpers.TABLES_MISC.sync_table + "(" + cols + ") VALUES ";
                  for (var s = 0; s < syncs.length; s++) {
                     sync = syncs[s];
                     //is_app = sync.IS_APP == null ? "NULL" : (sync.IS_APP === true ? "1" : "0");
                     is_app = sync.IS_APP == null ? null : (sync.IS_APP === true ? "1" : "0");
                     values = [
                        is_app, syncOpID, sync.DB_Type_ID, sync.Table_name, sync.Act_Type_ID, JSON.stringify(sync.Cols), JSON.stringify(sync.Vals), JSON.stringify(sync.Wheres)
                     ];
                     valsPlaces.push("(" + "?".repeat(values.length).split("").join(",") + ")");
                     valsAll = valsAll.concat(values);
                  }
                  sync_sql += valsPlaces.join(",");
                  console.log("INSERT sync_table sql = " + sync_sql + ", valsAll = " + JSON.stringify(valsAll));
                  self.query(Helpers.database_misc, sync_sql, 'execute', valsAll).then((success) => {
                     response.text = "Saved.";
                     resolve(response);
                  }, error => {
                     response.isSuccess = false;
                     console.log("Insert into sync_table error: " + error.message)
                     response.text += "Not Saved: " + error.message;
                     resolve(response);
                  });
               }, error => {
                  response.isSuccess = false;
                  console.log("Get max sync op ID error: " + error.message)
                  response.text += "Not Saved: " + error.message;
                  resolve(response);
               });
            }, error => {
               response.isSuccess = false;
               console.log("Insert sync operation error: " + error.message)
               response.text += "Not Saved: " + error.message;
               resolve(response);
            });
         }
      });
   }

   public insertAutoRequestEntries(requests: Array<SyncQuery>, opTypeID: number, userIdOld: number | null, names: object, entryOld: object, entry: object, imageOld: Blob | null, imageNew: Blob | null, response: any): Promise<any> {
      console.log("insertAutoRequestEntries called");
      var self = this;
      return new Promise((resolve, reject) => {
         if (requests.length === 0) {
            response.text = "";
            resolve(response);
         } else {
            var cols = "";
            var sync_sql = "";
            var timestamp = this.getCurrentTimestamp();
            var namesString = names != null ? JSON.stringify(names) : null;
            var entryOldString = entryOld != null ? JSON.stringify(entryOld) : null;
            var entryString = entry != null ? JSON.stringify(entry) : null;
            var params = [
               opTypeID, timestamp, Helpers.device.ID, Helpers.User.ID, userIdOld, namesString, entryOldString, entryString
            ];
            if (imageOld != null || imageNew != null) {
               sync_sql = "INSERT INTO " + Helpers.TABLES_MISC.operation + "(Op_Type_ID, Timestamp, Device_ID, User_ID, User_ID_Old, Names, Entry_Old, Entry, Image_Old, Image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
               params.push(imageOld);
               params.push(imageNew);
            } else {
               sync_sql = "INSERT INTO " + Helpers.TABLES_MISC.operation + "(Op_Type_ID, Timestamp, Device_ID, User_ID, User_ID_Old, Names, Entry_Old, Entry) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            }
            self.query(Helpers.database_misc, sync_sql, 'execute', params).then((success) => {
               self.query(Helpers.database_misc, "SELECT MAX(ID) AS ID FROM " + Helpers.TABLES_MISC.operation, 'query', []).then((success) => {
                  var opID = -1;
                  if (success.rows.length > 0) {
                     console.log("GOT opID1 = " + success.rows.item(0).ID);
                     opID = success.rows.item(0).ID;
                  }
                  var rq: any, is_app: string | null, valsPlaces: any = [], valsAll: any = [], values: any = [];
                  //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                  //requests: ID, IS_APP, Op_ID, DB_Type_ID, Table_name, Act_Type_ID, Cols, Vals, Wheres, User_Action
                  cols = "IS_APP, Op_ID, DB_Type_ID, Table_name, Act_Type_ID, Cols, Vals, Wheres, User_Action";
                  sync_sql = "INSERT INTO " + Helpers.TABLES_MISC.request + "(" + cols + ") VALUES ";
                  var cols = null, vals = null, wheres = null;
                  for (var r = 0; r < requests.length; r++) {
                     rq = requests[r];
                     is_app = rq.IS_APP == null ? null : (rq.IS_APP === true ? "1" : "0");
                     cols = rq.Cols != null ? JSON.stringify(rq.Cols) : null;
                     vals = rq.Vals != null ? JSON.stringify(rq.Vals) : null;
                     wheres = rq.Wheres != null ? JSON.stringify(rq.Wheres) : null;
                     values = [
                        is_app, opID, rq.DB_Type_ID, rq.Table_name, rq.Act_Type_ID, cols, vals, wheres, rq.User_Action
                     ];
                     valsPlaces.push("(" + "?".repeat(values.length).split("").join(",") + ")");
                     valsAll = valsAll.concat(values);
                  }
                  sync_sql += valsPlaces.join(",");
                  console.log("valsAll = " + JSON.stringify(valsAll));
                  self.query(Helpers.database_misc, sync_sql, 'execute', valsAll).then((success) => {
                     response.text = "Requested.";
                     resolve(response);
                  }, error => {
                     response.isSuccess = false;
                     console.log("Error Insert into requests table: " + error.message);
                     response.text += "Not Requested: " + error.message;
                     resolve(response);
                  });
               }, error => {
                  response.isSuccess = false;
                  console.log("Error get max operations ID: " + error.message);
                  response.text += "Not Requested: " + error.message;
                  resolve(response);
               });
            }, error => {
               response.isSuccess = false;
               console.log("Error Insert into operations table: " + error.message);
               response.text += "Not Requested: " + error.message;
               resolve(response);
            });
         }
      });
   }

   public deleteOldSyncRequests(queryIndex: number, OpTypeID: number, queries: Array<SyncQuery>, results: any, callback: any) {
      if (queryIndex < queries.length) {
         var is_request = this.isRequest(queries[queryIndex].User_ID_Old, Helpers.User.ID);//queries[queryIndex].User_ID_Old != null && parseInt(Helpers.User.ID) !== parseInt(String(queries[queryIndex].User_ID_Old));
         var batchQueries = [];
         var cols = this.isJSON(queries[queryIndex].Cols) ? queries[queryIndex].Cols : JSON.stringify(queries[queryIndex].Cols);
         var vals = this.isJSON(queries[queryIndex].Vals) ? queries[queryIndex].Vals : JSON.stringify(queries[queryIndex].Vals);
         var wheres = this.isJSON(queries[queryIndex].Wheres) ? queries[queryIndex].Wheres : JSON.stringify(queries[queryIndex].Wheres);
         if (is_request === true) {
            //DELETE operations:
            var batchQuery1: any = {};
            batchQuery1["SQL"] = "DELETE FROM " + Helpers.TABLES_MISC.operation + " WHERE Op_Type_ID=? AND ID IN (SELECT Op_ID FROM " + Helpers.TABLES_MISC.request + " Where DB_Type_ID=? AND Table_name=? AND Act_Type_ID=? AND Cols=? AND Vals=? AND Wheres=?)";
            batchQuery1["params"] = [OpTypeID, queries[queryIndex].DB_Type_ID, queries[queryIndex].Table_name, queries[queryIndex].Act_Type_ID, cols, vals, wheres];
            batchQueries.push(batchQuery1);
            //DELETE requests:
            var batchQuery2: any = {};
            batchQuery2["SQL"] = "DELETE FROM " + Helpers.TABLES_MISC.request + " Where DB_Type_ID=? AND Table_name=? AND Act_Type_ID=? AND Cols=? AND Vals=? AND Wheres=?";
            batchQuery2["params"] = [queries[queryIndex].DB_Type_ID, queries[queryIndex].Table_name, queries[queryIndex].Act_Type_ID, cols, vals, wheres];
            batchQueries.push(batchQuery2);
         } else {
            batchQuery1 = {};
            batchQuery1["SQL"] = "DELETE FROM " + Helpers.TABLES_MISC.sync_operation + " WHERE Op_Type_ID=? AND ID IN ("
            batchQuery1["SQL"] += "SELECT Sync_OP_ID FROM " + Helpers.TABLES_MISC.sync_table + " WHERE DB_Type_ID=? AND Table_name=? AND Act_Type_ID=? AND Cols=? AND Vals=? AND Wheres=?";
            batchQuery1["SQL"] += ")"
            batchQuery1["params"] = [OpTypeID, queries[queryIndex].DB_Type_ID, queries[queryIndex].Table_name, queries[queryIndex].Act_Type_ID, cols, vals, wheres];
            batchQueries.push(batchQuery1);
            batchQuery2 = {};
            batchQuery2["SQL"] = "DELETE FROM " + Helpers.TABLES_MISC.sync_table + " Where DB_Type_ID=? AND Table_name=? AND Act_Type_ID=? AND Cols=? AND Vals=? AND Wheres=?";
            batchQuery2["params"] = [queries[queryIndex].DB_Type_ID, queries[queryIndex].Table_name, queries[queryIndex].Act_Type_ID, cols, vals, wheres];
            batchQueries.push(batchQuery2);
         }
         //console.log("deleteOldSyncRequests DIFFERENT! batchQueries.length = " + batchQueries.length + " batchQueries = " + JSON.stringify(batchQueries));
         this.mySqlBatch(Helpers.database_misc, batchQueries, (success: any) => {
            this.deleteOldSyncRequests(++queryIndex, OpTypeID, queries, results, callback);
         }, (error: { message: any; }) => {
            results.isSuccess = false;
            results.Error += error.message;
            this.deleteOldSyncRequests(++queryIndex, OpTypeID, queries, results, callback);
         });
      } else {
         callback();
      }
   }

   public doAutoSyncQueries(queryIndex: number, appQueries: Array<SyncQuery>, image: Blob | null, response: any, callback: any) {
      var self = this;
      if (queryIndex < appQueries.length) {
         if (appQueries[queryIndex].Act_Type_ID === Op_Type_ID.UPDATE_IMAGE && image != null) {
            var sql_str = "UPDATE " + appQueries[0].Table_name + " SET Image=? WHERE Name=?";
            var params = [image, appQueries[0].Wheres["Name"]];
            this.query(Helpers.database_acrostics, sql_str, 'execute', params).then((data) => {
               callback(response);
            }, error => {
               response.isSuccess = false;
               response.Error += error.message + ". ";
               callback(response);
            });
         } else {
            var appQuery = this.getQueriesFromVals(appQueries[queryIndex]);
            console.log("doAutoSyncQueries called, doing SQL = " + appQuery.SQL + " appQuery.params = " + JSON.stringify(appQuery.params));
            var myDB = parseInt(appQuery.DB_Type_ID) === DB_Type_ID.DB_ACROSTICS ? Helpers.database_acrostics : Helpers.database_misc;
            this.query(myDB, appQuery.SQL, 'execute', appQuery.params).then((data) => {
               if (appQueries[queryIndex].Act_Type_ID === Op_Type_ID.INSERT_TYPES) {
                  this.query(myDB, "SELECT ID FROM " + appQueries[queryIndex].Table_name + " ORDER BY ID DESC LIMIT 1", 'query', []).then((data) => {
                     if (data.values.length > 0) {
                        var LAST_INSERT_ID = data.values[0].ID;
                        console.log("GOT LAST_INSERT_ID = " + LAST_INSERT_ID);
                        //COPY LAST_INSERT_ID INTO FIRST VALUE OF NEXT INSERT ENTRIES QUERY:
                        for (var v = 0; v < appQueries[queryIndex + 1].Vals.length; v++) {
                           appQueries[queryIndex + 1].Vals[v][0] = LAST_INSERT_ID;
                        }
                     }
                     this.doAutoSyncQueries(++queryIndex, appQueries, image, response, callback);
                  });
               }
               else if (appQueries[queryIndex].Act_Type_ID === Op_Type_ID.GET_ID_INSERT_MANY) {
                  if (data.values.length > 0) {
                     var INSERT_ID = data.values[0].ID;
                     console.log("GOT INSERT_ID = " + INSERT_ID);
                     //COPY LAST_INSERT_ID INTO FIRST VALUE OF NEXT INSERT ENTRIES QUERY:
                     for (var v = 0; v < appQueries[queryIndex + 1].Vals.length; v++) {
                        //SET FIRST ELEMENT OF EACH ARRAY TO THE INSERT_ID:
                        appQueries[queryIndex + 1].Vals[v][0] = INSERT_ID;
                     }
                  }
                  this.doAutoSyncQueries(++queryIndex, appQueries, image, response, callback);
               }
               else {
                  this.doAutoSyncQueries(++queryIndex, appQueries, image, response, callback);
               }
            }, (error) => {
               response.isSuccess = false;
               response.Error += error.message + ". ";
               this.doAutoSyncQueries(++queryIndex, appQueries, image, response, callback);
            });
         }
      } else {
         callback(response);
      }
   }

   public syncFromTo(isDoingProgress: boolean): Promise<void> {
      console.log("syncFromTo called");
      var self = this;
      return new Promise((resolve, reject) => {
         self.syncToResults = "";
         self.syncFromResults = "";
         self.doSyncFrom(isDoingProgress).then((res) => {
            console.log("doSyncFrom DONE");
            self.doSyncTo(true).then(async (res) => {
               console.log("doSyncTo DONE");
               let alert = await this.alertCtrl.create({
                  header: "Sync Results:",
                  message: this.syncFromResults + "<br />" + this.syncToResults,
                  buttons: ['Dismiss']
               });
               alert.present();
               resolve();
            });
         });
      });
   }

   public doSyncTo(isDoingProgress: boolean): Promise<Boolean> {
      //autoSync(queries: Array<SyncQuery>, opTypeId, userIdOld, names, entryOld, entry, image): Promise<any> {
      //addSyncEntries( $sqs, $opTypeID, $device_id, $userId, $userIdOld, $names, $entryOld, $entry, $status, $image )
      console.log("doSyncTo called");
      return new Promise((resolve, reject) => {
         this.setProgress("Syncing to: Getting sync table entries, please wait...", isDoingProgress).then(() => {
            if (!navigator.onLine) {
               this.syncToResults = "NOT CONNECTED. UPDATES NOT SYNCED.";
               console.log(this.syncToResults);
               this.dismissProgress();
               resolve(false);
            } else {
               this.storage.get("TIME_SYNCED").then((time_synced) => {
                  // PASS SYNC TO QUERIES:          
                  var params: any = {};
                  params.TIME_SYNCED = time_synced;
                  params.USER_ID = Helpers.User.ID;
                  if (this.isApp() === true) {
                     console.log('Device UUID is: ' + Helpers.device.Device_Number);
                     params.DEVICE_ID = Helpers.device.Device_Number;
                  } else {
                     params.DEVICE_ID = "358583050470700";//SAMSUNG S4 GALAXY
                  }
                  params.params_sync = [];
                  var sql = "SELECT so.* FROM " + Helpers.TABLES_MISC.sync_operation + " AS so ";
                  sql += "INNER JOIN " + Helpers.TABLES_MISC.sync_device_table + " AS sdt ON sdt.ID=so.Device_ID ";
                  sql += "WHERE sdt.Device_Number=? AND so.Timestamp>? GROUP BY so.ID";
                  var syncOpParams = [Helpers.device.Device_Number, time_synced];
                  console.log("GET SYNC OPERATIONS SQL = " + sql + ", syncOpParams = " + JSON.stringify(syncOpParams));
                  this.query(Helpers.database_misc, sql, 'query', syncOpParams).then((data) => {
                     console.log("SYNC TO SYNC OPERATIONS LENGTH=" + data.values.length);
                     params.Count_To_Sync_Queries = data.values.length;
                     console.log("SYNC TO QUERIES LENGTH=" + params.Count_To_Sync_Queries);
                     var syncGroups: any = [], syncOpIDs: any = [];
                     for (var i = 0; i < data.values.length; i++) {
                        syncGroups.push(this.parseSyncQuery(data.values[i]));
                        syncGroups[i]["SYNCS"] = [];
                        syncOpIDs.push(syncGroups[i].ID);
                     }
                     var sql = "SELECT * FROM " + Helpers.TABLES_MISC.sync_table + " WHERE Sync_Op_ID IN (" + syncOpIDs.join(", ") + ")";
                     console.log("GET sync_table SQL = " + sql);
                     this.query(Helpers.database_misc, sql, 'query', []).then((data) => {
                        // PASS SYNC TO QUERIES:          
                        console.log("SYNC TO SYNC TABLE LENGTH=" + data.values.length);
                        var syncs = [];
                        for (var i = 0; i < data.values.length; i++) {
                           //console.log("LFQ_SQL=" + data.values[i].LFQ_SQL);
                           syncs.push(this.parseSyncQuery(data.values[i]));
                        }
                        for (var g = 0; g < syncGroups.length; g++) {
                           syncGroups[g].SYNCS = syncs.filter((so: any) => {
                              return so.Sync_Op_ID === syncGroups[g].ID;
                           });
                        }
                        //params_request ARE REQUESTS GROUPED BY Op_ID !!!!:
                        params.params_sync = syncGroups;


                        //SYNCING REQUESTS==================================================================================>:
                        this.setProgress("Syncing to: Getting request table entries, please wait...", true).then(() => {
                           //NEED TO SYNC TO ONLY operations INSERT FROM THIS APP!:===============>
                           //SO..., GET ALL OPERATIONS AFTER LAST SYNC TIME WITH sync_device_table Device_Number = THIS DEVICE ID:
                           var sql = "SELECT o.* FROM " + Helpers.TABLES_MISC.operation + " AS o ";
                           sql += "INNER JOIN " + Helpers.TABLES_MISC.sync_device_table + " AS sdt ON sdt.ID=o.Device_ID ";
                           sql += "WHERE sdt.Device_Number='" + Helpers.device.Device_Number + "' AND o.Timestamp>'" + time_synced + "' GROUP BY o.ID";
                           this.query(Helpers.database_misc, sql, 'query', []).then((data) => {
                              console.log("SYNC TO OPERATIONS LENGTH=" + data.values.length);
                              params.Count_To_Request_Queries = data.values.length;
                              var requestGroups: any = [], opIDs: any = [];
                              for (var i = 0; i < data.values.length; i++) {
                                 requestGroups.push(this.parseSyncQuery(data.values[i]));
                                 requestGroups[i]["REQUESTS"] = [];
                                 opIDs.push(requestGroups[i].ID);
                              }
                              var sql = "SELECT * FROM " + Helpers.TABLES_MISC.request + " WHERE Op_ID IN (" + opIDs.join(", ") + ")";
                              console.log("GET requests SQL = " + sql);
                              this.query(Helpers.database_misc, sql, 'query', []).then((data) => {
                                 // PASS SYNC TO QUERIES:          
                                 console.log("SYNC TO REQUESTS LENGTH=" + data.values.length);
                                 var requests = [];
                                 for (var i = 0; i < data.values.length; i++) {
                                    //console.log("LFQ_SQL=" + data.values[i].LFQ_SQL);
                                    requests.push(this.parseSyncQuery(data.values[i]));
                                 }
                                 for (var g = 0; g < requestGroups.length; g++) {
                                    requestGroups[g].REQUESTS = requests.filter((rq) => {
                                       return rq.Op_ID === requestGroups[g].ID;
                                    });
                                 }
                                 //params_request ARE REQUESTS GROUPED BY Op_ID !!!!:
                                 params.params_request = requestGroups;
                                 console.log("SYNC TO PARAMS = " + JSON.stringify(params));
                                 //if (params.params_sync.length > 0 || params.params_request.length > 0) {
                                 var url = "/lfq_app_php/synchronize_to_ionic.php";
                                 //this.syncUploadImages(0, () => {
                                 this.setProgress("Syncing to: Posting sync entries to LFQ, please wait...", true).then(() => {
                                    this.makeHttpRequest(url, "POST", params).then((res) => {
                                       this.json_to_response = res;
                                       if (this.json_to_response == null) {
                                          this.syncToResults = "SERVER NOT RESPONDING.";
                                          console.log("this.json_to_response IS NULL." + this.syncToResults);
                                          this.dismissProgress();
                                          resolve(false);
                                       } else {
                                          console.log("this.json_to_response=" + JSON.stringify(this.json_to_response));
                                          //console.log("data.valuesF.length=" + data.values.length);
                                          this.setProgress("Syncing to: Posting sync and request entries to LFQ, please wait...", true).then(() => {
                                             sql = "DELETE FROM " + Helpers.TABLES_MISC.sync_operation;
                                             this.query(Helpers.database_misc, sql, 'execute', []).then(() => {
                                                sql = "DELETE FROM " + Helpers.TABLES_MISC.sync_table;
                                                this.query(Helpers.database_misc, sql, 'execute', []).then(() => {
                                                   //FOR SYNCING:                                 
                                                   this.syncToResults = "Sync To: " + this.json_to_response["COUNT_SUCCESS_SYNC"] + " of " + this.json_to_response["to_results_sync"].length + " Done:<br />";
                                                   var tables = [], names = "", wheres = [];
                                                   var j = 0;
                                                   for (var i = 0; i < this.json_to_response["to_results_sync"].length; i++) {
                                                      j = i + 1;
                                                      wheres = params.params_sync[i]["SYNCS"].map((sc: any) => { return this.jsonToStringPlain(sc.Wheres) }).filter((wh: any) => { return wh !== '' });
                                                      tables = params.params_sync[i]["SYNCS"].map((sc: any) => { return sc.Table_name }).filter(this.onlyUnique);
                                                      this.syncToResults += j + ")" + this.json_to_response["to_results_sync"][i]["to_result"] + ": " + Op_Type_ID[params.params_sync[i].Op_Type_ID] + " on table(s): " + tables.join(", ") + ", where: " + wheres.join("<br /") + "<br />";
                                                   }
                                                   this.syncToResults += "<br />";
                                                   //FOR REQUESTING:
                                                   this.syncToResults += "Requests To: " + this.json_to_response["COUNT_SUCCESS_REQUEST"] + " of " + this.json_to_response["to_results_request"].length + " Done:<br />";

                                                   for (var i = 0; i < this.json_to_response["to_results_request"].length; i++) {
                                                      j = i + 1;
                                                      names = this.jsonToStringPlain(params.params_request[i]["Names"]);
                                                      tables = params.params_request[i]["REQUESTS"].map((rq: any) => { return rq.Table_name }).filter(this.onlyUnique);
                                                      this.syncToResults += j + ")" + this.json_to_response["to_results_request"][i]["to_result"] + ": " + Op_Type_ID[params.params_request[i].Op_Type_ID] + " on table(s): " + tables.join(", ") + ", name(s): " + names + "<br />";//DB, Action, Table_name
                                                   }
                                                   this.syncToResults += "<br />";
                                                   this.storage.set("TIME_SYNCED", this.json_to_response["TIME_SYNCED"]).then(() => {
                                                      console.log("SET TIME_SYNCED=" + this.json_to_response["TIME_SYNCED"]);
                                                      this.dismissProgress();
                                                      resolve(true);
                                                   });
                                                }, error => {
                                                   console.log("DELETE sync_table, sql:" + sql + ", ERROR:" + error.message);
                                                   this.dismissProgress();
                                                   resolve(false);
                                                });
                                             }, error => {
                                                console.log("DELETE sync_operation, sql:" + sql + ", ERROR:" + error.message);
                                                this.dismissProgress();
                                                resolve(false);
                                             });
                                          });
                                       }
                                    }, (error) => {
                                       this.dismissProgress();
                                       this.syncFromResults = "Sync To server error: " + error.message;
                                       resolve(false);
                                    });
                                    //});
                                 });
                                 //} else {//NO SQLS TO SYNC TO/REQUEST FROM APP sync_table, SO JUST resolve:
                                 //   this.dismissProgress();
                                 //   resolve(true);
                                 //}
                              }, (error) => {
                                 console.log("sql:" + sql + ", ERROR GETTING REQUESTS:" + error.message);
                                 this.dismissProgress();
                                 resolve(false);
                              });
                           }).catch((error) => {
                              console.log("sql:" + sql + ", ERROR GETTING OPERATIONS:" + error.message);
                              this.dismissProgress();
                              resolve(false);
                           });
                        });
                     }, (error) => {
                        console.log("sql:" + sql + ", ERROR GETTING SYNC TABLE ENTRIES:" + error.message);
                        this.dismissProgress();
                        resolve(false);
                     });
                  }, (error) => {
                     console.log("sql:" + sql + ", ERROR GETTING SYNC OPERATION ENTRIES:" + error.message);
                     this.dismissProgress();
                     resolve(false);
                  });
               });//END GET SYNC TIME FROM STORAGE
            }//END IF ONLINE
         });//END PROGRESS SYNC
      });//END PROMISE.
   }

   /*
   private syncUploadImages(imageIndex, callback) {
      console.log("syncUploadImages called");
      if (imageIndex < this.imageFilenames.length) {
         let options: FileUploadOptions = {
            fileKey: 'acrostic_image',
            fileName: this.imageFilenames[imageIndex].name,
            headers: {}
         }
         this.fileTransfer.upload(this.imageFilenames[imageIndex].uri, 'https://www.learnfactsquick.com/images_saved/' + this.imageFilenames[imageIndex].table, options)
            .then((data) => {
               console.log("IMAGE UPLOAD " + this.imageFilenames[imageIndex].name + " SUCCESS.");
               imageIndex++;
               this.syncUploadImages(imageIndex, callback);
            }, (err) => {
               console.log("IMAGE UPLOAD " + this.imageFilenames[imageIndex].name + " ERROR=" + JSON.stringify(err));
               imageIndex++;
               this.syncUploadImages(imageIndex, callback);
            })
      } else {
         callback();
      }
   }
   */

   public doSyncFrom(isDoingProgress: any): Promise<Boolean> {
      console.log("doSyncFrom called");
      return new Promise((resolve, reject) => {
         try {
            var params: myObject = {};
            this.storage.get("TIME_SYNCED").then((time_synced: any) => {
               console.log("doSyncFrom TIME_SYNCED=" + time_synced);
               params["TIME_SYNCED"] = time_synced;
               params["USER_ID"] = Helpers.User.ID;
               if (this.isApp() === true) {
                  console.log('Device UUID is: ' + Helpers.device.Device_Number);
                  params["DEVICE_ID"] = Helpers.device.Device_Number;
               } else {
                  params["DEVICE_ID"] = "358583050470700";//SAMSUNG S4 GALAXY
               }
               var url = "/lfq_app_php/synchronize_from_ionic.php";
               this.setProgress("Syncing from: Getting sync entries from LFQ, please wait...", isDoingProgress).then(() => {
                  this.makeHttpRequest(url, "POST", params).then((res) => {
                     this.json_from_response = res;
                     if (this.json_from_response == null) {
                        this.syncFromResults += "Sync From Error: SERVER NOT RESPONDING.";
                        this.dismissProgress();
                        resolve(false);
                     } else {
                        console.log("doSyncFrom this.json_from_response=" + JSON.stringify(this.json_from_response));
                        this.setProgress("Syncing from: Inserting sync entries into app, please wait...", true).then(() => {
                           var countSuccess = 0, results = "";
                           var params_syncs = this.json_from_response["params_syncs"];
                           var requestGroups = this.json_from_response["params_operations"];
                           this.insertSyncFromSqls(0, params_syncs, countSuccess, results, (res: any) => {
                              console.log("insertSyncFromSqls resolved");
                              this.syncFromResults += "Sync From Updates: " + res.countSuccess + " of " + this.json_from_response["params_syncs"].length + " Done:<br />" + res.results;
                              countSuccess = 0, results = "";
                              this.doDeleteOldRequests(0, requestGroups, () => {
                                 this.insertSyncFromRequests(0, requestGroups, countSuccess, results, (res: any) => {
                                    this.dismissProgress();
                                    this.syncFromResults += "Sync From Requests: " + res.countSuccess + " of " + this.json_from_response["params_operations"].length + " Done:<br />" + res.results;
                                    resolve(true);
                                 });
                              });
                           });
                        });
                     }
                  }, (error) => {
                     this.dismissProgress();
                     this.syncFromResults = "Sync From server error: " + error.message;
                     resolve(false);
                  });
               });
            });
         } catch (e: any) {
            this.dismissProgress();
            e.printStackTrace();
            resolve(false);
         }
      });
   }


   doDeleteOldRequests(groupIndex: any, rqGroups: any, callback: any) {
      if (groupIndex < rqGroups.length) {
         this.deleteOldRequests(0, rqGroups[groupIndex], () => {
            groupIndex++;
            this.doDeleteOldRequests(groupIndex, rqGroups, callback);
         });
      } else {
         callback();
      }
   }
   deleteOldRequests(index: any, rqGroup: any, callback: any) {
      if (index < rqGroup.REQUESTS.length) {
         var batchQueries = [];
         var requests: Array<SyncQuery> = rqGroup.REQUESTS;
         var cols = this.isJSON(requests[index].Cols) ? requests[index].Cols : JSON.stringify(requests[index].Cols);
         var vals = this.isJSON(requests[index].Vals) ? requests[index].Vals : JSON.stringify(requests[index].Vals);
         var wheres = this.isJSON(requests[index].Wheres) ? requests[index].Wheres : JSON.stringify(requests[index].Wheres);
         //DELETE operations:
         var batchQuery1: any = {};
         batchQuery1["SQL"] = "DELETE FROM " + Helpers.TABLES_MISC.operation + " WHERE Op_Type_ID=? AND ID IN (SELECT Op_ID FROM " + Helpers.TABLES_MISC.request + " Where DB_Type_ID=? AND Table_name=? AND Act_Type_ID=? AND Cols=? AND Vals=? AND Wheres=?)";
         batchQuery1["params"] = [rqGroup.OpTypeID, requests[index].DB_Type_ID, requests[index].Table_name, requests[index].Act_Type_ID, cols, vals, wheres];
         batchQueries.push(batchQuery1);
         //DELETE requests:
         var batchQuery2: any = {};
         batchQuery2["SQL"] = "DELETE FROM " + Helpers.TABLES_MISC.request + " Where DB_Type_ID=? AND Table_name=? AND Act_Type_ID=? AND Cols=? AND Vals=? AND Wheres=?";
         batchQuery2["params"] = [requests[index].DB_Type_ID, requests[index].Table_name, requests[index].Act_Type_ID, cols, vals, wheres];
         batchQueries.push(batchQuery2);
         this.mySqlBatch(Helpers.database_misc, batchQueries, (success: any) => {
            this.deleteOldRequests(++index, rqGroup, callback);
         }, (error: { message: any; }) => {
            this.deleteOldRequests(++index, rqGroup, callback);
         });
      } else {
         callback();
      }
   }

   insertSyncFromSqls(param_index: any, params_syncs: any, countSuccess: any, results: any, callback: any) {
      console.log("insertSyncFromSqls called, param_index=" + param_index);
      if (params_syncs && param_index < params_syncs.length) {
         console.log("params_syncs.length=" + params_syncs.length);
         var params_sync: any = params_syncs[param_index];
         var query: any = { "DB_Type_ID": params_sync.DB_Type_ID, "SQL": "", "params": [] };
         console.log("PARANS_SYNC =" + JSON.stringify(params_sync));
         params_sync["DB_Type_ID"] = parseInt(params_sync["DB_Type_ID"]);
         params_sync["Act_Type_ID"] = parseInt(params_sync["Act_Type_ID"]);
         if (parseInt(params_sync.DB_Type_ID) === DB_Type_ID.DB_ACROSTICS) {
            Helpers.database = Helpers.database_acrostics;
         }
         else if (parseInt(params_sync.DB_Type_ID) === DB_Type_ID.DB_MISC) {
            Helpers.database = Helpers.database_misc;
         }
         //query = params[param_index].APP_SQL;
         //SET UP QUERIES:------------------------------------>         
         //console.log("params_sync.Cols = " + params_sync.Cols);
         //if(params_sync.Cols.indexOf("Image")>=0){
         //params_sync.Vals[0] = this.base64ToBlob(params_sync.Vals[0], "jpeg", 512);
         //}

         if (params_sync["Act_Type_ID"] === Op_Type_ID.UPDATE_IMAGE && (params_sync.Image && params_sync.Image.trim() !== "" && String(params_sync.Image).toUpperCase() !== 'NULL')) {
            //IF IMAGE:
            query.SQL = "UPDATE " + params_sync.Table_name + " SET Image=? WHERE Name=?";
            query.params = [params_sync.Image, params_sync.Wheres["Name"]];
         } else {
            query = this.getQueriesFromVals(params_sync);
         }
         //END SET UP QUERIES...
         if (query) {
            console.log("insertSyncFromSqls query = " + JSON.stringify(query));
         }
         this.executeFromSqls(query).then((res) => {
            var successPrompt = res.success === true ? "SUCCESS" : "FAIL :" + res.error;
            if (res.success === true) {
               countSuccess++;
            }
            this.setNextExecuteID(params_syncs, param_index, res.success).then(() => {
               var syncFromStatus = this.getSyncFromStatus(params_sync);
               if (syncFromStatus !== "") {
                  syncFromStatus = " / " + syncFromStatus;
               }
               results += (param_index + 1) + ")" + successPrompt + ": " + Op_Type_ID[params_sync.Act_Type_ID] + " " + params_sync.Table_name + syncFromStatus + "<br />";//DB, Action, Table_name
               param_index++;
               this.insertSyncFromSqls(param_index, params_syncs, countSuccess, results, callback);
            });
         });
      } else {
         callback({ "countSuccess": countSuccess, "results": results });
      }
   }

   setNextExecuteID(queries: any, queryIndex: any, isDo: boolean): Promise<void> {
      return new Promise((resolve, reject) => {
         if (isDo === false) {
            resolve();
         } else {
            var setNextExecuteOpTypeIDs: Array<Op_Type_ID> = [Op_Type_ID.INSERT_TYPES, Op_Type_ID.GET_ID_INSERT_MANY];
            var myDB: SQLiteDBConnection | null = null;
            if (setNextExecuteOpTypeIDs.indexOf(queries[queryIndex].Act_Type_ID) > -1) {
               if (parseInt(queries[queryIndex].DB_Type_ID) === DB_Type_ID.DB_ACROSTICS) {
                  myDB = Helpers.database_acrostics;
               }
               else if (parseInt(queries[queryIndex].DB_Type_ID) === DB_Type_ID.DB_MISC) {
                  myDB = Helpers.database_misc;
               }
            }
            if (queries[queryIndex].Act_Type_ID === Op_Type_ID.INSERT_TYPES) {
               this.query(myDB, "SELECT ID FROM " + queries[queryIndex].Table_name + " ORDER BY ID DESC LIMIT 1", 'query', []).then((data) => {
                  if (data.values.length > 0) {
                     var LAST_INSERT_ID = data.values[0].ID;
                     console.log("GOT LAST_INSERT_ID = " + LAST_INSERT_ID);
                     //COPY LAST_INSERT_ID INTO FIRST VALUE OF NEXT INSERT ENTRIES QUERY:
                     for (var v = 0; v < queries[queryIndex + 1].Vals.length; v++) {
                        queries[queryIndex + 1].Vals[v][0] = LAST_INSERT_ID;
                     }
                  }
                  resolve();
               });
            }
            else if (queries[queryIndex].Act_Type_ID === Op_Type_ID.GET_ID_INSERT_MANY) {
               var cols = Object.keys(queries[queryIndex].Wheres);
               var whereCols = cols.map((col) => { return col + "=?" });
               var wheres = whereCols.length > 0 ? " WHERE " + whereCols.join(" AND ") : "";
               var whereVals = cols.map((col) => { return queries[queryIndex].Wheres[col]; });

               this.query(myDB, "SELECT ID FROM " + queries[queryIndex].Table_name + wheres, 'query', whereVals).then((data) => {
                  if (data.values.length > 0) {
                     var INSERT_ID = data.values[0].ID;
                     console.log("GOT LAST_INSERT_ID = " + INSERT_ID);
                     //COPY LAST_INSERT_ID INTO FIRST VALUE OF NEXT INSERT ENTRIES QUERY:
                     for (var v = 0; v < queries[queryIndex + 1].Vals.length; v++) {
                        queries[queryIndex + 1].Vals[v][0] = INSERT_ID;
                     }
                  }
                  resolve();
               });
            } else {
               resolve();
            }
         }
      });
   }

   insertSyncFromRequests(param_index: any, requestGroups: any, countSuccess: any, results: any, callback: any) {
      var self = this;
      if (param_index < requestGroups.length) {
         var requestGroup = requestGroups[param_index];
         console.log("insertSyncFromRequests requestGroup = " + JSON.stringify(requestGroup));
         var requests: Array<SyncQuery> = requestGroup.REQUESTS;
         var requestsTables = requests.map(rq => { return rq.Table_name }).filter(this.onlyUnique);
         var requestsWheres = requests.map(rq => { return this.jsonToStringPlain(rq.Wheres) }).filter(wh => { return wh !== '' });
         var resultMessage = Op_Type_ID[requestGroup.Op_Type_ID] + " on table(s): " + requestsTables.join(", ") + ", where: " + requestsWheres.join("<br /") + "<br />";
         //Op_Type_ID, Timestamp, Device_ID, Choice, User_ID, User_ID_Old, Names, Entry_Old, Entry
         var sync_sql1 = "INSERT INTO " + Helpers.TABLES_MISC.operation + " (Op_Type_ID, Timestamp, Device_ID, Choice, User_ID, User_ID_Old, Names, Entry_Old, Entry) VALUES (?, ? ,? ,? ,? ,?, ?, ?, ?)";
         var params = [
            requestGroup.Op_Type_ID, requestGroup.Timestamp, requestGroup.Device_ID, requestGroup.Choice, requestGroup.User_ID, requestGroup.User_ID_Old, JSON.stringify(requestGroup.Names), JSON.stringify(requestGroup.Entry_Old), JSON.stringify(requestGroup.Entry)
         ];
         self.query(Helpers.database_misc, sync_sql1, 'execute', params).then((success) => {
            self.query(Helpers.database_misc, "SELECT MAX(ID) AS LAST_INSERT_ID FROM " + Helpers.TABLES_MISC.operation, 'query', []).then((success) => {
               if (success.rows.length > 0) {
                  var opID = parseInt(success.rows.item(0).LAST_INSERT_ID);
                  //ID, Op_ID, IS_APP, DB_Type_ID, Table_name, Act_Type_ID, Cols, Vals, Wheres
                  var cols = "Op_ID, IS_APP, DB_Type_ID, Table_name, Act_Type_ID, Cols, Vals, Wheres, User_Action";
                  var sync_sql2 = "INSERT INTO " + Helpers.TABLES_MISC.request + " (" + cols + ") VALUES ";

                  var rq: any, is_app: string | null, user_action: string | null = null, valsPlaces: any = [], valsAll: any = [], values: any = [];
                  for (var r = 0; r < requests.length; r++) {
                     rq = requests[r];
                     is_app = rq.IS_APP == null ? "NULL" : (rq.IS_APP === true ? "1" : "0");
                     user_action = rq.IS_APP == null ? "NULL" : String(rq.User_Action);
                     //ID, Op_ID, IS_APP, DB_Type_ID, Table_name, Act_Type_ID, Cols, Vals, Wheres
                     values = [
                        opID, is_app, rq.DB_Type_ID, rq.Table_name, rq.Act_Type_ID, JSON.stringify(rq.Cols), JSON.stringify(rq.Vals), JSON.stringify(rq.Wheres), user_action
                     ];
                     valsAll = valsAll.concat(values);
                     valsPlaces.push("(" + "?".repeat(values.length).split("").join(",") + ")");
                  }
                  sync_sql2 += valsPlaces.join(",");
                  self.query(Helpers.database_misc, sync_sql2, 'execute', valsAll).then((success) => {
                     results += (param_index + 1) + ")SUCCESS: " + resultMessage;
                     countSuccess++;
                     param_index++;
                     this.insertSyncFromRequests(param_index, requestGroups, countSuccess, results, callback);
                  }, error => {
                     results += (param_index + 1) + ")FAIL: " + error.message + ". " + resultMessage;
                     param_index++;
                     this.insertSyncFromRequests(param_index, requestGroups, countSuccess, results, callback);
                  });
               } else {
                  results += (param_index + 1) + ")FAIL: Could not get op ID. " + resultMessage;
                  param_index++;
                  this.insertSyncFromRequests(param_index, requestGroups, countSuccess, results, callback);
               }
            }, error => {
               results += (param_index + 1) + ")FAIL: Get Op ID: " + error.message + ". " + resultMessage;
               param_index++;
               this.insertSyncFromRequests(param_index, requestGroups, countSuccess, results, callback);
            });
         }, error => {
            results += (param_index + 1) + ")FAIL: Insert operation: " + error.message + ". " + resultMessage;
            param_index++;
            this.insertSyncFromRequests(param_index, requestGroups, countSuccess, results, callback);
         });
      } else {
         callback({ "countSuccess": countSuccess, "results": results });
      }
   }

   getQueriesFromVals(query: SyncQuery): any {
      //console.log("getQueriesFromVals query BEFORE JSON PARSE = " + JSON.stringify(query));
      query = this.parseSyncQuery(query);
      //console.log("getQueriesFromVals query AFTER JSON PARSE = " + JSON.stringify(query));
      var appSql: any = { "DB_Type_ID": query.DB_Type_ID, "SQL": "", "params": [] };
      var where_str = "";
      var whereVals: any[] = [];
      var Act_Type_ID: number = query.Act_Type_ID;
      if (Act_Type_ID === Op_Type_ID.INSERT || Act_Type_ID === Op_Type_ID.INSERT_TYPES) {
         var vals_all_ques: any = [];
         var vals_all: any = [];
         for (var v = 0; v < query.Vals.length; v++) {
            vals_all_ques.push("(" + "?".repeat(query.Vals[v].length).split("").join(",") + ")");
            vals_all = vals_all.concat(query.Vals[v]);
         }
         appSql.SQL = "INSERT INTO " + query.Table_name + " (" + query.Cols.join(",") + ") VALUES " + vals_all_ques.join(", ");
         appSql.params = vals_all;
      } else if (Act_Type_ID === Op_Type_ID.REPLACE) {
         var vals_all_ques: any = [];
         var vals_all: any = [];
         for (var v = 0; v < query.Vals.length; v++) {
            vals_all_ques.push("(" + "?".repeat(query.Vals[v].length).split("").join(",") + ")");
            vals_all = vals_all.concat(query.Vals[v]);
         }
         appSql.SQL = "REPLACE INTO " + query.Table_name + " (" + query.Cols.join(",") + ") VALUES " + vals_all_ques.join(", ");
         appSql.params = vals_all;
      }
      else if (Act_Type_ID === Op_Type_ID.INSERT_SELECT) {
         var whereCols: Array<string> = [];
         for (var p in query.Wheres) {
            if (p !== "From_Table") whereCols.push(p);
         }
         whereVals = whereCols.map((col) => { return query.Wheres[col]; });
         var wheres = whereCols.map((col) => { return col + "=?" });
         if (wheres.length > 0) {
            where_str = " WHERE " + wheres.join(" AND ");
         }
         appSql.SQL = "INSERT INTO " + query.Table_name + "(" + query.Cols.join(",") + ") SELECT " + query.Vals.join(",") + " FROM " + query.Wheres["From_Table"] + where_str;
      } else if (Act_Type_ID === Op_Type_ID.UPDATE) {
         var updates = [];
         for (var i = 0; i < query.Cols.length; i++) {
            updates.push(query.Cols[i] + "=?");
         }
         var whereCols = Object.keys(query.Wheres).filter((col) => { return this.isQueryValNull(query.Wheres[col]) === false });
         whereVals = whereCols.map((col) => { return query.Wheres[col]; });
         var wheres = whereCols.map((col) => { return col + "=?" });
         if (wheres.length > 0) {
            where_str = " WHERE " + wheres.join(" AND ");
         }
         appSql.SQL = "UPDATE " + query.Table_name + " SET " + updates.join(",") + where_str;
         console.log("getQueriesFromVals query.Vals=" + JSON.stringify(query.Vals));
         appSql.params = query.Vals.concat(whereVals);
      } else if (Act_Type_ID === Op_Type_ID.UPDATE_IN) {
         var updates = [];
         for (var i = 0; i < query.Cols.length; i++) {
            updates.push(query.Cols[i] + "=?");
         }
         var whereCols = Object.keys(query.Wheres);
         var whereIns = query.Wheres[whereCols[0]];
         appSql.SQL = "UPDATE " + query.Table_name + " SET " + updates.join(",") + " WHERE " + whereCols[0] + " IN (" + whereIns.join(",") + ")";
         appSql.params = query.Vals;
      } else if (Act_Type_ID === Op_Type_ID.DELETE) {
         var whereCols = Object.keys(query.Wheres).filter(col => { return this.isQueryValNull(query.Wheres[col]) === false });
         whereVals = whereCols.map((col) => {
            //whereVal = query.Wheres[col];
            //if(typeof whereVal === 'object') whereVal = JSON.stringify(whereVal);
            return query.Wheres[col];
         });
         var wheres = whereCols.map((col) => { return col + "=?" });
         if (wheres.length > 0) {
            where_str = " WHERE " + wheres.join(" AND ");
         }
         appSql.SQL = "DELETE FROM " + query.Table_name + where_str;
         appSql.params = whereVals;
      } else if (Act_Type_ID === Op_Type_ID.DELETE_IN) {
         var whereCols = Object.keys(query.Wheres);
         whereVals = whereCols.map((col) => { return query.Wheres[col]; });
         if (whereCols.length > 0) {
            where_str = " WHERE " + whereCols[0] + " IN (" + "?".repeat(whereVals[0].length).split("").join(",") + ")";
         }
         appSql.SQL = "DELETE FROM " + query.Table_name + where_str;
         appSql.params = whereVals[0];
      } else if (Act_Type_ID === Op_Type_ID.CREATE) {
         var columnns_arr = [];
         for (var i = 0; i < query.Cols.length; i++) {
            columnns_arr.push(query.Cols[i] + " " + query.Vals[i]);
         }
         appSql.SQL = "CREATE TABLE IF NOT EXISTS " + query.Table_name + " (" + columnns_arr.join(",") + ")";
      } else if (Act_Type_ID === Op_Type_ID.DROP) {
         appSql.SQL = "DROP TABLE " + query.Table_name;
      } else if (Act_Type_ID === Op_Type_ID.CREATE_INDEX) {
         appSql.SQL = "CREATE UNIQUE INDEX IF NOT EXISTS " + query.Table_name + "_unique_index ON " + query.Table_name + " (" + query.Cols.join(",") + ")";
      } else if (Act_Type_ID === Op_Type_ID.DROP_INDEX) {
         appSql.SQL = "DROP INDEX IF EXISTS " + query.Table_name + "_unique_index";
      } else if (Act_Type_ID === Op_Type_ID.ADD_COLUMN) {
         appSql.SQL = "ALTER TABLE " + query.Table_name + " ADD COLUMN " + query.Cols[0] + " " + query.Vals[0];
      } else if (Act_Type_ID === Op_Type_ID.RENAME_TABLE) {
         appSql.SQL = "ALTER TABLE " + query.Wheres["Old_Table_Name"] + " RENAME TO " + query.Wheres["New_Table_Name"];
      } else if (Act_Type_ID === Op_Type_ID.DELETE_INNER_JOIN) {
         //Wheres(SELECT_COL_MT, SELECT_COL_A), Cols(inner join tables), Vals(A(A Col), MT(alias of table to join to), MT_Col)
         appSql.SQL = "DELETE FROM " + query.Table_name + " ";
         appSql.SQL += "WHERE " + query.Vals[0]["A"] + " IN ("
         appSql.SQL += "SELECT " + query.Vals[0]["B"] + " FROM ";
         if (query.Cols.length > 0) {
            var inJns = [];
            for (var i = 0; i < query.Cols.length; i++) {
               if (i === 0) {
                  inJns.push(query.Cols[0] + " AS T" + (i + 1));
               } else {
                  inJns.push("INNER JOIN " + query.Cols[i] + " AS T" + (i + 1) + " ON " + query.Vals[i]["A"] + "=" + query.Vals[i]["B"]);
               }
            }
            appSql.SQL += inJns.join(" ");
         }
         var whereCols: string[] = [], wheres: string[] = [];
         var whereCols = Object.keys(query.Wheres).filter(col => { return this.isQueryValNull(query.Wheres[col]) === false });
         wheres = wheres.concat(whereCols.map((col) => { return col + "=?" }));
         whereVals = whereCols.map((col) => {
            return query.Wheres[col];
         });

         if (wheres.length > 0) {
            appSql.SQL += " WHERE " + wheres.join(" AND ");
         }
         appSql.SQL += ")";
         appSql.params = whereVals;
      } else if (Act_Type_ID === Op_Type_ID.INSERT_UPDATE) {
         var vals_all_ques: any = [];
         var vals_all: any = [];
         for (var v = 0; v < query.Vals.length; v++) {
            vals_all_ques.push("(" + "?".repeat(query.Vals[v].length).split("").join(",") + ")");
            vals_all = vals_all.concat(query.Vals[v]);
         }
         appSql.SQL = "INSERT INTO " + query.Table_name + " (" + query.Cols.join(",") + ") VALUES " + vals_all_ques.join(", ");
         appSql.SQL += " ON CONFLICT(" + query.Wheres["CONFLICT_COLUMN"] + ") DO UPDATE SET " + query.Wheres["UPDATE_COLUMN"] + " = ?";
         vals_all.push(query.Wheres["UPDATE_VALUE"]);
         appSql.params = vals_all;
      } else if (Act_Type_ID === Op_Type_ID.GET_ID_INSERT_MANY) {
         var cols = Object.keys(query.Wheres).filter(col => { return this.isQueryValNull(query.Wheres[col]) === false });
         var whereCols = cols.map((col) => { return col + "=?" });
         var whereVals = whereCols.map((col) => { return query.Wheres[col]; });
         var myWheres = whereCols.length > 0 ? " WHERE " + whereCols.join(" AND ") : "";
         appSql.SQL = "SELECT ID FROM " + query.Table_name + myWheres;
         appSql.params = whereVals;
      }

      //CAST ALL PARAMS TO STRING!:
      appSql.params.forEach((p: any) => { p = String(p); });
      return appSql;
   }

   private getSyncFromStatus(sq: SyncQuery): string {
      var status = "";
      // ALL:======>
      //   NO_ACTION, INSERT, INSERT_SELECT, REPLACE, UPDATE, UPDATE_IN, DELETE, DELETE_IN, CREATE, RENAME_TABLE, ALTER_TABLE, 
      //  DROP, CREATE_INDEX, DROP_INDEX, CHANGE_COLUMN, ADD_COLUMN, DROP_COLUMN, RENAME_COLUMN, CREATE_TRIGGERS, DROP_TRIGGERS,
      // ADVANCED_SQLS, CREATE_USER, RENAME_MNEMONIC_TABLE, RENAME_MNEMONIC_TITLE, RENAME_MNEMONIC_TABLE_AND_TITLE, DELETE_INNER_JOIN,
      // DROP_COLUMNS, ADD_COLUMNS
      var whereCols: any = [];
      if (sq.Act_Type_ID === Op_Type_ID.UPDATE || sq.Act_Type_ID === Op_Type_ID.DELETE) {
         if (sq.DB_Type_ID === DB_Type_ID.DB_ACROSTICS) {
            status = sq.Wheres["Name"];
         } else {
            status = this.jsonToStringPlain(sq.Wheres);
         }
      } else if (sq.Act_Type_ID === Op_Type_ID.INSERT || sq.Act_Type_ID === Op_Type_ID.REPLACE) {
         status = sq.Cols.join(", ");
      } else if (sq.Act_Type_ID === Op_Type_ID.INSERT_SELECT) {
         status = "Insert Table: " + sq.Wheres["Insert_Table"];
      } else if (sq.Act_Type_ID === Op_Type_ID.UPDATE_IN) {
         whereCols = Object.keys(sq.Wheres);
         status = whereCols[0] + ": " + sq.Cols.join(", ");
      } else if (sq.Act_Type_ID === Op_Type_ID.DELETE_IN) {
         whereCols = Object.keys(sq.Wheres);
         status = whereCols[0];
      } else if (sq.Act_Type_ID === Op_Type_ID.CREATE) {
         status = sq.Cols.join(", ");
      } else if (sq.Act_Type_ID === Op_Type_ID.RENAME_TABLE) {
         status = sq.Wheres["Old_Table_Name"] + " to " + sq.Wheres["New_Table_Name"]
      } else if (sq.Act_Type_ID === Op_Type_ID.CREATE_INDEX) {
         status = sq.Cols.join(", ");
      } else if (sq.Act_Type_ID === Op_Type_ID.DROP_INDEX) {
         status = sq.Table_name + "_unique_index";
      } else if (sq.Act_Type_ID === Op_Type_ID.ADD_COLUMN) {
         status = sq.Cols[0];
      } else if (sq.Act_Type_ID === Op_Type_ID.DELETE_INNER_JOIN) {
         for (var p in sq.Wheres) {
            whereCols = whereCols.concat(p);
         }
         status = whereCols.join(", ");
      }
      return status;
   }

   public executeFromSqls(query: any): Promise<any> {
      return new Promise((resolve, reject) => {
         if (query) {
            console.log("executeFromSqls called");
            this.query(Helpers.database, query.SQL, 'execute', query.params).then((data) => {
               resolve({ "success": true, "error": "" });
            }).catch((error) => {
               resolve({ "success": false, "error": error.message });
            });
         } else {
            resolve({ "success": false, "error": "Query is null." });
         }
      });
   }

   public mySqlBatch(myDB: SQLiteDBConnection | null, queries: any, success: any, error: any) {
      //if(this.isApp()){
      //   myDB.sqlBatch(queries).then((res)=>{
      //     success();
      //   }).catch((err)=>{
      //      error(err);
      //   });
      //}else{
      this.doSqlBatch(0, myDB, queries, success, error);
      //}
   }

   public doSqlBatch(index: any, myDB: any, queries: any, success: any, error: any) {
      console.log("doSqlBatch called index = " + index + ", queries.length=" + queries.length);
      if (index < queries.length) {
         console.log("doSqlBatch doing query: " + JSON.stringify(queries[index]));
         this.query(myDB, queries[index].SQL, 'execute', queries[index].params).then((data) => {
            this.doSqlBatch(++index, myDB, queries, success, error);
         }, (err) => {
            error(err);
         });
      } else {
         success();
      }
   }

   public makeHttpRequest(url: any, method: any, params: any): Promise<any> {
      Helpers.IS_DO_HTTP_REQUEST = true;
      var self = this;

      return new Promise((resolve, reject) => {
         if (navigator.onLine === false) {
            Helpers.IS_DO_HTTP_REQUEST = false;
            reject({ message: "NOT ONLINE. Need to connect to network." });
         } else {
            if (this.isApp()) {
               //for (var prop in params) {
               //   console.log("PARSING prop: " + prop);
               //   if (this.isNumber(params[prop]) === true || (method === "GET" && typeof params[prop] == "boolean")) {
               //      console.log("SETTING prop," + prop + ", to STRING!");
               //      params[prop] = String(params[prop]);
               //   } else if (params[prop] == null) {
               //      delete params[prop];
               //   }
               //}
               this.makeDeviceHttpRequest(url, method, params).then((res) => {
                  Helpers.IS_DO_HTTP_REQUEST = false;
                  resolve(res);
               });
            } else {
               this.makeBrowserHttpRequest(url, method, params).then((res) => {
                  Helpers.IS_DO_HTTP_REQUEST = false;
                  resolve(res);
               });
            }
         }
      });
   }

   public makeDeviceHttpRequest(url: string, method: string, params: any): Promise<any> {
      console.log("makeDeviceHttpRequest called, url=" + url + ", method=" + method);
      return new Promise((resolve, reject) => {
         var myUrl = url;
         if (Helpers.isLfqHttp === false) {
            myUrl = url;
         } else {
            //if (this.isApp() === false) {
            //   myUrl = "/LFQ" + url;
            //} else {
            myUrl = "https://www.learnfactsquick.com" + url;
            //}
         }
         this.nativeHttp.setHeader('*', String("Content-Type"), String("application/json"));
         this.nativeHttp.setHeader('*', String("Accept"), String("application/json"));
         this.nativeHttp.setDataSerializer('json');
         console.log("myUrl=" + myUrl);
         var myParams = this.parseDeviceParamsAsStrings(params);
         console.log("makeDeviceHttpRequest called, params = " + JSON.stringify(params));
         if (method.toUpperCase() === "POST") {
            this.nativeHttp.post(
               myUrl, myParams, { responseType: 'json' }
            ).then((res: any) => {
               console.log("makeDeviceHttpRequest BACK FROM POSTING TO " + myUrl);
               console.log("makeDeviceHttpRequest, res=" + JSON.stringify(res));
               if (Helpers.isLfqHttp === true) {
                  var jsonRes = res.data;
                  if (this.isJSON(res.data)) {
                     jsonRes = JSON.parse(res.data);
                  }
                  resolve(jsonRes);
               } else {
                  //console.log("POST RESOLVING:" + JSON.stringify(res.data));
                  resolve(res.data);
               }
            }, (error: any) => {
               console.log("HTTP ERROR=" + JSON.stringify(error));
               reject(error);
            }); '"'
         } else if (method.toUpperCase() === "GET") {
            this.nativeHttp.get(
               myUrl, myParams, {}
            ).then((res: any) => {
               var jsonRes = res.data;
               if (this.isJSON(res.data)) {
                  jsonRes = JSON.parse(res.data);
               }
               resolve(jsonRes);
            }, (error: any) => {
               console.log("HTTP ERROR=" + JSON.stringify(error));
               reject(error);
            });
         }
      });
   }

   public makeBrowserHttpRequest(url: string, method: string, params: any): Promise<any> {
      console.log("makeBrowserHttpRequest called, url=" + url + ", method=" + method + ", params=" + JSON.stringify(params));
      return new Promise((resolve, reject) => {
         var myUrl = url;
         if (Helpers.isLfqHttp === false) {
            myUrl = url;
         } else {
            //if (this.isApp() === false) {
            //   myUrl = "/LFQ" + url;
            //} else {
            myUrl = "https://www.learnfactsquick.com" + url;
            //}
         }
         console.log("myUrl=" + myUrl);
         if (method.toUpperCase() === "POST") {
            this.http.post(
               myUrl, params, { responseType: 'text' }
            ).subscribe((res: string) => {
               console.log("makeBrowserHttpRequest BACK FROM POSTING TO " + myUrl);
               //console.log("makeHttpRequest, res=" + JSON.stringify(res));
               if (Helpers.isLfqHttp === true) {
                  if (this.isJSON(res)) {
                     resolve(JSON.parse(res));
                  } else {
                     resolve(res);
                  }
               } else {
                  resolve(res);
               }
            }, error => {
               console.log("HTTP ERROR=" + JSON.stringify(error));
               reject(error);
            });
         } else if (method.toUpperCase() === "GET") {
            var myParams: any = {};
            myParams.params = params;
            myParams.headers = { 'Content-Type': 'application/json; charset=utf-8' };
            this.http.get<any>(
               myUrl, myParams
            ).subscribe((res: any) => {
               console.log("res = " + JSON.stringify(res));
               resolve(res);
            }, error => {
               console.log("HTTP ERROR=" + JSON.stringify(error));
               reject(error);
            });
         }
      });
   }

   testGoogle(): Promise<any> {
      console.log("testGoogle called");
      var res = { "success": false, "error": "" };
      return new Promise((resolve, rejects) => {
         var googleTestUrl = "https://play.app.goo.gl/?link=https://play.google.com/store/apps/details?id=com.lfq.madmother";
         this.nativeHttp.get(
            googleTestUrl, {}, {}
         ).then((res: any) => {
            res.success = true;
            resolve(res);
         }, (error: any) => {
            res.error = error;
            resolve(res);
         });
      });
   }

   public async clearSyncTable() {
      console.log("helpers.clearSyncTable() called");
      var progressLoader = await this.progress.create({ message: "Clearing sync table ,please wait..." });
      progressLoader.present().then(() => {
         this.query(Helpers.database_misc, "DELETE FROM " + Helpers.TABLES_MISC.sync_operation, 'execute', []).then(() => {
            this.query(Helpers.database_misc, "DELETE FROM " + Helpers.TABLES_MISC.sync_table, 'execute', []).then(() => {
               progressLoader.dismiss();
            });
         });
      });
   }

   public isApp(): Boolean {
      var ret = false;
      if (this.platform.is('cordova')) {
         console.log("isApp returning true");
         ret = true;
      } else {
         ret = false;
      }
      console.log("isApp returning =" + ret);
      return ret;
   }

   public static getUpdateString(cv: any) {
      console.log("getUpdateString called, cv=" + JSON.stringify(cv));
      var update_array = [];
      for (var prop in cv) {
         update_array.push(prop + "='" + cv[prop] + "'");
      }
      return update_array.join(", ");
   }

   public static getWhereString(cv: any) {
      console.log("getWhereString called, cv=" + JSON.stringify(cv));
      var update_array = [];
      for (var prop in cv) {
         update_array.push(prop + "='" + cv[prop] + "'");
      }
      return update_array.join(" AND ");
   }

   public static getUniqueIndex(cv: any) {
      console.log("getHiphenatedString called, cv=" + JSON.stringify(cv));
      var update_array = [];
      for (var prop in cv) {
         update_array.push(cv[prop]);
      }
      return update_array.join("-");
   }


   public static getInsertString(cv: any) {
      var columns = Object.keys(cv);
      var values = [];
      for (var prop in cv) {
         values.push(cv[prop]);
      }
      return "(" + columns + ") VALUES('" + values.join("','") + "')";
   }

   public static getEntriesRequest(oldCv: any, newCv: any, includeProps: Array<string>): myObject[] {
      console.log("getEntriesRequest called, newCv=" + JSON.stringify(newCv) + ", oldCv=" + JSON.stringify(oldCv));
      //**cv[0] IS NEW ENTRY......cv[1] IS OLD ENTRY
      var cvs = [];
      var cv1: any = {};
      var cv2: any = {};
      cvs.push(cv1);
      cvs.push(cv2);
      var excludeProps = ["ID", "Username", "User_ID"];
      var oldCvKeys: any = [], newCvKeys: any = [];
      var condComp = false;
      if (!oldCv) oldCv = {};
      if (!newCv) newCv = {};
      for (var prop in oldCv) {
         oldCvKeys.push(prop);
      }
      for (var prop in newCv) {
         newCvKeys.push(prop);
      }
      console.log("newCvKeys = " + newCvKeys + " , oldCvKeys = " + oldCvKeys);
      var keysCompare = oldCvKeys.length > newCvKeys.length ? oldCvKeys : newCvKeys;
      var isDelete = oldCvKeys.length > newCvKeys.length ? true : false;
      console.log("keysCompare = " + keysCompare);
      for (var k = 0; k < keysCompare.length; k++) {
         condComp = isDelete === true ? oldCv[keysCompare[k]] != null : newCv[keysCompare[k]] != null;
         if (condComp && newCv && oldCv && newCv[keysCompare[k]] !== oldCv[keysCompare[k]] && (includeProps == null || includeProps.indexOf(keysCompare[k]) >= 0) && excludeProps.indexOf(keysCompare[k]) < 0) {
            cvs[0][keysCompare[k]] = oldCv[keysCompare[k]];
            cvs[1][keysCompare[k]] = newCv[keysCompare[k]];
         }
      }
      console.log("getEntriesRequest returning entryRequests = " + JSON.stringify(cvs));
      return cvs;
   }

   /**
   * @method: getIndex: Returns the index of an array if a property matches a given value.
   * @param arr: The array
   * @param prop: The property
   * @param val: The value
   * @return: Integer or "FALSE"
   **/
   public getIndex(arr: any, prop: any, val: any): any {
      //console.log("getIndex called.");
      if (arr != null) {
         if (prop != null) {
            if (arr.length > 0) {
               if (arr[0][prop] != null) {
                  //console.log("getIndex arr[0][prop] = " + arr[0][prop]);
                  for (var i = 0; i < arr.length; i++) {
                     if (String(arr[i][prop]) === String(val)) return i;
                  }
                  console.log("getIndex . NOT FOUND");
                  return "FALSE";//NOT FOUND
               } else {
                  console.log("getIndex . IF PROPERTY DOES NOT EXIST");
                  return "FALSE";//IF PROPERTY DOES NOT EXIST
               }
            } else {
               console.log("getIndex . ARR LENGTH IS 0");
               return "FALSE";//ARR LENGTH IS 0
            }
         } else {
            console.log("getIndex . PROP IS NULL");
            return "FALSE";//PROP IS NULL
         }
      } else {
         console.log("getIndex . ARR IS NULL");
         return "FALSE";//ARR IS NULL
      }
   }


   public getRecord(arr: any, prop: any, val: any) {
      if (arr != null) {
         if (arr.length > 0) {
            if (arr[0][prop] != null) {
               for (var i = 0; i < arr.length; i++) {
                  if (String(arr[i][prop]) === String(val)) return arr[i];
               }
               return "FALSE";//IF NOT FOUND
            } else {
               return "FALSE";//IF PROPERTY DOES NOT EXIST
            }
         } else {
            return "FALSE";//IF ARR LENGTH IS 0
         }
      }
      else {
         return "FALSE";//IF ARR IS NULL
      }
   }

   public static getIndex(array: any, item: any) {
      for (var i = 0; i < array.length; i++) {
         if (array[i] === item) {
            return i;
         }
      }
      return null;
   }

   public static getIndexByProperty(arr: any, prop: any, val: any) {
      if (arr != null) {
         if (prop != null) {
            if (arr.length > 0) {
               if (arr[0][prop] != null) {
                  for (var i = 0; i < arr.length; i++) {
                     if (String(arr[i][prop]) === String(val)) return i;
                  }
                  return "FALSE";//NOT FOUND
               } else {//IF PROPERTY DOES NOT EXIST
                  return "FALSE";
               }
            } else {
               return "FALSE";//ARR LENGTH IS 0
            }
         } else {
            return "FALSE";//PROP IS NULL	
         }
      } else {
         return "FALSE";//ARR IS NULL
      }
   }

   formatWord(worspl: Array<any>, myNumber: string) {
      /*ERRORS:
      1) NO 'H' AFTER S IN MIDDLE OF WORD
      */
      /*
         PROCEDURE:
         1) IF IGNORE LETTERS -> LOWER CASE
         2) FOR DOUBLE LETTERS/LETTER COMBINATIONS -> USE 1 SOUND - >ALL UPPERCASE
            BB/CH,CK,CZ,CY/DD/FF/GH,GG/LL/MM/NN/PP,PH,RR/SS,SH/TT/ZZ
      */
      myNumber = String(myNumber);
      let mark_max = myNumber.length;
      //console.log("formatWord called., worspl=" + worspl + ", mark_max=" + mark_max);
      if (typeof worspl === "string") {
         worspl = [worspl];
      }
      //MAKE ARRAY LOWERCASE:
      worspl = worspl.map(function (l) { return l.toLowerCase(); });
      var word_length = worspl.length;
      var marletct = 0;
      var formattedWord = "";
      var letterCombos = [["b", "b"], ["c", "h"], ["c", "k"], ["c", "y"], ["c", "z"], ["d", "d"], ["f", "f"], ["g", "h"], ["g", "g"], ["l", "l"], ["m", "m"], ["n", "n"], ["p", "p"], ["p", "h"], ["r", "r"], ["s", "s"], ["s", "h"], ["t", "t"], ["t", "h"], ["z", "z"]];
      var isLetterCombo = false;
      let number_split = myNumber.split("");
      // ignlets=aeiouwxy
      for (var i = 0; i < word_length; i++) {
         //1) IGNORE LETTERS:
         if ("aeiouwxy".match(worspl[i]) != null) {
            formattedWord += worspl[i].toLowerCase();
         } else {//IF NOT IGNORE LETTERS:
            if (marletct < mark_max) {
               //if ("aeiouwxyh".match(worspl[i]) == null) {
               //   formattedWord += worspl[i].toUpperCase();
               //   marletct++;
               //}
               //BEGINNING LETTER:
               if (i === 0 && worspl[i] === "h") {
                  formattedWord += worspl[i].toLowerCase();
               } else if (i === 0 && worspl[i] !== "h") {
                  formattedWord += worspl[i].toUpperCase();
                  marletct++;
               } else if (i > 0) {//NOT BEGINNING LETTER:
                  //DOUBLE LETTERS/COMBINATIONS:
                  isLetterCombo = false;
                  for (var j = 0; j < letterCombos.length; j++) {
                     if (worspl[i - 1] === letterCombos[j][0] && worspl[i] === letterCombos[j][1]) {
                        if (letterCombos[j][0] === "g" && letterCombos[j][1] === "h" && number_split[marletct] !== "7" && number_split[marletct] !== "8") {
                           formattedWord += worspl[i].toLowerCase();
                        } else {
                           formattedWord += worspl[i].toUpperCase();
                        }
                        isLetterCombo = true;
                        //break;
                        //console.log("formatWord isLetterCombo = " + isLetterCombo + ", marletct = " + marletct);
                     }
                  }
                  if (isLetterCombo === false) {
                     if (worspl[i] === "h" || ((i < (word_length - 1)) && worspl[i] === "g" && worspl[i + 1] === "h" && (number_split[marletct] !== "7" && number_split[marletct] !== "8"))) {
                        formattedWord += worspl[i].toLowerCase();
                     } else {
                        formattedWord += worspl[i].toUpperCase();
                        marletct++;
                     }
                  }
               }
            } else {// end if marletct<numct
               formattedWord += worspl[i].toLowerCase();
            }
         }
      }// end for loop format letters
      return formattedWord;
   }

   formatMnemonicWord(mnemonic: any, word: any) {
      //console.log("formatMnemonicWord called");
      var mnemonic_split = [];
      var word_split = [];
      var formattedMnemonic = "";
      if (mnemonic && word) {
         mnemonic_split = mnemonic.toLowerCase().split("");
         word_split = word.toLowerCase().split("");
         for (var i = 0; i < mnemonic_split.length; i++) {
            if (i < word_split.length && mnemonic_split[i] === word_split[i]) {
               formattedMnemonic += mnemonic_split[i].toUpperCase();
            } else {
               formattedMnemonic += mnemonic_split.slice(i).join("");
               break;
            }
         }
      } else {
         formattedMnemonic = mnemonic;
      }
      return formattedMnemonic;
   }



   getMajorSystemNumber(input_word: any, start: any, number: any) {
      //console.log("getMajorSystemNumber called. word=" + input_word);
      var defspl = input_word.toLowerCase().split("");
      var wl = defspl.length;
      var z;
      var num = "";
      number = String(number);
      var number_split: any = [];
      if (number) {
         number_split = String(number).split("");
      }
      for (var i = start; i < wl; i++) {
         z = i + 1;
         if (defspl[i] === "s") {
            if (z < wl) {
               if (defspl[z] !== "h") {
                  num += "0";
               }
            }
            else if (z >= wl) {
               num += "0";
            }
         }
         if (defspl[i] === "z") {
            num += "0";
         }
         if (defspl[i] === "d" || defspl[i] === "t") {
            num += "1";
         }
         if (defspl[i] === "n") {
            num += "2";
         }
         if (defspl[i] === "m") {
            num += "3";
         }
         if (defspl[i] === "r") {
            num += "4";
         }
         if (defspl[i] === "l") {
            num += "5";
         }
         if (defspl[i] === "j") {
            num += "6";
         }
         if (defspl[i] === "c" && z < wl) {
            if (defspl[z] === "h") {
               num += "6";
            }
         }
         if (defspl[i] === "s" && z < wl) {
            if (defspl[z] === "h") {
               num += "6";
            }
         }
         if (defspl[i] === "g") {
            //console.log("TESTING G?? z = " + z + ", wl = " + wl);
            if (z < wl) {
               //console.log("TESTING G??");
               if (defspl[z] !== "g" && defspl[z] !== "h") {
                  //console.log("TESTING G??");
                  if (number && number_split[num.length] === "6") {
                     num += "6";
                  } else if (number && number_split[num.length] === "7") {
                     num += "7";
                  } else if (number) {
                     num += "";
                  } else {
                     num += "6";
                  }
               } else if (defspl[z] === "h") {
                  //console.log("TESTING G??");
                  //console.log("number_split[num.length] = " + number_split[num.length]);
                  if (number && number_split[num.length] === "7") {
                     num += "7";
                  } else if (number && number_split[num.length] === "8") {
                     num += "8";
                  } else if (number) {
                     num += "";
                  } else {
                     num += "7";
                  }
                  i++;
               } else if (defspl[z] === "g") {
                  //console.log("TESTING G??");
                  num += "7";
               }
            }
            else if (z === wl) {
               num += "7";
            }
         }
         if (defspl[i] === "c") {
            if (z < wl) {
               if (defspl[z] !== "h") {
                  num += "7";
               }
            }
            else if (z >= wl) {
               num += "7";
            }
         }
         if (defspl[i] === "k" || defspl[i] === "q") {
            num += "7";
         }
         if (defspl[i] === "f" || defspl[i] === "v") {
            num += "8";
         }
         if (defspl[i] === "p" && z < wl) {
            if (defspl[z] === "h") {
               num += "8";
            }
         }
         if (defspl[i] === "b") {
            num += "9";
         }
         if (defspl[i] === "p") {
            if (z < wl) {
               if (defspl[z] !== "h") {
                  num += "9";
               }
            }
            else if (z >= wl) {
               num += "9";
            }
         }
      }
      //console.log("getMajorSystemNumber num = " + num);
      return num;
   }

   getFormattedAnagram(anagram: any, letters: any) {
      console.log("getFormattedAnagram called, anagram=" + anagram + " ,letters=" + letters);
      //PLeaSe->PLS
      var anagram_split = anagram.toLowerCase().split("");
      var formattedAnagram = "";
      var letterIndex = 0;
      for (var i = 0; i < anagram_split.length; i++) {
         if (letterIndex < letters.length) {
            if (anagram_split[i] === letters[letterIndex].toLowerCase()) {
               formattedAnagram += anagram_split[i].toUpperCase();
               letterIndex++;
            }
            else {
               formattedAnagram += anagram_split[i];
            }
         } else {
            formattedAnagram += anagram_split[i];
         }
      }
      return formattedAnagram;
   }

   countUpperCase(str: any) {
      const re = /[A-Z]/g;
      return ((str || '').match(re) || []).length
   }

   async dismissProgress() {
      if (this.progressLoader) {
         console.log("dismissProgress DISMISSING PROGRESS");
         await this.progressLoader.dismiss();
         this.progressLoader = null;
      } else {
         console.log("dismissProgress NOT DISMISSING PROGRESS");
      }
   }

   async setProgress(message: any, isDoingProgress: any, isDoDismiss?: any): Promise<void> {
      var self = this;
      if (isDoDismiss == null) isDoDismiss = true;
      if (this.progressLoader != null) {
         //var customHtmlMessage: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(message);
         const safeMessage: IonicSafeString = new IonicSafeString(message);
         //const safeMessage: IonicSafeString = this.sanitizer.sanitize(1, customHtmlMessage) as unknown as IonicSafeString;
         message = message.replaceAll('<br />', '\n');
         message = message.replaceAll('<br>', '\n');
         this.progressLoader.message = message;

         /*this.ngZone.run(() => {
            this.progressLoader.setContent(message);
            if (isDoDismiss === true) {
               setTimeout(() => {
                  self.dismissProgress();
               }, 20000);
            }
            resolve();
         });
         */
      } else {
         this.progressLoader = await this.progress.create({ message: message });
         this.progressLoader.present().then(() => {
            if (isDoDismiss === true) {
               setTimeout(() => {
                  self.dismissProgress();
               }, 20000);
            }
         });
      }
   }

   dataURItoBlob(dataURI: any) {
      console.log("dataURItoBlob called");
      // convert base64/URLEncoded data component to raw binary data held in a string
      //data:image/jpeg;base64,
      var byteString;
      //if (dataURI.split(',')[0].indexOf('base64') >= 0)
      //  byteString = window.atob(dataURI.split(',')[1]);
      //else
      byteString = window.atob(dataURI);
      // separate out the mime component
      //var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
      // convert to byte Array
      var mimeString = "image/jpeg";
      var array = [];
      for (var i = 0; i < byteString.length; i++) {
         array.push(byteString.charCodeAt(i));
      }
      return new Blob([new Uint8Array(array)], { type: mimeString });
   }

   /*
   hexToBlob(hexdata) {
     console.log("hexToBlob called");
     var byteArray = new Uint8Array(hexdata.length / 2);
     for (var x = 0; x < byteArray.length; x++) {
       byteArray[x] = parseInt(hexdata.substr(x * 2, 2), 16);
     }
     return new Blob([byteArray], { type: "application/octet-stream" });
   }
   */

   //**blob to dataURL**
   blobToDataURL(blob: any, callback: any) {
      var a = new FileReader();
      a.onload = (event: Event) => { callback(a.result); }
      a.readAsDataURL(blob);
   }


   checkAcrostic(word: any, acrostic: any): any {
      console.log("checkAcrostic called, word=" + word + ", acrostic=" + acrostic);
      var result: any = true;
      if (this.checkParenthesis(acrostic) === false) {
         result = "Parenthesis don't match";
         return result;
      }
      var word_split = word.toUpperCase().split(" ").join("").split("");
      //REMOVE PARENTHESIS IN ACROSTIC:------------------
      acrostic = acrostic.replace(/\([^)]*\)/g, "");//REPLACE ALL INSIDE PARENTHESIS INCLUSIVE
      acrostic = acrostic.replace(/\[[^]]*\]/g, "");//REPLACE ALL INSIDE SQUARE BRACKETS INCLUSIVE
      acrostic = acrostic.replace(/\{[^}]*\}/g, "");//REPLACE ALL INSIDE CURLY BRACKETS INCLUSIVE
      console.log("checkAcrostic called, word=" + word + ", FIXED acrostic=" + acrostic);
      //CHECK IF ALL BEGINNING LETTERS OF WORDS ARE CAPITAL AND NUMBER OF CAPITALS=WORD_LENGTH            
      var numUpper = (acrostic.match(/[A-Z]/g) || []).length;
      if (numUpper === 0) {
         result = "You entered no capital letters. First letters of each word in the acrostic should be capitalized and match the word itself.";
         return result;
      }
      //------------------------------------------------
      var acrostic_split = acrostic.trim().split(" ");

      var goodAcrosticCapitalLetters = [];
      var letterIndex = 0;
      var acrostic_word_split = [];
      for (var i = 0; i < acrostic_split.length; i++) {
         letterIndex = 0;
         acrostic_word_split = acrostic_split[i].split("");
         //console.log("acrostic_word_split(" + i + ")=" + acrostic_word_split);
         while (letterIndex < acrostic_word_split.length && acrostic_word_split[letterIndex].match(/[A-Z]/)) {
            goodAcrosticCapitalLetters.push({ "word_index": i, "letter": acrostic_word_split[letterIndex] });
            letterIndex++;
         }
      }
      console.log("numUpper(" + numUpper + ")=word_split.length(" + word_split.length + ") ?");
      console.log("goodAcrosticCapitalLetters = " + JSON.stringify(goodAcrosticCapitalLetters));
      var nextLetterIndex = 0;
      //012345
      //LIVELY
      //123456

      while (nextLetterIndex < word_split.length) {
         if (nextLetterIndex >= goodAcrosticCapitalLetters.length || word_split[nextLetterIndex] !== goodAcrosticCapitalLetters[nextLetterIndex].letter) {
            break;
         } else {
            nextLetterIndex++;
         }
      }
      console.log("nextLetterIndex = " + nextLetterIndex);
      var badWordIndex = 0;
      if (nextLetterIndex < word_split.length) {//RESULT IS BAD:
         if (goodAcrosticCapitalLetters.length < word_split.length) {
            result = "Not enough capital letters.<br />Still need words with these letters:<br />" + word.toUpperCase().substring(nextLetterIndex);
         } else {
            badWordIndex = goodAcrosticCapitalLetters[nextLetterIndex].word_index;//BAD WORD = CURRENT ACROSTIC WORD
            result = "Bad Word: " + acrostic_split[badWordIndex];
         }
         console.log("Bad Word: " + acrostic_split[badWordIndex]);
      }
      //---------------------------------------------------------------------------------------
      return result;
   }

   checkParenthesis(str: any): boolean {
      var parentheses = "[]{}()";
      var stack = [];
      var character;
      var bracePosition;

      for (var i = 0; character = str[i]; i++) {
         bracePosition = parentheses.indexOf(character);
         if (bracePosition === -1) {
            continue;
         }
         if (bracePosition % 2 === 0) {
            stack.push(bracePosition + 1); // push next expected brace position
         } else {
            if (stack.pop() !== bracePosition) {
               return false;
            }
         }
      }
      return stack.length === 0;
   }

   convertNumbersToNames(eveyear: any, isStudy: any, isAbbreviate: any, numbersArrayString: any): Promise<any> {
      console.log("Helpers convertNumbersToNames called, numbersArrayString = " + numbersArrayString);
      return new Promise(async (resolve, reject) => {
         if (!isStudy && (!numbersArrayString || String(numbersArrayString).trim() === '')) {
            let alert = await this.alertCtrl.create({
               header: "ALERT",
               subHeader: "<b>PLEASE ENTER SOME NUMBERS.</b>",
               buttons: ['Dismiss']
            });
            alert.present();
            resolve(null);
         }
         var numbers: any, text: any;
         if (eveyear != null) {
            numbers = eveyear.split(";");
            isAbbreviate = true;
         }
         if (eveyear == null) {
            if (isStudy == false) {
               numbers = numbersArrayString.split(";");
            }
            if (isStudy == true) {
               numbers = new Array();
               numbers.push("0000010102020303040405050606070708080909101011111212131314141515161617171818191920202121222223232424252526262727282829293030313132323333343435353636373738383939404041414242434344444545464647474848494950505151525253535454555556565757585859596060616162626363646465656666676768686969707071717272737374747575767677777878797980808181828283838484858586868787888889899090919192929393949495959696979798989999");
            }
            var count = 0;
            var numbersSplit;
            var promptNumber = "";
            for (var i = 0; i < numbers.length; i++) {
               count = 1;
               numbersSplit = numbers[i].split("");
               promptNumber = "NUMBER ";
               if (isStudy == false) {
                  text += promptNumber + String((i + 1)) + ": ";
               }
               for (var j = 0; j < numbersSplit.length; j++) {
                  text += numbersSplit[j];
                  if (count == 4) {
                     if (j != (numbersSplit.length - 1)) {
                        text += "-";
                     }
                     count = 0;
                  }
                  count++;
               }
               text += "<br />";
            }
            text += "<br />" + "<br />";
         }
         var onlyNumbersPattern = /[0-9]/;
         for (i = 0; i < numbers.length; i++) {
            if (numbers[i].match(onlyNumbersPattern) == null) {
               let alert = await this.alertCtrl.create({
                  header: "ALERT",
                  subHeader: "<b>MUST ENTER ONLY NUMBERS." + numbers[i] + ".</b>",
                  buttons: ['Dismiss']
               });
               alert.present();
               resolve(null);
            }
            if (numbers[i].length < 2) {
               let alert = await this.alertCtrl.create({
                  header: "ALERT",
                  subHeader: "<b>MUST ENTER A LENGTH OF 2 OR MORE.</b>",
                  buttons: ['Dismiss']
               });
               alert.present();
               resolve(null);
            }
         }
         console.log("Helpers convertNumbersToNames Helpers.celebrities = " + JSON.stringify(Helpers.celebrities));
         var returnArray = [];
         var numberString = "";
         var celebrityText = "";
         var group4Index = 0;
         var firstIndex = 0;
         var lastIndex = 0;
         var numbersIndex = 0;
         var celebritiesIndex = 0;
         //DO FIRST & LAST NAME * ACTION & NOUN REPEATEDLY:
         for (var i = 0; i < numbers.length; i++) {
            //GET NUMBER OF GROUPS OF 4:-->
            var groups4Length = Math.floor(numbers[i].length / 4);
            var remainder = numbers[i].length % 4;
            //---------------------------->
            //console.log("groups4Length = " + groups4Length + ", remainder = " + remainder);
            numberString = "";
            for (var j = 0; j < groups4Length; j++) {
               group4Index = 4 * j;
               numberString = "";
               if (isStudy === true) {
                  numberString += numbers[i].substring(group4Index, (group4Index + 2)) + ":<br />";
               }
               firstIndex = parseInt(numbers[i].substring(group4Index, (group4Index + 2)));
               lastIndex = parseInt(numbers[i].substring((group4Index + 2), (group4Index + 4)));
               numberString += Helpers.celebrities[firstIndex].First_Name + "<br />";
               numberString += Helpers.celebrities[firstIndex].Last_Name;
               if (isAbbreviate === false && Helpers.celebrities[firstIndex].Information !== '') {
                  numberString += "(" + Helpers.celebrities[firstIndex].Information + ")";
               }
               numberString += "<br />" + Helpers.celebrities[lastIndex].Action1;
               numberString += "<br />" + Helpers.celebrities[lastIndex].Action2;
               if (isAbbreviate === false && isStudy === false) {
                  numberString += "(" + Helpers.celebrities[lastIndex].First_Name + " " + Helpers.celebrities[lastIndex].Last_Name;
                  if (Helpers.celebrities[lastIndex].Information !== '') {
                     numberString += ": " + Helpers.celebrities[lastIndex].Information;
                  }
                  numberString += ")";
               }
               if (j != (groups4Length - 1)) {
                  returnArray.push(numberString);
               }
            }
            //REMAINDER 1: ONLY ACTION------------------------------------------->
            if (remainder === 1) {
               numbersIndex = groups4Length * 4;
               celebritiesIndex = parseInt(numbers[i].substring(numbersIndex, (numbersIndex + 1)) + "0");
               //GET ACTIONS OF celebrities: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90
               if (groups4Length > 0) {
                  numberString += "<br />AND<br />";
               }
               numberString += Helpers.celebrities[celebritiesIndex].Action1;
               if (isAbbreviate === false) {
                  numberString += "(" + Helpers.celebrities[celebritiesIndex].First_Name + " " + Helpers.celebrities[celebritiesIndex].Last_Name;
                  if (Helpers.celebrities[celebritiesIndex].Information !== '') {
                     numberString += ": " + Helpers.celebrities[celebritiesIndex].Information
                  }
                  numberString += ")";
               }
            }
            //REMAINDER  2: ACTION & NOUN------------------------------------------->
            else if (remainder === 2) {
               numbersIndex = groups4Length * 4;
               celebritiesIndex = parseInt(numbers[i].substring(numbersIndex, (numbersIndex + 2)));
               //console.log("CELEBRITIES REMAINDER 2 celebritiesIndex = " + celebritiesIndex);
               if (groups4Length > 0) {
                  numberString += "<br />AND<br />";
               }
               numberString += Helpers.celebrities[celebritiesIndex].Action1;
               numberString += "<br />" + Helpers.celebrities[celebritiesIndex].Action2;
               if (isAbbreviate === false) {
                  numberString += "(" + Helpers.celebrities[celebritiesIndex].First_Name + " " + Helpers.celebrities[celebritiesIndex].Last_Name;
                  if (Helpers.celebrities[celebritiesIndex].Information !== '') {
                     numberString += ": " + Helpers.celebrities[celebritiesIndex].Information;
                  }
                  numberString += ")";
               }
            }
            //REMAINDER  3: FIRST & ACTION & NOUN------------------------------------------->
            else if (remainder === 3) {
               numbersIndex = groups4Length * 4;
               firstIndex = parseInt(numbers[i].substring(numbersIndex, (numbersIndex + 2)));
               lastIndex = parseInt(numbers[i].substring((numbersIndex + 1), (numbersIndex + 3)));
               //console.log("CELEBRITIES REMAINDER 3 first2Index = " + firstIndex + ", last2Index = " + lastIndex);
               if (groups4Length > 0) {
                  numberString += "<br />AND<br />";
               }
               numberString += Helpers.celebrities[firstIndex].First_Name;
               if (isAbbreviate === false) {
                  numberString += "(" + Helpers.celebrities[firstIndex].Last_Name;
                  if (Helpers.celebrities[firstIndex].Information !== '') {
                     numberString += ": " + Helpers.celebrities[firstIndex].Information + ")";
                  } else {
                     numberString += ")";
                  }
               }
               numberString += "<br />" + Helpers.celebrities[lastIndex].Action1;
               numberString += "<br />" + Helpers.celebrities[lastIndex].Action2;
               if (isAbbreviate === false) {
                  numberString += "(" + Helpers.celebrities[lastIndex].First_Name + " " + Helpers.celebrities[lastIndex].Last_Name;
                  if (Helpers.celebrities[lastIndex].Information !== '') {
                     numberString += ": " + Helpers.celebrities[lastIndex].Information;
                  }
                  numberString += ")";
               }
            }
            returnArray.push(numberString);
         }
         //------------------------------------------->   
         var results = { "celebritiesArray": returnArray, "text": text };
         //console.log("CELEBRITIES RETURNING RESULTS = " + JSON.stringify(results));
         resolve(results);
      });
   }

   importSql(db: SQLiteDBConnection | null, sql: string): Promise<Boolean> {
      console.log("importSql called");
      this.currentDB = db;
      return new Promise((resolve, reject) => {
         if (this.isApp()) {
            this.currentDB?.execute(sql).then((data: any) => {
               resolve(true);
            })
               .catch((e: any) => {
                  console.log("HELPERS importSqlToDb ERROR: " + JSON.stringify(e));
                  resolve(true);
               });
         } else {
            try {
               const statementRegEx = /(?!\s|;|$)(?:[^;"']*(?:"(?:\\.|[^\\"])*"|'(?:\\.|[^\\'])*')?)*/g;
               if (!sql) {
                  sql = "";
               }
               this.statements = sql
                  .replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, "") // strip out comments
                  .match(statementRegEx);
               if (this.statements === null || (Array.isArray && !Array.isArray(this.statements))) this.statements = [];
               // Strip empty statements
               for (var i = 0; i < this.statements.length; i++) {
                  if (!this.statements[i]) {
                     delete this.statements[i];
                  }
               }
               this.doQueries(0, async (res: boolean) => {
                  if (res && db && !this.isApp()) {
                     await Helpers.sqlite?.saveToStore(db.getConnectionDBName());
                  }
                  resolve(res);
               });
            } catch (e: any) {
               console.log("importSql ERROR: " + e.message);
               resolve(false);
            }
            // finally {
            //   console.log("importSql FINISHED WITHOUT DOING ANYTHING!!!");
            //   return null;
            //}
         }
      });
   }

   doQueries(index: any, callback: any) {
      if (index < this.statements.length) {
         this.query(this.currentDB, this.statements[index], 'execute', []).then(() => {
            index++;
            this.doQueries(index, callback);
         }, (res: any) => {

            callback(false);
         });
      } else {
         callback(true);
      }
   }

   query(db: SQLiteDBConnection | null, query: string, method: String, params: any[] = []): Promise<any> {
      //console.log("query called: query=" + query + " params=" + JSON.stringify(params));
      Helpers.IS_DO_QUERY = true;
      return new Promise(async (resolve, reject) => {
         if (db) {
            try {
               console.log("Helpers.query, DOING " + method + "...");
               var res: any;
               if (method === "query") {
                  res = await db.query(query, params);
               } else if (method === "execute") {
                  res = await db.execute(query);
               }
               //console.log("Helpers.query, DID QUERY: " + query + ", res = " + JSON.stringify(res));
               Helpers.IS_DO_QUERY = false;
               if (res) {
                  await Helpers.sqlite?.saveToStore(db.getConnectionDBName());
               }
               resolve(res);
            } catch (err: any) {
               console.log("REJECTING EXECUTION!, query = " + query + ", ERROR = " + JSON.stringify(err));
               Helpers.IS_DO_QUERY = false;
               reject({ "message": "Error executing: SQL: " + query + ", ERROR:" + JSON.stringify(err) });
            }
         } else {
            Helpers.IS_DO_QUERY = false;
            reject({ "message": "Database does not exist." });
         }
      });
   }

   enableForeignKeys(): Promise<boolean> {
      return new Promise((resolve, reject) => {
         if (this.isApp() === false) {
            resolve(true);
         } else {
            if (Helpers.database_misc == null) {
               resolve(false);
            } else {
               Helpers.database_misc.execute("PRAGMA foreign_keys = ON;").then(() => {
                  if (Helpers.database_misc != null) {
                     Helpers.database_misc.execute("PRAGMA foreign_keys;").then((data: any) => {
                        console.log("IS FOREIGN KEYS = " + data.values[0].foreign_keys);
                        resolve(true);
                     }, () => {
                        resolve(false);
                     });
                  }
               }, () => {
                  resolve(false);
               });
            }
         }
      });
   }

   rateMe(callback: any) {
      console.log("helpers rateMe called, Helpers.isAppRated = " + Helpers.isAppRated + ", Helpers.User = " + JSON.stringify(Helpers.User));
      if (Helpers.isAppRated === false && Helpers.User && Helpers.User.Username && String(Helpers.User.Username) !== "harryman75") {
         Helpers.rateMeRuns++;
         if (Helpers.rateMeRuns < 5) {
            this.storage.set("RATE_ME_RUNS", Helpers.rateMeRuns).then(() => {
               console.log("SET RATE_ME_RUNS = " + Helpers.rateMeRuns);
               callback();
            });
         } else {
            Helpers.rateMeRuns = 0;
            this.storage.set("RATE_ME_RUNS", 0).then(async () => {
               //if (this.isApp() === false) {
               //   let alert = this.alertCtrl.create({
               //      title: "Learn Facts Quick",
               //      subTitle: "<b>Do you enjoy this App?</b><br />If you enjoy this App. would you mind talking a moment to rate it?",
               //      buttons: ['Dismiss']
               //  });
               //  alert.present().then(() => {
               //     callback();
               //  });
               //} else {
               //https://play.google.com/store/apps/details?id=com.lfq.lfq


               /*
                 this.launchReview.launch()
                    .then(() => console.log('Successfully launched store app'));
    
                 if (this.launchReview.isRatingSupported()) {
                    this.launchReview.rating()
                       .then((result) => {
                          console.log('Successfully launched rating dialog');
                          alert(result);
                          //this.this.storage.set("IS_APP_RATED", true).then(() => {
                          //Helpers.isAppRated = true;
                          //console.log("onRateDialogShow IS_APP_RATED storage variable set = " + Helpers.isAppRated);
    
    
    
                          callback();
                          //});
                       });
                 } else {
                    callback();
                 }
                 */

               /*
               this.appRate.preferences = {
                  usesUntilPrompt: 3,
                  displayAppName: 'Learn Facts Quick',
                  promptAgainForEachNewVersion: false,
                  //inAppReview: true,
                  //market://details?id=com.lfq.lfq
                  storeAppURL: {
                     ios: 'com.lfq.lfq',
                     android: 'market://details?id=com.lfq.lfq',
                     windows: 'ms-windows-store://review/?ProductId=com.lfq.lfq'
                  },
                  customLocale: {
                     title: 'Do you enjoy this App?',
                     message: 'If you enjoy this App. would you mind talking a moment to rate it?',
                     cancelButtonLabel: 'No, Thanks',
                     laterButtonLabel: 'Remind me Later',
                     rateButtonLabel: 'Rate it Now',
                     yesButtonLabel: "Yes!",
                     noButtonLabel: "Not Really",
                     appRatePromptTitle: 'Do you like using my App?',
                     feedbackPromptTitle: 'Mind giving us some feedback?',
                  },
                  callbacks: {
                     onRateDialogShow: function (callback) {
                        // show something               
                        console.log("onRateDialogShow callback called");
                        // TO DO : STOP SHOWING RATE MY APP POPUP!(USE STORAGE VARIABLE)
                        this.this.storage.set("IS_APP_RATED", true).then(() => {
                           Helpers.isAppRated = true;
                           console.log("onRateDialogShow IS_APP_RATED storage variable set = " + Helpers.isAppRated);
                           callback();
                        });
                     },
                     onButtonClicked: function (buttonIndex) {
                        // show something
                        console.log("onButtonClicked callback called, buttonIndex = " + buttonIndex);
                        callback();
                     }
                  }
               };
               this.appRate.promptForRating(true);
               */
               var rateResponse = 0;
               let alert = await this.alertCtrl.create({
                  header: "Do you enjoy using Learn Facts Quick? Would you mind taking a moment to rate it? It won\'t take more than a minute.\nThank for your support.",
                  buttons: [
                     {
                        text: 'No!',
                        cssClass: 'cancelRateMeButton',
                        handler: () => {
                           console.log('Dismiss rate clicked');
                           rateResponse = 0;
                           //callback();
                           return true;
                        }
                     },
                     {
                        text: 'Rate LFQ',
                        cssClass: 'confirmButton',
                        handler: () => {
                           console.log('Rate app button clicked');
                           rateResponse = 1;
                           return true;
                        }
                     }
                  ]
               });
               alert.present();
               alert.onDidDismiss().then(() => {
                  console.log("Rate popup dismissed, rateResponse = " + rateResponse);
                  if (rateResponse === 1) {
                     this.storage.set("IS_APP_RATED", true).then(() => {
                        Helpers.isAppRated = true;
                        if (this.platform.is('android')) {
                           window.open('market://details?id=com.lfq.learnfactsquickly');
                        } else if (this.platform.is('ios')) {
                           window.open('itms-apps://itunes.apple.com/us/app/domainsicle-domain-name-search/id511364723?ls=1&mt=8');
                        } else {
                           window.open('https://play.google.com/store/apps/details?id=com.lfq.learnfactsquickly');
                           window.open('market://details?id=com.lfq.lfq');
                        }
                        console.log("onRateDialogShow IS_APP_RATED storage variable set = " + Helpers.isAppRated);
                     });
                  } else {
                     callback();
                  }
               });
               //}

            });//END SET rateMeRuns
         }//END IF rateMeRuns>= 5
      } else {//END IF isAppRated IS FALSE
         callback();
      }
   }

   getSavedWords(numberArray: any) {
      console.log("getSavedWords called");
      var saved_words = "";
      var saved_numbers = "", saved_mnes = "";
      for (var i = 1; i <= 4; i++) {
         if (numberArray["Number" + i] && numberArray["Number" + i] !== "") {
            saved_numbers += numberArray["Number" + i];
            saved_mnes += numberArray["Number_Mnemonic" + i];
            if (numberArray["Number_Info" + i] && numberArray["Number_Info" + i] !== "") {
               saved_mnes += "(" + numberArray["Number_Info" + i] + ")";
            }
            if (i != 4) {
               saved_numbers += " ";
               saved_mnes += " ";
            }
         }
      }
      saved_words = saved_numbers + " " + saved_mnes;
      console.log("getSavedWords=" + saved_words);
      return saved_words;
   }

   getColumnNames(db: any, table: any): Promise<Array<string>> {
      console.log("getColumnNames called");
      var self = this;
      return new Promise((resolve, reject) => {

         if (Helpers.isWorkOffline === false) {
            var params = { select_table: table };
            this.makeHttpRequest("/lfq_directory/php/acrostics_tables_select_category.php", "GET", params).then((data) => {
               console.log("getColumnNames RESOLVING");
               resolve(data["CATEGORIES"]);
            }, error => {
               this.alertServerError(error.message);
               reject();
            });
         } else {
            self.query(db, "SELECT name, sql FROM sqlite_master WHERE type='table' AND name = '" + table + "'", 'query', []).then((data) => {
               console.log("the table create sql = " + data.values[0].sql);
               var columnParts = data.values[0].sql.replace(/^[^\(]+\(([^\)]+)\)/g, '$1').split(','); ///// RegEx
               console.log("columnParts = " + columnParts);
               var columnNames = [];
               for (var i in columnParts) {
                  if (typeof columnParts[i] === 'string')
                     columnNames.push(columnParts[i].trim().split(" ")[0]);
               }
               console.log(columnNames);
               resolve(columnNames);
            }).catch((error) => {
               console.log("ERROR:" + error.message);
               this.alertLfqError(error.message);
               reject();
            });
         }
      })
   }

   shuffleArray(array: any) {
      var currentIndex = array.length, temporaryValue, randomIndex;
      // While there remain elements to shuffle...
      while (0 !== currentIndex) {
         // Pick a remaining element...
         randomIndex = Math.floor(Math.random() * currentIndex);
         currentIndex -= 1;
         // And swap it with the current element.
         temporaryValue = array[currentIndex];
         array[currentIndex] = array[randomIndex];
         array[randomIndex] = temporaryValue;
      }
      return array;
   }

   sortArray(isReverse: any) {
      //console.log("sortArray isReverse = " + isReverse);
      return function (a: any, b: any) {
         var ret = 0;
         if (isNaN(a) && isNaN(b)) {
            a = String(a).toUpperCase();
            b = String(b).toUpperCase();
         }
         //console.log("sortArray comparing " + a + " and " + b);
         if (a > b) {
            ret = (isReverse === false ? 1 : -1);
            return ret;
         } else if (a < b) {
            ret = (isReverse === false ? -1 : 1);
            return ret;
         }
         else return 0;
      }
   }

   sortByItem(item: any, isReverse: any) {
      //console.log("sortByItem called, item = " + item + ", isReverse = " + isReverse);
      return function (a: any, b: any) {
         var ret = 0;
         if (a[item] > b[item]) {
            ret = (isReverse === false ? 1 : -1);
            //console.log("ret = " + ret);
            return ret;
         } else if (a[item] < b[item]) {
            ret = (isReverse === false ? -1 : 1);
            //console.log("ret = " + ret);
            return ret;
         }
         else return 0;
      }
   }


   sortByItemStrings(item: any, isReverse: any) {
      console.log("sortByItem called, item = " + item + ", isReverse = " + isReverse);
      return function (a: string, b: string) {
         var ret = 0;
         if (String(a[item]).toUpperCase() > String(b[item]).toUpperCase()) {
            ret = (isReverse === false ? 1 : -1);
            //console.log("ret = " + ret);
            return ret;
         } else if (String(a[item]).toUpperCase() < String(b[item]).toUpperCase()) {
            ret = (isReverse === false ? -1 : 1);
            //console.log("ret = " + ret);
            return ret;
         }
         else return 0;
      }
   }

   sortBy2Items(items: any, isReverses: any) {
      console.log("sortByItems called, items = " + JSON.stringify(items) + ", isReverses = " + JSON.stringify(isReverses));
      var count = items.length;
      return function (a: any, b: any) {
         var ret = 0;
         var lastIndex = count - 1;
         var compareInner = function (index: any) {
            if (a[items[index]] > b[items[index]]) {
               ret = (isReverses[index] === false ? 1 : -1);
            } else if (a[items[index]] < b[items[index]]) {
               ret = (isReverses[index] === false ? -1 : 1);
            } else {
               ret = 0;
            }
            return ret;
         };
         if (a[items[0]] > b[items[0]]) {
            if (isReverses[0] === false) {
               return compareInner(lastIndex);
            } else {
               return -1;
            }
         } else if (a[items[0]] < b[items[0]]) {
            if (isReverses[0] === true) {
               return compareInner(lastIndex);
            } else {
               return -1;
            }
         }
         else {
            return compareInner(lastIndex);
         }
      }
   }


   getTimestamp(date: any): String {
      var timestamp = date.getFullYear() + "-" + ("00" + (date.getMonth() + 1)).slice(-2) + "-" + ("00" + date.getDate()).slice(-2) + " ";
      timestamp += ("00" + date.getHours()).slice(-2) + ":" + ("00" + date.getMinutes()).slice(-2) + ":" + ("00" + date.getSeconds()).slice(-2);
      return timestamp;
   }

   setSQLiteConnection(): SQLiteConnection {
      if (!Helpers.sqlite) {
         Helpers.sqlite = new SQLiteConnection(CapacitorSQLite);
      }
      return Helpers.sqlite;
   }


   createDatabase(DB_NAME: string): Promise<SQLiteDBConnection | null> {
      console.log("Helpers.createDatabase called, DB_NAME = " + DB_NAME);
      var self = this;
      return new Promise(async (resolve, reject) => {
         const platform = Capacitor.getPlatform();
         console.log("Helpers.createDatabase platform = " + platform);
         Helpers.database = DB_NAME === "acrostics.db" ? Helpers.database_acrostics : Helpers.database_misc;
         if (Helpers.database) {
            resolve(Helpers.database);
         } else {
            if (Helpers.sqlite == null && !Helpers.database_acrostics && !Helpers.database_misc) {
               if (platform === 'web') {
                  jeepSqliteElements(window);
                  await Helpers.delay(5000);
                  Helpers.sqlite = self.setSQLiteConnection();
                  await Helpers.sqlite.initWebStore();
               } else if (platform === 'android' || platform === 'ios') {
                  Helpers.sqlite = self.setSQLiteConnection();
               }
            }
            if (Helpers.sqlite) {
               const isConnected = await Helpers.sqlite.isConnection(DB_NAME, false);
               var db: SQLiteDBConnection | null = null;
               console.log("Helpers.createDatabase CALLING Helpers.sqlite.isConnection GOT isConnected.result  = " + isConnected.result);
               if (isConnected.result !== true) {
                  console.log("Helpers.createDatabase CALLING Helpers.sqlite.createConnection ... ");
                  db = await Helpers.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
               }
               if (db != null) {
                  await db.open();
               }

               //await self.sqliteService.saveToStore('acrosticsSQLite.db');
               //await self.sqliteService.saveToStore('miscSQLite.db');
               console.log("Helpers.createDatabase DB_NAME created!");
               resolve(db);
            } else {
               resolve(null);
            }
         }
         //5 * 1024 * 1024
      });
   }

   public static delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
   }

   deleteDB(DB_NAME: any): Promise<void> {
      console.log("Helpers.deleteDB called, DB_NAME = " + DB_NAME);
      var self = this;
      return new Promise(async (resolve, reject) => {
         const platform = Capacitor.getPlatform();
         console.log("Helpers.deleteDB platform = " + platform);
         if (platform === 'web') {
            resolve();
         } else {
            Helpers.sqlite = self.setSQLiteConnection();
            Helpers.database = DB_NAME === "acrostics.db" ? Helpers.database_acrostics : Helpers.database_misc;
            try {
               if (!Helpers.database) {
                  const isConnected = await Helpers.sqlite.isConnection(DB_NAME, false);
                  console.log("Helpers.deleteDB CALLING Helpers.sqlite.isConnection GOT isConnected.result  = " + isConnected.result);
                  if (isConnected.result !== true) {
                     console.log("Helpers.deleteDB CALLING sqlite.createConnection  = " + isConnected.result);
                     Helpers.database = await Helpers.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
                     var isOpen: capSQLiteResult = await Helpers.database.isDBOpen();
                     if (isOpen.result?.valueOf() === true) {
                        await Helpers.database.close();
                     }
                  }
               }
               await Helpers.sqlite.closeConnection(DB_NAME, false);
               await Helpers.sqlite.deleteOldDatabases();
               console.log(`Database "${DB_NAME}" deleted successfully.`);
            } catch (error) {
               console.error(`Helpers.deleteDB Error deleting database "${DB_NAME}":`, error);
            }            
            resolve();
         }
         //   this.win.indexedDB.deleteDatabase(DB_NAME);//.then(() => {
         //resolve();
         //}
      });
   }//END deleteDB

   /**
   * @method: onlyUnique: Used for filtering only unique VINs. **Can be used to return other unique simple arrays.
   * @param value: An arbitrary array element value
   * @param index: The index of the arbitrary value
   * @param self: The array itself
   * @return: index
   **/
   onlyUnique(value: any, index: any, self: any) {
      return self.indexOf(value) === index;
   }

   getYearBC(year: string): string {
      if (year && parseInt(year) < 0) {
         year = String(year).replace("-", "") + " BC";
      }
      return year;
   }

   getYearInteger(year: string): string {
      if (year && String(year).match("BC") != null) {
         year = "-" + String(year).replace(" BC", "");
      }
      return year;
   }

   myAlert(title: any, subtitle: any, message: any, okButton: any): Promise<void> {
      return new Promise(async (resolve, reject) => {
         let alert = await this.alertCtrl.create({
            header: title,
            subHeader: subtitle,
            message: message,
            buttons: [okButton]
         });
         alert.present();
         alert.onDidDismiss().then(() => {
            resolve();
         });
      });
   }

   async alertLfqError(error: any) {
      let alert = await this.alertCtrl.create({
         header: "Alert",
         subHeader: "<b>LFQ ERROR:</b>",
         message: error,
         buttons: ['Dismiss']
      });
      alert.present();
   }

   async alertServerError(error: any) {
      let alert = await this.alertCtrl.create({
         header: "Server Error:",
         message: "<b>" + error + "<b>",
         buttons: ['Dismiss']
      });
      alert.present();
   }

   getIdTables(tables: any): Promise<any> {
      console.log("getOrderedByIdTables called tables=" + tables);
      return new Promise((resolve, reject) => {
         if (Helpers.isWorkOffline === false) {
            var params = {
               "tables": tables
            }
            this.makeHttpRequest("/lfq_app_php/acrostics_get_tables_ids.php", "POST", params).then((data) => {
               console.log("getIdTables RESOLVING = " + JSON.stringify(data["TABLES"]));
               resolve(data["TABLES"]);
            }, error => {
               this.alertServerError(error.message);
               reject();
            });
         } else {
            var sql = "SELECT Table_name,ID,User_ID from " + Helpers.TABLES_MISC.acrostic_table + " WHERE Table_name IN ('" + tables.join("','") + "')";
            this.query(Helpers.database_misc, sql, 'query', []).then((data) => {
               var idTablesGet = [];
               var idTables = [];
               for (var i = 0; i < data.values.length; i++) {
                  idTablesGet.push({ "Table_ID": data.values[i].ID, "Table_name": data.values[i].Table_name, "User_ID": data.values[i].User_ID });
               }
               var idTable;
               for (var i = 0; i < tables.length; i++) {
                  idTable = idTablesGet.filter((idTableGet) => { return idTableGet.Table_name === tables[i] })[0];
                  if (idTable) {
                     idTables.push(idTable);
                  }
               }
               console.log("getOrderedByIdTables RESOLVING=" + JSON.stringify(idTables));
               resolve(idTables);
            });
         }
      });
   }


   getDictionaryWords(isDoingProgress: any): Promise<any> {
      console.log("getAllDictionaryWords called");
      return new Promise((resolve, reject) => {
         this.setProgress("Getting all dictionary words...", isDoingProgress).then(() => {
            if (Helpers.isWorkOffline === false) {
               this.makeHttpRequest("/lfq_app_php/edit_dictionary_get_all_words.php", "GET", {}).then((data) => {
                  if (data["SUCCESS"] === true) {
                     resolve(data["WORDS"]);
                  } else {
                     this.alertLfqError(data["ERROR"]);
                     reject();
                  }
               }, error => {
                  this.alertServerError(error.message);
                  reject();
               });
            } else {
               var sql = "SELECT Word FROM " + Helpers.TABLES_MISC.dictionarya + " ORDER BY Word";
               this.query(Helpers.database_misc, sql, 'query', []).then((data) => {
                  var dictionaryWords = [];
                  if (data.values.length > 0) {
                     for (var i = 0; i < data.values.length; i++) {
                        dictionaryWords.push(data.values[i].Word);
                     }
                  }
                  resolve(dictionaryWords);
               }).catch((error) => {
                  this.alertLfqError(error.message);
                  reject();
               });
            }
         });
      });
   }

   getPeglist(): Promise<any> {
      console.log("getPeglist called");
      return new Promise((resolve, reject) => {
         var peglist: any = [];
         this.setProgress("Loading entries for " + Helpers.User.Username + ", please wait...", false).then(() => {
            if (Helpers.isWorkOffline === false) {
               var params = {
                  "username": Helpers.User.Username
               };
               this.makeHttpRequest("/lfq_directory/php/edit_peglist_get.php", "GET", params).then((data) => {
                  this.dismissProgress();
                  if (data["SUCCESS"] === true) {
                     peglist = data['WORDS'];
                     resolve(peglist);
                  } else {
                     this.alertLfqError(data["ERROR"]);
                     resolve(null);
                  }
               }, error => {
                  this.dismissProgress();
                  this.alertServerError("Error getting peglist: " + error.message);
                  resolve(null);
               });
            } else {
               var sql = "SELECT * FROM " + Helpers.TABLES_MISC.peglist + " a ";
               sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " ud ON ud.ID=a.User_ID ";
               sql += "WHERE ud.Username='" + Helpers.User.Username + "' ORDER BY Number";
               console.log("getPeglist called sql = " + sql);
               this.query(Helpers.database_misc, sql, 'query', []).then((data) => {
                  if (data.values.length > 0) {
                     for (var i = 0; i < data.values.length; i++) {
                        peglist.push(data.values[i].Entry);
                     }
                  }
                  this.dismissProgress();
                  resolve(peglist);
               }).catch(async (error) => {
                  let alert = await this.alertCtrl.create({
                     header: "Alert",
                     message: "<b>Error getting peglist: " + error.message + "</b>",
                     buttons: ['Dismiss']
                  });
                  alert.present();
                  this.dismissProgress();
                  resolve(null);
               });
            }
         });
      });
   }

   getCelebrityNumbers(): Promise<any> {
      console.log("getCelebrityNumbers called");
      return new Promise((resolve, reject) => {
         var celebrity_numbers: any = [];
         var celebritiesUser = Helpers.User ? Helpers.User.Username : "GUEST";
         this.setProgress("Loading celebrity numbers for " + celebritiesUser + ", please wait...", false).then(() => {
            if (Helpers.isWorkOffline === false) {
               var params = {
                  "username": celebritiesUser
               };
               this.makeHttpRequest("/lfq_directory/php/show_celebrity_numbers_get.php", "GET", params).then((data) => {
                  this.dismissProgress();
                  if (data["SUCCESS"] === true) {
                     celebrity_numbers = data['WORDS'];
                     console.log("getCelebrityNumbers RESOLVING celebrity_numbers = " + JSON.stringify(celebrity_numbers));
                     celebrity_numbers.forEach((cN: any) => {
                        if (!cN.Information) { cN.Information = ""; }
                     });
                     resolve(celebrity_numbers);
                  } else {
                     this.alertLfqError(data["ERROR"]);
                     resolve(null);
                  }
               }, error => {
                  this.dismissProgress();
                  this.alertServerError("Error getting celebrity_numbers: " + error.message);
                  resolve(null);
               });
            } else {
               var sql = "SELECT a.*,ud.Username FROM " + Helpers.TABLES_MISC.celebrity_number + " a ";
               sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " ud ON ud.ID=a.User_ID ";
               sql += "WHERE ud.Username='" + Helpers.User.Username + "' ORDER BY Number";
               console.log("getCelebrityNumbers called sql = " + sql);
               this.query(Helpers.database_misc, sql, 'query', []).then((data) => {
                  if (data.values.length > 0) {
                     for (var i = 0; i < data.values.length; i++) {
                        if (!data.values[i].Information) { data.values[i].Information = ""; }
                        celebrity_numbers.push(data.values[i]);
                     }
                  }
                  this.dismissProgress();
                  resolve(celebrity_numbers);
               }).catch(async (error) => {
                  let alert = await this.alertCtrl.create({
                     header: "Alert",
                     message: "<b>Error getting celebrity_numbers: " + error.message + "</b>",
                     buttons: ['Dismiss']
                  });
                  alert.present();
                  this.dismissProgress();
                  resolve(null);
               });
            }
         });
      });
   }

   /*
   getPaidAllowed(isNewUser: boolean): Promise<any> {
      return new Promise((resolve, reject) => {
         if (Helpers.isWorkOffline === false) {
            var url = "/lfq_app_php/check_if_users_allowed_use_app.php";
            var is_new_user = isNewUser === true ? "TRUE" : "FALSE";
            var params = {
               "deviceID": Helpers.device.Device_Number,
               "username": Helpers.User.Username,
               "is_new_user": is_new_user
            }
            this.makeHttpRequest(url, "POST", params).then((data) => {
               Helpers.isUserAllowedUsedApp = data.IS_ALLOWED;
               this.this.storage.set("IS_USER_ALLOWED_USE_APP", data.IS_ALLOWED).then(() => {
                  resolve(data);
               });
            });
         } else {
            var deviceUserClause = "";
            if (isNewUser === true) {
               deviceUserClause = "Device_Number='" + Helpers.device.Device_Number + "'";
            } else if (Helpers.User.Username === "GUEST") {
               deviceUserClause = "(Device_Number='" + Helpers.device.Device_Number + "' AND User_ID='" + Helpers.User.ID + "')";
            } else {
               deviceUserClause = "(Device_Number='" + Helpers.device.Device_Number + "' OR User_ID='" + Helpers.User.ID + "')";
            }
            //GET USERS WITH SAME DEVICE NUMBER:
            var sql_string = "SELECT COUNT(ID) AS COUNT, (SELECT MIN(DATE_INSTALLED) FROM " + Helpers.TABLES_MISC.sync_device_table + " WHERE IS_PAID='0' AND " + deviceUserClause + ") AS DATE_INSTALLED, (SELECT COUNT(ID) FROM " + Helpers.TABLES_MISC.sync_device_table + " WHERE IS_PAID='1' AND " + deviceUserClause + ") AS COUNT_PAID FROM " + Helpers.TABLES_MISC.sync_device_table + " WHERE " + deviceUserClause;
            this.query(Helpers.database_misc, sql_string, []).then((data) => {
               var isNew = data["COUNT"] === 0 ? true : false;
               var isPaid = parseInt(data["COUNT_PAID"]) > 0 ? true : false;
               var resolveData = { "IS_PAID": isPaid, "IS_ALLOWED": true, "IS_NEW": isNew };
               if (isPaid === false && data["DATE_INSTALLED"] != null) {
                  var timeNowMS = new Date().getTime();
                  var expiresMS = (1000 * 60 * 60 * 24 * Helpers.TRIAL_PERIOD_DAYS);
                  var timeInstalledMS = new Date(data["DATE_INSTALLED"]).getTime();
                  console.log("CHECK ALLOWED: timeNow=" + (new Date().toLocaleDateString()) + ", timeInstalled=" + (new Date(data["DATE_INSTALLED"]).toLocaleDateString()) + ", (timeNowMS - timeInstalledMS - sevenDaysMS) = " + (timeNowMS - timeInstalledMS - expiresMS));
                  if ((timeNowMS - timeInstalledMS) > expiresMS) {//MUST PAY!!!!
                     console.log("checkIfUserAllowedUseApp EXPIRED! MUST PAY!");
                     Helpers.isUserAllowedUsedApp = false;
                     this.this.storage.set("IS_USER_ALLOWED_USE_APP", false).then(() => {
                        resolveData["IS_ALLOWED"] = false;
                        resolve(resolveData);
                     });
                  } else {
                     this.this.storage.set("IS_USER_ALLOWED_USE_APP", true).then(() => {
                        resolve(resolveData);
                     });
                  }
               } else {
                  this.this.storage.set("IS_USER_ALLOWED_USE_APP", true).then(() => {
                     resolve(resolveData);
                  });
               }
            });
         }
      });
   }
   */

   /*
   purchase() {
      // Check For Review Status
      console.log("purchase called");
      this.setProgress("Completing transaction...", false).then(() => {
         if (!Helpers.appleProductId && !Helpers.googleProductId) {
            this.toastCtrl.create({
               message: 'This product has not yet been approved for purchase. Please submit it for review.',
               duration: 2000
            }).present();
            this.dismissProgress();
            return;
         }
 
         //this.configurePurchasing();
 
         if (!this.platform.is('cordova')) {
            this.dismissProgress();
            return;
         };
 
         let productId;
 
         if (this.platform.is('ios')) {
            productId = Helpers.appleProductId;
         } else if (this.platform.is('android')) {
            productId = Helpers.googleProductId;
         }
 
         try {
            let product = this.store.get(productId);
            console.log('Product Info: ' + JSON.stringify(product));
            this.store.order(productId).then(() => {
               console.log('Show 1 Tap Buy Succesfull');
               this.dismissProgress();
            }).catch(() => {
               console.log('Error Ordering From Store');
               this.dismissProgress();
            });
         } catch (err) {
            console.log('Error Ordering ' + JSON.stringify(err));
            this.dismissProgress();
         }
      });
   }
   */

   /*
   configurePurchasing() {
      console.log("configurePurchasing called");
      if (!this.platform.is('cordova')) { return; }
      console.log('Starting Configurations');
      let productId;
      try {
         if (this.platform.is('ios')) {
            productId = Helpers.appleProductId;
         } else if (this.platform.is('android')) {
            productId = Helpers.googleProductId;
         }
 
         // Register Product
         console.log('Registering Product ' + JSON.stringify(productId));
         this.store.verbosity = this.store.DEBUG;
         this.store.register({
            id: productId,
            alias: productId,
            type: this.store.NON_RENEWING_SUBSCRIPTION
         });
 
         //1) Registered
         //2) Loaded
         //3) Refresh
 
         // Handlers
         this.store.when(productId).approved((product: IAPProduct) => {
            // Purchase was approved
            //AFTER AGREE TO SUBSCRIPTION:---------------->
            console.log('purchase_approved, verifying..', { programId: Helpers.inAppPurchaseProgramID });
            product.verify();
            //this.subscribe();
         });
 
         this.store.when(productId).verified((product: IAPProduct) => {
            if (Helpers.isProductVerified === false) {
               console.log('purchase_verified, finishing..', { programId: Helpers.inAppPurchaseProgramID });
               product.finish();
               Helpers.isProductVerified = true;
               this.saveProductOwnedLfq();
            }
         });
 
         this.store.when(productId).registered((product: IAPProduct) => {
            console.log('Registered: ' + JSON.stringify(product));
            //Helpers.AppPrice = product.price;
         });
 
         this.store.when(productId).updated((product: IAPProduct) => {
            console.log('Loaded: ' + JSON.stringify(product));
            //CALLED AFTER store.when(approved) FOR SUBSCRIBING:...canPurchase=false, owned=false, introPricePaymentMode:FreeTrial
            /*{
            //"id": "learn_facts_quick_app_1",
            //"alias": "learn_facts_quick_app_1",
            //"type": "non renewing subscription",
            //"group": "",
            //"state": "valid",
            //"title": "Learn Facts Quick App",
            //"description": "This product allows the full use of Learn Facts Quick app without \nadvertisements.",
            //"priceMicros": 2990000,
            //"price": "$2.99",
            //"currency": "USD",
            //"countryCode": null,
            //"loaded": true,
            //"canPurchase": true,
            //"owned": false,
            //"introPrice": "",
            //"introPriceMicros": "",
            //"introPricePeriod": null,
            //"introPriceNumberOfPeriods": null,
            //"introPricePeriodUnit": null,
            //"introPriceSubscriptionPeriod": null,
            //"introPricePaymentMode": null,
            //"ineligibleForIntroPrice": null,
            //"discounts": [],
            //"downloading": false,
            //"downloaded": false,
            //"additionalData": null,
            //"transaction": null,
            //"trialPeriod": null,
            //"trialPeriodUnit": null,
            //"billingPeriod": null,
            //"billingPeriodUnit": null,
            //"valid": true
            //}            
            Helpers.AppPrice = product.price;
         });
 
         this.store.when(productId).cancelled((product) => {
            console.log('purchase_cancelled', {});
            //this.toastCtrl.create({
            //   message: 'Purchase was cancelled.',
            //   duration: 2000
            //}).present();
         });
 
         this.store.error((err) => {
            console.log('store_error: ', JSON.stringify(err));
            //alert('Store Error:' + JSON.stringify(err));
         });
 
         //Run some code only when the store is ready to be used
         // Errors
         this.store.when(productId).error((error) => {
            console.log('store_error', JSON.stringify(error));
            //alert('An Error Occured' + JSON.stringify(error));
         });
 
         // Specific query for one ID
         this.store.when(productId).owned((p: IAPProduct) => {
            console.log("LFQ OWNED DUDE!!!!!!!!!");
            console.log("APP PAID, SETTING Helpers.isAppPaid = true!!!");
            this.this.storage.set("IS_APP_PAID", true).then(() => {
               Helpers.isAppPaid = true;
               this.this.storage.set("IS_USER_ALLOWED_USE_APP", true).then(() => {
                  Helpers.isUserAllowedUsedApp = true;
               });
            });
         });
 
         // Refresh Always
         console.log('Refresh Store');
         this.store.refresh();
      } catch (err) {
         console.log('Error On Store Issues' + JSON.stringify(err));
      }
   }
   */

   /*
   saveProductOwnedLfq() {
      console.log("saveProductOwnedLfq  called");
      this.setProgress("Saving your app into LFQ database...", false).then(() => {
         if (Helpers.isWorkOffline === false) {
            var params = {
               "device_number": Helpers.device.Device_Number,
               "username": Helpers.User.Username
            };
            console.log("SENDING EDIT INFO PARAMS=" + JSON.stringify(params));
            this.makeHttpRequest("/lfq_directory/php/save_user_owned_app.php", "POST", params).then((data) => {
               this.dismissProgress();
               if (data["SUCCESS"] === true) {
                  this.finishSetUserPaid();
               } else {
                  this.alertLfqError(data["ERROR"]);
               }
            }, error => {
               this.dismissProgress();
               this.alertServerError("Sorry. Error editting information: " + error.message);
            });
         } else {
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.sync_device_table, Op_Type_ID.UPDATE, ["IS_PAID"], ['1'], { "Device_Number": Helpers.device.Device_Number, "User_ID": Helpers.User.ID })];
            this.autoSync(queries, null, null, null, null, null).then((res) => {
               Helpers.isForceSyncOnline = true;
               var isAlertedUpdatePaidError = false;
               if (res.isSuccess === false) {
                  isAlertedUpdatePaidError = true;
                  this.alertLfqError(res.results);
               }
               this.autoSync(queries, null, null, null, null, null).then((res) => {
                  Helpers.isForceSyncOnline = false;
                  this.dismissProgress();
                  if (res.isSuccess === true) {
                     this.finishSetUserPaid();
                  } else {
                     if (isAlertedUpdatePaidError === false) {
                        this.alertLfqError(res.results);
                     }
                  }
               });
            });
         }
      });
   }
   */


   /*
   finishSetUserPaid() {
      console.log("finishSetUserPaid called");
      Helpers.isAppPaid = true;
      this.this.storage.set("IS_APP_PAID", true).then(() => {
         let alert = this.alertCtrl.create({
            title: "Congratulations",
            subTitle: '<b>You now have Learn Facts Quick completely free & without the ads.<br /><span style="font-style:italic">Happy Learning!</span></b><br />**if you get syncing error, please login to the app and manually sync on the home page, so that your purchase is saved on LFQ server. Thanks again!',
            buttons: ['Woooop!']
         });
         alert.present();
      });
   }
   */

   getMysqlTime(): any {
      return new Date().toISOString().substring(0, 19).replace('T', ' ');
   }

   getUsernameByID(id: any): Promise<any> {
      return new Promise((resolve, reject) => {
         if (Helpers.isWorkOffline === false) {
            var params = {
               "User_ID": id
            };
            this.makeHttpRequest("/lfq_directory/php/get_username_by_id.php", "GET", params).then((data) => {
               if (data["SUCCESS"] === true) {
                  resolve(data["Username"]);
               } else {
                  this.dismissProgress();
                  reject();
                  this.alertLfqError(data["ERROR"]);
               }
            }, error => {
               this.dismissProgress();
               reject();
               this.alertServerError("Sorry. Error getting user id:" + error.message);
            });
         } else {
            var sql = "SELECT Username FROM " + Helpers.TABLES_MISC.userdata + " WHERE ID='" + id + "'";
            this.query(Helpers.database_misc, sql, 'query', []).then((data) => {
               resolve(data.values[0].Username);
            }).catch((error) => {
               this.dismissProgress();
               reject();
               this.alertLfqError(error.message);
            });
         }
      });
   }

   isJSON(str: any): boolean {
      try {
         JSON.parse(str);
      } catch (e) {
         return false;
      }
      return true;
   }

   isNumber(myNumber: any): boolean {
      return isNaN(parseFloat(myNumber)) === false;
   }

   parseSyncQuery(query: any): SyncQuery {
      var propsParse = ["Cols", "Vals", "Wheres", "Names", "Entry_Old", "Entry"];
      for (var p = 0; p < propsParse.length; p++) {
         if (query[propsParse[p]] && typeof query[propsParse[p]] === 'string' || query[propsParse[p]] instanceof String) {
            while (this.isJSON(query[propsParse[p]]) && typeof query[propsParse[p]] !== 'object') query[propsParse[p]] = JSON.parse(query[propsParse[p]]);
         }
      }
      return query;
   }

   parseDeviceParamsAsStrings(params: any) {
      for (var prop in params) {
         if (!isNaN(parseFloat(params[prop]))) {
            params[prop] = String([params[prop]]);
         } else if (params[prop] === true) {
            params[prop] = "true";
         } else if (params[prop] === false) {
            params[prop] = "false";
         } else if (params[prop] == null) {
            delete params[prop];
         }
      }
      return params;
   }

   convertFormalName(name: string, type: string): string {
      if (type === "DB_ACTIONS") {
         name = name.replace("ACTION_", "").replace(/_/g, " ");
         var nameSplit = name.split(" ");
         for (var ns = 0; ns < nameSplit.length; ns++) {
            nameSplit[ns] = nameSplit[ns].substring(0, 1).toUpperCase() + nameSplit[ns].substring(1).toLowerCase();
         }
         name = nameSplit.join(" ");
      }
      return name;
   }

   jsonToString(obj: any, requestGroup?: any): string {
      //console.log("jsonToString called obj = " + JSON.stringify(obj));
      var str = "";
      try {
         if (this.isJSON(obj)) {
            obj = JSON.parse(String(obj));
         }
         str = "";
         var tables = [];
         var whichType = "";
         if (requestGroup) {
            tables = requestGroup["REQUESTS"].map((request: any) => { return request.Table_name }).filter(this.onlyUnique);
            if (tables.indexOf(Helpers.TABLES_MISC.event_table) >= 0 || tables.indexOf(Helpers.TABLES_MISC.user_event) >= 0) {
               whichType = "EVENT_TABLE";
            }
         }
         if (whichType === "EVENT_TABLE") {
            var eventProps = ["Event", "Date", "Year", "Mnemonics"];
            for (var ep = 0; ep < eventProps.length; ep++) {
               if (obj[eventProps[ep]] && obj[eventProps[ep]].trim() !== "") {
                  str += "<b>" + eventProps[ep] + "</b>: " + obj[eventProps[ep]] + "<br />";
               }
            }
            var savedWords = this.getSavedWords(obj);
            if (savedWords.trim() !== "") {
               str += "<b>Major Words</b>: " + savedWords + "<br />";
            }
         } else {
            var getLoopObj = function (ob: any) {
               var ret = "";
               for (var prop in ob) {
                  ret += "<b>" + prop + "</b>: ";
                  if (typeof ob[prop] === 'object' && !Array.isArray(ob[prop])) {
                     /*
                     var propsOthersSorted = Object.keys(ob[prop]).filter((item)=>{return isNaN(parseInt(item))}).sort();
                     var propsNumbersSorted = Object.keys(ob[prop]).filter((item)=>{return !isNaN(parseInt(item))}).sort();
                     var myProps = propsOthersSorted.concat(propsNumbersSorted);
                     for (var p=0;p<myProps.length;p++) {
                        ret += "<b>" + myProps[p] + "</b>: " + ob[prop][myProps[p]] + "<br />";
                     } 
                     */
                     for (var prop2 in ob[prop]) {
                        ret += "<b>" + prop2 + "</b>: " + ob[prop][prop2] + "<br />";
                     }
                  } else if (Array.isArray(ob[prop])) {
                     ret += "<br />";
                     for (var ele = 0; ele < ob[prop].length; ele++) {
                        ret += "<b>" + (ele + 1) + ")</b><br />" + getLoopObj(ob[prop][ele]);
                     }
                  } else {
                     ret += ob[prop] + "<br />";
                  }
               }
               return ret;
            }
            if (!Array.isArray(obj)) {
               str += getLoopObj(obj);
            } else {
               for (var ele = 0; ele < obj.length; ele++) {
                  str += "<b>" + (ele + 1) + ")</b><br />" + getLoopObj(obj[ele]);
               };
            }
         }
      } catch (e) {
         if (obj && String(obj).trim() !== "") {
            str = JSON.stringify(obj);
         }
      }
      console.log("jsonToString returning str = " + str);
      return str;
   }

   jsonToStringPlain(json: any): string {
      var obj: any = {};
      var str_arr: any = [], str = "";
      if (json) {
         try {
            if (this.isJSON(json)) {
               obj = JSON.parse(json);
            } else if (typeof json === 'object') {
               obj = json;
            }
            for (var prop in obj) {
               str_arr.push(prop + ": " + obj[prop]);
            }
            str = str_arr.join(", ");
         } catch (e) {
            str = JSON.stringify(json);
         }
      }
      return str;
   }

   hash(input: string) {
      var md5 = forge.md.md5.create();
      //md5.start('md5', input);
      md5.update(input);
      var hash = md5.digest().toHex();
      console.log("HASH = " + hash);
      return hash;
   }

   isValidEmail(email: any): any {
      var reEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      var emailAlert = null;
      if (email == null || String(email).trim() === '' || reEmail.test(String(email).trim().toLowerCase()) === false) {
         if (email == null || String(email).trim() === '') {
            emailAlert = "Please enter an email.";
         } else if (reEmail.test(String(email).trim().toLowerCase()) === false) {
            emailAlert = "Please enter a valid email.";
         }
      }
      return emailAlert;
   }

   isValidPhone(phone: any): any {
      //var rePhone = /^(\+\d{1,2}\s)?[\s.-]\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/;
      var rePhone = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/;
      var phoneAlert = null;
      if (phone == null || String(phone).trim() === '' || rePhone.test(String(phone).trim()) === false) {
         if (phone == null || String(phone).trim() === '') {
            phoneAlert = "Please enter phone number.";
         } else if (rePhone.test(String(phone).trim()) === false) {
            phoneAlert = "Please enter a valid phone. Phone entered is:\n" + phone;
         }
      }
      return phoneAlert;
   }

   /*
   checkIsGooglePlayServicesAllowed(): Promise<any> {
      console.log("checkIsGooglePlayServicesAllowed called");
      return new Promise((resolve, reject) => {
         if (this.isApp() === false) {
            resolve(false);
         } else {
            try {
               this.fcm.isAllowed().then((res) => {
                  console.log("checkIsGooglePlayServicesAllowed RESOLVING WITH res=" + res);
                  var isAllowed = res === "TRUE" ? true : false;
                  resolve(isAllowed);
               });
            } catch (error) {
               console.log("this.fcm.isAllowed() IS NULL RESOLVING FALSE!!!");
               resolve(false);
            }
         }
      });
   }
   */

   clearRequests() {
      this.query(Helpers.database_misc, "DELETE FROM " + Helpers.TABLES_MISC.request + " WHERE 1", 'query', []).then((data) => {
         console.log("REQUESTS ALL CLEAR!");
      });
   }

   //NOTE DEVICE ID CHANGES IF UPGRADING
   setDevice(isReset: boolean): Promise<void> {
      console.log("setDevice CALLED!");
      var self = this;
      return new Promise((resolve, reject) => {
         this.storage.get("DEVICE").then((gotDevice: any) => {
            console.log("setDevice gotDevice = " + gotDevice);
            if (gotDevice != null) {
               Helpers.device = JSON.parse(gotDevice);
            }
            if (Helpers.device.Device_Number && Helpers.User.ID) {
               if (Helpers.isWorkOffline === false) {
                  var params = {
                     "device_number": Helpers.device.Device_Number,
                     "user_id": Helpers.User.ID,
                     "is_reset": isReset
                  }
                  self.makeHttpRequest("/lfq_directory/php/get_device.php", "POST", params).then((data) => {
                     if (data["SUCCESS"] === true) {
                        Helpers.device = data["DEVICE"];
                        this.storage.set("DEVICE", JSON.stringify(Helpers.device)).then(() => {
                           console.log("STORAGE SAVED DEVICE AS " + JSON.stringify(Helpers.device));
                           resolve();
                        });
                     } else {
                        resolve();
                     }
                  });
               } else {//IF OFFLINE:
                  var queryGet = "SELECT * FROM " + Helpers.TABLES_MISC.sync_device_table + " WHERE Device_Number=? AND User_ID=?";
                  var valsGet = [Helpers.device.Device_Number, Helpers.User.ID];
                  console.log("helpers.setDevice OFFLINE, query = " + queryGet + ", vals = " + JSON.stringify(valsGet));
                  self.query(Helpers.database_misc, queryGet, 'query', valsGet).then((data) => {
                     console.log("helpers.setDevice OFFLINE query RESOLVED, data.values.length = " + data.values.length);
                     if (data.values.length > 0) {
                        Helpers.device = data.values[0];
                        console.log("GOT DEVICE OFFLINE = " + JSON.stringify(Helpers.device));
                        this.storage.set("DEVICE", JSON.stringify(Helpers.device)).then(() => {
                           console.log("STORAGE SAVED DEVICE AS " + JSON.stringify(Helpers.device));
                           resolve();
                        });
                     } else {
                        //HAS BEEN UPDATED!! INSERT NEW ONE, AND AUTO SYNC IT===>
                        if (isReset === true) {
                           var colsSync = ["DATE_INSTALLED", "Sync_Time", "Device_Number", "User_ID"];
                           var valsSync = [this.getCurrentTimestamp(), this.getCurrentTimestamp(), Helpers.device.Device_Number, Helpers.User.ID];
                           var query = "REPLACE INTO " + Helpers.TABLES_MISC.sync_device_table + " (" + colsSync.join(",") + ") VALUES (?,?,?,?)";
                           console.log("REPLACE sync_device_table SQL = " + query + ", valsSDT = " + JSON.stringify(valsSync));
                           self.query(Helpers.database_misc, query, 'execute', valsSync).then((data) => {
                              self.query(Helpers.database_misc, queryGet, 'query', valsGet).then((data) => {
                                 console.log("helpers.setDevice OFFLINE query RESOLVED, data.values.length = " + data.values.length);
                                 if (data.values.length > 0) {
                                    var myDevice = data.values[0];
                                    Helpers.device = data.values[0];
                                    console.log("GOT DEVICE OFFLINE = " + JSON.stringify(myDevice));
                                    this.storage.set("DEVICE", JSON.stringify(myDevice)).then(() => {
                                       console.log("STORAGE RE-SAVED DEVICE AS " + JSON.stringify(myDevice));
                                       var wheres = { "Device_Number": Helpers.device.Device_Number, "User_ID": Helpers.User.ID };
                                       var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.sync_device_table, Op_Type_ID.REPLACE, colsSync, [valsSync], wheres)];
                                       //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
                                       self.autoSync(queries, Op_Type_ID.REPLACE, null, null, null, null).then((res) => {
                                          self.dismissProgress();
                                          resolve();
                                       });
                                    });
                                 } else {
                                    resolve();
                                 }
                              });
                           });
                        } else {
                           resolve();
                        }
                     }
                  });
               }
            } else {
               resolve();
            }
         });
      });
   }

   getCurrentTimestamp(): number {
      return Math.round((new Date()).getTime() / 1000);
   }

   getBase64(file: File, callback: Function) {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function () {
         callback(reader.result);
      };
      reader.onerror = function (error) {
         console.log('Error: ', error);
         callback(null);
      };
   }

   removeImageType(dataUrl: any): any {
      return dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
   }


   base64ToBlob(base64: any, contentType: any, sliceSize: number) {
      const byteCharacters = atob(base64);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
         const slice = byteCharacters.slice(offset, offset + sliceSize);

         const byteNumbers = new Array(slice.length);
         for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
         }

         const byteArray = new Uint8Array(byteNumbers);
         byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: contentType });
      return blob;
   }


   getPlaceID(placeType: any, placeTypeName: any): Promise<any> {
      return new Promise((resolve, reject) => {
         if (Helpers.isWorkOffline === false) {
            var params = {
               "place_type": placeType,
               "place_type_name": placeTypeName
            }
            this.makeHttpRequest("/lfq_directory/php/map_get_place_id.php", "GET", params).then((data) => {
               if (data["SUCCESS"] === true) {
                  resolve(data["ID"]);
               } else {
                  this.alertLfqError(data["ERROR"]);
                  resolve(null);//DONT INSERT IF ERROR
               }
            }, error => {
               this.alertServerError(error.message);
               resolve(null);//DONT INSERT IF ERROR
            });
         } else {
            var table = "";
            if (placeType === "COUNTRY") { table = Helpers.TABLES_MISC.map_country }
            else if (placeType === "STATE") { table = Helpers.TABLES_MISC.map_state }
            else if (placeType === "CITY") { table = Helpers.TABLES_MISC.map_city }
            var sql = "SELECT ID FROM " + table + " WHERE Name=?";
            var queryParams = [placeTypeName];
            this.query(Helpers.database_misc, sql, 'query', queryParams).then((data) => {
               console.log("getPlaceID OFFLINE data.values.length=" + data.values.length);
               if (data.values.length > 0) {
                  resolve(data.values[0].ID);
               } else {
                  this.alertLfqError("Place ID not found.");
                  resolve(null);
               }
            }, error => {
               this.alertLfqError(error.message);
               resolve(null);//DONT INSERT IF ERROR
            });
         }
      });
   }

   isRequest(userIdOld: number | null, userIdNew: number): boolean {
      var ret = (userIdOld != null && parseInt(String(userIdNew).trim()) !== parseInt(String(userIdOld).trim()));
      console.log("isRequest called, userIdOld = " + userIdOld + ", userIdNew = " + userIdNew, " ret = " + ret);
      return ret;
   }

   isQueryValNull(val: any): boolean {
      //RETURNS false if val is not null and string value is not 'null' or 'undefined'
      return (val == null || ((typeof val === 'string' || val instanceof String) && (val.trim() === "" || val.toUpperCase() === "NULL" || val.toLowerCase() === "undefined")));
   }

   adsUpdateClicked(isClickedAd: any): Promise<void> {
      console.log("adsUpdateClicked clicked");
      var self = this;
      return new Promise((resolve, reject) => {
         if (isClickedAd === false) {
            resolve();
         } else {
            this.setProgress("Updating number of user's clicked ads, please wait...", true).then(() => {
               var adsToClick = (Helpers.ADS_TO_CLICK - 1);
               var countClicked = Helpers.MIN_AD_CLICKS - adsToClick;
               var cols = ["Device_ID", "Count"];
               var vals = [[Helpers.device.ID, countClicked]];
               //var wheres = { "Device_ID": Helpers.device.ID };
               //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
               var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.ad_click, Op_Type_ID.REPLACE, cols, vals, null)];
               //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
               this.autoSync(queries, Op_Type_ID.REPLACE, null, null, null, null).then((res) => {
                  this.dismissProgress();
                  Helpers.ADS_TO_CLICK = adsToClick;
                  this.storage.set("ADS_TO_CLICK", adsToClick);
                  if (Helpers.ADS_TO_CLICK <= 0) {
                     this.storage.set("IS_CLICKED_ADS", true);
                     Helpers.IS_CLICKED_ADS = true;
                     resolve();
                  } else {
                     resolve();
                  }
               });
            });
         }
      });
   }

   isClickedAds(): Promise<boolean> {
      console.log("isClickedAds called");
      var self = this;
      return new Promise((resolve, reject) => {
         this.storage.get("IS_CLICKED_ADS").then((val: any) => {
            if (val != null && val === true) {
               resolve(true);
            } else {
               if (Helpers.isWorkOffline === false) {
                  var params = {
                     "device_number": Helpers.device.number
                  }
                  self.makeHttpRequest("/lfq_directory/php/ads_check_clicked.php", "GET", params).then((data) => {
                     if (data["SUCCESS"] === true) {
                        console.log("isClickedAds: data['IS_CLICKED_ADS'] = " + data['IS_CLICKED_ADS']);
                        Helpers.IS_CLICKED_ADS = data["IS_CLICKED_ADS"];
                        this.storage.set("IS_CLICKED_ADS", data["IS_CLICKED_ADS"]);
                        resolve(data["IS_CLICKED_ADS"])
                     } else {
                        //this.alertLfqError(data["ERROR"]);
                        console.log("CLICKED ADS CHECK ERROR: " + data["ERROR"]);
                        resolve(false);
                     }
                  }, error => {
                     //this.alertServerError(error.message);
                     console.log("CLICKED ADS CHECK SERVER ERROR: " + error.message);
                     resolve(false);
                  });
               } else {
                  var sql = "SELECT Count FROM " + Helpers.TABLES_MISC.ad_click + " AS ac INNER JOIN sync_device_table AS sdt ON sdt.ID=ac.Device_ID WHERE sdt.Device_Number=?";
                  var queryParams = [Helpers.device.Device_Number];
                  self.query(Helpers.database_misc, sql, 'query', queryParams).then((data) => {
                     console.log("isClickedAds OFFLINE data.values.length=" + data.values.length);
                     if (data.values.length > 0) {
                        var count = parseInt(String(data.values[0].Count));
                        var isDoneClicked = count >= Helpers.MIN_AD_CLICKS;
                        Helpers.IS_CLICKED_ADS = isDoneClicked;
                        this.storage.set("IS_CLICKED_ADS", isDoneClicked);
                        resolve(isDoneClicked);
                     } else {
                        console.log("Count ad clicks not found.");
                        resolve(false);
                     }
                  }, error => {
                     console.log("Error getting count ad clicks: " + error.message);
                     resolve(false);
                  });
               }
            }
         });
      });
   }

   /**
* @method insertCheckExists: Checks if exists before insert, resolves true(exists), false(not exists)
* @param databaseId: Database ID(1 or 2)
* @param tableName: Table name
* @param wheres: JSON object: Where to check
* @return: Promise true if exists(or fails) false otherwise
*/
   insertCheckExists(databaseTypeId: DB_Type_ID, tableName: string, Wheres: any): Promise<any> {
      var self = this;
      return new Promise((resolve, reject) => {
         if (Helpers.isWorkOffline === false) {
            var params = {
               "database_type_id": databaseTypeId,
               "table_name": tableName,
               "wheres": Wheres
            }
            self.makeHttpRequest("/lfq_directory/php/check_exists.php", "POST", params).then((data) => {
               if (data["SUCCESS"] === true) {
                  if (data["IS_EXISTS"] === true) {
                     resolve(data["ENTRY"]);
                  } else {
                     resolve(false);
                  }
               } else {
                  this.alertLfqError(data["ERROR"]);
                  resolve(null);//DONT INSERT IF ERROR
               }
            }, error => {
               this.alertServerError(error.message);
               resolve(null);//DONT INSERT IF ERROR
            });
         } else {
            var myDB = databaseTypeId === DB_Type_ID.DB_ACROSTICS ? Helpers.database_acrostics : Helpers.database_misc;
            var where_cols: any = [];
            var where_vals: any = [];
            for (var prop in Wheres) {
               if (self.isQueryValNull(Wheres[prop]) === false) {
                  where_cols.push(prop + ' = ?');
                  where_vals.push(Wheres[prop]);
               }
            }
            var where_str = "";
            if (where_cols.length > 0) {
               where_str = " WHERE " + where_cols.join(' AND ');
            }
            var sql_string = "SELECT * FROM " + tableName + where_str;
            self.query(myDB, sql_string, 'query', where_vals).then((data) => {
               if (data.values.length > 0) {
                  resolve(data.values[0]);
               } else {
                  resolve(false);
               }
            }, error => {
               console.log("Error checking exists: " + error.message);
               resolve(null);//DONT INSERT IF ERROR.
            });
         }
      });
   }

   formatNumber(number: number): string {
      var parts = number.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
   }

   getMajorWords(number: number, limit: number): Promise<any> {
      return new Promise((resolve, reject) => {
         if (Helpers.isWorkOffline === false) {
            var params = {
               find_word: number,
               limit: limit
            };
            this.makeHttpRequest("/lfq_app_php/timeline_get_major_words.php", "GET", params).then((data) => {
               if (data["SUCCESS"] === true) {
                  resolve(data["MAJOR_WORDS"]);
               } else {
                  resolve(false);
                  this.alertLfqError(data["ERROR"]);
               }
            }, error => {
               console.log("sql:" + sql + ", ERROR:" + error.message);
               this.alertServerError(error.message);
               resolve(false);
            });
         } else {
            var sql = "";
            var queryParams = [];
            if (this.isApp()) {
               sql = "SELECT a.* FROM ";
               sql += "(SELECT * FROM " + Helpers.TABLES_MISC.dictionarya + " ";
               sql += "WHERE Number LIKE '" + number + "%' ";
               sql += "ORDER BY RANDOM() LIMIT " + limit + ")a ";
               sql += "ORDER BY a.Word";
            } else {//BROWSER:
               var randomSeed = (Math.random() + 1) * 1111111;
               queryParams.push(randomSeed);
               sql = "SELECT a.* FROM ";
               sql += "(SELECT * FROM " + Helpers.TABLES_MISC.dictionarya + " ";
               sql += "WHERE Number LIKE '" + number + "%' ";
               sql += "ORDER BY ID * ? % 10000 LIMIT " + limit + ")a ORDER BY a.Word";
               console.log("BROWSER RANDOM SQL = " + sql);
            }
            this.query(Helpers.database_misc, sql, 'query', queryParams).then((data) => {
               var major_words = [];
               for (var i = 0; i < data.values.length; i++) {
                  major_words.push(data.values[i]);
               }
               resolve(major_words);
            }).catch((error) => {//END SELECT QUERY
               console.log("sql:" + sql + ", ERROR:" + error.message);
               resolve(false);
            });
         }
      });
   }

   encryptData(data: any) {
      try {
         return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
      } catch (e) {
         console.log(e);
         return false;
      }
   }

   decryptData(data: any) {
      if (data == null) {
         return null;
      } else {
         try {
            //const bytes = CryptoJS.AES.decrypt(data, this.ENCRYPTION_KEY);
            //if (bytes.toString()) {
            //   return bytes.toString(CryptoJS.enc.Utf8);
            //}
            return data;
         } catch (e) {
            console.log(e);
            return null;
         }
      }
   }

   setEncryptionKey(loginData: any) {
      //var encData = CryptoJS.SHA256(loginData).toString(CryptoJS.enc.Base64);
      //if (encData !== false) {
      //  this.ENCRYPTION_KEY = encData;
      //}
   }

   usernameHash(username: any) {
      var code = "";
      for (var i = 0; i < username.length; i++) {
         code += username.charCodeAt(i) % 13;
      }
      return code;
   }

   mysql_real_escape_string(str: any): any {
      if (typeof str != 'string')
         return str;

      /*
      return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
         switch (char) {
            case "\0":
               return "\\0";
            case "\x08":
               return "\\b";
            case "\x09":
               return "\\t";
            case "\x1a":
               return "\\z";
            case "\n":
               return "\\n";
            case "\r":
               return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
               return "\\" + char; // prepends a backslash to backslash, percent,
            // and double/single quotes
         }
      });
      */
   }

   getAcrosticTables(): Promise<any> {
      return new Promise((resolve, reject) => {
         if (Helpers.isWorkOffline === false) {
            this.makeHttpRequest("/lfq_directory/php/get_acrostics_tables.php", "GET", null).then((data) => {
               if (data["SUCCESS"] === true) {
                  resolve(data["TABLES"]);
               } else {
                  this.alertLfqError(data["ERROR"]);
               }
            }, error => {
               console.log("ERROR:" + error.message);
               this.alertServerError("Sorry. Error getting table names: " + error.message);
               resolve(false);
            });
         } else {//OFFLINE:
            var sql = "SELECT at.Table_name, at.User_ID, ud.Username FROM " + Helpers.TABLES_MISC.acrostic_table + " AS at INNER JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=at.User_ID ORDER BY at.Table_name";
            this.query(Helpers.database_misc, sql, 'query', []).then((data) => {
               var tables = [];
               if (data.values.length > 0) {
                  for (var i = 0; i < data.values.length; i++) {
                     tables.push(data.values[i]);
                  }
               }
               resolve(tables);
            }).catch((error) => {
               console.log("sql:" + sql + ", ERROR:" + error.message);
               this.alertLfqError(error.message);
               resolve(false);
            });
         }
      });
   }

   getMnemonicsTables(isDoingProgress: any): Promise<any> {
      console.log("getMnemonicsTables called.");
      var self = this;
      return new Promise((resolve, reject) => {
         self.setProgress("Loading tables ,please wait...", isDoingProgress).then(() => {
            if (Helpers.isWorkOffline === false) {
               self.makeHttpRequest("/lfq_directory/php/get_mnemonics_tables.php", "GET", null).then((data) => {
                  if (data["SUCCESS"] === true) {
                     resolve(data["TABLES"]);
                  } else {
                     self.alertLfqError(data["ERROR"]);
                     resolve(false);
                  }
               }, error => {
                  console.log("ERROR:" + error.message);
                  self.alertServerError(error.message);
                  resolve(false);
               });
            } else {//OFFLINE GET CATEGORIES:
               var sql = "SELECT mc.ID, mc.Name AS Category, mc.User_ID, ud.Username FROM " + Helpers.TABLES_MISC.mnemonic_category + " AS mc INNER JOIN userdata AS ud ON ud.ID=mc.User_ID ORDER BY mc.Name";
               self.query(Helpers.database_misc, sql, 'query', []).then((data) => {
                  var tables = [];
                  if (data.values && data.values.length > 0) {
                     for (var i = 0; i < data.values.length; i++) {
                        tables.push(data.values[i]);
                     }
                  }
                  resolve(tables);
               }).catch((error) => {
                  self.alertLfqError(error.message);
                  resolve(false);
                  //this.getTitles(true);
               });
            }
         });
      });
   }

   getMnemonicsTitles(category: any): Promise<any> {
      console.log("getMnemonicsTitles called");
      var self = this;
      return new Promise((resolve, reject) => {
         if (Helpers.isWorkOffline === false) {
            var params = {
               "table": category
            };
            self.makeHttpRequest("/lfq_directory/php/get_mnemonics_titles.php", "GET", params).then((data) => {
               console.log("NUMBER OF TITLES=" + data["TITLES"].length);
               var titles = [];
               if (data["SUCCESS"] === true) {
                  resolve(data["TITLES"]);
               } else {
                  self.alertLfqError(data["ERROR"]);
                  resolve(false);
               }
            }, error => {
               console.log("ERROR:" + error.message);
               self.alertServerError(error.message);
               resolve(false);
            });
         } else {//OFFLINE GET TITLES:
            var sql = "SELECT m.*,m.ID AS Mnemonic_ID, mt.Name AS Mnemonic_Type, mc.Name AS Category, ud.Username FROM " + Helpers.TABLES_MISC.mnemonic + " AS m ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.mnemonic_type + " AS mt ON mt.ID=m.Mnemonic_Type_ID ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.mnemonic_category + " AS mc ON mc.ID=m.Mnemonic_Category_ID ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=m.User_ID ";
            sql += "WHERE mc.Name=? GROUP BY m.ID";

            self.query(Helpers.database_misc, sql, 'query', [category]).then((data) => {
               console.log("NUMBER OF TITLES=" + data.values.length);
               var titles = [];
               for (var i = 0; i < data.values.length; i++) {
                  titles.push(data.values[i]);
               }
               resolve(titles);
            }).catch((error) => {
               self.alertLfqError(error.message);
               resolve(false);
            });
         }
      });
   }

   getNumbersTitles(isDoingProgress: boolean, table: string, type?: string): Promise<any> {
      console.log("getNumbersTitles called. table=" + table);
      return new Promise((resolve, reject) => {
         var prompt_table = table === Helpers.TABLES_MISC.global_number ? "Shared Numbers" : Helpers.User.Username + "'s Numbers";
         this.setProgress("Loading titles for " + prompt_table + ", please wait...", isDoingProgress).then(() => {
            var titles = [];
            if (Helpers.isWorkOffline === false) {
               var params: any = {
                  "table": table,
                  "username": Helpers.User.Username
               };
               if (type) {
                  params["type"] = type;
               }
               this.makeHttpRequest("/lfq_directory/php/get_numbers_titles.php", "GET", params).then((data) => {
                  if (data["SUCCESS"] === true) {
                     resolve(data["ENTRIES"]);
                  } else {
                     this.alertLfqError(data["ERROR"]);
                     resolve(false);
                  }
               }, error => {
                  this.alertServerError(error.message);
                  resolve(false);
               });
            } else {
               var sql = "";
               if (table === Helpers.TABLES_MISC.global_number) {
                  sql = "SELECT gne.Number_ID, gn.User_ID, gn.Title, gne.Entry_Index, gne.Entry, gne.Entry_Info, gne.Entry_Mnemonic, gne.Entry_Mnemonic_Info, ud.Username FROM "
                  sql += Helpers.TABLES_MISC.global_number + " AS gn INNER JOIN " + Helpers.TABLES_MISC.global_number_entry + " AS gne ON gne.Number_ID=gn.ID ";
                  sql += "INNER JOIN userdata AS ud ON ud.ID=gn.User_ID GROUP BY gn.Title ORDER BY gn.Title,gn.ID";
               } else {//FOR USER NUMBERS TABLE
                  var Data_Type_ID = type === 'PERSONAL' ? '1' : '2';
                  sql = "SELECT une.Number_ID, un.User_ID, un.Title, une.Entry_Index, une.Entry, une.Entry_Info, une.Entry_Mnemonic, une.Entry_Mnemonic_Info, ud.Username FROM ";
                  sql += Helpers.TABLES_MISC.user_number + " AS un INNER JOIN " + Helpers.TABLES_MISC.user_number_entry + " AS une ON une.Number_ID=un.ID ";
                  sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=un.User_ID ";
                  sql += "WHERE ud.Username='" + Helpers.User.Username + "' AND un.Data_Type_ID='" + Data_Type_ID + "' ";
                  sql += "GROUP BY un.Title ORDER BY un.Title,un.Data_Type_ID";
               }
               this.query(Helpers.database_misc, sql, 'query', []).then((data) => {
                  var entries = [];
                  for (var i = 0; i < data.values.length; i++) {
                     entries.push(data.values[i]);
                  }
                  resolve(entries);
               }).catch((error) => {
                  this.alertLfqError(error.message);
                  resolve(false);
               });
            }
         });
      });
   }

   getMnemonicText(mnemonic: Array<any>, peglist: Array<any>): string {
      console.log("getMnemonicText called");
      var text = "";
      var type = Mnemonic_Type_ID[mnemonic[0]["Mnemonic_Type_ID"]];
      var anaspl = "", anagram = "", majwordspl = [], maj_word = "";
      if (type === "number_major" || type === "number_letters") {
         if (mnemonic[0]["Number"]) {
            text += "<b>" + this.formatNumber(mnemonic[0]["Number"]);
            if (parseInt(mnemonic[0]["Number_Power"]) !== 0) text += " X 10^" + mnemonic[0]["Number_Power"];
            text += "</b><br />";
         }
      }
      for (var i = 0; i < mnemonic.length; i++) {
         if (type === "anagram" && i === 0) {
            if (mnemonic[i].Entry_Mnemonic) {
               anaspl = mnemonic[i].Entry_Mnemonic.split("");
               anagram = "";
               for (var a = 0; a < anaspl.length; a++) {
                  if (anaspl[a].match("[A-Z]") != null) {
                     anagram += "<b>" + anaspl[a] + "</b>";
                  } else {
                     anagram += anaspl[a];
                  }
               }
               text += anagram + "<br />";
            }
         }

         if (type === "mnemonic") {
            if (mnemonic[i].Entry_Mnemonic.length > 0) {
               text += "<b>" + mnemonic[i].Entry_Index + ". " + mnemonic[i].Entry_Mnemonic.substring(0, 1).toUpperCase() + "</b>";
            }
            if (mnemonic[i].Entry_Mnemonic.length > 1) {
               text += mnemonic[i].Entry_Mnemonic.substring(1);
            }
            if (mnemonic[i].Entry.length > 0) {
               text += "(<b>"
                  + mnemonic[i].Entry.substring(0, 1).toUpperCase() + "</b>";
               if (mnemonic[i].Entry.length > 1) {
                  text += mnemonic[i].Entry.substring(1);
               }
            }
            if (this.isQueryValNull(mnemonic[i].Entry_Info) === false) {
               text += "("
                  + mnemonic[i].Entry_Info
                  + ")  ";
            }
            text += ")";
         }
         if (type === "anagram") {
            if (mnemonic[i].Entry && mnemonic[i].Entry.length > 0) {
               text += "<b>"
                  + mnemonic[i].Entry_Index
                  + ". "
                  + mnemonic[i].Entry.substring(0, 1).toUpperCase()
                  + "</b>";
               if (mnemonic[i].Entry.length > 1) {
                  text += mnemonic[i].Entry.substring(1);
               }
            }
            if (this.isQueryValNull(mnemonic[i].Entry_Info) === false) {
               text += "("
                  + mnemonic[i].Entry_Info
                  + ")  ";
            }

         }
         if (type === "number_major" || type === "number_letters") {
            text += "<b>"
               + mnemonic[i].Entry_Index
               + ". "
               + ((mnemonic[i].Entry_Mnemonic) ? mnemonic[i].Entry_Mnemonic : "")
               + ":</b> ";
            majwordspl = mnemonic[i].Entry.split("");
            maj_word = "";
            for (var k = 0; k < majwordspl.length; k++) {
               if (majwordspl[k].match("[A-Z]") != null) {
                  maj_word += "<b>"
                     + majwordspl[k]
                     + "</b>";
               } else {
                  maj_word += majwordspl[k];
               }
            }
            text += maj_word;
            if (this.isQueryValNull(mnemonic[i].Entry_Info) === false) {
               text += "("
                  + mnemonic[i].Entry_Info
                  + ")   ";
            }

         }
         if (type === "peglist") {
            text += "<b>"
               + mnemonic[i].Entry_Index
               + ".</b> "
               + mnemonic[i].Entry;
            if (this.isQueryValNull(mnemonic[i].Entry_Info) === false) {
               text += "("
                  + mnemonic[i].Entry_Info
                  + ")  ";
            }

            text += "((#"
               + mnemonic[i].Entry_Index
               + ":"
               + peglist[parseInt(mnemonic[i].Entry_Index) - 1]
                  .toUpperCase()
               + ")"
               + mnemonic[i].Entry_Mnemonic
               + ")   ";

         }
         if (parseInt(mnemonic[i].Is_Linebreak) === 1) {
            text += "<br />";
         } else {
            text += " ";
         }
      }
      return text;
   }

   async confirmPopup(title: string, cancelPrompt: string, confirmPrompt: string, callback: Function) {
      var res: any = null;
      let alert = await this.alertCtrl.create({
         header: title,
         buttons: [
            {
               text: cancelPrompt,
               cssClass: 'cancelButton',
               handler: () => {
                  console.log('helpers.confirmPopup Cancel clicked');
                  res = false;
                  //callback();
                  return true;
               }
            },
            {
               text: confirmPrompt,
               cssClass: 'confirmButton',
               handler: () => {
                  console.log('helpers.confirmPopup Confirm clicked');
                  res = true;
                  return true;
               }
            }
         ]
      });
      alert.present();
      alert.onDidDismiss().then(() => {
         callback(res);
      });
   }

}


interface myObject {
   [key: string]: any;
}
