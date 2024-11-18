import { Component, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NavController, LoadingController, AlertController, Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';

import { DB_Type_ID, Helpers, Op_Type, Op_Type_ID, SyncQuery, User_Action_Request } from '../../providers/helpers/helpers';
import { NgZone } from '@angular/core';
import { Subscription } from 'rxjs';


@Component({
   selector: 'page-edit-events',
   templateUrl: 'edit-events.html',
   styleUrl: 'edit-events.scss'
})
export class EditEventsPage {
   public pageName:string = "Edit Events";
   public database_misc: SQLiteDBConnection;
   //@ViewChild('eventsYearSelect') eventsYearSelect: ElementRef;
   //@ViewChild('eventsMonthSelect') eventsMonthSelect: ElementRef;
   //@ViewChild('eventsDaySelect') eventsDaySelect: ElementRef;
   progressLoader: any;
   editEvents: any;
   date: any;
   table: any;
   id: any;
   savedEvent: any;
   count: number = 0;
   total: number = 0;
   is_after_years_load: any;
   lfq_table: any;
   isAfterYearsLoad: any;
   user_clause: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   private onPauseSubscription: Subscription;

   constructor(public navCtrl: NavController, private platform: Platform, public changeDet: ChangeDetectorRef, private alertCtrl: AlertController, public progress: LoadingController, public storage: Storage, public helpers: Helpers, public ngZone: NgZone) {
      console.log("EDIT EVENTS CONSTRUCTOR CALLED.");
      this.onPauseSubscription = this.platform.pause.subscribe(() => {
         this.saveStorage();
      });
      this.database_misc = this.helpers.getDatabaseMisc();
   }

   ngOnDestroy() {
      console.log("ngOnDestroy called");
      this.saveStorage();
      this.onPauseSubscription.unsubscribe();
   }

   async ngOnInit() {      
      this.isAfterYearsLoad = false;
      this.lfq_table = "";
      this.editEvents = {};
      Helpers.currentPageName = this.pageName;
      this.editEvents.user = Helpers.User;
      await this.storage.create();
      var getOld: myObject = {};
      this.editEvents.getOld = getOld;
      this.editEvents.textInputs = ["EVENT", "MAJOR_WORDS", "MNEMONICS"];
      this.editEvents.selectedTextInput = this.editEvents.textInputs[0];
      this.editEvents.selectedTextInputIndex = 0;
      this.editEvents.isGottenByMethod = false;
      this.editEvents.savedYear = "";
      this.is_after_years_load = false;
      this.date = "";
      this.table = Helpers.TABLES_MISC.event_table;
      this.id = "";
      this.savedEvent = "";
      this.count = 0;
      this.editEvents.selectedMethod = null;
      this.editEvents.selectedAction = null;
      this.editEvents.selectedType = "HISTORICAL";
      this.editEvents.isShared = false;
      this.editEvents.isBC = false;
      var date_now = new Date();
      var year = date_now.getFullYear();
      var month_index = date_now.getMonth();
      var day = date_now.getDate();
      this.editEvents.years = [];
      this.editEvents.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      this.editEvents.month = this.editEvents.months[month_index];
      for (var i = (year - 20); i < (year + 20); i++) {
         this.editEvents.years.push(i);
      }
      this.editEvents.year = year;
      this.editEvents.savedYear = year;
      this.editEvents.days = [];
      this.getMonthDays(year, month_index);
      this.editEvents.day = day;
      this.editEvents.peglist = [];
      this.helpers.getPeglist().then((peglist) => {
         if (peglist != null) {
            this.editEvents.peglist = peglist;
         }
         this.storage.get('EDIT_EVENTS_SELECTED_METHOD').then((val) => {
            if (val != null) {
               this.editEvents.selectedMethod = val;
               this.editEvents.savedSelectedMethod = this.editEvents.selectedMethod;
            }
            this.storage.get('EDIT_EVENTS_IS_SHARED').then((val) => {
               if (Helpers.User.Username === 'GUEST') {
                  this.editEvents.isShared = true;
               } else {
                  if (val != null) {
                     this.editEvents.isShared = val;
                  }
               }
               this.storage.get('EDIT_EVENTS_SELECTED_TABLE').then((val) => {
                  if (val != null) {
                     this.editEvents.selectedType = val;
                     this.editEvents.savedselectedType = this.editEvents.selectedType;
                  }
                  this.storage.get('EDIT_EVENTS_SELECTED_ACTION').then((val) => {
                     if (val != null) {
                        this.editEvents.selectedAction = val;
                     }
                     //this.editEvents.scrollColor = "light";
                     //this.editEvents.forwardColor = "light";
                     this.background_color = Helpers.background_color;
                     this.button_color = Helpers.button_color;
                     this.button_gradient = Helpers.button_gradient;
                     this.editEvents.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
                        this.background_color = bgColor;
                     });
                     this.editEvents.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
                        this.button_color = buttonColor.value;
                        this.button_gradient = buttonColor.gradient;
                     });                     
                  });
               });
            });
         });
      });
   }

   ionViewDidLoad() {
      console.log('ionViewDidLoad EditEventsPage');
   }

   ionViewWillLeave() {
      console.log('ionViewWillLeave EditEventsPage');
      this.editEvents.subscribedBackgroundColorEvent.unsubscribe();
      this.editEvents.subscribedButtonColorEvent.unsubscribe();
      this.saveStorage();
   }

   saveStorage() {
      console.log("saveStorage called");
      this.storage.set('EDIT_EVENTS_SELECTED_METHOD', this.editEvents.selectedMethod).then(() => {
         this.storage.set('EDIT_EVENTS_IS_SHARED', this.editEvents.isShared).then(() => {
            this.storage.set('EDIT_EVENTS_SELECTED_TYPE', this.editEvents.selectedType).then(() => {
               this.storage.set('EDIT_EVENTS_SELECTED_ACTION', this.editEvents.selectedAction).then(() => {
               });
            });
         });
      });
   }

   //LOADS THE DAYS IN A MONTH
   getMonthDays(year:any, month_index:any) {
      console.log("getMonthDays called.");
      this.editEvents.days = [];
      var days_in_month = new Date(year, (month_index + 1), 0).getDate();
      for (var i = 1; i <= days_in_month; i++) {
         this.editEvents.days.push(i);
      }
   }

   //SET SELECT YEAR, MONTH, DAY WITH CURRENT DATE
   changeLatest() {
      console.log('changeLatest called.');
      var date_now = new Date();
      var year = date_now.getFullYear();
      var month_index = date_now.getMonth();
      var day = date_now.getDate();
      this.editEvents.month = this.editEvents.months[month_index];
      this.editEvents.day = day;
      this.editEvents.years = [];
      for (var i = (year - 20); i < (year + 20); i++) {
         this.editEvents.years.push(i);
      }
      this.editEvents.year = year;
      this.editEvents.savedYear = year;
      this.editEvents.event = "";
      this.id = 0;
      this.savedEvent = "";
   }

   getEvent(message:any, action:any) {
      console.log("getEvent called");
      this.helpers.setProgress(message, false).then(() => {
         var isGetNext:any = null;
         if (action === "last") {
            isGetNext = false;
         } else if (action === "next") {
            isGetNext = true;
         }
         if (this.total === 0) {
            this.helpers.dismissProgress();
            return;
         }
         console.log('getEvent called. this.editEvents.selectedMethod=' + this.editEvents.selectedMethod + ", this.count=" + this.count + ", this.total=" + this.total);
         var year = null;
         if (this.editEvents.years.length > 0) {
            if (this.editEvents.year) {
               year = this.editEvents.year;
               this.editEvents.savedYear = year;
               year = this.helpers.getYearInteger(year);
            }
         } else {
            return;
         }
         var filter = "";
         if (this.editEvents.savedFilterSearch) {
            filter = this.editEvents.savedFilterSearch;
         }
         console.log("PASSING FILTER = " + filter);
         if (Helpers.isWorkOffline === false) {
            var number;
            var type = "";
            var year_index = 0;
            var params = {
               "username": Helpers.User.Username,
               "type": type,
               "table": this.table,
               "date": this.date,
               "year": year,
               "action": action,
               "id": this.id,
               "number": number,
               "get_by": this.editEvents.selectedMethod,
               "year_index": year_index,
               "filter": filter
            };
            this.helpers.makeHttpRequest("/lfq_directory/php/edit_events_get.php", "GET", params).then((data) => {
               if (data["SUCCESS"] === true) {
                  if (!data["Event"]) {
                     data = null;
                  }
                  this.doShowGetScroll(data, isGetNext);
               } else {
                  this.helpers.alertLfqError(data["ERROR"]);
                  this.doShowGetScroll(null, isGetNext);
               }
            }, error => {
               console.log("ERROR:" + error.message);
               this.helpers.alertServerError(error.message);
               this.doShowGetScroll(null, isGetNext);
            });
         } else {//OFFLINE GET EVENT:
            console.log("year=" + year + "date=" + this.date + "table=" + this.table + ", id=" + this.id);
            var whereFilter = "";
            var whereFilterOnly = "";
            if (this.editEvents.isFilter === true && filter !== "") {
               filter = filter.toLowerCase();
               whereFilter = " AND LOWER(a.Event) LIKE '%" + filter + "%'";
               whereFilterOnly = " WHERE LOWER(a.Event) LIKE '%" + filter + "%'";
            }
            // GET DATES:            
            if (this.editEvents.selectedMethod === "BY_DATE") {
               var sql_dates = "";
               var sql_total = "SELECT COUNT(a.ID) FROM " + this.table + " AS a WHERE a.Date='" + this.date + "'" + this.user_clause + whereFilter;
               if (isGetNext == null) {
                  if (year == null) {
                     sql_dates = "SELECT (" + sql_total + ") AS TOTAL,(" + sql_total + ") AS COUNT_NEXT,a.*,ud.Username FROM ";
                     sql_dates += this.table + " AS a ";
                     sql_dates += "LEFT JOIN userdata AS ud ON ud.ID=a.User_ID ";
                     sql_dates += "WHERE a.Date='" + this.date + "'" + this.user_clause + whereFilter + " ";
                     sql_dates += "ORDER BY a.Year ASC, a.ID ASC LIMIT 1";
                  } else {
                     var sql_count_next = "SELECT COUNT(a.ID) FROM " + this.table + " AS a WHERE a.Date='" + this.date + "' AND a.Year>='" + year + "'" + this.user_clause + whereFilter + " ORDER BY a.Year ASC, a.ID ASC";
                     sql_dates = "SELECT (" + sql_total + ") AS TOTAL,(" + sql_count_next + ") AS COUNT_NEXT,a.*,ud.Username FROM ";
                     sql_dates += this.table + " AS a ";
                     sql_dates += "LEFT JOIN userdata ud ON ud.ID=a.User_ID ";
                     sql_dates += "WHERE a.Date='" + this.date + "' AND a.Year='" + year + "'" + this.user_clause + whereFilter + " ";
                     sql_dates += "ORDER BY a.ID ASC LIMIT 1";
                  }
               } else {
                  var comparison_clause = action === "next" ? ">" : "<";
                  var ascending_clause = action === "next" ? "ASC" : "DESC";
                  var sql_count_next = "SELECT COUNT(a.ID) FROM " + this.table + " AS a WHERE a.Date='" + this.date + "' AND (a.Year" + comparison_clause + "'" + year + "' OR (a.Year='" + year + "' AND a.ID" + comparison_clause + "'" + this.id + "'))" + this.user_clause + whereFilter + " ORDER BY a.Year " + ascending_clause + ",a.ID " + ascending_clause;
                  sql_dates = "SELECT (" + sql_total + ") AS TOTAL,(" + sql_count_next + ") AS COUNT_NEXT,a.*,ud.Username FROM ";
                  sql_dates += this.table + " AS a ";
                  sql_dates += "LEFT JOIN userdata AS ud ON ud.ID=a.User_ID ";
                  sql_dates += "WHERE a.Date='" + this.date + "' AND (a.Year" + comparison_clause + "'" + year + "' OR (a.Year='" + year + "' AND a.ID" + comparison_clause + "'" + this.id + "'))" + this.user_clause + whereFilter + " ";
                  sql_dates += "ORDER BY a.Year " + ascending_clause + ",a.ID " + ascending_clause + " LIMIT 1";
               }
               console.log("sql_dates = " + sql_dates);
               this.helpers.query(this.database_misc, sql_dates, []).then((data) => {
                  var myData = null;
                  if (data.rows.length > 0) {
                     myData = data.rows.item(0);
                  }
                  console.log("DATA=" + JSON.stringify(myData));
                  this.doShowGetScroll(myData, isGetNext);
               }).catch((error) => {
                  console.log("sql:" + sql_dates + ", ERROR:" + error.message);
                  this.doShowGetScroll(null, isGetNext);
               });
            }
            // GET YEARS:
            if (this.editEvents.selectedMethod === "BY_YEAR") {
               var sql_years = "";
               var sql_total = "SELECT COUNT(a.ID) FROM " + this.table + " AS a WHERE a.Year='" + year + "'" + this.user_clause + whereFilter;
               if (isGetNext == null) {
                  sql_years = "SELECT (" + sql_total + ") AS TOTAL,(" + sql_total + ") AS COUNT_NEXT,a.*,ud.Username FROM " + this.table + " AS a INNER JOIN userdata AS ud ON ud.ID=a.User_ID WHERE a.Year='" + year + "'" + this.user_clause + whereFilter + " ORDER BY a.Date ASC,a.ID ASC LIMIT 1";
               } else {
                  var comparison_clause = action === "next" ? ">" : "<";
                  var ascending_clause = action === "next" ? "ASC" : "DESC";
                  var sql_count_next = "SELECT COUNT(a.ID) FROM " + this.table + " AS a WHERE a.Year='" + year + "' AND (a.Date" + comparison_clause + "'" + this.date + "' OR (a.Date='" + this.date + "' AND a.ID" + comparison_clause + "'" + this.id + "'))" + this.user_clause + whereFilter + " ORDER BY a.Date " + ascending_clause + ",a.ID " + ascending_clause;
                  sql_years = "SELECT (" + sql_total + ") AS TOTAL,(" + sql_count_next + ") AS COUNT_NEXT,a.*,ud.Username FROM " + this.table + " AS a LEFT JOIN userdata AS ud ON ud.ID=a.User_ID WHERE a.Year='" + year + "' AND (a.Date" + comparison_clause + "'" + this.date + "' OR (a.Date='" + this.date + "' AND a.ID" + comparison_clause + "'" + this.id + "'))" + this.user_clause + whereFilter + " ORDER BY a.Date " + ascending_clause + ",a.ID " + ascending_clause + " LIMIT 1";
               }
               console.log("sql_years = " + sql_years);
               this.helpers.query(this.database_misc, sql_years, []).then((data) => {
                  var myData = null;
                  if (data.rows.length > 0) {
                     myData = data.rows.item(0);
                  }
                  console.log("DATA=" + JSON.stringify(myData));
                  this.doShowGetScroll(myData, isGetNext);
               }).catch((error) => {
                  console.log("sql:" + sql_years + ", ERROR:" + error.message);
                  this.doShowGetScroll(null, isGetNext);
               });
            }
         }
      });
   }

   doShowGetScroll(data:any, isGetNext:boolean | null) {
      //this.id==0 MEANS STARTING WITH isGetNext!!!
      console.log("doShowGetScroll called, isGetNext=" + isGetNext);
      if (data) {
         this.editEvents.getOld = data;
         console.log("SET this.editEvents.getOld = " + JSON.stringify(this.editEvents.getOld));
         this.total = parseInt(data.TOTAL);
         console.log("SET this.total TO=" + this.total);
         console.log("doShowGetScroll called. this.count=" + this.count);
         var myCount: number = 0;
         if (isGetNext === false) {//GET LAST
            myCount = parseInt(data["COUNT_NEXT"]);
         } else if (isGetNext === true || isGetNext == null) {//GET NEXT
            myCount = (this.total - parseInt(data["COUNT_NEXT"])) + 1;
         }
         console.log("myCount = " + myCount + ", this.total = " + this.total);
         if (myCount > 0 && myCount <= this.total) {
            this.count = myCount;
            console.log("SETTING myCount TO = " + this.count);
         }
         if (data.ID) {
            this.id = data.ID;
            console.log("NEW ID=" + this.id);
         }
         if (data.Event) {
            this.editEvents.event = data.Event;
            this.savedEvent = data.Event;
         }
         if (data.Mnemonics) {
            this.editEvents.mnemonics = data.Mnemonics;
         }
         //GET numbers:
         this.editEvents.numbers = [];
         //console.log("GET EVENT DATA = " + JSON.stringify(data));
         for (var i = 0; i < 4; i++) {
            console.log("data['Number' + (i+1)]" + data["Number" + (i + 1)]);
            if (data["Number" + (i + 1)] && data["Number" + (i + 1)] !== "") {
               this.editEvents.numbers.push({
                  "number": data["Number" + (i + 1)],
                  "number_mnemonic": data["Number_Mnemonic" + (i + 1)],
                  "mnemonic_info": data["Number_Info" + (i + 1)]
               });
            }
         }
         this.setHasMenmonics();
         var date_split = data.Date.split("-");
         this.editEvents.promptMnemonicsPeglist = this.editEvents.peglist[parseInt(date_split[0])] + "(" + date_split[0] + ") " + this.editEvents.peglist[parseInt(date_split[1])] + "(" + date_split[1] + ")";
         console.log("this.editEvents.numbers = " + JSON.stringify(this.editEvents.numbers));
         var results_text = "SHOWING " + this.count + " OF " + this.total + " EVENTS ";
         if (this.editEvents.selectedMethod === "BY_YEAR") {
            if (data.Date) {
               date_split = [];
               var month_index = 0;
               var day_index = 0;
               date_split = data.Date.split("-");
               this.date = data.Date;
               month_index = parseInt(date_split[0]) - 1;
               day_index = parseInt(date_split[1]) - 1;
               this.editEvents.month = this.editEvents.months[month_index];
               this.getMonthDays(data.Year, month_index);
               this.editEvents.day = this.editEvents.days[day_index];
            }
            results_text += "IN " + this.editEvents.year + ".";
         }
         else if (this.editEvents.selectedMethod === "BY_DATE") {
            if (data.Year) {
               console.log("SETTING YEAR TO " + data.Year);
               this.editEvents.year = this.helpers.getYearBC(data.Year);
               var yearIndex = this.editEvents.years.indexOf(data.Year);
               if (yearIndex >= 0) {
                  console.log("FOUND YEAR! SETTING TO YEAR INDEX=" + yearIndex);
                  this.editEvents.year = this.editEvents.years[yearIndex];
               }
            }
            results_text += "ON " + this.editEvents.month + " " + this.editEvents.day + ".";
         }
      } else {// NO NEXT: NO ROWS, OR COUNT TOO HIGH/LOW
         results_text = "SHOWING " + this.count + " OF " + this.total
            + " EVENTS ";
         if (this.editEvents.selectedMethod === "BY_DATE") {
            results_text += "ON " + this.editEvents.month + " " + this.editEvents.day;
         }
         if (this.editEvents.selectedMethod === "BY_YEAR") {
            results_text += "IN " + this.editEvents.year;
         }
         var prompt_next = "CURRENT";
         if (isGetNext === true) {
            prompt_next = "NEXT";
         }
         else if (isGetNext === false) {
            prompt_next = "LAST";
         }
         results_text += ". NO " + prompt_next + " EVENT.";
      }
      console.log("results_text 2 = " + results_text);
      //PUBLISH PROGRESS: --------------------------------
      this.editEvents.results = results_text;
      //this.changeDet.detectChanges();
      this.helpers.dismissProgress();
      //END PUBLISH PROGRESS----------------------------------------------------      
   }

   //LOADS SELECT YEARS THAT HAVE EVENTS
   doGetYears(isDoingProgress:boolean) {
      this.helpers.setProgress("Loading all years, please wait...", isDoingProgress).then(() => {
         console.log("doGetYears called.");
         this.editEvents.years = [];
         this.editEvents.results = "<b>LOADING YEARS...</b>";
         this.count = 1;
         this.total = 1;
         var year = "";
         this.setTable();
         this.editEvents.savedFilterSearch = null;
         var filter = "";
         if (this.editEvents.isFilter === true) {
            filter = this.editEvents.filterSearch == null ? "" : this.editEvents.filterSearch;
            this.editEvents.savedFilterSearch = filter;
         }
         console.log("this.editEvents.filterSearch = " + this.editEvents.filterSearch + " filter = " + filter);
         if (Helpers.isWorkOffline === false) {
            var params = {
               "username": Helpers.User.Username,
               "table": this.table,
               "type": this.editEvents.selectedType,
               "filter": filter
            };
            this.editEvents.years = [];
            this.helpers.makeHttpRequest("/lfq_directory/php/edit_events_get_by_years.php", "GET", params).then((data) => {
               if (data["SUCCESS"] === true) {
                  this.editEvents.getOld = data;
                  this.id = 0;
                  for (var i = 0; i < data["YEARS"].length; i++) {
                     if (data["YEARS"][i] && data["YEARS"][i] !== 'undefined') {
                        this.editEvents.years.push(this.helpers.getYearBC(data["YEARS"][i]));
                     }
                  }
                  this.editEvents.year = this.editEvents.years[0];
                  this.editEvents.savedYear = this.editEvents.year;
                  this.editEvents.isGottenByMethod = true;
                  this.doShowGetScroll(data, null);
               } else {
                  this.helpers.dismissProgress();
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            }, error => {
               console.log("ERROR:" + error.message);
               this.helpers.dismissProgress();
               this.editEvents.results = "Sorry. Error getting event years. " + error.message;
               this.editEvents.event = null;
               this.total = 0;
               this.editEvents.isGottenByMethod = true;
               this.helpers.alertServerError(error.message);
            });
         } else {
            var sql = "";
            var whereFilter = "";
            if (filter !== "") {
               whereFilter = " WHERE Event LIKE '%" + filter + "%'";
            }
            if (this.editEvents.isShared === true) {
               sql = "SELECT DISTINCT Year FROM " + this.table + whereFilter + " ORDER BY Year ASC";
            } else {
               whereFilter = whereFilter === "" ? "" : " AND" + whereFilter;
               var Data_Type_ID = (this.editEvents.selectedType && this.editEvents.selectedType === "PERSONAL") ? "1" : "2";
               sql = "SELECT DISTINCT Year FROM " + this.table + " WHERE Data_Type_ID='" + Data_Type_ID + "' AND User_ID='" + Helpers.User.ID + "'" + whereFilter + " ORDER BY Year ASC";
            }
            this.helpers.query(this.database_misc, sql, []).then((data) => {
               if (data.rows.length > 0) {
                  for (var i = 0; i < data.rows.length; i++) {
                     this.editEvents.years.push(this.helpers.getYearBC(data.rows.item(i).Year));
                  }
               }
               this.editEvents.year = this.editEvents.years[0];
               this.editEvents.savedYear = year;
               //this.eventsYearSelect.nativeElement.selectedIndex = this.editEvents.years.indexOf(this.editEvents.year);
               this.editEvents.isGottenByMethod = true;
               if (this.editEvents.years.length > 0) {
                  this.helpers.dismissProgress();
                  this.getEvent("Getting first event of first year: " + this.editEvents.year + " ....", true);
               } else {
                  this.helpers.dismissProgress();
                  this.editEvents.results = "SHOWING 0 OF 0 EVENTS";
                  this.editEvents.event = null;
                  this.total = 0;
                  this.editEvents.isGottenByMethod = true;
               }
            }).catch((error) => {
               console.log("sql:" + sql + ", ERROR:" + error.message);
               this.helpers.dismissProgress();
               this.editEvents.results = "Sorry. Error getting event years.";
               this.editEvents.event = null;
               this.total = 0;
               this.editEvents.isGottenByMethod = true;
            });
         }
      });
   }

   methodOptionsClick(option:any) {
      console.log("methodOptionsClick called, option=" + option + ", this.editEvents.savedSelectedMethod=" + this.editEvents.savedSelectedMethod);
      this.editEvents.isGottenByMethod = false;
      if (option !== this.editEvents.savedSelectedMethod) {
         this.editEvents.savedSelectedMethod = this.editEvents.selectedMethod;
         this.resetEvents();
      }
   }

   userOptionsClick(option:any) {
      console.log("userOptionsClick called, option=" + option + ", this.editEvents.savedSelectedType=" + this.editEvents.savedSelectedType);
      if (option !== this.editEvents.savedSelectedType) {
         this.editEvents.savedSelectedType = this.editEvents.selectedType;
         this.resetEvents();
      }
   }
   resetEvents() {
      console.log("resetEvents called");
      this.editEvents.isGottenByMethod = false;
      this.editEvents.years = [];
      this.editEvents.results = "";
      this.count = 1;
      this.total = 1;
      this.editEvents.event = null;
      this.setTable();
   }
   getByMethod(isDoingProgress:boolean) {
      if (this.editEvents.selectedMethod === 'BY_DATE') {
         this.doGetDates(isDoingProgress);
      }
      if (this.editEvents.selectedMethod === 'BY_YEAR') {
         this.doGetYears(isDoingProgress);
      }
   }
   //LOADS ALL EVENTS OF A DATE
   doGetDates(isDoingProgress:boolean) {
      console.log("doGetDates called");
      var promptDate = this.editEvents.month + " " + this.editEvents.day;
      var day = String(this.editEvents.day);
      var last_of_day = day.substr(day.length - 1);
      console.log("last of day=" + last_of_day);
      if (day.length > 0) {
         if (last_of_day === "1") {
            promptDate += "st";
         }
         else if (last_of_day === "2") {
            promptDate += "nd";
         }
         else if (last_of_day === "3") {
            promptDate += "rd";
         }
         else {
            promptDate += "th";
         }
      }
      this.helpers.setProgress("Loading events for date: " + promptDate + ",please wait...", isDoingProgress).then(() => {
         this.setTable();
         var day_number = this.editEvents.day;
         var month_number = this.editEvents.months.indexOf(this.editEvents.month) + 1;
         console.log("day_number=" + day_number + ", month_number=" + month_number);
         var month = ("0" + String(month_number)).slice(-2);
         var day = ("0" + String(day_number)).slice(-2);
         this.date = month + "-" + day;
         this.editEvents.years = [];
         if (Helpers.isWorkOffline === false) {
            var params = {
               "username": Helpers.User.Username,
               "date": this.date,
               "table": this.table,
               "type": this.editEvents.selectedType
            };
            console.log("getByDates parameters = " + JSON.stringify(params));
            this.helpers.makeHttpRequest("/lfq_directory/php/edit_events_get_by_dates.php", "GET", params).then((data) => {
               if (data["SUCCESS"] === true) {
                  this.editEvents.getOld = data;
                  if (data['MAJOR_WORDS']) {
                     this.editEvents.majorWords = this.helpers.getSavedWords(data['MAJOR_WORDS']);
                  }
                  this.finishDoGetDatesEvent(data);
                  this.editEvents.years = [];
                  for (var i = 0; i < data["YEARS"].length; i++) {
                     this.editEvents.years.push(this.helpers.getYearBC(data["YEARS"][i]));
                  }
                  if (this.editEvents.years.length > 0) {
                     this.editEvents.year = this.editEvents.years[0];
                  }
                  this.editEvents.results = "SHOWING " + this.count + " OF " + this.total + " EVENTS ON " + month + " " + day + ".";
                  this.is_after_years_load = false;
                  this.helpers.dismissProgress();
                  this.editEvents.isGottenByMethod = true;
               } else {
                  this.helpers.dismissProgress();
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            });
         } else {
            console.log("table=" + this.table + ", date=" + this.date);
            var sql_total = "SELECT COUNT(a.ID) FROM " + this.table + " AS a WHERE a.Date='" + this.date + "'" + this.user_clause;
            var sql_dates = "SELECT (" + sql_total + ") AS TOTAL,* FROM ";
            sql_dates += this.table + " AS a ";
            sql_dates += "WHERE a.Date='" + this.date + "'" + this.user_clause + " ";
            sql_dates += "ORDER BY a.Year ASC,a.ID ASC";
            this.helpers.query(this.database_misc, sql_dates, []).then((data) => {
               console.log("getStartingId=" + this.id);
               var myData = null;
               if (data.rows.length > 0) {
                  myData = data.rows.item(0);
               }
               this.finishDoGetDatesEvent(myData);
               var sql = "SELECT DISTINCT a.Year FROM " + this.table + " AS a WHERE a.Date='" + this.date + "'" + this.user_clause + " ORDER BY a.Year ASC";
               this.helpers.query(this.database_misc, sql, []).then((data) => {
                  if (data.rows.length > 0) {
                     var year = "";
                     for (var i = 0; i < data.rows.length; i++) {
                        this.editEvents.years.push(this.helpers.getYearBC(data.rows.item(i).Year));
                     }
                  }
                  if (this.editEvents.years.length > 0) {
                     this.editEvents.year = this.editEvents.years[0];
                  }
                  this.editEvents.results = "SHOWING " + this.count + " OF " + this.total + " EVENTS ON " + month + " " + day + ".";
                  this.is_after_years_load = false;
                  this.helpers.dismissProgress();
                  this.editEvents.isGottenByMethod = true;
               }).catch((error) => {
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  this.editEvents.results = "Sorry. Error getting event years.";
                  this.is_after_years_load = false;
                  this.helpers.dismissProgress();
                  this.editEvents.isGottenByMethod = true;
               });
            }).catch((error) => {
               console.log("sql:" + sql_dates + ", ERROR:" + error.message);
               this.editEvents.results = "Sorry. Error getting event dates.";
               this.is_after_years_load = false;
               this.helpers.dismissProgress();
               this.editEvents.isGottenByMethod = true;
            });
         }
      });
   }

   finishDoGetDatesEvent(data:any) {
      console.log("finishDoGetDatesEvent called");
      if (data) {
         this.total = data["TOTAL"];
         if (this.total > 0) {
            this.id = data["ID"];
            this.count = 1;
            this.editEvents.event = data["Event"];
            this.savedEvent = data["Event"];
         } else {
            this.count = 0;
         }
      } else {
         this.count = 0;
         this.total = 0;
      }
      // SET (DISTINCT) BC AND AD years to yearsAdapter:
      console.log("table=" + this.table + ", date=" + this.date + ", year=" + this.editEvents.year);
   }


   //LOADS EVENTS OF A YEAR
   selectYear() {
      console.log("selectYear called.");
      var message = "";
      if (this.editEvents.selectedMethod === "BY_DATE") {
         message = "Getting first event on " + this.date + ", " + this.editEvents.year;
      } else if (this.editEvents.selectedMethod === "BY_YEAR") {
         message = "Getting first event of year: " + this.editEvents.year + " ...";
      }
      this.getEvent(message, "get");

   }
   //LOADS EVENTS OF A DATE
   selectMonth() {
      console.log("selectMonth called.");
   }
   //LOADS EVENTS OF A DATE
   selectDay() {
      console.log("selectDay called.");
   }

   //CALLED WHEN IS_SHARED CHECKBOX CLICKED
   setTable() {
      console.log("setTable called.");
      var Data_Type_ID = (this.editEvents.selectedType && this.editEvents.selectedType === "PERSONAL") ? "1" : "2";
      if (this.editEvents.isShared === false) {//NOT SHARED = USER TABLE
         this.editEvents.user = Helpers.User;
         this.table = Helpers.TABLES_MISC.user_event;
         this.lfq_table = "" + Helpers.db_prefix + "misc." + this.table;
         this.user_clause = " AND a.Data_Type_ID='" + Data_Type_ID + "' AND a.User_ID='" + Helpers.User.ID + "'";
         console.log("setting type clause =" + this.user_clause);
      } else {
         this.table = Helpers.TABLES_MISC.event_table;
         this.user_clause = "";
         this.lfq_table = "" + Helpers.db_prefix + "misc." + this.table;
      }
   }

   //EDITS EVENT
   editEvent() {
      console.log('editEvent called.');
      this.setTable();
      if (this.editEvents.selectedAction == null) {
         this.helpers.myAlert("Alert", "<b>Select Edit, Delete, or Insert.</b>", "", "Dismiss");
         return;
      }
      if (this.editEvents.selectedAction === "INSERT") {
         this.insertEvent();
      } else if (this.editEvents.selectedAction === "EDIT") {
         this.updateEvent();
      } else if (this.editEvents.selectedAction === "DELETE") {
         this.deleteEvent();
      }
   }

   insertEvent() {
      console.log("insertEvent called");
      var year = this.editEvents.year;
      if (year === "") {
         this.helpers.myAlert("Alert", "<b>Must enter a year.</b>", "", "Dismiss");
         return;
      }
      if (year.length > 5) {
         this.helpers.myAlert("Alert", "<b>Enter a 4 digit year.</b>", "", "Dismiss");
         return;
      }
      var date = "";
      var month_number = this.editEvents.months.indexOf(this.editEvents.month) + 1;
      var day_number = this.editEvents.day;
      var month = ("0" + String(month_number)).slice(-2);
      var day = ("0" + String(day_number)).slice(-2);
      var event = this.editEvents.event.replace(/'/g, '`');
      date = month + "-" + day;
      year = ("0000" + String(year)).slice(-4);
      if (this.editEvents.isBC === true) {
         year = "-" + year;
      }
      this.helpers.setProgress("Inserting event for " + year + "-" + date + ", please wait...", false).then(() => {
         var checkWheres = {
             "Event": event
         };
         this.helpers.insertCheckExists(DB_Type_ID.DB_MISC, this.table, checkWheres).then(isExist => {
            if(isExist){
               this.helpers.dismissProgress();
               this.helpers.myAlert("Alert", "<b>The event already exists.</b>", "", "OK");
               return;
            }
            var cv: any = {};
            cv.User_ID = Helpers.User.ID;
            cv.Year = year;
            cv.Date = date;
            cv.Event = event;
            if (this.editEvents.isShared !== true) {
               var Data_Type_ID = (this.editEvents.selectedType && this.editEvents.selectedType === "PERSONAL") ? "1" : "2";
               cv.Data_Type_ID = Data_Type_ID;
            }
            var cols = Object.keys(cv);
            var vals = [cols.map((col) => { return cv[col]; })];
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, this.table, Op_Type_ID.INSERT, cols, vals, {"Event": event})];
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            this.helpers.autoSync(queries, Op_Type_ID.INSERT, null, { "Date": cv.Year + "-" + cv.Date }, {}, cv).then((res) => {
               if (res.isSuccess === true) {
                  this.editEvents.results = "RESULTS: Inserted event on date:" + date + "<br />" + res.results;
                  this.helpers.myAlert("SUCCESS", "<b>" + this.editEvents.results + "</b>", "", "Dismiss");
                  this.getByMethod(true);
               } else {
                  console.log("ERROR:" + res.results);
                  this.editEvents.results = "Sorry. Error getting event years. " + res.results;
                  this.helpers.myAlert("ERROR", "<b>" + this.editEvents.results + "</b>", "", "Dismiss");
                  this.getByMethod(true);
               }
            });
         });
      });
   }


   updateEvent() {
      this.helpers.setProgress("Updating event, please wait...", false).then(() => {
         var event = this.editEvents.event;
         var unique_index = "";
         console.log("updateEvent called, replacing old event=" + this.editEvents.savedEvent + " with new event=" + event);
         var major_words_columns = ""
         var major_word_values = ""
         var major_word_updates = "";
         var newCv: any = {};
         var year = this.editEvents.year;
         if (this.editEvents.isBC === true) {
            year = "-" + year;
         }
         newCv.Year = year;
         var monthNumber = ("00" + (this.editEvents.months.indexOf(this.editEvents.month) + 1)).slice(-2);
         var dayNumber = ("00" + (this.editEvents.day)).slice(-2);
         newCv.Date = monthNumber + "-" + dayNumber;
         newCv.Event = event;
         newCv.Mnemonics = this.editEvents.mnemonics;
         if (this.editEvents.numbers) {
            for (var i = 0; i < this.editEvents.numbers.length; i++) {
               major_words_columns += ",Number" + (i + 1) + ", Number_Mnemonic" + (i + 1) + ", Number_Info" + (i + 1);
               major_word_values += ",'" + this.editEvents.numbers[i].number + "','" + this.editEvents.numbers[i].number_mnemonic + "','" + this.editEvents.numbers[i].mnemonic_info + "'";
               major_word_updates += ", Number" + (i + 1) + "='" + this.editEvents.numbers[i].number + "'";
               major_word_updates += ", Number_Mnemonic" + (i + 1) + "='" + this.editEvents.numbers[i].number_mnemonic + "'";
               major_word_updates += ", Number_Info" + (i + 1) + "='" + this.editEvents.numbers[i].mnemonic_info + "'";
               newCv["Number" + (i + 1)] = this.editEvents.numbers[i].number;
               newCv["Number_Mnemonic" + (i + 1)] = this.editEvents.numbers[i].number_mnemonic;
               newCv["Number_Info" + (i + 1)] = this.editEvents.numbers[i].mnemonic_info;
            }
         }
         var where:any = { "User_ID": this.editEvents.getOld.User_ID, "Event": this.savedEvent };
         if (this.editEvents.isShared === false) {//FOR USER EVENTS:            
            var Data_Type_ID = (this.editEvents.selectedType && this.editEvents.selectedType === "PERSONAL") ? "1" : "2";
            where["Data_Type_ID"] = Data_Type_ID;
         }
         var cols = Object.keys(newCv);
         var includeProps = cols;
         var vals = cols.map((col) => { return newCv[col]; });
         console.log(" newCv = " + JSON.stringify(newCv) + ", this.editEvents.getOld = " + JSON.stringify(this.editEvents.getOld));
         var entriesRequest = Helpers.getEntriesRequest(this.editEvents.getOld, newCv, includeProps);
         //WILL EXIST IN LOCAL APP SO ONLY NEED TO DO Update appSql!!!:
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [new SyncQuery(null, this.editEvents.getOld.User_ID, DB_Type_ID.DB_MISC, this.table, Op_Type_ID.UPDATE, cols, vals, where, User_Action_Request.USER_ID_UPDATE)];
         //console.log("UPDATE EVENT queries = " + JSON.stringify(queries));
         //return;
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.UPDATE, this.editEvents.getOld.User_ID, { "Name": this.editEvents.year + "-" + this.date }, entriesRequest[0], entriesRequest[1]).then((res) => {
            this.helpers.dismissProgress();
            if (res.isSuccess === true) {
               this.editEvents.results = "RESULTS: Updated with new event. " + res.results; ''
               this.helpers.myAlert("SUCCESS", "<b>" + this.editEvents.results + "</b>", "", "Dismiss");
               this.savedEvent = event;
               setTimeout(() => this.editEvents.results = "", 5000);
            } else {
               console.log("ERROR:" + res.results);
               this.editEvents.results = "Sorry. Error updating event. " + res.results;
               this.helpers.myAlert("ERROR", "<b>" + this.editEvents.results + "</b>", "", "Dismiss");
               setTimeout(() => this.editEvents.results = "", 5000);
            }
         });
      });
   }

   deleteEvent() {
      console.log("deleteEvent called");
      this.helpers.setProgress("Deleting event, please wait...", false).then(() => {
         var where = {};
         if (this.editEvents.isShared === true) {//FOR SHARED EVENTS
            where = { "Event": this.savedEvent };
         } else {//FOR USER EVENTS
            var Data_Type_ID = (this.editEvents.selectedType && this.editEvents.selectedType === "PERSONAL") ? "1" : "2";
            where = { "User_ID": Helpers.User.ID, "Event": this.savedEvent, "Data_Type_ID": Data_Type_ID };
         }
         //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
         var queries = [new SyncQuery(null, this.editEvents.getOld.User_ID, DB_Type_ID.DB_MISC, this.table, Op_Type_ID.DELETE, [], [], where)];
         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, Op_Type_ID.DELETE, this.editEvents.getOld.User_ID, { "Date": this.editEvents.getOld.Year + "-" + this.editEvents.getOld.Date }, { "Event": this.savedEvent }, {}).then((res) => {
            if (res.isSuccess === true) {
               this.editEvents.results = "RESULTS: Deleted event.<br />" + res.results;
               this.helpers.myAlert("SUCCESS", "<b>" + this.editEvents.results + "</b>", "", "Dismiss");
               this.getByMethod(true);
            } else {
               console.log("ERROR:" + res.results);
               this.editEvents.results = "Sorry. Error deleting event. " + res.results;
               this.helpers.myAlert("ERROR", "<b>" + this.editEvents.results + "</b>", "", "Dismiss");
               this.getByMethod(true);
            }
         });
      });
   }

   doSelectAction() {
      console.log("doSelectAction called. this.editEvents.selectedAction=" + this.editEvents.selectedAction);
      if (this.editEvents.selectedAction === "INSERT") {
         this.editEvents.savedYear = this.editEvents.year;
      } else {
         this.editEvents.year = this.editEvents.savedYear;
      }
   }

   getLastTextInput() {
      console.log("getLastTextInput called");
      if (this.editEvents.selectedTextInputIndex > 0) {
         this.editEvents.selectedTextInputIndex--;
         this.editEvents.selectedTextInput = this.editEvents.textInputs[this.editEvents.selectedTextInputIndex];
      }
      this.setHasMenmonics();
      console.log("this.editEvents.selectedTextInput=" + this.editEvents.selectedTextInput);
   }

   getNextTextInput() {
      console.log("getNextTextInput called this.editEvents.textInputs.length=" + this.editEvents.textInputs.length + ", this.editEvents.selectedTextInputIndex=" + this.editEvents.selectedTextInputIndex);
      if (this.editEvents.selectedTextInputIndex < (this.editEvents.textInputs.length - 1)) {
         this.editEvents.selectedTextInputIndex++;
         this.editEvents.selectedTextInput = this.editEvents.textInputs[this.editEvents.selectedTextInputIndex];
      }
      this.setHasMenmonics();
      console.log("this.editEvents.selectedTextInput=" + this.editEvents.selectedTextInput);
   }

   setHasMenmonics() {
      console.log("setHasMenmonics called");
      this.editEvents.hasMnemonics = false;
      this.editEvents.forwardColor = "light";
      this.editEvents.scrollColor = "light";
      if (this.editEvents.selectedTextInput === "EVENT") {
         if (this.editEvents.numbers && this.editEvents.numbers.length > 0) {
            this.editEvents.hasMnemonics = true;
            this.editEvents.forwardColor = "secondary";
         }
      } else if (this.editEvents.selectedTextInput === "MAJOR_WORDS") {
         if (this.editEvents.mnemonics && this.editEvents.mnemonics.trim() !== "") {
            this.editEvents.hasMnemonics = true;
            this.editEvents.forwardColor = "secondary";
         }
         this.editEvents.scrollColor = "secondary";
      } else if (this.editEvents.selectedTextInput === "MNEMONICS") {
         if (this.editEvents.numbers && this.editEvents.numbers.length > 0) {
            this.editEvents.scrollColor = "secondary";
         }
      }
   }

   checkNumbersInput(isAlert:boolean): Boolean {
      console.log("checkNumbersInput called");
      var canEdit = true;
      var isNullNumberInput = false;
      var isNullMajorInput = false;
      var isInvalidNumber = false;
      for (var i = 0; i < this.editEvents.numbers.length; i++) {
         this.editEvents.numbers[i].invalidNumber = false;
         this.editEvents.numbers[i].invalidMajor = false;
         this.editEvents.numbers[i].number = this.editEvents.numbers[i].number.replace(/[^0-9]/ig, '');
         this.editEvents.numbers[i].number_mnemonic = this.editEvents.numbers[i].number_mnemonic.replace(/[^A-Z]/ig, '');
         //FORMAT WORD:
         //CHECK FOR isInvalidNumber:     
         if (this.editEvents.numbers[i].number != null && String(this.editEvents.numbers[i].number).trim() !== "") {
            if (this.editEvents.numbers[i].number_mnemonic != null && String(this.editEvents.numbers[i].number_mnemonic).trim() !== "") {
               //FORMAT MAJOR WORD:-----------------------------
               this.editEvents.numbers[i].number_mnemonic = this.helpers.formatWord(String(this.editEvents.numbers[i].number_mnemonic).split(""), this.editEvents.numbers[i].number);
               //----------------------------------------------------
               console.log("Checking if number matches major word: number=" + String(this.editEvents.numbers[i].number) + ", major number=" + this.helpers.getMajorSystemNumber(this.editEvents.numbers[i].number_mnemonic, 0, this.editEvents.numbers[i].number));
               if (String(this.editEvents.numbers[i].number) !== String(this.helpers.getMajorSystemNumber(this.editEvents.numbers[i].number_mnemonic, 0, this.editEvents.numbers[i].number)).substring(0, String(this.editEvents.numbers[i].number).length)) {
                  console.log("NUMBERS DONT MATCH! INVALIDATING! : ...");
                  //isInvalidNumber:
                  isInvalidNumber = true;
                  this.editEvents.numbers[i].invalidNumber = true;
                  this.editEvents.numbers[i].invalidMajor = true;
               }
            }
         } else {
            //nullNumber INPUT:
            isNullNumberInput = true;
            this.editEvents.numbers[i].invalidNumber = true;
         }
         //nullMajor INPUT:
         console.log("this.editEvents.numbers[" + i + "].major=" + this.editEvents.numbers[i].number_mnemonic);
         if (this.editEvents.numbers[i].number_mnemonic == null || String(this.editEvents.numbers[i].number_mnemonic).trim() === "") {
            console.log("SETTING invalidMajor TO TRUE!!!!!!!!!!!");
            this.editEvents.numbers[i].invalidMajor = true;
            isNullMajorInput = true;
         }
      }//END LOOP THROUGH NUMBER OBJECTS.
      //INVALID ALERT ERRORS:
      if (isAlert) {
         if (isNullNumberInput === true) {
            this.helpers.myAlert("Alert", "<b>Make sure all numbers inputted.</b>", "", "Dismiss");
            canEdit = false;
         } else if (isNullMajorInput === true) {
            this.helpers.myAlert("Alert", "<b>Make sure all major words inputted.</b>", "", "Dismiss");
            canEdit = false;
         } else if (isInvalidNumber === true) {
            this.helpers.myAlert("Alert", "<b>Make sure numbers match valid major words.</b>", "", "Dismiss");
            canEdit = false;
         }
      }
      return canEdit;
   }

}

interface myObject {
   [key: string]: any;
}
