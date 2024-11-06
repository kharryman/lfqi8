import { Component, ViewChild, ElementRef, ChangeDetectorRef, HostBinding, HostListener } from '@angular/core';
import { NavController, LoadingController, AlertController, Platform, ModalController } from '@ionic/angular';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';
import { DB_Type_ID, Helpers, Op_Type, Op_Type_ID, SyncQuery } from '../../providers/helpers/helpers';
import { Subscription } from 'rxjs';
import { ModalListPage } from '../../pages/modal-list/modal-list';


@Component({
   selector: 'page-show-world-map',
   templateUrl: 'show-world-map.html',
})
@HostBinding('style.height.px')

export class ShowWorldMapPage {
   public pageName: string = "World Map";
   @ViewChild('world_map') world_map: any;
   worldMap: any = {};
   public database_misc: SQLiteDBConnection | null = null;
   progressLoader: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   //private onPauseSubscription: Subscription;
   user: any;

   constructor(public navCtrl: NavController, private platform: Platform, private alertCtrl: AlertController, public progress: LoadingController, public storage: Storage, private helpers: Helpers, public modalCtrl: ModalController, private chRef: ChangeDetectorRef) {
   }

   async ngOnInit() {
      this.database_misc = this.helpers.getDatabaseMisc();
      this.user = Helpers.User;
      await this.storage.create();
      this.worldMap = {};
      this.worldMap.isShow = true;
      this.worldMap.places = [];
      this.worldMap.selectedPlaces = [];
      this.worldMap.isSelect = false;
      this.worldMap.locationType = "COUNTRY";
      this.worldMap.countries = [];
      this.worldMap.states = [];
      this.worldMap.cities = [];
      this.worldMap.isSeeMap = true;
      this.worldMap.username = Helpers.User.Username;
      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.worldMap.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor: any) => {
         this.background_color = bgColor;
      });
      this.worldMap.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor: any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });
      this.worldMap.scrollHeight = 600;
      //this.worldMap.mapWidthFixed = 2500;//*2=5000
      //this.worldMap.mapHeightFixed = 1427;//*2=2854
      this.worldMap.mapWidthFixed = 2726;//*2=5000
      this.worldMap.mapHeightFixed = 2010;//*2=2854
      this.worldMap.mapWidth = this.worldMap.mapWidthFixed;
      this.worldMap.mapHeight = this.worldMap.mapHeightFixed;
      this.worldMap.scrollWidth = 0;
      this.worldMap.scrollHeight = 0;
      this.platform.ready().then(() => {
         this.worldMap.width = this.platform.width();
         this.worldMap.height = this.platform.height();

         //this.worldMap.mapWidth = 2*this.worldMap.width;
         var aspectRatio = this.worldMap.mapWidth / this.worldMap.mapWidthFixed;
         //this.world_map.addScrollEventListener((e) => {
         //   console.log("WORLD MAP SCROLLED!:" + JSON.stringify(e));
         //})         
         //this.worldMap.mapHeight = 1000;
         console.log("SCREEN WIDTH=" + this.worldMap.width + ", SCREEN HEIGHT = " + this.worldMap.height);
         //if(this.worldMap.width<(2*this.worldMap.mapWidthFixed) || this.worldMap.scrollHeight<(2*this.worldMap.mapHeightFixed)){//scale map:
         //   this.worldMap.mapWidth = Math.floor(this.worldMap.width/2);
         //   var aspectFactorWidth = (2*this.worldMap.width)/this.worldMap.mapWidthFixed;
         //   var aspectFactorHeight = (2*this.worldMap.scrollHeight)/this.worldMap.mapHeightFixed;
         //   var aspectFactor = Math.min(aspectFactorWidth,aspectFactorHeight);
         //   this.worldMap.mapHeight = Math.floor(this.worldMap.mapHeightFixed*aspectFactor);
         //   this.worldMap.mapWidth = Math.floor(this.worldMap.scrollHeight*aspectFactor);
         //}
         //this.worldMap.worldMap = document.getElementById("world_map");
         //this.worldMap.worldMap.addEventListener('resize', this.resize());
         //console.log("SET MAP WIDTH=" + this.worldMap.mapWidth + ", HEIGHT = " + this.worldMap.mapHeight);
         this.getPlaces().then(() => {
            if (this.worldMap.places.length > 0) {
               //this.worldMap.selectedPlace = this.worldMap.places[0];
               this.worldMap.selectedFilterPlaces = "COUNTRY";
               this.getFilterPlaces();
               if (this.worldMap.selectedPlace) {
                  this.showPlace(this.worldMap.selectedPlace).then(() => {
                     this.getCountries();
                  }, () => {
                     console.log("this.worldMap.selectedPlace GET ERROR");
                  });
               }
            }
         });
      });
   }

   ionViewDidLoad() {
      console.log('ionViewDidLoad ShowWorldMapPage');
   }

   ionViewWillLeave() {
      this.worldMap.subscribedBackgroundColorEvent.unsubscribe();
      this.worldMap.subscribedButtonColorEvent.unsubscribe();
   }

   getPlaces(): Promise<void> {
      console.log("getPlaces called");
      return new Promise((resolve, reject) => {
         this.worldMap.places = [];
         this.helpers.setProgress("Getting all places ,please wait...", false).then(() => {
            if (Helpers.isWorkOffline === false) {
               var params = {};
               this.helpers.makeHttpRequest("/lfq_app_php/show_map_get_places.php", "GET", params).then((data) => {
                  this.helpers.dismissProgress();
                  if (data["SUCCESS"] === true) {
                     this.finishGetPlaces(data["PLACES"]);
                  } else {
                     this.helpers.alertLfqError(data["ERROR"]);
                  }
                  resolve();
               }, error => {
                  console.log("ERROR:" + error.message);
                  this.helpers.alertServerError("Sorry. Error getting places: " + error.message);
                  this.helpers.dismissProgress();
                  resolve();
               });
            } else {
               var sql = "SELECT r.T,r.N,r.K,r.S,r.C,r.D FROM ";
               //COUNTRIES:
               sql += "(SELECT 'K' AS T,'0' AS N,Name AS K,'0' AS S, '0' AS C, '0' AS D FROM " + Helpers.TABLES_MISC.map_country + " ";
               //STATES:
               sql += "UNION ALL SELECT 'S' AS T, '0' AS N, k.Name as K, s.Name AS S,'0' AS C,'0' AS D FROM " + Helpers.TABLES_MISC.map_state + " AS s ";
               sql += "INNER JOIN " + Helpers.TABLES_MISC.map_country + " AS k ON k.ID=s.Country_ID ";
               //CITIES:
               sql += "UNION ALL SELECT 'C' AS T, '0' AS N, k.Name as K, s.Name AS S, c.Name AS C, (CASE WHEN c.SW_LNG<0 THEN 1 ELSE 2 END) AS D FROM " + Helpers.TABLES_MISC.map_city + " AS c ";
               sql += "INNER JOIN " + Helpers.TABLES_MISC.map_state + " AS s ON s.ID=c.State_ID ";
               sql += "INNER JOIN " + Helpers.TABLES_MISC.map_country + " AS k ON k.ID=c.Country_ID ";
               //FOR PLACES:
               sql += "UNION ALL SELECT (CASE WHEN p.Country_ID iS NOT NULL THEN 'KP' WHEN p.State_ID iS NOT NULL THEN 'SP' WHEN p.City_ID iS NOT NULL THEN 'CP' END) AS T, ";
               sql += "p.Name AS N, ikp.Name AS K, isp.Name AS S, icp.Name AS C,";
               sql += "(CASE WHEN icp.SW_LNG<0 THEN 1 WHEN icp.SW_LNG>=0 THEN 2 ELSE 0 END) AS D ";
               sql += "FROM " + Helpers.TABLES_MISC.map_place + " AS p ";
               sql += "LEFT JOIN  " + Helpers.TABLES_MISC.map_city + " AS icp ON icp.ID=p.City_ID ";
               sql += "LEFT JOIN  " + Helpers.TABLES_MISC.map_state + " AS isp ON isp.ID=p.State_ID ";
               sql += "LEFT JOIN  " + Helpers.TABLES_MISC.map_country + " AS ikp ON ikp.ID=p.Country_ID ";
               sql += ")r ORDER BY r.T,r.N";
               console.log("getWords sql = " + sql);
               this.helpers.query(this.database_misc, sql, []).then((data) => {
                  console.log("NUMBER PLACES=" + data.rows.length);
                  var places = [];
                  if (data.rows.length > 0) {
                     for (var i = 0; i < data.rows.length; i++) {
                        places.push(data.rows.item(i));
                     }
                  }
                  console.log("GOT PLACES = " + JSON.stringify(places));
                  this.finishGetPlaces(places);
                  //console.log("PLACES = " + JSON.stringify(this.worldMap.places));                  
                  this.helpers.dismissProgress();
                  resolve();
               }).catch((error) => {
                  console.log("sql:" + sql + ", ERROR:" + error.message);
                  this.helpers.alertLfqError("Error getting places:" + error.message);
                  this.helpers.dismissProgress();
                  resolve();
               });
            }
         });
      });
   }

   finishGetPlaces(places: any) {
      this.worldMap.places = places.map((place: any) => {
         place.Type = this.getPlaceType(place.T);
         delete place.T;
         place.Country = place.K;
         delete place.K;
         place.State = place.S;
         delete place.S;
         place.City = place.C;
         delete place.C;
         if (place.Type === "CITY") {
            place.Name = place.City;
         } else if (place.Type === "STATE") {
            place.Name = place.State;
         } else if (place.Type === "COUNTRY") {
            place.Name = place.Country;
         } else if (place.Type === "CITY PLACE" || place.Type === "STATE PLACE" || place.Type === "COUNTRY PLACE") {
            place.Name = place.N;
            console.log("GOT A SPECIAL PLACE! = " + place.Name);
         }
         delete place.N;
         return place;
      });
      //console.log("finishGetPlaces: places=" + JSON.stringify(this.worldMap.places));
      var placeTypeName = "";
      this.worldMap.selectedPlaces = this.worldMap.places.map((place: any) => {
         placeTypeName = "";
         if (place.Type === "CITY PLACE") placeTypeName = ", City: " + place.City;
         if (place.Type === "STATE PLACE") placeTypeName = ", State: " + place.State;
         if (place.Type === "COUNTRY PLACE") placeTypeName = ", Country: " + place.Country;
         place.name = place.Name + placeTypeName + " --- Type: " + place.Type;
         return place;
      }).sort(this.helpers.sortBy2Items(["Type", "Name"], [false, false]));
   }

   seeEditMap() {
      console.log("seeEditMap called");
      if (this.worldMap.isShow === true) {
         this.worldMap.isSeeMap = true;
         this.worldMap.mapWidth = this.worldMap.mapWidthFixed;
         this.worldMap.mapHeight = this.worldMap.mapHeightFixed;
      } else {//TO DO EDIT!:
         this.helpers.setProgress("Adding place, please wait...", false).then(() => {
            var Country = '0', State = '0', City = '0';
            var cols = ["Name"];
            var vals = [this.worldMap.newPlaceName];
            var placeTypeName = "";
            if (this.worldMap.locationType === "COUNTRY") {
               placeTypeName = this.worldMap.selectedCountry.Name;
               Country = placeTypeName;
               cols.push("Country_ID");
            } else if (this.worldMap.locationType === "STATE") {
               placeTypeName = this.worldMap.selectedState.Name;
               State = placeTypeName;
               cols.push("State_ID");
            } else if (this.worldMap.locationType === "CITY") {
               placeTypeName = this.worldMap.selectedCity.Name;
               City = placeTypeName;
               cols.push("City_ID");
            }
            this.helpers.getPlaceID(this.worldMap.locationType, placeTypeName).then(ID => {
               if (ID != null) {
                  vals.push(ID);
                  //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                  var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.map_place, Op_Type_ID.INSERT, cols, [vals], { "Name": this.worldMap.newPlaceName })];
                  //autoSync(queries,opTypeId,userIdOld,names,entryOld,entry,imageOld,imageNew)
                  this.helpers.autoSync(queries, Op_Type_ID.INSERT, null, null, null, null).then((res) => {
                     if (res.isSuccess === true) {
                        this.worldMap.places.push({ "Name": this.worldMap.newPlaceName, "Type": this.worldMap.locationType + " PLACE", "Country": Country, "State": State, "City": City });
                        this.worldMap.places.sort(this.helpers.sortBy2Items(["Type", "Name"], [false, false]));
                        var placeTypeName = "";
                        this.worldMap.selectedPlaces = this.worldMap.places.map((place:any) => {
                           placeTypeName = "";
                           if (place.Type === "CITY PLACE") placeTypeName = ", City: " + place.City;
                           if (place.Type === "STATE PLACE") placeTypeName = ", State: " + place.State;
                           if (place.Type === "COUNTRY PLACE") placeTypeName = ", Country: " + place.Country;
                           place.name = place.Name + placeTypeName + " --- Type: " + place.Type;
                           return place;
                        });
                        this.getCountries();
                        this.helpers.myAlert("SUCCESS", null, "Added place:<br />" + this.worldMap.newPlaceName + "!", "Done");
                        this.helpers.dismissProgress();
                     } else {
                        console.log("ERROR:" + res.results);
                        this.helpers.alertLfqError("Error adding place:" + res.results);
                        this.helpers.dismissProgress();
                     }
                  });
               }
            });
         });
      }
   }

   async showPlaces() {
      console.log("showPlaces called");
      console.log("showSuggestedWords called");
      // Create the modal      
      let modal = await this.modalCtrl.create({
         component: ModalListPage,
         componentProps: {
            "items": this.worldMap.selectedPlaces,
            "title": "Places(" + this.worldMap.selectedPlaces.length + ")"
         }
      });
      // Handle the result
      modal.onDidDismiss().then((item:any) => {
         if (item) {
            console.log("SELECTED item=" + JSON.stringify(item));
            //var itemSplit = item.split(" --- Type: ");
            this.worldMap.selectedPlace = item;
            this.worldMap.isSelect = false;
            if (this.worldMap.selectedPlace) {
               this.showPlace(this.worldMap.selectedPlace);
            }
         }
      });
      await modal.present();
   }
   getFilterPlaces() {
      console.log("getFilterPlaces called, this.worldMap.selectedFilterPlaces = " + this.worldMap.selectedFilterPlaces);
      var filterPlacesSplit = this.worldMap.selectedFilterPlaces.split("-");
      console.log("getFilterPlaces filterPlacesSplit= " + JSON.stringify(filterPlacesSplit[1]));
      var placeTypeName = "";
      this.worldMap.selectedPlaces = this.worldMap.places.filter((place: any) => {
         //console.log("getFilterPlaces place.Type=" + place.Type + ", place.City = " + place.City+ ", place.State = " + place.State+ ", place.Country = " + place.Country);
         if (filterPlacesSplit[0] === "CITIES") {
            return ((place.Type === "CITY" || place.Type === "CITY PLACE") && String(place.D) === String(filterPlacesSplit[1]));
         } else {
            return (place.Type === this.worldMap.selectedFilterPlaces || place.Type === (this.worldMap.selectedFilterPlaces + " PLACE"));
         }
      }).map((place:any) => {
         placeTypeName = "";
         if (place.Type === "CITY PLACE") placeTypeName = ", City: " + place.City;
         if (place.Type === "STATE PLACE") placeTypeName = ", State: " + place.State;
         if (place.Type === "COUNTRY PLACE") placeTypeName = ", Country: " + place.Country;
         place.name = place.Name + placeTypeName + " --- Type: " + place.Type;
         return place;
      }).sort(this.helpers.sortBy2Items(["Type", "Name"], [false, false]));
      console.log("this.worldMap.selectedPlaces.length = " + this.worldMap.selectedPlaces.length);
      this.worldMap.selectedPlace = this.worldMap.selectedPlaces[0];
   }
   getCountries() {
      console.log("getCountries called");
      var placeTypeName = "";
      this.worldMap.countries = this.worldMap.places.filter((place:any) => { return (place.Type === "COUNTRY" || place.Type === "COUNTRY PLACE"); }).map((place:any) => {
         placeTypeName = "";
         if (place.Type === "CITY PLACE") placeTypeName = ", City: " + place.City;
         if (place.Type === "STATE PLACE") placeTypeName = ", State: " + place.State;
         if (place.Type === "COUNTRY PLACE") placeTypeName = ", Country: " + place.Country;
         place.name = place.Name + placeTypeName + " --- Type: " + place.Type;
         return place;
      }).sort(this.helpers.sortBy2Items(["Type", "Name"], [false, false]));
   }
   getStates() {
      console.log("getStates called, this.worldMap.selectedCountry = " + JSON.stringify(this.worldMap.selectedCountry));
      if (this.worldMap.selectedCountry) {
         this.worldMap.states = this.worldMap.places.filter((place: any) => {
            return (place.Country === this.worldMap.selectedCountry.Name && place.Type === "STATE");
         }).sort(this.helpers.sortByItem('Name', false));
         console.log("getStates this.worldMap.states.length = " + this.worldMap.states.length);
         this.worldMap.locationType = "COUNTRY";
         if (this.worldMap.states.length > 0) {
            this.worldMap.selectedState = this.worldMap.states[0];
         }
         if (this.worldMap.selectedCountry) {
            this.showPlace(this.worldMap.selectedCountry);
         }
      }
   }
   getCities() {
      console.log("getCities called");
      if (this.worldMap.selectedCountry && this.worldMap.selectedState) {
         console.log("getCities: selectedCountry=" + JSON.stringify(this.worldMap.selectedCountry) + ", selectedState = " + JSON.stringify(this.worldMap.selectedState));
         this.worldMap.cities = this.worldMap.places.filter((place:any) => {
            return ((place.Country === this.worldMap.selectedCountry.Name && place.State === this.worldMap.selectedState.Name && place.Type === "CITY"));
         }).sort(this.helpers.sortByItem('Name', false));
         //console.log("getCities: cities = " + JSON.stringify(this.worldMap.cities));
         if (this.worldMap.cities.length > 0) {
            this.worldMap.selectedCity = this.worldMap.cities[0];
         }
         this.worldMap.locationType = "STATE";
         if (this.worldMap.selectedState) {
            this.showPlace(this.worldMap.selectedState);
         }
      }
   }

   selectCity() {
      console.log("selectCity called");
      this.worldMap.locationType = "CITY";
      if (this.worldMap.selectedCity) {
         this.showPlace(this.worldMap.selectedCity);
      }
   }

   enterShow() {
      console.log("enterShow called");
      this.worldMap.isShow = !this.worldMap.isShow;
   }

   getPlaceType(type:any):string | void {
      if (type === "K") return "COUNTRY";
      else if (type === "S") return "STATE";
      else if (type === "C") return "CITY";
      else if (type === "KP") return "COUNTRY PLACE";
      else if (type === "SP") return "STATE PLACE";
      else if (type === "CP") return "CITY PLACE";
   }

   scrollEvent(event:any) {
      console.log("scroll called, event=" + JSON.stringify(event));
   }

   onResize() {
      console.log("onResize called");
      this.myResize();
   }
   private myResize(): void {
      this.worldMap.scrollWidth = this.world_map.nativeElement.width;
      this.worldMap.scrollHeight = this.world_map.nativeElement.height;
      console.log("myResize: this.worldMap.scrollWidth=" + this.worldMap.scrollWidth + ", this.worldMap.scrollHeight =" + this.worldMap.scrollHeight);
   }

   showPlace(selectedPlace:any): Promise<void> {
      console.log("showPlace called, selectedPlace = " + JSON.stringify(selectedPlace) + ", this.worldMap.locationType = " + this.worldMap.locationType);
      return new Promise((resolve, reject) => {
         if (!selectedPlace) {
            reject();
         } else {
            this.helpers.setProgress("Finding place " + selectedPlace.Name + ", please wait...", false).then(() => {
               if (Helpers.isWorkOffline === false) {
                  var params = {
                     "name": selectedPlace.Name,
                     "type": selectedPlace.Type
                  };
                  this.helpers.makeHttpRequest("/lfq_app_php/show_map_get_place.php", "POST", params).then((data) => {
                     this.helpers.dismissProgress();
                     if (data["SUCCESS"] === true) {
                        this.finishShowPlace(data["PLACE"]);
                        resolve();
                     } else {
                        this.helpers.alertLfqError(data["ERROR"]);
                        reject();
                     }
                  }, error => {
                     console.log("ERROR:" + error.message);
                     this.helpers.dismissProgress();
                     this.helpers.alertServerError("Sorry. Error getting place: " + error.message);
                     reject();
                  });
               } else {//IF OFFLINE:               
                  var sql = "";
                  if (selectedPlace.Type === "COUNTRY") {
                     sql = "SELECT '" + selectedPlace.Type + "' AS Type, Name AS Country,* FROM " + Helpers.TABLES_MISC.map_country + " WHERE Name='" + selectedPlace.Name + "'";
                  } else if (selectedPlace.Type === "STATE") {
                     sql = "SELECT '" + selectedPlace.Type + "' AS Type, k.Name AS Country, s.Name AS State,s.* FROM " + Helpers.TABLES_MISC.map_state + " AS s ";
                     sql += "INNER JOIN " + Helpers.TABLES_MISC.map_country + " AS k ON k.ID=s.Country_ID WHERE s.Name='" + selectedPlace.Name + "'";
                  } else if (selectedPlace.Type === "CITY") {
                     sql = "SELECT '" + selectedPlace.Type + "' AS Type, k.Name AS Country, s.Name AS State,c.Name AS City,c.* FROM " + Helpers.TABLES_MISC.map_city + " AS c ";
                     sql += "INNER JOIN " + Helpers.TABLES_MISC.map_state + " AS s ON s.ID=c.State_ID ";
                     sql += "INNER JOIN " + Helpers.TABLES_MISC.map_country + " AS k ON k.ID=c.Country_ID ";
                     sql += "WHERE c.Name='" + selectedPlace.Name + "'";
                  } else if (selectedPlace.Type === "COUNTRY PLACE") {
                     sql = "SELECT p.Name, '" + selectedPlace.Type + "' AS Type, k.Name AS Country FROM " + Helpers.TABLES_MISC.map_place + " AS p ";
                     sql += "INNER JOIN " + Helpers.TABLES_MISC.map_country + " AS k ON k.ID=p.Country_ID ";
                     sql += "WHERE p.Name='" + selectedPlace.Name + "'";
                  } else if (selectedPlace.Type === "STATE PLACE") {
                     sql = "SELECT p.Name, '" + selectedPlace.Type + "' AS Type, k.Name AS Country, s.Name AS State FROM " + Helpers.TABLES_MISC.map_place + " AS p ";
                     sql += "INNER JOIN " + Helpers.TABLES_MISC.map_state + " AS s ON s.ID=p.State_ID ";
                     sql += "INNER JOIN " + Helpers.TABLES_MISC.map_country + " AS k ON k.ID=s.Country_ID ";
                     sql += "WHERE p.Name='" + selectedPlace.Name + "'";
                  } else if (selectedPlace.Type === "CITY PLACE") {
                     sql = "SELECT p.Name AS Name, '" + selectedPlace.Type + "' AS Type, k.Name AS Country, s.Name AS State,c.Name AS City,c.* FROM " + Helpers.TABLES_MISC.map_place + " AS p ";
                     sql += "INNER JOIN " + Helpers.TABLES_MISC.map_city + " AS c ON c.ID=p.City_ID ";
                     sql += "INNER JOIN " + Helpers.TABLES_MISC.map_state + " AS s ON s.ID=c.State_ID ";
                     sql += "INNER JOIN " + Helpers.TABLES_MISC.map_country + " AS k ON k.ID=c.Country_ID ";
                     sql += "WHERE p.Name='" + selectedPlace.Name + "'";
                  }
                  console.log("showPlace getPlace sql = " + sql);
                  this.helpers.query(this.database_misc, sql, []).then((data) => {
                     this.helpers.dismissProgress();
                     if (data.rows.length > 0) {
                        this.finishShowPlace(data.rows.item(0));
                     }
                     resolve();
                  }).catch((error) => {
                     this.helpers.dismissProgress();
                     console.log("sql:" + sql + ", ERROR:" + error.message);
                     this.helpers.alertLfqError("Error getting place:" + error.message);
                     reject();
                  });
               }
            });
         }
      });
   }

   finishShowPlace(place:any) {
      console.log("finishShowPlace: place=" + JSON.stringify(place));
      var lat:any = parseFloat(place.SW_LAT);
      var lng:any = parseFloat(place.SW_LNG);
      console.log("finishShowPlace: lat = " + lat + ", lng=" + lng);
      this.worldMap.isSeeMap = false;
      this.worldMap.mapWidth = Math.floor(this.worldMap.mapWidthFixed * 2.0);
      this.worldMap.mapHeight = Math.floor(this.worldMap.mapHeightFixed * 2.0);
      console.log("NEW this.worldMap.mapWidth=" + this.worldMap.mapWidth + ", NEW this.worldMap.mapHeight=" + this.worldMap.mapHeight);


      //lat: -90 <-> 90
      //lng: -180 <-> 180
      //this.world_map.scrollElement.scrollHeight = (unitX * lat);
      //this.world_map._scrollContent.nativeElement.scrollTo({ left: 0, top: 0 });
      //setTimeout(() => {
      //this.world_map._scrollContent.nativeElement.scrollTo({ left: (Math.floor(this.worldMap.mapWidthFixed/2.0)) + (unitX * (180 + lng)), bottom: (Math.floor(this.worldMap.mapHeightFixed/2.0)) + Math.floor((unitY * (90 + lat))), behavior: 'smooth' });
      //left=0 & top=0 ===> TOP LEFT CORNER OF MAP!!!:
      //this.world_map._scrollContent.nativeElement.scrollTo({ left: 0, top: 0, behavior: 'smooth' });

      //LEFT: HALF IMAGE WIDTH + HALF SCREEN WIDTH

      var lat2 = -90.0;
      var lng2 = 180.0;

      //this.worldMap.scrollWidth = this.world_map._scrollContent.nativeElement.getBoundingClientRect().width
      //this.worldMap.scrollHeight = this.world_map._scrollContent.nativeElement.getBoundingClientRect().height;
      console.log("finishShowPlace: this.worldMap.scrollWidth=" + this.worldMap.scrollWidth + ", this.worldMap.scrollHeight =" + this.worldMap.scrollHeight);

      var unitX = parseFloat(this.worldMap.mapWidthFixed) / 360.0;
      var unitY = parseFloat(this.worldMap.mapHeightFixed) / 180.0;

      var mapLeft = Math.floor(unitX * (180.0 + lng2));
      var mapTop = Math.floor(unitY * (90.0 - lat2));
      console.log("finishShowPlace: mapLeft = " + mapLeft + ", mapTop=" + mapTop);

      var leftMapOffset = Math.floor(parseFloat(this.worldMap.mapWidthFixed) / 2.0);
      var topMapOffset = Math.floor(parseFloat(this.worldMap.mapHeightFixed) / 2.0);
      console.log("finishShowPlace: leftMapOffset=" + leftMapOffset + ", topMapOffset = " + topMapOffset);



      //var middleX = parseFloat(this.worldMap.mapWidthFixed) / 2.0;
      //var middleY = parseFloat(this.worldMap.mapWidthFixed) / 2.0;
      //var distanceX = (unitX * Math.abs(lng));
      //var distanceY = (unitY * Math.abs(lat));
      //var distanceCenter = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
      //up: +lat, left:-lng
      var sphereX = 0.0;
      var sphereY = 0.0;
      //var sphereXF = 0.0;//10%
      //var sphereYF = 0.0;//10%
      //sphereX = lng > 0 ? (-1.0 * distanceY * sphereXF) : (distanceY * sphereXF);
      //sphereY = lat > 0 ? (distanceX * sphereYF) : (-1.0 * distanceX * sphereYF);

      // APP_DEBUG X :
      //lat = 0;
      //lng = 0;
      //---------
      console.log("finishShowPlace: this.worldMap.mapWidthFixed = " + this.worldMap.mapWidthFixed + ", this.worldMap.width = " + this.worldMap.width + ", unitX = " + unitX + ", unitY=" + unitY + ", lng = " + lng);
      var scrollLeft = Math.floor(parseFloat(this.worldMap.mapWidthFixed) / 2.0 + (unitX * (180.0 + lng)) - (this.worldMap.width / 2.0) + sphereX);
      var scrollTop = Math.floor(parseFloat(this.worldMap.mapHeightFixed) / 2.0 + unitY * ((90.0 - lat)) + sphereY);
      //this.world_map._scrollContent.nativeElement.zoomIn
      //this.world_map._scrollContent.nativeElement.zoomIn
      setTimeout(() => {
         console.log("SCROLLING!!!!!!");
         //zoomTo(zoom, parameter2, parameter3, parameter4)         
         this.world_map._scrollContent.nativeElement.scrollTo({ left: scrollLeft, top: scrollTop, behavior: 'smooth' });
         //setTimeout(() => {
         //   this.world_map._scrollContent.nativeElement.minZoom = 2.0;
         //},200);
         //level, animate, originLeft, originTop         
         //this.world_map._scrollContent.nativeElement.zoomTo({ level: 2.0, animate:true, originLeft: scrollLeft, originTop: scrollTop});
         //this.world_map._scrollContent.zoomTo({ level: 2.0, animate:true, originLeft: scrollLeft, originTop: scrollTop});
         //this.world_map._scrollContent.nativeElement.zoom({ zoom: 2.0, left: scrollLeft, top: scrollTop, behavior: 'smooth'});
      }, 200);

      //}, 2000);
      //this.world_map.scrollLeft += (unitX * lng);
      //this.world_map._scrollContent.nativeElement.scrollLeft = (unitX * lng);      
      console.log("finishShowPlace: SCROLLING LEFT=" + scrollLeft + ", SCROLLING TOP=" + scrollTop);
      console.log("finishShowPlace: mapWidth=" + this.worldMap.mapWidth + ", mapHeight=" + this.worldMap.mapHeight);
      this.chRef.detectChanges();
   }
}
