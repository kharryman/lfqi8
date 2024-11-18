import { Component, AfterViewInit } from '@angular/core';
import { NavController, LoadingController, Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';
import { Helpers } from '../../providers/helpers/helpers';
import { NgZone } from '@angular/core';
import { Subscription } from 'rxjs';


@Component({
   selector: 'page-show-tables',
   templateUrl: 'show-tables.html',
   styleUrl: 'show-tables.scss'
})
export class ShowTablesPage implements AfterViewInit {
   public pageName: string = "Show Acrostics Tables";
   acrosticsTables: any = {};
   //@ViewChild('selectedAcrosticsTable') selectedAcrosticsTable:ElementRef;
   public database_acrostics: SQLiteDBConnection;
   queries: any;
   tableCountIndex: any;
   totalTableCount: any;
   info_sentence_isread: any
   selected_table: any;
   progressLoader: any;
   user: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;


   constructor(public navCtrl: NavController, private platform: Platform, public progress: LoadingController, public storage: Storage, public helpers: Helpers, public ngZone: NgZone) {
      console.log("constructor CALLED");
      this.onPauseSubscription = this.platform.pause.subscribe(() => {
         this.saveStorage();
      });
      this.database_acrostics = this.helpers.getDatabaseAcrostics();
   }

   ngOnDestroy() {
      console.log("ngOnDestroy called");
      this.onPauseSubscription.unsubscribe();
      this.acrosticsTables.subscribedMenuToolbarEvent.unsubscribe();
      this.acrosticsTables.subscribedBackgroundColorEvent.unsubscribe();
      this.acrosticsTables.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   async ngOnInit() {
      console.log("ngOnInit CALLED");
      this.user = Helpers.User.Username;
      Helpers.currentPageName = this.pageName;
      await this.storage.create();
      this.queries = [];
      this.info_sentence_isread = [];
      this.tableCountIndex = 0;
      this.totalTableCount = 0;
      this.acrosticsTables = {};
      this.acrosticsTables.isShowAllCategories = true;
      this.acrosticsTables.oneCategoryOptions = {};
      this.acrosticsTables.selectedShowCategories = {};
      this.acrosticsTables.isShowByCategories = false;
      this.acrosticsTables.selectedCategories = [];

      this.acrosticsTables.countTotal = 0;
      this.acrosticsTables.isShowTable = false;
      this.acrosticsTables.isInit = true;
      this.acrosticsTables.categories = [];
      this.acrosticsTables.tableSortCategories = [];
      this.acrosticsTables.tableResults = [];
      this.acrosticsTables.selectedTable = "";
      this.acrosticsTables.isRead = false;

      //SHOW FLAGS:---------
      this.acrosticsTables.isInformation = false;
      this.acrosticsTables.isInformationComplete = false;
      this.acrosticsTables.isInformationIncomplete = false;

      this.acrosticsTables.isAcrostics = false;
      this.acrosticsTables.isAcrosticsComplete = false;
      this.acrosticsTables.isAcrosticsIncomplete = false;

      this.acrosticsTables.isMnemonics = false;
      this.acrosticsTables.isMnemonicsComplete = false;
      this.acrosticsTables.isMnemonicsIncomplete = false;

      this.acrosticsTables.isImages = false;
      this.acrosticsTables.isImagesComplete = false;
      this.acrosticsTables.isImagesIncomplete = false;

      this.acrosticsTables.isPeglist = false;
      this.acrosticsTables.isPeglistComplete = false;
      this.acrosticsTables.isPeglistIncomplete = false;

      this.acrosticsTables.isShowingMenu = false;
      this.acrosticsTables.subscribedMenuToolbarEvent = this.helpers.menuToolbarEvent.subscribe((isShown) => {
         this.acrosticsTables.isShowingMenu = isShown;
      });

      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.acrosticsTables.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor: any) => {
         this.background_color = bgColor;
      });
      this.acrosticsTables.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor: any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });
   }

   async ngAfterViewInit() {
      console.log("ngAfterViewInit called");
      console.log("ShowTablesPage ionViewDidLoad CALLED");
      this.user = Helpers.User;
      var val: any = await this.storage.get('SHOW_TABLES_SELECTED_TABLE');
      this.acrosticsTables.selectedTable = val;
      val = await this.storage.get('SHOW_TABLES_IS_READ');
      this.acrosticsTables.isRead = val;
      //INFORMATION
      val = await this.storage.get('SHOW_TABLES_IS_INFORMATION');
      this.acrosticsTables.isInformation = val;
      val = await this.storage.get('SHOW_TABLES_IS_INFORMATION_COMPLETE');
      this.acrosticsTables.isInformationComplete = val;
      val = await this.storage.get('SHOW_TABLES_IS_INFORMATION_INCOMPLETE');
      this.acrosticsTables.isInformationIncomplete = val;
      //ACROSTICS
      val = await this.storage.get('SHOW_TABLES_IS_ACROSTICS');
      this.acrosticsTables.isAcrostics = val;
      val = await this.storage.get('SHOW_TABLES_IS_ACROSTICS_COMPLETE');
      this.acrosticsTables.isAcrosticsComplete = val;
      val = await this.storage.get('SHOW_TABLES_IS_ACROSTICS_INCOMPLETE');
      this.acrosticsTables.isAcrosticsIncomplete = val;
      //MNEMONICS
      val = await this.storage.get('SHOW_TABLES_IS_MNEMONICS');
      this.acrosticsTables.isMnemonics = val;
      val = await this.storage.get('SHOW_TABLES_IS_MNEMONICS_COMPLETE');
      this.acrosticsTables.isMnemonicsComplete = val;
      val = await this.storage.get('SHOW_TABLES_IS_MNEMONICS_INCOMPLETE');
      this.acrosticsTables.isMnemonicsIncomplete = val;
      //PEGLIST
      val = await this.storage.get('SHOW_TABLES_IS_PEGLIST');
      this.acrosticsTables.isPeglist = val;
      val = await this.storage.get('SHOW_TABLES_IS_PEGLIST_COMPLETE');
      this.acrosticsTables.isPeglistComplete = val;
      val = await this.storage.get('SHOW_TABLES_IS_PEGLIST_INCOMPLETE');
      this.acrosticsTables.isPeglistIncomplete = val;
      //IMAGES
      val = await this.storage.get('SHOW_TABLES_IS_IMAGES');
      this.acrosticsTables.isImages = val;
      val = await this.storage.get('SHOW_TABLES_IS_IMAGES_COMPLETE');
      this.acrosticsTables.isImagesComplete = val;
      val = await this.storage.get('SHOW_TABLES_IS_IMAGES_INCOMPLETE');
      this.acrosticsTables.isImagesIncomplete = val;
      //--------------------
      this.acrosticsTables.color = "secondary";
      await this.loadTables();
   }

   async saveStorage() {
      console.log("saveStorage called");
      await this.storage.set('SHOW_TABLES_SELECTED_TABLE', this.acrosticsTables.selectedTable);
      await this.storage.set('SHOW_TABLES_IS_READ', this.acrosticsTables.isRead);
      //INFORMATION
      await this.storage.set('SHOW_TABLES_IS_INFORMATION', this.acrosticsTables.isInformation);
      await this.storage.set('SHOW_TABLES_IS_INFORMATION_COMPLETE', this.acrosticsTables.isInformationComplete);
      await this.storage.set('SHOW_TABLES_IS_INFORMATION_INCOMPLETE', this.acrosticsTables.isInformationIncomplete);
      //ACROSTICS
      await this.storage.set('SHOW_TABLES_IS_ACROSTICS', this.acrosticsTables.isAcrostics);
      await this.storage.set('SHOW_TABLES_IS_ACROSTICS_COMPLETE', this.acrosticsTables.isAcrosticsComplete);
      await this.storage.set('SHOW_TABLES_IS_ACROSTICS_INCOMPLETE', this.acrosticsTables.isAcrosticsIncomplete);
      //MNEMONICS
      await this.storage.set('SHOW_TABLES_IS_MNEMONICS', this.acrosticsTables.isMnemonics);
      await this.storage.set('SHOW_TABLES_IS_MNEMONICS_COMPLETE', this.acrosticsTables.isMnemonicsComplete);
      await this.storage.set('SHOW_TABLES_IS_MNEMONICS_INCOMPLETE', this.acrosticsTables.isMnemonicsIncomplete);
      //PEGLIST
      await this.storage.set('SHOW_TABLES_IS_PEGLIST', this.acrosticsTables.isPeglist);
      await this.storage.set('SHOW_TABLES_IS_PEGLIST_COMPLETE', this.acrosticsTables.isPeglistComplete);
      await this.storage.set('SHOW_TABLES_IS_PEGLIST_INCOMPLETE', this.acrosticsTables.isPeglistIncomplete);
      //IMAGES
      await this.storage.set('SHOW_TABLES_IS_IMAGES', this.acrosticsTables.isImages);
      await this.storage.set('SHOW_TABLES_IS_IMAGES_COMPLETE', this.acrosticsTables.isImagesComplete);
      await this.storage.set('SHOW_TABLES_IS_IMAGES_INCOMPLETE', this.acrosticsTables.isImagesIncomplete);
   }

   async loadTables(): Promise<void> {
      console.log("loadTables called");
      await this.helpers.setProgress("Loading tables ,please wait...", false);
      this.acrosticsTables.tables = [];
      this.acrosticsTables.counts = [];
      this.acrosticsTables.countTotal = 0;
      this.acrosticsTables.countCompleted = 0;
      if (Helpers.isWorkOffline === false) {
         var data: any = null;
         try {
            data = await this.helpers.makeHttpRequest("/lfq_directory/php/acrostics_tables_initiate.php", "GET", null);
            this.helpers.dismissProgress();
         } catch (error: any) {
            this.helpers.dismissProgress();
            this.helpers.alertLfqError(error.mesage);
         }
         if (data && data["SUCCESS"] === true) {
            this.acrosticsTables.COUNT_TOTAL = data["COUNT_TOTAL"];
            this.acrosticsTables.COUNT_COMPLETED = data["COUNT_COMPLETED"];
            var countCompleted = 0;
            var countTotal = 0;
            for (var i = 0; i < data["TABLES"].length; i++) {
               this.acrosticsTables.tables.push(data["TABLES"][i].TABLE);
               countCompleted = data["TABLES"][i].COUNT_COMPLETED != null ? data["TABLES"][i].COUNT_COMPLETED : 0;
               countTotal = data["TABLES"][i].COUNT_COMPLETED != null ? data["TABLES"][i].COUNT_TOTAL : 0;
               this.acrosticsTables.counts.push({
                  "COMPLETED": countCompleted,
                  "TOTAL": countTotal
               });
               this.acrosticsTables.countCompleted += parseInt(String(countCompleted));
               this.acrosticsTables.countTotal += parseInt(String(countTotal));
            }
         } else {
            this.helpers.alertLfqError(data["ERROR"]);
         }
         //this.acrosticsTables.counts
      } else {
         await this.getTableNames();
         console.log("Number of tables = " + this.acrosticsTables.tables.length);
         var query = "";
         this.queries = [];
         var ct64s = 0;//USESD BECAUSE LIMIT OF JOIN IS 64 QUERIES.
         for (var i = 0; i < this.acrosticsTables.tables.length; i++) {
            console.log("name =" + this.acrosticsTables.tables[i] + "?");
            query += "(SELECT COUNT(ID) AS c" + i + ", SUM(CASE WHEN (Acrostics IS NOT NULL AND Acrostics!='') THEN 1 ELSE 0 END) AS cc" + i + " FROM " + this.acrosticsTables.tables[i] + ")";
            ct64s++;
            if (ct64s < 64 && i != this.acrosticsTables.tables.length - 1) {
               query += ",";
            }
            if (ct64s >= 64) {
               this.queries.push(query);
               ct64s = 0;
               query = "";
            }
         }
         if (ct64s > 0) {
            this.queries.push(query);
         }
         console.log("queries.length=" + this.queries.length);
         //console.log("this.acrosticsTables.tables=" + this.acrosticsTables.tables);
         this.tableCountIndex = 0;
         this.getCounts(0);
      }
   }

   getTableNames(): Promise<void> {
      return new Promise((resolve, reject) => {
         var sql = "SELECT tbl_name FROM sqlite_master WHERE type='table' ORDER BY tbl_name";
         this.helpers.query(this.database_acrostics, sql, []).then((data) => {
            if (data.rows.length > 0) {
               for (var i = 0; i < data.rows.length; i++) {
                  if (data.rows.item(i).tbl_name === '__WebKitDatabaseInfoTable__' || data.rows.item(i).tbl_name === "android_metadata" || data.rows.item(i).tbl_name === "sqlite_sequence") {
                     continue;
                  }
                  this.acrosticsTables.tables.push(data.rows.item(i).tbl_name);
               }
               resolve();
            } else {
               resolve();
            }
         }).catch((error) => {//END SELECT QUERY
            console.log("sql:" + sql + ", ERROR:" + error.message);
            resolve();
         });
      });
   }

   getCounts(index: any) {
      var sql = "SELECT * FROM " + this.queries[index];
      console.log("getCounts called index=" + index + ", sql=" + sql);
      this.helpers.query(this.database_acrostics, sql, []).then((data) => {
         console.log("data.rows.length=" + data.rows.length);
         //console.log("data=" + JSON.stringify(data));
         var countCompleted = 0;
         var countTotal = 0;
         if (index != this.queries.length - 1) {
            for (var i = 0; i < 64; i++) {
               console.log("data.rows.item[c + i]=" + data.rows.item(0)["c" + i]);
               countCompleted = data.rows.item(0)["cc" + this.tableCountIndex] != null ? data.rows.item(0)["cc" + this.tableCountIndex] : 0;
               countTotal = data.rows.item(0)["c" + this.tableCountIndex] != null ? data.rows.item(0)["c" + this.tableCountIndex] : 0;
               this.acrosticsTables.counts.push({
                  "COMPLETED": countCompleted,
                  "TOTAL": countTotal
               });
               this.acrosticsTables.countCompleted += parseInt(String(countCompleted));
               this.acrosticsTables.countTotal += parseInt(String(countTotal));
               this.tableCountIndex++;
            }
         } else {
            while (this.tableCountIndex < this.acrosticsTables.tables.length) {
               countCompleted = data.rows.item(0)["cc" + this.tableCountIndex] != null ? data.rows.item(0)["cc" + this.tableCountIndex] : 0;
               countTotal = data.rows.item(0)["c" + this.tableCountIndex] != null ? data.rows.item(0)["c" + this.tableCountIndex] : 0;
               this.acrosticsTables.counts.push({
                  "COMPLETED": countCompleted,
                  "TOTAL": countTotal
               });
               this.acrosticsTables.countCompleted += parseInt(String(countCompleted));
               this.acrosticsTables.countTotal += parseInt(String(countTotal));
               this.tableCountIndex++;
            }
         }
         if (++index < this.queries.length) {
            this.getCounts(index);
         } else {
            this.acrosticsTables.table = this.acrosticsTables.tables[0];
            this.selectTable();
         }
      }).catch((error) => {//END SELECT QUERY
         console.log("sql:" + sql + ", ERROR:" + error.message);
         this.helpers.dismissProgress();
      });
   }

   setSelectedTable(selectedOption: any) {
      console.log("setSelectedTable called");
      this.acrosticsTables.table = selectedOption;
   }


   setUnchecked(whichField: any) {
      console.log("setUnchecked called, whichField=" + whichField);
      if (whichField === 'Information') {
         if (this.acrosticsTables.isInformation === true) {
            this.acrosticsTables.isInformationComplete = false;
            this.acrosticsTables.isInformationIncomplete = false;
         }
      }
      if (whichField === 'Acrostics') {
         if (this.acrosticsTables.isAcrostics === true) {
            this.acrosticsTables.isAcrosticsComplete = false;
            this.acrosticsTables.isAcrosticsIncomplete = false;
         }
      }
      if (whichField === 'Mnemonics') {
         if (this.acrosticsTables.isMnemonics === true) {
            this.acrosticsTables.isMnemonicsComplete = false;
            this.acrosticsTables.isMnemonicsIncomplete = false;
         }
      }
      if (whichField === 'Images') {
         if (this.acrosticsTables.isImages === true) {
            this.acrosticsTables.isImagesComplete = false;
            this.acrosticsTables.isImagesIncomplete = false;
         }
      }
      if (whichField === 'Peglist') {
         if (this.acrosticsTables.isPeglist === true) {
            this.acrosticsTables.isPeglistComplete = false;
            this.acrosticsTables.isPeglistIncomplete = false;
         }
      }
   }

   setChecked(category: any, whichField: any) {
      console.log("setChecked called, whichField=" + whichField);
      if (whichField === false) {
         if (category === "Information") {
            this.acrosticsTables.isInformation = true;
         }
         if (category === "Acrostics") {
            this.acrosticsTables.isAcrostics = true;
         }
         if (category === "Mnemonics") {
            this.acrosticsTables.isMnemonics = true;
         }
         if (category === "Images") {
            this.acrosticsTables.isImages = true;
         }
         if (category === "Peglist") {
            this.acrosticsTables.isPeglist = true;
         }
      }
   }

   showSelectOneCategory(index: number) {
      console.log("showSelectOneCategory called, index = " + index);
      if (this.acrosticsTables.isShowByCategories === false) {
         this.helpers.dismissProgress();
         return;
      } else {
         this.helpers.setProgress("Loading category types of " + this.acrosticsTables.selectedCategories[index].selectedCategory + ", please wait...", true).then(() => {
            this.setShowSelectedCategories(index);
            for (var sc = (index + 1); sc < this.acrosticsTables.selectedCategories.length; sc++) {
               this.acrosticsTables.selectedCategories[sc].selectedCategory = null;
               this.acrosticsTables.selectedCategories[sc].selectedValue = null;
               this.acrosticsTables.selectedCategories[sc].isShowNext = false;
            }
            if (Helpers.isWorkOffline === false) {
               var params = {
                  "select_table": this.acrosticsTables.selectedTable,
                  "sort_by_category": this.acrosticsTables.selectedCategories[index].selectedCategory,
                  "selected_categories": this.acrosticsTables.selectedShowCategories
               };
               this.helpers.makeHttpRequest("/lfq_directory/php/acrostics_tables_get_category_values.php", "POST", params).then((data) => {
                  this.helpers.dismissProgress();
                  if (data["SUCCESS"] === true) {
                     this.acrosticsTables.selectedCategoriesValues[index] = data["CATEGORY_VALUES"];
                  } else {
                     this.helpers.alertLfqError(data["ERROR"]);
                  }
               }, error => {
                  this.helpers.dismissProgress();
                  this.helpers.alertServerError(error.message);
               });
            } else {
               var where_sel_cats = "";
               if (this.acrosticsTables.selectedShowCategories != null) {
                  var where_sel_cats_add = [];
                  for (var prop in this.acrosticsTables.selectedShowCategories) {
                     where_sel_cats_add.push(prop + "='" + this.acrosticsTables.selectedShowCategories[prop] + "'");
                  }
                  where_sel_cats = where_sel_cats_add.join(" AND ");
                  if (where_sel_cats_add.length > 0) {
                     where_sel_cats += " AND ";
                  }
               }
               var sql = "SELECT DISTINCT " + this.acrosticsTables.selectedCategories[index].selectedCategory + " FROM " + this.acrosticsTables.selectedTable + " WHERE " + where_sel_cats + this.acrosticsTables.selectedCategories[index].selectedCategory + " IS NOT NULL AND TRIM(" + this.acrosticsTables.selectedCategories[index].selectedCategory + ")<>'' AND " + this.acrosticsTables.selectedCategories[index].selectedCategory + "<>'undefined' ORDER BY " + this.acrosticsTables.selectedCategories[index].selectedCategory;
               //var sql = 'SELECT DISTINCT ' + this.acrosticsTables.selectedCategories[index].selectedCategory + ' FROM ' + this.acrosticsTables.selectedTable + ' ORDER BY ' + this.acrosticsTables.selectedCategories[index].selectedCategory;
               this.helpers.query(this.database_acrostics, sql, []).then((data) => {
                  console.log("NUMBER TYPES=" + data.rows.length + ", this.acrosticsTables.selectedCategoriesValues.length = " + this.acrosticsTables.selectedCategoriesValues.length);
                  this.acrosticsTables.selectedCategoriesValues[index] = [];
                  for (var i = 0; i < data.rows.length; i++) {
                     console.log("PUSHING TYPE=" + data.rows.item(i)[this.acrosticsTables.selectedCategories[index].selectedCategory]);
                     if (data.rows.item(i)[this.acrosticsTables.selectedCategories[index].selectedCategory] !== '' && data.rows.item(i)[this.acrosticsTables.selectedCategories[index].selectedCategory] !== 'undefined') {
                        this.acrosticsTables.selectedCategoriesValues[index].push(data.rows.item(i)[this.acrosticsTables.selectedCategories[index].selectedCategory]);
                     }
                  }
                  this.helpers.dismissProgress();
               }, (error) => {
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  this.helpers.dismissProgress();
               });
            }
         });
      }
   }

   selectTable() {
      console.log("selectTable called");
      if (this.acrosticsTables.selectedTable == null) {
         this.helpers.dismissProgress();
         return;
      }
      this.helpers.setProgress("Loading table " + this.acrosticsTables.selectedTable + ", please wait...", true).then(() => {
         this.acrosticsTables.categories = [];
         this.acrosticsTables.tableSortCategories = [];
         this.helpers.getColumnNames(this.database_acrostics, this.acrosticsTables.selectedTable).then((columns) => {
            var col = "";
            var notCategories = [
               "ID", "Username", "Name", "Information", "Acrostics",
               "Mnemonics", "Peglist", "Image", "User_ID"
            ];
            for (var i = 0; i < columns.length; i++) {
               col = columns[i];
               if (notCategories.indexOf(col) < 0) {
                  this.acrosticsTables.categories.push(col);
                  this.acrosticsTables.tableSortCategories.push(col);
               }
            }
            this.acrosticsTables.selectedCategories = [];
            var nextCategories = [];
            for (var i = 0; i < this.acrosticsTables.categories.length; i++) {
               nextCategories = [];
               if (i === 0) {
                  nextCategories = this.acrosticsTables.categories;
                  console.log("SETTING FIRST this.acrosticsTables.selectedCategories nextCategories = " + nextCategories);
               }
               this.acrosticsTables.selectedCategories.push({ "isChecked": false, "selectedCategory": null, "selectedValue": null, "nextCategories": nextCategories });
            }
            this.acrosticsTables.selectedCategoriesValues = new Array(this.acrosticsTables.categories.length);

            console.log("acrosticsTables.tableCategories=" + this.acrosticsTables.tableCategories);
            console.log("acrosticsTables.tableSortCategories=" + this.acrosticsTables.tableSortCategories);
            if (this.acrosticsTables.categories.length > 0) {
               this.acrosticsTables.selectedCategories[0].selectedCategory = this.acrosticsTables.categories[0];
               this.showSelectOneCategory(0);
            } else {
               this.helpers.dismissProgress();
            }
         });
      });
   }


   getAcrosticsTable() {
      console.log("getAcrosticsTable called.");
      this.acrosticsTables.isShowTable = true;
      this.helpers.setProgress("Loading " + this.acrosticsTables.selectedTable + " acrostics table  ,please wait...", false).then(() => {
         console.log("Selected table=" + this.acrosticsTables.selectedTable);
         // QUERY CONDITIONS:
         var category = "Name";
         var orderby = "Name COLLATE NOCASE";
         var col_list: any = [];
         this.acrosticsTables.tableResults = [];
         this.helpers.getColumnNames(this.database_acrostics, this.acrosticsTables.selectedTable).then((columns) => {
            this.acrosticsTables.hasMnemonics = false;
            this.acrosticsTables.hasPeglist = false;
            this.acrosticsTables.hasImages = false;
            var col = "";
            for (var i = 0; i < columns.length; i++) {
               col = columns[i];
               if (col !== "ID" && col !== "Username") {
                  console.log("COLUMN = " + col);
                  col_list.push(col);
               }

            }
            var cols_str = col_list.join(",");
            console.log("cols_str = " + cols_str);
            if (this.acrosticsTables.isSortByCategory == true && this.acrosticsTables.sortByCategory) {
               category = this.acrosticsTables.sortByCategory;
               orderby = category + ",Name COLLATE NOCASE";
            }
            if (col_list.indexOf("Mnemonics") >= 0 && this.acrosticsTables.isMnemonics === true) {
               this.acrosticsTables.hasMnemonics = true;
            }
            if (col_list.indexOf("Peglist") >= 0 && this.acrosticsTables.isPeglist === true) {
               this.acrosticsTables.hasPeglist = true;
            }
            console.log("this.acrosticsTables.isImages=" + this.acrosticsTables.isImages);
            if (col_list.indexOf("Image") >= 0 && this.acrosticsTables.isImages === true) {
               console.log("SETTING this.acrosticsTables.hasImages to TRUE");
               this.acrosticsTables.hasImages = true;
            }
            this.acrosticsTables.categories = [];
            var select_sort_by_categories = [];
            for (var i = 0; i < col_list.length; i++) {
               if (col_list[i] !== "ID"
                  && col_list[i] !== "Username"
                  && col_list[i] !== "User_ID"
                  && col_list[i] !== "Name"
                  && col_list[i] !== "Information"
                  && col_list[i] !== "Acrostics"
                  && col_list[i] !== "Mnemonics"
                  && col_list[i] !== "Peglist"
                  && col_list[i] !== "Image") {
                  this.acrosticsTables.categories.push(col_list[i]);
               }
            }
            select_sort_by_categories = this.acrosticsTables.categories;
            if (this.acrosticsTables.isShowByCategories === true) {
               this.acrosticsTables.oneCategoryOptions = {};
               for (var sc = 0; sc < this.acrosticsTables.selectedCategories.length; sc++) {
                  if (this.acrosticsTables.selectedCategories[sc].selectedValue != null) {
                     this.acrosticsTables.oneCategoryOptions[this.acrosticsTables.selectedCategories[sc].selectedCategory] = this.acrosticsTables.selectedCategories[sc].selectedValue;
                  }
               }
            }
            if (Helpers.isWorkOffline === false) {
               this.acrosticsTables.isShowAllCategories = true;
               console.log("this.acrosticsTables.categories = " + this.acrosticsTables.categories + ", col_list=" + col_list);
               var params = {
                  "select_table": this.acrosticsTables.selectedTable,
                  "select_sort_by_categories": this.acrosticsTables.categories,
                  "one_category_options": this.acrosticsTables.oneCategoryOptions,
                  "is_show_all_categories": this.acrosticsTables.isShowAllCategories,
                  "is_information": this.acrosticsTables.isInformation,
                  "is_acrostics": this.acrosticsTables.isAcrostics,
                  "is_images": this.acrosticsTables.isImages,
                  "is_mnemonics": this.acrosticsTables.isMnemonics,
                  "is_information_complete": this.acrosticsTables.isInformationComplete,
                  "is_acrostics_complete": this.acrosticsTables.isAcrosticsComplete,
                  "is_images_complete": this.acrosticsTables.isImagesComplete,
                  "is_mnemonics_complete": this.acrosticsTables.isMnemonicsComplete,
                  "is_information_incomplete": this.acrosticsTables.isInformationIncomplete,
                  "is_acrostics_incomplete": this.acrosticsTables.isAcrosticsIncomplete,
                  "is_images_incomplete": this.acrosticsTables.isImagesIncomplete,
                  "is_mnemonics_incomplete": this.acrosticsTables.isMnemonicsIncomplete,
                  "is_read": this.acrosticsTables.isRead
               };
               this.helpers.makeHttpRequest("/lfq_directory/php/acrostics_tables_show_table.php", "POST", params).then((data) => {
                  if (data["SUCCESS"] === true) {
                     this.acrosticsTables.tableRows = data["ROWS"];
                     for (var i = 0; i < this.acrosticsTables.tableRows.length; i++) {
                        if (data["ROWS"][i]) {
                           data["ROWS"][i].Names = data["ROWS"][i].Name.split(";");
                           if (data["ROWS"][i].Image !== false) {
                              data["ROWS"][i].Image = atob(data["ROWS"][i].Image);
                           }
                        }
                     }
                     this.showAcrosticsTable(data["ROWS"], category);
                     this.helpers.dismissProgress();
                  } else {
                     this.helpers.dismissProgress();
                     this.helpers.alertLfqError(data["ERROR"]);
                  }
               }, error => {
                  this.helpers.dismissProgress();
                  this.helpers.alertServerError(error.message);
               });
            } else {
               var sql = "";
               if (this.acrosticsTables.hasMnemonics || this.acrosticsTables.hasPeglist) {
                  sql = "SELECT " + cols_str + " FROM " + this.acrosticsTables.selectedTable;
               }
               else {
                  if (this.acrosticsTables.isShowByCategories === false) {
                     sql = "SELECT " + cols_str + " FROM " + this.acrosticsTables.selectedTable + " ORDER BY " + orderby;
                  } else {
                     var where_cats = [];
                     for (var sc = 0; sc < this.acrosticsTables.selectedCategories.length; sc++) {
                        where_cats.push(this.acrosticsTables.selectedCategories[0].selectedCategory + "='"
                           + this.acrosticsTables.selectedCategories[0].selectedValue + "'");
                     }
                     sql = "SELECT " + cols_str + " FROM " + this.acrosticsTables.selectedTable + " WHERE " + where_cats.join(" AND ") + " ORDER BY " + orderby;
                  }
               }
               this.helpers.query(this.database_acrostics, sql, []).then((data) => {
                  var rows = [];
                  for (var i = 0; i < data.rows.length; i++) {
                     rows.push(data.rows.item(i));
                  }
                  this.showAcrosticsTable(rows, category);
                  this.helpers.dismissProgress();
               }).catch((error) => {
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  this.helpers.dismissProgress();
               });
            }
         });
      });
   }

   showAcrosticsTable(rows: any, category: any) {
      console.log("showAcrosticsTable called");
      var ct = 0;
      var is_found_image = false;
      var mnemonics = "";
      var column1 = "";
      if (rows.length > 0) {
         var tableResultsObj: any = {};
         var hasShownImage = false;
         for (var i = 0; i < rows.length; i++) {
            tableResultsObj = {};
            var name = rows[i].Name;
            mnemonics = "";
            if (this.acrosticsTables.hasMnemonics === true) {
               mnemonics = rows[i].Mnemonics;
            }
            if (this.acrosticsTables.isImages === true) {
               // GET IMAGE:
               is_found_image = false;
               if (rows[i].Image != null) {
                  is_found_image = true;
               }
            }
            var isComplete = !(this.acrosticsTables.isInformationComplete && rows[i].Information === "")
               && !(this.acrosticsTables.isAcrosticsComplete && rows[i].Acrostics === "")
               && !(this.acrosticsTables.isMnemonicsComplete && mnemonics === "")
               && !(this.acrosticsTables.isImagesComplete && is_found_image == false)
               && !(this.acrosticsTables.isPeglistComplete && rows[i].Peglist === "");
            var isIncomplete = !(this.acrosticsTables.isInformationIncomplete && rows[i].Information === "")
               && !(this.acrosticsTables.isAcrosticsIncomplete && rows[i].Acrostics !== "")
               && !(this.acrosticsTables.isMnemonicsIncomplete && mnemonics !== "")
               && !(this.acrosticsTables.isImagesIncomplete && is_found_image == true)
               && !(this.acrosticsTables.isPeglistIncomplete && rows[i].Peglist !== "");
            if (isComplete && isIncomplete) {
               ct++;
               var aliased_name_spl = name.split(";");
               var aliased_name = aliased_name_spl.join("\nOR... ");
               column1 = "<b>" + ct + ".<u>" + aliased_name + "</u></b>";
               if (this.acrosticsTables.isShowAllCategories === true) {
                  for (var c = 0; c < this.acrosticsTables.categories.length; c++) {
                     column1 += "<br /><b>" + this.acrosticsTables.categories[c] + "</b>: ";
                     if (rows[i][this.acrosticsTables.categories[c]] != null) {
                        column1 += rows[i][this.acrosticsTables.categories[c]];
                     }
                  }
               } else {
                  if (category !== "Name") {
                     column1 += "<br /><b><u>" + category + ": </u></b>";
                     if (rows[i][category] != null) {
                        column1 += "<b>" + rows[i][category] + "</b>";
                     }
                  }
               }
               tableResultsObj.Column1 = column1;
               if (this.acrosticsTables.isImages === true && this.acrosticsTables.hasImages === true) {
                  if (rows[i].Image != null) {
                     tableResultsObj.Image = rows[i].Image;
                     if (hasShownImage == false) {
                        console.log("MY STUPID IMAGE=" + tableResultsObj.Image);
                        hasShownImage = true;
                     }

                  }
               }
               if (this.acrosticsTables.isInformation === true) {
                  if (rows[i].Information !== "") {
                     tableResultsObj.Information = rows[i].Information;
                  }
               }
               if (this.acrosticsTables.isAcrostics) {
                  if (rows[i].Acrostics !== "") {
                     tableResultsObj.Acrostics = rows[i].Acrostics;
                  }
               }
               if (this.acrosticsTables.isMnemonics && this.acrosticsTables.hasMnemonics) {
                  if (rows[i].Mnemonics !== "") {
                     tableResultsObj.Mnemonics = rows[i].Mnemonics;
                  }
               }
               if (this.acrosticsTables.isPeglist && this.acrosticsTables.hasPeglist) {
                  if (rows[i].Peglist !== "") {
                     tableResultsObj.Peglist = rows[i].Peglist;
                  }
               }
               this.acrosticsTables.tableResults.push(tableResultsObj);
            }
         }//END FOR LOOP.
      }
   }

   readInfo(info_index: number) {
      var text_now = "";
      if (this.info_sentence_isread[info_index] == false) {
         var dummy_text = text_now;
         var strind = 0;
         var period_array = [];
         while (dummy_text.indexOf(".") != -1) {
            var strlen = dummy_text.indexOf(".") + 1;
            strind += strlen;
            period_array.push(strind);
            dummy_text = dummy_text.substring(strlen);
            console.log("dummy_text=" + dummy_text);
         }
      }
   }


   showInformation(info_index: number) {
      console.log("showInformation called");
      console.log("info_index=" + info_index);
      if (this.info_sentence_isread[info_index] == true) {
         console.log("IN INFO EDIT (IS READ)!!");
         var senct = 0;
      }
   }

   goBackUp() {
      this.acrosticsTables.isShowTable = false;
   }

   getNextCategories(categoryIndex: number) {
      console.log("getNextCategories called, categoryIndex = " + categoryIndex);
      var selectedCategory = this.acrosticsTables.selectedCategories[categoryIndex].selectedCategory;
      var indexSelected = this.acrosticsTables.categories.indexOf(selectedCategory);
      console.log("getNextCategories selectedCategory = " + selectedCategory + ", indexSelected = " + indexSelected + ", categories.length=" + this.acrosticsTables.categories.length);
      if (indexSelected < this.acrosticsTables.categories.length - 1) {
         console.log("this.acrosticsTables.selectedCategories[categoryIndex + 1].isShowNext TRUE !");
         this.acrosticsTables.selectedCategories[categoryIndex + 1].isShowNext = true;
         this.acrosticsTables.selectedCategories[categoryIndex + 1].nextCategories = this.acrosticsTables.categories.slice(indexSelected + 1);
      }
      this.setShowSelectedCategories(categoryIndex);
      for (var sc = (categoryIndex + 2); sc < this.acrosticsTables.selectedCategories.length; sc++) {
         this.acrosticsTables.selectedCategories[sc].selectedCategory = null;
         this.acrosticsTables.selectedCategories[sc].selectedValue = null;
         this.acrosticsTables.selectedCategories[sc].isShowNext = false;
      }
   }

   setShowSelectedCategories(categoryIndex: number) {
      this.acrosticsTables.selectedShowCategories = {};
      for (var sc = 0; sc < categoryIndex; sc++) {
         this.acrosticsTables.selectedShowCategories[this.acrosticsTables.selectedCategories[sc].selectedCategory] = this.acrosticsTables.selectedCategories[sc].selectedValue;
      }
      console.log("setShowSelectedCategories, this.acrosticsTables.selectedShowCategories = " + JSON.stringify(this.acrosticsTables.selectedShowCategories));
   }

   doSelectCategories() {
      console.log("BEGIN doSelectCategories called, this.acrosticsTables.isShowByCategories = " + this.acrosticsTables.isShowByCategories);
      //this.acrosticsTables.isShowByCategories = !this.acrosticsTables.isShowByCategories;
      if (this.acrosticsTables.isShowByCategories === false) {
         this.acrosticsTables.selectedShowCategories = {};
         for (var sc = 0; sc < this.acrosticsTables.selectedCategories.length; sc++) {
            this.acrosticsTables.selectedCategories[sc].selectedCategory = null;
            this.acrosticsTables.selectedCategories[sc].selectedValue = null;
            this.acrosticsTables.selectedCategories[sc].isShowNext = false;
         }
      }
      console.log("END doSelectCategories called, this.acrosticsTables.isShowByCategories = " + this.acrosticsTables.isShowByCategories);
   }
}

interface myObject {
   [key: string]: any;
}