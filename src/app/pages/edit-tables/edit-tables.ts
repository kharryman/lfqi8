import { Component } from '@angular/core';
import { NavController, AlertController, LoadingController, Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';
import { DB_Type_ID, Helpers, Op_Type, Op_Type_ID, SyncQuery, User_Action_Request } from '../../providers/helpers/helpers';
import { NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import {PrettifyPipe} from '../../pipes/prettify/prettify';
import {DeprettifyPipe} from '../../pipes/deprettify/deprettify';


@Component({
   selector: 'page-edit-tables',
   templateUrl: 'edit-tables.html',
   styleUrl: 'edit-tables.scss'
})


export class EditTablesPage {
   public pageName:string = "Edit Tables";
   prettify: PrettifyPipe;
   deprettify: DeprettifyPipe;
   progressLoader: any;
   public database_acrostics: SQLiteDBConnection;
   public database_misc: SQLiteDBConnection;
   editTables: any;
   cat_arr: any;
   table_columns: any;
   table_data_types: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;

   constructor(public navCtrl: NavController, private platform: Platform, private alertCtrl: AlertController, public progress: LoadingController, public storage: Storage, public helpers: Helpers, public ngZone: NgZone) {
      this.onPauseSubscription = this.platform.pause.subscribe(() => {
         this.saveStorage();
      });
      this.prettify = new PrettifyPipe();
      this.deprettify = new DeprettifyPipe();
      this.database_acrostics = this.helpers.getDatabaseAcrostics();
      this.database_misc = this.helpers.getDatabaseMisc();
      this.loadTables(false).then(() => {
         this.helpers.dismissProgress();
      });
   }

   ngOnDestroy() {
      console.log("ngOnDestroy called");
      this.saveStorage();
      this.onPauseSubscription.unsubscribe();
   }

   async ngOnInit() {      
      this.editTables = {};
      this.editTables.user = Helpers.User;
      await this.storage.create();
      this.editTables.isInit = true;
      this.editTables.isIncludeMnemonics = false;
      this.editTables.selectedAction = null;
      this.editTables.categories = [];
      this.editTables.old_categories = [];
      this.editTables.tables = [];
      for (var i = 0; i < 7; i++) {
         this.editTables.categories.push(null);
         this.editTables.old_categories.push(null);
      }
      this.storage.get('EDIT_TABLES_SELECTED_ACTION').then((val) => {
         this.editTables.selectedAction = val;
         this.storage.get('EDIT_TABLES_IS_INCLUDE_MNEMONICS').then((val) => {
            this.editTables.isIncludeMnemonics = val;
            this.background_color = Helpers.background_color;
            this.button_color = Helpers.button_color;
            this.button_gradient = Helpers.button_gradient;
            this.editTables.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
               this.background_color = bgColor;
            });
            this.editTables.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
               this.button_color = buttonColor.value;
               this.button_gradient = buttonColor.gradient;
            });            
         });
      });
   }

   ionViewDidLoad() {
      console.log('ionViewDidLoad EditTablesPage');
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave EditTablesPage');
      this.editTables.subscribedBackgroundColorEvent.unsubscribe();
      this.editTables.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   saveStorage() {
      console.log("saveStorage called");
      if (this.editTables.selectedAction !== "CREATE") {
         this.storage.set('EDIT_TABLES_SELECTED_TABLE', JSON.stringify(this.editTables.selectedTable));
      }
      if (this.editTables.selectedAction === "CREATE" || this.editTables.selectedAction === "RENAME") {
         this.storage.set('EDIT_TABLES_INPUT_TABLE', this.editTables.inputTable);
      }
      this.storage.set('EDIT_TABLES_SELECTED_ACTION', this.editTables.selectedAction);
      this.storage.set('EDIT_TABLES_IS_INCLUDE_MNEMONICS', this.editTables.isIncludeMnemonics);
      for (var i = 0; i < 7; i++) {
         this.storage.set('EDIT_TABLES_CATEGORY_' + i, this.editTables.categories[i]);
      }
      for (var i = 0; i < 7; i++) {
         this.storage.set('EDIT_TABLES_OLD_CATEGORY_' + i, this.editTables.old_categories[i]);
      }
   }

   loadTables(isDoingProgress:boolean): Promise<void> {
      console.log("loadTables called");
      return new Promise((resolve, reject) => {
         this.helpers.setProgress("Loading tables ,please wait......", isDoingProgress).then(() => {
            this.editTables.tables = [];
            this.getTableNames().then(() => {
               console.log("loadTables BACK FROM  getTableNames !");
               if (this.editTables.tables.length > 0) {
                  if (this.editTables.isInit === true) {
                     this.editTables.isInit = false;
                     this.setSavedTable().then(() => {
                        console.log("CALLING loadSavedCategories NEXT:");
                        this.loadSavedCategories(0, () => {
                           console.log("RETURNED FROM loadSavedCategories!!");
                           resolve();
                        });
                     });
                  } else {
                     resolve();
                  }
               } else {
                  resolve();
               }
            });
         });
      });
   }

   getTableNames(): Promise<void> {
      console.log("getTableNames called");
      return new Promise((resolve, reject) => {
         this.editTables.tables = [];
         if (Helpers.isWorkOffline === false) {
            this.helpers.makeHttpRequest("/lfq_directory/php/edit_tables_get_tables.php", "GET", null).then((data) => {
               if (data["SUCCESS"] === true) {
                  this.editTables.tables = data["TABLE_LIST"];
                  this.finishGetTableNames();                  
               } else {
                  this.helpers.alertLfqError(data["ERROR"]);
               }
               resolve();
            }, error => {
               console.log("ERROR:" + error.message);
               this.editTables.results = "Sorry. Error getting table names: " + error.message;
               this.helpers.alertServerError("Sorry. Error getting table names: " + error.message);
               resolve();
            });
         } else {
            //var sql = "SELECT tbl_name FROM sqlite_master WHERE type='table' ORDER BY tbl_name";
            var sql = "SELECT at.Table_name, at.User_ID, ud.Username FROM ";
            sql += Helpers.TABLES_MISC.acrostic_table + " at ";
            sql += "LEFT JOIN " + Helpers.TABLES_MISC.userdata + " ud ON ud.ID=at.User_ID ";
            sql += "ORDER BY at.Table_name";
            this.helpers.query(this.database_misc, sql, []).then((data) => {
               if (data.rows.length > 0) {
                  for (var i = 0; i < data.rows.length; i++) {
                     //if (data.rows.item(i).tbl_name === '__WebKitDatabaseInfoTable__' || data.rows.item(i).tbl_name === "android_metadata" || data.rows.item(i).tbl_name === "sqlite_sequence") {
                     this.editTables.tables.push(data.rows.item(i));
                  }
                  this.finishGetTableNames();
                  resolve();
               } else {
                  resolve();
               }
            }).catch((error) => {
               console.log("sql:" + sql + ", ERROR:" + error.message);
               this.editTables.results = "Sorry. Error getting table names.";
               resolve();
            });
         }
      });
   }

   finishGetTableNames(){
     var showUsername = "No-User";
     this.editTables.tables.forEach((tbl:any)=>{
      showUsername = tbl.Username!=null? tbl.Username : "No-User";
      tbl.showOption = this.prettify.transform(tbl.Table_name) + " <<i>" + showUsername + "</i>>";
     });
     this.editTables.tables.sort(this.helpers.sortByItem('Table_name', false));
   }

   setSavedTable(): Promise<void> {
      return new Promise((resolve, reject) => {
         if (this.editTables.selectedAction !== "CREATE") {
            this.storage.get('EDIT_TABLES_SELECTED_TABLE').then((val) => {
               if (val != null) {
                  var savedTable = JSON.parse(val);
                  var tableIndex = this.editTables.tables.map((tbl:any) => { return tbl.Table_name; }).indexOf(savedTable.Table_name);
                  if (tableIndex >= 0) {
                     this.editTables.selectedTable = this.editTables.tables[tableIndex];
                  }
               } else {
                  console.log("SETTING this.editTables.selectedTable = this.editTables.tables[0]");
                  this.editTables.selectedTable = this.editTables.tables[0];
               }
               if (this.editTables.selectedAction === "RENAME") {
                  this.storage.get('EDIT_TABLES_INPUT_TABLE').then((val) => {
                     this.editTables.inputTable = val;
                     resolve();
                  });
               } else {
                  resolve();
               }
            });
         }
         else {
            this.storage.get('EDIT_TABLES_INPUT_TABLE').then((val) => {
               this.editTables.inputTable = val;
               resolve();
            });
         }
      });
   }

   loadSavedCategories(index:number, callback:Function) {
      console.log("loadSavedCategories called");
      if (index < 7) {
         this.storage.get('EDIT_TABLES_CATEGORY_' + index).then((val) => {
            this.editTables.categories[index] = val;
            this.storage.get('EDIT_TABLES_OLD_CATEGORY_' + index).then((val) => {
               this.editTables.old_categories[index] = val;
               index++;
               this.loadSavedCategories(index, callback);
            });
         });
      } else {
         callback();
      }
   }

   async editTable() {
      console.log("editTable called. this.editTables.selectedAction=" + this.editTables.selectedAction);
      var notCreateAndNullOrEmptyTable: Boolean = (this.editTables.selectedAction !== "CREATE" && this.editTables.selectedTable == null);
      var createAndNullOrEmptyTable: Boolean = (this.editTables.selectedAction === "CREATE" && (this.editTables.inputTable == null || String(this.editTables.inputTable).trim() === ""));
      var createAndHasWhitespace: Boolean = (this.editTables.selectedAction === "CREATE" && this.editTables.inputTable != null && this.editTables.inputTable.match(/\s+/g) != null);
      if (notCreateAndNullOrEmptyTable || createAndNullOrEmptyTable) {
         this.helpers.myAlert("Alert", "<b>Need to select or input a table</b>", "", "Dismiss");
         return;
      }
      if (createAndHasWhitespace) {
         this.helpers.myAlert("Alert", "<b>Table name can not have spaces</b>", "", "Dismiss");
         return;
      }
      if (this.editTables.selectedAction === "GET") {
         this.getTable(this.editTables.selectedTable.Table_name);
      }
      if (this.editTables.selectedAction === "EDIT") {
         this.updateTable();
      }
      if (this.editTables.selectedAction === "CREATE") {
         let alert = await this.alertCtrl.create({
            header: "Confirm",
            subHeader: "Are you sure you want to create table: " + this.editTables.inputTable + "?",
            buttons: [
               {
                  text: 'Cancel',
                  cssClass: 'cancelButton',
                  handler: () => {
                     console.log('Cancel create table clicked');
                     return true;
                  }
               },
               {
                  text: 'Confirm',
                  cssClass: 'confirmButton',
                  handler: () => {
                     console.log('Confirm create table clicked');
                     this.createTable();
                     return true;
                  }
               }
            ]
         });
         await alert.present();
      }
      if (this.editTables.selectedAction === "DROP") {
         let alert = await this.alertCtrl.create({
            header: "Confirm",
            subHeader: "Dropping table " + this.editTables.selectedTable.Table_name + " will remove table and all other users' new words using the table. Confirm?",
            buttons: [
               {
                  text: 'Cancel',
                  cssClass: 'cancelButton',
                  handler: () => {
                     console.log('Cancel delete table clicked');
                     return true;
                  }
               },
               {
                  text: 'Confirm',
                  cssClass: 'confirmButton',
                  handler: () => {
                     console.log('Confirm delete table clicked');
                     this.dropTable();
                     return true;
                  }
               }
            ]
         });
         await alert.present();
      }
      if (this.editTables.selectedAction === "RENAME") {
         this.renameTable();
      }
   }

   clearTable() {
      console.log("clearTable called.");
      this.editTables.inputTable = null;
      for (var i = 0; i < 7; i++) {
         this.editTables.categories[i] = null;
      }
      //APP_DEBUG X:
      //this.helpers.clearRequests();
   }

   getTable(table:any) {
      console.log("getTable called.");
      this.helpers.setProgress("Getting table " + this.editTables.selectedTable.Table_name + ", please wait......", false).then(() => {
         this.clearTable();
         this.editTables.inputTable = table;
         this.editTables.isIncludeMnemonics = false;
         //this.helpers.dismissProgress();
         //return;
         if (Helpers.isWorkOffline === false) {
            var params = {
               "table": this.editTables.selectedTable.Table_name
            };
            this.helpers.makeHttpRequest("/lfq_directory/php/edit_tables_get_table.php", "GET", params).then((data) => {

               if (data["SUCCESS"] === true) {
                  var ct_ind = 0;
                  var col = "";
                  for (var i = 0; i < data["COLUMNS"].length; i++) {
                     col = data["COLUMNS"][i];
                     if (col === "Mnemonics" || col === "Peglist") {
                        this.editTables.isIncludeMnemonics = true;
                     }
                     if (col !== "ID" && col !== "Name" && col !== "Information" && col !== "Acrostics" && col !== "Mnemonics" && col !== "Peglist" && col !== "Image" && col !== "Username") {
                        console.log("col" + i + "=" + col);
                        this.editTables.categories[ct_ind] = col;
                        this.editTables.old_categories[ct_ind] = col;
                        ct_ind++;
                     }
                  }
                  this.editTables.results = "Found table " + this.prettify.transform(table);
                  this.editTables.tableUserIdOld = data["User_ID"];
                  this.helpers.dismissProgress();
               } else {
                  this.helpers.dismissProgress();
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            });
         } else {//IF OFFLINE:
            this.helpers.getColumnNames(this.database_acrostics, table).then((columns) => {
               console.log("MORE THAN 0 ROWS!");
               var ct_ind = 0;
               var col = "";
               for (var i = 0; i < columns.length; i++) {
                  col = columns[i];
                  if (col === "Mnemonics" || col === "Peglist") {
                     this.editTables.isIncludeMnemonics = true;
                  }
                  if (col !== "ID" && col !== "Name" && col !== "Information" && col !== "Acrostics" && col !== "Mnemonics" && col !== "Peglist" && col !== "Image" && col !== "Username" && col !== "User_ID") {
                     console.log("col" + i + "=" + col);
                     this.editTables.categories[ct_ind] = col;
                     ct_ind++;
                  }
               }
               this.helpers.setProgress("Checking if it table belongs to user, please wait......", true).then(() => {
                  var sql = "SELECT User_ID FROM " + Helpers.TABLES_MISC.acrostic_table + " ";
                  sql += "WHERE Table_name='" + table + "'";
                  this.helpers.query(this.database_misc, sql, []).then((data) => {
                     this.editTables.tableUserIdOld = null;
                     if (data.rows.length > 0) {
                        this.editTables.tableUserIdOld = data.rows.item(0).User_ID;
                     }
                     this.editTables.results = "Found table " + table;
                     this.helpers.dismissProgress();
                  }).catch((error) => {
                     console.log("sql:" + sql + ", ERROR:" + error.message);
                     this.editTables.results = "Sorry. Error getting table info.";
                     this.helpers.dismissProgress();
                  });
               });
            });
         }
      });
   }

   createTable() {
      console.log("createTable called.");
      this.editTables.results = "";
      this.helpers.setProgress("Creating table " + this.editTables.inputTable + ", please wait......", false).then(() => {
         var inputTable = this.deprettify.transform(this.editTables.inputTable);
         //ALERT IF HAVE DUPLICATE COLUMNS:-------------------------------
         for (var i = 0; i < 7; i++) {
            if (this.editTables.categories[i] && this.editTables.categories[i].trim() !== "") {
               for (var j = i + 1; j < 7; j++) {
                  if (this.editTables.categories[j] && this.editTables.categories[j].trim() !== "") {
                     if (this.editTables.categories[i] === this.editTables.categories[j]) {
                        this.helpers.myAlert("ALERT", "<b>Can not have columns with the same names.</b>", "", "Dismiss");
                        this.helpers.dismissProgress();
                        return;
                     }
                  }
               }
            }
         }

         //----------------------------------------------------------------------
         //CHECK IF TABLE EXISTS:
         var sqlCheck = "SELECT name FROM sqlite_master WHERE type='table' AND name='" + inputTable + "'";
         this.helpers.query(this.database_acrostics, sqlCheck, []).then((data) => {
            if (data.rows.length > 0) {//TABLE ALREADY EXISTS.                  
               this.helpers.myAlert("Alert", "<b>Table " + this.editTables.inputTable + " Already Exists.</b>", "", "Dismiss");
               this.editTables.results = "Table " + this.editTables.inputTable + " Already Exists.";
               this.helpers.dismissProgress();
            } else {
               //var columns = "`ID` INTEGER PRIMARY KEY AUTOINCREMENT,`Name` tinytext,`Information` TEXT,`Acrostics` TEXT,`Image` blob";                  
               var cols = ["ID", "Name", "Information", "Acrostics", "Image", "User_ID"];
               var vals = ["integer PRIMARY KEY AUTOINCREMENT", "varchar(250)", "mediumtext", "mediumtext", "longblob", "int(11)"];
               if (this.editTables.isIncludeMnemonics === true) {
                  cols.concat(["Mnemonics", "Peglist"]);
                  vals.concat(["mediumtext", "mediumtext"]);
               }
               for (var i = 0; i < 7; i++) {
                  if (this.editTables.categories[i] && this.editTables.categories[i].trim() !== "") {
                     cols.push(this.editTables.categories[i]);
                     vals.push("varchar(500)");
                  }
               }
               var dateCreated = this.helpers.getMysqlTime();
               var triggerSqls = [
                  "Create Trigger " + Helpers.db_prefix + "acrostics." + inputTable + "_DOWNLOAD_INSERT AFTER INSERT ON " + Helpers.db_prefix + "acrostics." + inputTable + " FOR EACH ROW UPDATE " + Helpers.db_prefix + "acrostics.download_table_sqls SET Needs_Update=1 WHERE Table_name='" + inputTable + "'",
                  "Create Trigger " + Helpers.db_prefix + "acrostics." + inputTable + "_DOWNLOAD_UPDATE AFTER UPDATE ON " + Helpers.db_prefix + "acrostics." + inputTable + " FOR EACH ROW UPDATE " + Helpers.db_prefix + "acrostics.download_table_sqls SET Needs_Update=1 WHERE Table_name='" + inputTable + "'",
                  "Create Trigger " + Helpers.db_prefix + "acrostics." + inputTable + "_DOWNLOAD_DELETE AFTER DELETE ON " + Helpers.db_prefix + "acrostics." + inputTable + " FOR EACH ROW UPDATE " + Helpers.db_prefix + "acrostics.download_table_sqls SET Needs_Update=1 WHERE Table_name='" + inputTable + "'"
               ];
               var queries: Array<SyncQuery> = [];
               var names = { "Table": inputTable };
               //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
               queries.push(new SyncQuery(null, null, DB_Type_ID.DB_ACROSTICS, inputTable, Op_Type_ID.CREATE, cols, vals, { "Table": inputTable }));
               queries.push(new SyncQuery(null, null, DB_Type_ID.DB_ACROSTICS, inputTable, Op_Type_ID.CREATE_INDEX, ["Name", "User_ID"], [], {}));
               queries.push(new SyncQuery(false, null, DB_Type_ID.DB_ACROSTICS, inputTable, Op_Type_ID.ADVANCED_SQLS, [], [], { "SQLS": triggerSqls }));
               var d = new Date();
               //FORMAT: 2019-07-20 10:19:45
               var timestamp = this.helpers.getTimestamp(d);
               queries.push(new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.acrostic_table, Op_Type_ID.INSERT, ["Date_Created", "User_ID", "Table_name"], [[this.helpers.getCurrentTimestamp(), Helpers.User.ID, inputTable]], { "User_ID": Helpers.User.ID, "Table_name": inputTable }));
               queries.push(new SyncQuery(false, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.download_table_sql, Op_Type_ID.INSERT, ["DB_Type_ID", "Table_name", "Needs_Update"], [[DB_Type_ID.DB_ACROSTICS, inputTable, "1"]], { "Table_name": inputTable }));
               //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
               this.helpers.autoSync(queries, Op_Type_ID.CREATE, null, null, null, null).then((res) => {
                  if (res.isSuccess === true) {
                     this.editTables.results = "Created table " + this.editTables.inputTable + ".";
                     this.loadTables(true).then(() => {
                        this.helpers.dismissProgress();
                        this.helpers.myAlert("SUCCESS", "<b>" + this.editTables.results + "</b>", "", "OK");
                     });
                  } else {
                     console.log("ERROR:" + res.results);
                     this.editTables.results = "Sorry. Error creating table: " + res.results;
                     this.helpers.myAlert("ERROR", "<b>" + this.editTables.results + "</b>", "", "Dismiss");
                     this.helpers.dismissProgress();
                  }
               });
            }//END NO TABLE ALREADY EXISTS.
         });
      });
   }

   updateTable() {
      console.log("updateTable called.");
      var Table_name = this.prettify.transform(this.editTables.selectedTable.Table_name);
      this.helpers.setProgress("Updating table " + Table_name + ", please wait......", false).then(() => {

         //1)GET COLUMNS, DATA TYPES NOT MNEMONICS.PEGLIST : table_columns, table_data_types
         //2)CHECK IF NEED TO ADD/DROP MNEMONICS/PEGLIST
         //3)LOOP 7, COMPARE INPUT CATEGORIES TO CATEGORIES FOUND IN TABLE
         //4)SET 'old_columns'=table_columns REMOVE OR SPLICE TO table_columns & REMOVE ONLY IF DROPPING TO old_columns , OR ADD to addColumns            
         var get_cols_sql = "SELECT sql FROM sqlite_master where tbl_name='" + this.editTables.selectedTable.Table_name + "' AND type='table'";
         this.helpers.query(this.database_acrostics, get_cols_sql, []).then((data) => {
            var sql = data.rows.item(0).sql;
            console.log("crete table sql=" + sql);
            var structure = sql.split(this.editTables.selectedTable.Table_name + " (")[1];
            structure = structure.substring(0, structure.length - 1);
            console.log("structure = " + structure);
            var columns_types = structure.split(",");
            this.table_columns = [];
            this.table_data_types = [];
            this.cat_arr = [];
            var col = "";
            for (var i = 0; i < 7; i++) {
               this.cat_arr.push(null);
            }
            var cat_arr_index = 0;
            var hasMnemonics = false;
            var hasPeglist = false;
            for (var i = 0; i < columns_types.length; i++) {
               col = columns_types[i].trim().split(" ")[0];
               if (this.editTables.isIncludeMnemonics === true || (col !== "Mnemonics" && col !== "Peglist")) {//FALSE IF INCLUDE MNES FALSE AND COL= Mnemonics/Peglist
                  this.table_columns.push(col);
                  this.table_data_types.push(columns_types[i].trim().split(" ").slice(1).join(" "));
               }
               if (col === "Mnemonics") {
                  hasMnemonics = true;
               }
               if (col === "Peglist") {
                  hasPeglist = true;
               }
               if (col !== "ID" && col !== "Name" && col !== "Information" && col !== "Acrostics" && col !== "Mnemonics" && col !== "Peglist" && col !== "Image" && col !== "User_ID") {
                  this.cat_arr[cat_arr_index] = col;
                  cat_arr_index++;
               }
            }
            var isAddMnemonicsPeglist = false;
            //ADD OR DROP MNEMONICS/PEGLIST ONLY IF YOU NEED TO:
            if (hasMnemonics === false && hasPeglist === false && this.editTables.isIncludeMnemonics === true) {
               isAddMnemonicsPeglist = true;
            }
            var isDropMnemonicsPeglist = false;
            if ((hasMnemonics === true || hasPeglist === true) && this.editTables.isIncludeMnemonics === false) {
               isDropMnemonicsPeglist = true;
            }
            console.log("updateTable cat_arr=" + this.cat_arr);
            this.editTables.results = "";
            this.alterColumns(isAddMnemonicsPeglist, isDropMnemonicsPeglist).then(() => {
               console.log("alterColumns RESOLVED!!");
               this.helpers.dismissProgress();
               this.editTables.results += "Updated table " + Table_name + ".";
               this.helpers.myAlert("SUCCESS", "<b>" + this.editTables.results + "</b>", "", "OK");
               return;
            }, () => {
               this.helpers.dismissProgress();
               return;
            });
         }).catch((error) => {
            console.log("sql:" + get_cols_sql + ", ERROR:" + error.message);
            this.editTables.results = "Sorry. Error updating table. " + error.message;
            this.helpers.dismissProgress();
            this.helpers.myAlert("ERROR", "<b>" + this.editTables.results + "</b>", "", "Dismiss");
            return;
         });
      });
   }
   //THIS WILL EXECUTE AT MOST 7 SQLS: ADDING A COLUMN FOR EVERY CATEGORY INPUT:
   alterColumns(isAddMnemonicsPeglist:any, isDropMnemonicsPeglist:any): Promise<void> {
      console.log("alterColumns called, isAddMnemonicsPeglist=" + isAddMnemonicsPeglist + ", isDropMnemonicsPeglist=" + isDropMnemonicsPeglist);
      var Table_name = this.prettify.transform(this.editTables.selectedTable.Table_name);
      return new Promise((resolve, reject) => {
         this.helpers.getIdTables([this.editTables.selectedTable.Table_name]).then((idTables) => {
            if (idTables[0]) {
               var oldUserID = idTables[0].User_ID;
               var results = "";
               var isDropColumn = false;
               var addColumns = [];
               var old_column_names:any = [];
               var myNewColumns:any = [];
               var myOldColumns:any = [];
               var entriesOld:any = { "Columns": [] }, entries:any = { "Columns": [] };
               Object.assign(old_column_names, this.table_columns);
               Object.assign(myNewColumns, this.editTables.categories);
               Object.assign(myOldColumns, this.cat_arr);
               var queries: Array<SyncQuery> = [];
               var queries2: Array<SyncQuery> = [];
               if (isAddMnemonicsPeglist === true) {
                  myNewColumns.push("Mnemonics");
                  myNewColumns.push("Peglist");
                  myOldColumns.push("");
                  myOldColumns.push("");
               }
               console.log("BEFORE LOOPING cat_arr = " + this.cat_arr + ", categories=" + this.editTables.categories);
               for (var i = 0; i < 7; i++) {
                  if (this.editTables.categories[i] && this.cat_arr[i] && this.editTables.categories[i] !== this.cat_arr[i]) {
                     //change column name
                     isDropColumn = true;
                     this.table_columns.splice(this.table_columns.indexOf(this.cat_arr[i]), 1, this.editTables.categories[i]);
                     results += "Changed " + this.cat_arr[i] + " to " + this.editTables.categories[i] + " ";
                     //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                     queries.push(new SyncQuery(false, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.CHANGE_COLUMN, [], [], { "Old_Column": this.cat_arr[i], "New_Column": "`" + this.editTables.categories[i] + "` varchar(100)" }));
                     //lfqSqls.push("ALTER TABLE " + Helpers.db_prefix + "acrostics." + this.editTables.selectedTable.Table_name + " CHANGE `" + this.cat_arr[i] + "` `" + this.editTables.categories[i] + "` varchar(100)");
                     entriesOld.Columns.push(this.cat_arr[i]);
                     entries.Columns.push(this.editTables.categories[i]);
                  }
                  else if (!this.editTables.categories[i] && this.cat_arr[i]) {
                     isDropColumn = true;
                     var spliceIndex = this.table_columns.indexOf(this.cat_arr[i]);
                     this.table_columns.splice(spliceIndex, 1);
                     this.table_data_types.splice(spliceIndex, 1);
                     old_column_names.splice(spliceIndex, 1);
                     results += "Dropped column " + this.cat_arr[i] + " ";
                     //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                     queries.push(new SyncQuery(false, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.DROP_COLUMN, [this.cat_arr[i]], [], { "Column": this.cat_arr[i] }));
                     entriesOld.Columns.push(this.cat_arr[i]);
                     //lfqSqls.push("ALTER TABLE " + Helpers.db_prefix + "acrostics." + this.editTables.selectedTable.Table_name + " DROP COLUMN `" + this.cat_arr[i] + "`");
                  }
                  else if (this.editTables.categories[i] && !this.cat_arr[i]) {
                     //add column
                     queries.push(new SyncQuery(false, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.ADD_COLUMN, [this.editTables.categories[i]], ["varchar(100)"], { "Column": this.editTables.categories[i] }));
                     queries2.push(new SyncQuery(true, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.ADD_COLUMN, [this.editTables.categories[i]], ["varchar(100)"], { "Column": this.editTables.categories[i] }));
                     addColumns.push(this.editTables.categories[i]);
                     results += "Added column " + this.editTables.categories[i] + " ";
                     entries.Columns.push(this.editTables.categories[i]);
                  }
               }//END FOR LOOP OF CATEGORY INPUTS
               console.log("AFTER LOOPING CATEGORY INPUTS, this.table_columns=" + JSON.stringify(this.table_columns));

               if (isDropColumn === true || isDropMnemonicsPeglist) {
                  //FOR INSERTING FROM OLD TABLE:
                  var new_column_names:any = [];
                  Object.assign(new_column_names, this.table_columns);
                  //FOR ADDING COLUMNS:----------------------------------        
                  for (var i = 0; i < addColumns.length; i++) {
                     this.table_columns.push(addColumns[i]);
                     this.table_data_types.push("varchar(100)");
                  }
                  if (isAddMnemonicsPeglist === true) {
                     this.table_columns.push("Mnemonics");
                     this.table_columns.push("Peglist");
                     this.table_data_types.push("varchar(100)");
                     this.table_data_types.push("varchar(100)");
                     entries["Columns"] = entries["Columns"].concat(["Mnemonics", "Peglist"]);
                  }
                  //END FOR ADDING COLUMNS------------------------------------------------------
                  //1) RENAME OLD T0 `OLD` + '_temp', 2) CREATE NEW, 3) CREATE INDEX ON NEW, 4) INSERT FROM OLD INTO NEW, 5) DROP OLD `OLD` + '_temp'...
                  //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                  queries.push(new SyncQuery(true, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.RENAME_TABLE, [], [], { "Old_Table_Name": this.editTables.selectedTable.Table_name, "New_Table_Name": this.editTables.selectedTable.Table_name + "_temp" }));
                  queries.push(new SyncQuery(true, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.CREATE, this.table_columns, this.table_data_types, { "Table": this.editTables.selectedTable.Table_name }));
                  queries.push(new SyncQuery(true, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.CREATE_INDEX, ["Name", "User_ID"], [], { "Table": this.editTables.selectedTable.Table_name }));
                  queries.push(new SyncQuery(true, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.INSERT_SELECT, new_column_names, old_column_names, { "Insert_Table": this.editTables.selectedTable.Table_name, "From_Table": this.editTables.selectedTable.Table_name + "_temp" }));
                  queries.push(new SyncQuery(true, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name + "_temp", Op_Type_ID.DROP, [], [], {}));
                  if (isDropMnemonicsPeglist === true) {
                     entriesOld["Columns"] = entriesOld["Columns"].concat(["Mnemonics", "Peglist"]);
                     queries.push(new SyncQuery(false, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.DROP_COLUMN, ["Mnemonics", "Peglist"], [], {}));
                  }
               } else {//IF ONLY ADDING COLUMNS:
                  for (var i = 0; i < queries2.length; i++) {
                     queries.push(queries2[i]);
                  }
                  if (isAddMnemonicsPeglist === true) {
                     //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                     queries.push(new SyncQuery(true, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.ADD_COLUMN, ["Mnemonics"], ["text"], null));
                     queries.push(new SyncQuery(true, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.ADD_COLUMN, ["Peglist"], ["text"], null));
                     queries.push(new SyncQuery(false, oldUserID, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.ADD_COLUMN, ["Mnemonics", "Peglist"], ["TEXT", "TEXT"], null));
                     entries["Columns"] = entries["Columns"].concat(["Mnemonics", "Peglist"]);
                  }
               }
               if (queries.length > 0) {
                  //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
                  this.helpers.autoSync(queries, Op_Type_ID.ALTER_TABLE, oldUserID, { "Table": Table_name }, entriesOld, entries).then((res) => {
                     if (res.isSuccess === true) {
                        this.editTables.results += results;
                        resolve();
                     } else {
                        console.log("ERROR: " + res.results);
                        this.editTables.results = "Sorry. Error altering table. " + res.results;
                        this.helpers.myAlert("ERROR", "<b>" + this.editTables.results + "</b", "", "Dismiss");
                        reject();
                     }
                  });
               } else {
                  console.log("NOT UPDATING TABLE AT ALL");
                  this.editTables.results = "Table not updated";
                  this.helpers.myAlert("Nothing Changed", "<b>" + this.editTables.results + "</b", "", "OK");
                  reject();
               }
            } else {
               console.log("this.helpers.getIdTables FAILES");
               this.editTables.results = "Get Table ID Failed.";
               this.helpers.myAlert(this.editTables.results, "", "", "Dismiss");
               reject();
            }
         });
      });
   }

   //dropTable: DROPS TABLE, DELETES FROM acrostic_tables AND DELETES FROM download_table_sqls
   dropTable() {
      console.log("dropTable called.");
      var Table_name = this.prettify.transform(this.editTables.selectedTable.Table_name);
      this.helpers.setProgress("Dropping table " + Table_name + ", please wait......", false).then(() => {
         this.helpers.getIdTables([this.editTables.selectedTable.Table_name]).then((idTables) => {
            console.log("GOT ID TABLES=" + JSON.stringify(idTables));
            var tableID = null;
            if (idTables.length > 0) {
               tableID = idTables[0].ID;
            }
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [
               new SyncQuery(null, this.editTables.tableUserIdOld, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.DROP, [], [], { "Table_name": this.editTables.selectedTable.Table_name }),
               new SyncQuery(null, this.editTables.tableUserIdOld, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.acrostic_table, Op_Type_ID.DELETE, [], [], { "Table_name": this.editTables.selectedTable.Table_name })
            ];
            if (tableID) {
               queries.push(new SyncQuery(null, this.editTables.tableUserIdOld, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.user_new_word, Op_Type_ID.DELETE, [], [], { "Table_ID": tableID }));
            }
            queries.push(new SyncQuery(false, this.editTables.tableUserIdOld, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.download_table_sql, Op_Type_ID.DELETE, [], [], { "Table_name": this.editTables.selectedTable.Table_name }));
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.DROP, this.editTables.tableUserIdOld, { "Table": Table_name }, null, null).then((res) => {
               if (res.isSuccess === true) {
                  this.editTables.results = "Dropped table " + Table_name + "." + res;
                  this.loadTables(true).then(() => {
                     this.clearTable();
                     this.helpers.dismissProgress();
                     this.editTables.results = "Dropped table " + Table_name + ".";
                     this.helpers.myAlert("SUCCESS", "<b>" + this.editTables.results + "</b>", "", "OK");
                     return;
                  });
               } else {
                  console.log("ERROR:" + res.results);
                  this.editTables.results = "Sorry. Error dropping table: " + res.results;
                  this.helpers.dismissProgress();
                  this.helpers.myAlert("ERROR", "<b>" + this.editTables.results + "</b>", "", "Dismiss");
                  return;
               }
            });
         });
      });
   }

   renameTable() {
      console.log("renameTable called");
      var Table_name = this.prettify.transform(this.editTables.selectedTable.Table_name);
      var inputTable = this.prettify.transform(this.editTables.inputTable);
      this.helpers.setProgress("Renaming table " + Table_name + ", please wait......", false).then(() => {
         var sync_results = "";
         var dateCreated = this.helpers.getMysqlTime();
         var queries: Array<SyncQuery> = [];
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         queries.push(new SyncQuery(null, this.editTables.tableUserIdOld, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.RENAME_TABLE, [], [], { "Old_Table_Name": this.editTables.selectedTable.Table_name, "New_Table_Name": inputTable }));
         queries.push(new SyncQuery(null, this.editTables.tableUserIdOld, DB_Type_ID.DB_ACROSTICS, this.editTables.selectedTable.Table_name, Op_Type_ID.DROP_INDEX, [], [], { "Index_Name": this.editTables.selectedTable.Table_name + "_unique_index" }));
         queries.push(new SyncQuery(null, this.editTables.tableUserIdOld, DB_Type_ID.DB_ACROSTICS, inputTable, Op_Type_ID.CREATE_INDEX, ["Name", "User_ID"], [], { "Index_Name": inputTable + "_unique_index" }));
         var dropTriggerSqls = [
            //DELETE THEN RECREATE TRIGGERS:--------------------------------------------------------------------------------------->
            "DROP TRIGGER IF EXISTS " + Helpers.db_prefix + "acrostics." + this.editTables.selectedTable.Table_name + "_DOWNLOAD_INSERT",
            "DROP TRIGGER IF EXISTS " + Helpers.db_prefix + "acrostics." + this.editTables.selectedTable.Table_name + "_DOWNLOAD_UPDATE",
            "DROP TRIGGER IF EXISTS " + Helpers.db_prefix + "acrostics." + this.editTables.selectedTable.Table_name + "_DOWNLOAD_DELETE",
            "DROP TRIGGER IF EXISTS " + Helpers.db_prefix + "acrostics." + this.editTables.selectedTable.Table_name + "_COMPILE_INSERT",
            "DROP TRIGGER IF EXISTS " + Helpers.db_prefix + "acrostics." + this.editTables.selectedTable.Table_name + "_COMPILE_UPDATE",
            "DROP TRIGGER IF EXISTS " + Helpers.db_prefix + "acrostics." + this.editTables.selectedTable.Table_name + "_COMPILE_DELETE"
         ];
         var createTriggerSqls = [
            "Create Trigger " + Helpers.db_prefix + "acrostics." + inputTable + "_DOWNLOAD_INSERT AFTER INSERT ON " + Helpers.db_prefix + "acrostics." + inputTable + " FOR EACH ROW UPDATE " + Helpers.db_prefix + "misc.download_table_sqls SET Needs_Update=1 WHERE Table_name='" + inputTable + "'",
            "Create Trigger " + Helpers.db_prefix + "acrostics." + inputTable + "_DOWNLOAD_UPDATE AFTER UPDATE ON " + Helpers.db_prefix + "acrostics." + inputTable + " FOR EACH ROW UPDATE " + Helpers.db_prefix + "misc.download_table_sqls SET Needs_Update=1 WHERE Table_name='" + inputTable + "'",
            "Create Trigger " + Helpers.db_prefix + "acrostics." + inputTable + "_DOWNLOAD_DELETE AFTER DELETE ON " + Helpers.db_prefix + "acrostics." + inputTable + " FOR EACH ROW UPDATE " + Helpers.db_prefix + "misc.download_table_sqls SET Needs_Update=1 WHERE Table_name='" + inputTable + "'",
            "Create Trigger " + Helpers.db_prefix + "acrostics." + inputTable + "_COMPILE_INSERT AFTER INSERT ON " + Helpers.db_prefix + "acrostics." + inputTable + " FOR EACH ROW UPDATE " + Helpers.db_prefix + "misc." + Helpers.TABLES_MISC.acrostic_table + " SET aDate_Modified=UNIX_TIMESTAMP() WHERE Table_name='" + inputTable + "'",
            "Create Trigger " + Helpers.db_prefix + "acrostics." + inputTable + "_COMPILE_UPDATE AFTER UPDATE ON " + Helpers.db_prefix + "acrostics." + inputTable + " FOR EACH ROW UPDATE " + Helpers.db_prefix + "misc." + Helpers.TABLES_MISC.acrostic_table + " SET aDate_Modified=UNIX_TIMESTAMP() WHERE Table_name='" + inputTable + "'",
            "Create Trigger " + Helpers.db_prefix + "acrostics." + inputTable + "_COMPILE_DELETE AFTER DELETE ON " + Helpers.db_prefix + "acrostics." + inputTable + " FOR EACH ROW UPDATE " + Helpers.db_prefix + "misc." + Helpers.TABLES_MISC.acrostic_table + " SET aDate_Modified=UNIX_TIMESTAMP() WHERE Table_name='" + inputTable + "'",
         ];
         var sqls = dropTriggerSqls.concat(createTriggerSqls);
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         queries.push(new SyncQuery(null, this.editTables.tableUserIdOld, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.acrostic_table, Op_Type_ID.UPDATE, ["Table_name"], [inputTable], { "Table_Name": this.editTables.selectedTable.Table_name }, User_Action_Request.USER_ID_UPDATE));
         queries.push(new SyncQuery(false, this.editTables.tableUserIdOld, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.download_table_sql, Op_Type_ID.UPDATE, ["Table_name"], [inputTable], { "Table_name": this.editTables.selectedTable.Table_name }));
         queries.push(new SyncQuery(false, this.editTables.tableUserIdOld, DB_Type_ID.DB_MISC, this.editTables.selectedTable.Table_name, Op_Type_ID.ADVANCED_SQLS, [], [], { "SQLS": sqls }));
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.RENAME_TABLE, this.editTables.tableUserIdOld, { "Table": this.editTables.selectedTable.Table_name }, { "Table": Table_name }, { "Table": this.editTables.inputTable }).then((res) => {
            if (res.isSuccess === true) {
               this.editTables.results = "Renamed table " + Table_name + " to " + this.editTables.inputTable + ". " + res.results;
               this.loadTables(true).then(() => {
                  this.helpers.dismissProgress();
                  this.helpers.myAlert("SUCCESS", "<b>" + this.editTables.results + "</b>", "", "Dismiss");
                  return;
               });
            } else {
               console.log("ERROR: " + res.results);
               this.editTables.results = "Sorry. Error renaming table: " + res.results;
               this.helpers.dismissProgress();
               this.helpers.myAlert("ERROR", "", "<b>" + this.editTables.results + "</b>", "Dismiess");
               return;
            }
         });
      });
   }

   watchCategories(index:number) {
      console.log("watchCategories called");
      if (this.editTables.categories[index] && this.editTables.categories[index].trim() === "") {
         console.log("setting category " + index + "to null.");
         this.editTables.categories[index] = null;
      }
   }
}
