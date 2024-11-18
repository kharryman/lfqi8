import { Component } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { DB_Type_ID, Helpers, OperationSync, Op_Type, Op_Type_ID, SyncQuery, User_Action_Request } from '../../providers/helpers/helpers';

@Component({
   selector: 'page-requests',
   templateUrl: 'requests.html',
   styleUrl: 'requests.scss'
})
export class RequestsPage {
   public pageName:string = "Requests";

   requests: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   user: any;
   requestsArray: Array<SyncQuery> = [];

   constructor(public navCtrl: NavController, public helpers: Helpers, private alertCtrl: AlertController) {
   }

   ngOnInit() {
      this.requests = {};
      Helpers.currentPageName = this.pageName;
      this.requests.requestGroups = [];
      this.requests.isReverse = true;
      this.requests.sortKey = "Timestamp";
      this.requests.requests = [];
      this.requestsArray = [];
      this.user = Helpers.User;
      this.requests.color = Helpers.button_color;
      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.requests.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
         this.background_color = bgColor;
      });
      this.requests.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });
      this.getRequests();
   }

   ionViewDidLoad() {
      console.log('ionViewDidLoad RequestsPage');
      this.requests.subscribedBackgroundColorEvent.unsubscribe();
      this.requests.subscribedButtonColorEvent.unsubscribe();
   }

   getRequests(): Promise<void> {
      console.log("getRequests called");
      return new Promise((resolve, reject) => {
         this.requests.results = "";
         this.requests.requestGroups = [];
         this.helpers.setProgress("Getting " + Helpers.User.Username + "'s requests...", false).then(() => {
            if (Helpers.isWorkOffline === false) {
               var params = {
                  "username": Helpers.User.Username
               }
               this.helpers.makeHttpRequest("/lfq_directory/php/requests_get.php", "GET", params).then((data) => {
                  this.helpers.dismissProgress();
                  if (data["SUCCESS"] === true) {
                     for (var o = 0; o < data["OPERATIONS"].length; o++) {
                        data["OPERATIONS"] = this.helpers.parseSyncQuery(data["OPERATIONS"]);
                        for (var r = 0; r < data["OPERATIONS"][o].REQUESTS.length; r++) {
                           data["OPERATIONS"][o].REQUESTS[r] = this.helpers.parseSyncQuery(data["OPERATIONS"][o].REQUESTS[r]);
                           if (data["OPERATIONS"][o].REQUESTS[r]["User_Action"]) {
                              data["OPERATIONS"][o].REQUESTS[r]["User_Action"] = parseInt(data["OPERATIONS"][o].REQUESTS[r]["User_Action"]);
                           }
                        }
                     }
                     this.finishGetRequests(data["OPERATIONS"]);
                     resolve();
                  } else {
                     this.helpers.alertLfqError(data["ERROR"]);
                     resolve();
                  }
               }, error => {
                  console.log("ERROR:" + error.message);
                  this.requests.results = "Sorry. Error getting requests: " + error.message;
                  this.helpers.dismissProgress();
                  this.helpers.alertServerError(error.message);
                  resolve();
               });
            } else {//IF OFFLINE:=========================================>
               var sql_ops = "SELECT o.*,ud.Username FROM " + Helpers.TABLES_MISC.operation + " AS o ";
               sql_ops += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " ud ON ud.ID=o.User_ID ";
               sql_ops += "WHERE o.User_ID_Old='" + Helpers.User.ID + "' AND o.Choice IS NULL";
               this.helpers.query(Helpers.database_misc, sql_ops, []).then((data) => {
                  var requestGroups:any = [];
                  for (var i = 0; i < data.rows.length; i++) {
                     requestGroups.push(this.helpers.parseSyncQuery(data.rows.item(i)));
                  }
                  //console.log("GOT requestGroups = " + JSON.stringify(requestGroups));
                  var opIDs = requestGroups.map((rq:any) => { return rq.ID; }).filter(this.helpers.onlyUnique);
                  console.log("GOT opIDs = " + opIDs);
                  var sql_rqs = "SELECT * FROM " + Helpers.TABLES_MISC.request + " WHERE Op_ID IN (" + opIDs.join(",") + ")";
                  this.helpers.query(Helpers.database_misc, sql_rqs, []).then((data:any) => {
                     var requests:any = [];
                     for (var i = 0; i < data.rows.length; i++) {
                        if (data.rows.item(i)["User_Action"]) {
                           data.rows.item(i)["User_Action"] = parseInt(data.rows.item(i)["User_Action"]);
                        }
                        requests.push(this.helpers.parseSyncQuery(data.rows.item(i)));
                     }
                     requestGroups.forEach((group:any) => {
                        group.REQUESTS = requests.filter((rq:any) => { return parseInt(rq.Op_ID, 10) === parseInt(group.ID, 10) });
                     });
                     this.finishGetRequests(requestGroups);
                     //console.log("this.requests.requestGroups = " + JSON.stringify(this.requests.requestGroups));
                     this.helpers.dismissProgress();
                     resolve();
                  }, error => {
                     console.log("sql:" + sql_rqs + ", ERROR:" + error.message);
                     this.requests.results = "Sorry. Error getting requests.";
                     this.helpers.dismissProgress();
                     resolve();
                  });
               }, error => {
                  console.log("sql:" + sql_ops + ", ERROR:" + error.message);
                  this.requests.results = "Sorry. Error getting requests.";
                  this.helpers.dismissProgress();
                  resolve();
               });
            }
         });
      });
   }

   finishGetRequests(requestGroups: Array<any>) {
      console.log("finishGetRequests called");
      var opAction = null, tables = [];
      requestGroups.forEach(group => {
         group["Op_Type_ID"] = parseInt(group["Op_Type_ID"]);
         group["REQUESTS"].forEach((rq:any) => {
            rq["Act_Type_ID"] = parseInt(rq["Act_Type_ID"]);
         });
         console.log("LOOP REQUEST GROUPS, GROUP = " + JSON.stringify(group));
         tables = group["REQUESTS"].map((rq:any) => { return rq.Table_name }).filter(this.helpers.onlyUnique);
         //console.log("LOOP REQUEST GROUPS TABLES = " + tables);
         opAction = Op_Type_ID[group["Op_Type_ID"]];
         group["isChecked"] = false;
         group["Tables"] = tables.join(", ");
         if (group["Image_Old"] && String(group["Image_Old"]).trim() !== '' && String(group["Image_Old"]).toUpperCase() !== "NULL") {
            group["Show_Entry_Old"] = '<img width="100" height="auto" src="data:image/jpeg;base64,' + group["Image_Old"] + '">';
         } else {
            group["Show_Entry_Old"] = this.helpers.jsonToString(group["Entry_Old"], group);
         }
         if (group["Image"] && String(group["Image"]).trim() !== '' && String(group["Image"]).toUpperCase() !== "NULL") {
            group["Show_Entry"] = '<img width="100" height="auto" src="data:image/jpeg;base64,' + group["Image"] + '">';
         } else {
            group["Show_Entry"] = this.helpers.jsonToString(group["Entry"], group);
         }
         group["Show_Names"] = this.helpers.jsonToString(group["Names"]);
         group["actionInformal"] = this.helpers.convertFormalName(opAction, "DB_ACTIONS");
      });
      this.requests.requestGroups = requestGroups;
   }

   updateRequests() {
      console.log("updateRequests called, this.requests.choice=" + this.requests.choice);
      if (!this.requests.choice) {
         this.helpers.myAlert("ALERT", "", "No request action chosen:<br />1)Ignore<br />2)Update<br />3)Update & change owner.", "OK");
         return;
      }
      var requestGroups = this.requests.requestGroups.filter((group:any) => { return group.isChecked === true; });
      var rq: SyncQuery;

      /*
      //CREATE SEPARATE! COPY====>      
      var myDeleteRequestGroups = [];
      var myRG = {};
      for(var rg=0;rg<requestGroups.length;rg++){
         myRG = {};
         for(var prop in requestGroups[rg]){
             if(prop !== "REQUESTS"){
               myRG[prop] = requestGroups[rg][prop];
             }
         }
         myRG["REQUESTS"] = [];
         for(var r=0;r<requestGroups[rg].REQUESTS;r++){
            rq = requestGroups[rg].REQUESTS[r];
            myRG["REQUESTS"].push(new SyncQuery(rq.IS_APP, rq.User_ID_Old, rq.DB_Type_ID, rq.Table_name, rq.Act_Type_ID, rq.Cols, rq.Vals, rq.Wheres));
         }
         myDeleteRequestGroups.push(myRG);
      }
      //END CREATE myDeleteRequestGroups SEPARATE! COPY.
      */

      if (requestGroups.length === 0) {
         this.helpers.myAlert("ALERT", "", "No requests selected.", "OK");
         return;
      }
      console.log("updateRequests, requestGroups = " + JSON.stringify(requestGroups));
      var syncResults:any = [];
      this.autoSyncAllRequests(0, requestGroups, syncResults, (syncResults: any[]) => {
         this.helpers.dismissProgress();
         this.requests.results = "";
         if (!syncResults) {
            this.requests.results = "No sync results.";
         } else {
            for (var i = 0; i < syncResults.length; i++) {
               this.requests.results += syncResults[i].isSuccess === true ? "SUCCESS" : "FAIL";
               this.requests.results += ":<br />" + requestGroups[i].actionInformal + " " + requestGroups[i].Tables;
               if (syncResults[i].isSuccess === false) {
                  this.requests.results += syncResults[i].results;
               }
            }
         }

         //LASTLY, DELETE THE REQUESTS, THIS WILL BE DONE FOR ALL CHOICES!: ("1", "2", "3"):
         var queries = [];
         var colsTbls = [Helpers.TABLES_MISC.operation];// valsJoins = [{ "A": "Op_ID", "MT": "A", "MT_Col": "ID" }];
         var wheres = {};
         for (var g = 0; g < requestGroups.length; g++) {
            for (var r = 0; r < requestGroups[g].REQUESTS.length; r++) {
               rq = requestGroups[g].REQUESTS[r];
               wheres = { "Op_Type_ID": requestGroups[g].Op_Type_ID, "Timestamp": requestGroups[g].Timestamp, "Device_ID": requestGroups[g].Device_ID, "User_ID": requestGroups[g].User_ID, "User_ID_Old": requestGroups[g].User_ID_Old };
               queries.push(new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.operation, Op_Type_ID.DELETE, [], [], wheres));
               wheres = { "Op_Type_ID": requestGroups[g].Op_Type_ID, "Timestamp": requestGroups[g].Timestamp, "Device_ID": requestGroups[g].Device_ID, "User_ID": requestGroups[g].User_ID, "User_ID_Old": requestGroups[g].User_ID_Old };
               queries.push(new SyncQuery(true, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.request, Op_Type_ID.DELETE_INNER_JOIN, colsTbls, [{"A":"Op_ID", "B":"ID"}], wheres));
            }
         }

         var opTypeId = this.requests.choice === "1" ? Op_Type_ID.DELETE : Op_Type_ID.UPDATE;

         //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
         this.helpers.autoSync(queries, opTypeId, null, null, null, null).then((res) => {
            if (res.isSuccess === true) {
               this.requests.results += ":<br />Updated request choices: " + res.results;
               this.helpers.myAlert("SUCCESS", "<b" + this.requests.results + "</b>", "", "OK");
               this.getRequests();
            } else {
               this.requests.results += ":<br />Error updating request choices: " + res.results;
               this.helpers.myAlert("ERROR", "<b" + this.requests.results + "</b>", "", "OK");
            }
         });
      });
   }

   finishUpdateRequests() {
      console.log("finishUpdateRequests called");
      this.requests.requests = this.requests.requests.filter((request:any) => { return request.isChecked === false; });
   }

   autoSyncAllRequests(index: number, requestGroups: Array<OperationSync>, syncResults: any[], callback: Function) {
      console.log("autoSyncAcrosticsSqls called");
      if (this.requests.choice === "1") {
         callback([]);
      } else {
         console.log("index = " + index + ", requestGroups.length = " + requestGroups.length);
         if (index < requestGroups.length) {
            var group:any = requestGroups[index];
            var queries: Array<SyncQuery> = group.REQUESTS;
            var rq: SyncQuery;

            //SET ALL REQUEST VALS AS STRINGS:
            for (var r = 0; r < group.REQUESTS.length; r++) {
               rq = group.REQUESTS[r];
               if (rq.Vals && Array.isArray(rq.Vals) && rq.Vals.length > 0) {
                  if (!Array.isArray(rq.Vals[0])) {//1D ARRAY
                     for (var v = 0; v < rq.Vals.length; v++) {
                        if (rq.Vals[v]) {
                           rq.Vals[v] = String(rq.Vals[v]);
                        }
                     }
                  } else {//2D ARRAY
                     for (var v = 0; v < rq.Vals.length; v++) {
                        for (var v2 = 0; v2 < rq.Vals[v].length; v2++) {
                           if (rq.Vals[v][v2]) {
                              rq.Vals[v][v2] = String(rq.Vals[v][v2]);
                           }
                        }
                     }
                  }
               }               
            }

            if (String(this.requests.choice) === "3") {
               var opTypeID: number = group.Op_Type_ID;
               if (opTypeID !== Op_Type_ID.ALTER_TABLE) {
                  queries = [];                  
                  for (var r = 0; r < group.REQUESTS.length; r++) {
                     rq = group.REQUESTS[r];
                     console.log("rq.User_Action = " + rq.User_Action + " User_Action_Request.USER_ID_UPDATE = " + User_Action_Request.USER_ID_UPDATE);
                     if (rq.User_Action === User_Action_Request.USER_ID_UPDATE) {
                        console.log("rq.User_Action === User_Action_Request.USER_ID_UPDATE, GOING TO UPDATE USER ID!!!");
                        var userIdIndex = rq.Cols.indexOf("User_ID");
                        if (userIdIndex >= 0) {
                           rq.Vals[userIdIndex] = group.User_ID;
                        } else {
                           rq.Cols.push("User_ID");
                           rq.Vals.push(group.User_ID);
                        }
                     }
                     queries.push(new SyncQuery(rq.IS_APP, group.User_ID_Old, rq.DB_Type_ID, rq.Table_name, rq.Act_Type_ID, rq.Cols, rq.Vals, rq.Wheres));
                  }

               }
               if (opTypeID === Op_Type_ID.ALTER_TABLE) {
                  console.log("REQUEST UPDATING USER ID 3RD OPTION");
                  var wheres = { "Table_name": group.Names["Table"] };
                  queries.unshift(new SyncQuery(null, null, DB_Type_ID.DB_MISC, "acrostic_tables", Op_Type_ID.UPDATE, ['User_ID'], [group.User_ID], wheres));
               }
            }//END UPDATE USER.
            //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
            //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
            //THIS WILL DO A SYNC, NOT A REQUEST!!!!===>
            this.helpers.autoSync(queries, group.Op_Type_ID, null, null, null, null, null, group["Image"]).then((res) => {
               syncResults.push(res);
               index++;
               this.autoSyncAllRequests(index, requestGroups, syncResults, callback);
            });
         } else {
            callback(syncResults);
         }
      }
   }

   checkAll() {
      console.log("checkAll called");
      this.requests.isCheckAll = !this.requests.isCheckAll;
      this.requests.requestGroups.forEach((group:any) => {
         group.isChecked = this.requests.isCheckAll;
      });
   }

   setSortKey(key:any) {
      console.log("setSortKey called: key=" + key);
      if (key === this.requests.sortKey) {
         this.requests.isReverse = !this.requests.isReverse;
      }
      this.requests.sortKey = key;
      this.requests.requests.sort(this.helpers.sortByItem(this.requests.sortKey, this.requests.isReverse));
   }

}
