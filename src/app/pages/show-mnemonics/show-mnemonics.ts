import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController } from '@ionic/angular';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage';
import { Helpers, Mnemonic_Type_ID } from '../../providers/helpers/helpers';


@Component({
   selector: 'show-mnemonics',
   templateUrl: 'show-mnemonics.html',
   styleUrl: 'show-mnemonics.scss'
})
export class ShowMnemonicsPage {
   public pageName:string = "Show Mnemonics";
   showMnemonics: any;
   public database_misc: SQLiteDBConnection | null = null;
   private peglist: any;
   progressLoader: any;
   user: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";

   constructor(public navCtrl: NavController, private alertCtrl: AlertController, public progress: LoadingController, public storage: Storage, public helpers: Helpers) {
      console.log("constructor called");
      this.database_misc = this.helpers.getDatabaseMisc();
   }

   ngOnInit() {
      this.user = Helpers.User;
      Helpers.currentPageName = this.pageName;
      console.log("ngOnInit called");
      this.peglist = ["Tea", "New", "Me", "Ear", "Owl", "Gay",
         "Cow", "UFO", "Bee", "Dash", "Dead", "Tuna", "Atom", "Deer",
         "Tale", "Dog", "Duke", "TV", "Tuba", "NASA", "Ant", "Noon",
         "Enemy", "Honor", "Noel", "Wing", "Ink", "Navy", "Newbie",
         "Mouse", "Myth", "Moon", "Memo", "Humor", "Email", "Image",
         "Macho", "Movie", "Amoeba", "Horse", "Rat", "Rain", "Arm",
         "Arrow", "Rail", "Rage", "Rich", "Review", "Robe", "Loose",
         "Old", "Lion", "Lama", "Liar", "Hello", "Leg", "Lake", "Wolf",
         "Loop", "Goose", "Goat", "Gun", "Game", "Gray", "Galaxy",
         "Egg", "Joke", "Goofy", "Jeep", "Cheese", "Cat", "Knee",
         "Coma", "Car", "Cola", "Cage", "Cake", "Cafe", "Chip", "Fish",
         "Fat", "Fun", "Fame", "Fairy", "Fly", "Fog", "Fake", "FIFO",
         "FBI", "Bus", "Bat", "PIN", "Beam", "Bear", "Pool", "Pig",
         "Bike", "Beef", "Babe", "Disease", "Test", "Disney", "Autism",
         "Tzar", "Diesel", "White sage", "Disc", "Satisfy", "Hat shop",
         "Odds", "Daddy", "Titan", "Stadium", "Dexter", "Total",
         "Hot dog", "Attic", "HDTV", "HTTP", "Adonis", "Stunt",
         "Estonian", "Autonomy", "Diner", "Denial", "Stone Age",
         "Dance", "TNF", "Danube", "Times", "Time-out", "Domine",
         "Dummy", "Tumor", "HTML", "Damage", "Stomach", "TMV", "Thumb",
         "Tears", "Druid", "Darwin", "Storm", "Adorer", "Australia",
         "Storage", "Dark", "Dwarf", "Trophy", "Atlas", "Athlete",
         "Italian", "Soda lime", "Hitler", "Dolly", "Dialogue",
         "Italic", "Tea leaf", "Toolbox", "Doghouse", "Widget",
         "Shotgun", "Dogma", "Tiger", "Stagily", "Hedgehog", "Dog hook",
         "Deja vu", "Doughboy", "Steakhouse", "Woodcut", "Technique",
         "Sitcom", "Teacher", "Stokehole", "The Cage", "Duck",
         "Deceive", "Teacup", "TV show", "DVD", "Divine", "The Fame",
         "Stover", "Devil", "Defog", "Device", "Day off", "The F.B.I.",
         "Oedipus", "Tibet", "Headphone", "Tie beam", "Sidebar",
         "Duplex", "Debug", "Topic", "Top-heavy", "Tippy", "News show"];
      this.showMnemonics = {};
      this.showMnemonics.results = null;
      this.showMnemonics.mnemonics = [];
      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.showMnemonics.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
         this.background_color = bgColor;
      });
      this.showMnemonics.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });
      this.loadMnemonics();
   }

   ngAfterViewInit() {
      console.log("ngAfterViewInit called");
   }

   ionViewWillLeave(){
      this.showMnemonics.subscribedBackgroundColorEvent.unsubscribe();
      this.showMnemonics.subscribedButtonColorEvent.unsubscribe();
   }

   expand(category:any) {
      console.log("expand called");
      category.isShow = !category.isShow;
      console.log("isShow=" + category.isShow);
   }

   loadMnemonics() {
      console.log("loadMnemonics called");
      this.helpers.setProgress("Loading mnemonics ,please wait...", false).then(() => {
         this.showMnemonics.results = null;
         this.showMnemonics.mnemonics = [];
         if (Helpers.isWorkOffline === false) {//IF ONLINE:
            this.helpers.makeHttpRequest("/lfq_directory/php/get_mnemonics_table.php", "GET", null).then((data) => {
               if (data["SUCCESS"] === true) {
                  this.showMnemonicResults(data["MNEMONICS"]);
                  this.helpers.dismissProgress();
               } else {
                  this.helpers.dismissProgress();
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            }, error => {
               this.helpers.dismissProgress();
               this.helpers.alertServerError(error.message);
            });
         } else {//IF OFFLINE:
            var sql = "SELECT m.*,me.*,mc.Name AS Category, mt.Name as Mnemonic_Type, ud.Username FROM " + Helpers.TABLES_MISC.mnemonic + " AS m ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.mnemonic_entry + " AS me ON me.Mnemonic_ID=m.ID ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.mnemonic_category + " AS mc ON mc.ID=m.Mnemonic_Category_ID ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.mnemonic_type + " AS mt ON mt.ID=m.Mnemonic_Type_ID ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=m.User_ID ";
            sql += "GROUP BY mc.Name, m.ID, me.Entry_Index "
            sql += "ORDER BY mc.Name, m.ID, me.Entry_Index";

            this.helpers.query(Helpers.database_misc, sql, []).then((data) => {

               if (data.rows) {
                  console.log("Number rows=" + data.rows.length);
                  var mnemonics = [];
                  for (var i = 0; i < data.rows.length; i++) {
                     mnemonics.push(data.rows.item(i));
                  }
                  this.showMnemonicResults(mnemonics);
               }
               this.helpers.dismissProgress();
            }).catch((error) => {//END SELECT QUERY
               console.log("sql:" + sql + ", ERROR:" + error.message);
               this.showMnemonics.results = "Sorry. Error loading mnemonics.";
               this.helpers.dismissProgress();
            });
         }
      });
   }

   showMnemonicResults(mnemonics:any) {
      //this.showMnemonics.mnemonics.push({"name": "HELLO", "isShow":false, "information":"INFO!"});
      var text = "";
      this.showMnemonics.mnemonics = [];
      var uniqueCategories = mnemonics.map((mne:any) => { return mne.Category }).filter(this.helpers.onlyUnique);
      var mnemonicsCategoriesUnique:any = [], titlesUnique:any = [], mnemonicsTitle:any = [], showTitles:any = [], text:string = "";
      for (var uc = 0; uc < uniqueCategories.length; uc++) {
         mnemonicsCategoriesUnique = mnemonics.filter((mne:any) => { return mne.Category === uniqueCategories[uc] });
         titlesUnique = mnemonicsCategoriesUnique.map((mct:any) => { return mct.Title }).filter(this.helpers.onlyUnique);
         showTitles = [];
         console.log("GOT CATEGORY, " + uniqueCategories[uc] + " titles = " + titlesUnique);
         for (var t = 0; t < titlesUnique.length; t++) {
            mnemonicsTitle = mnemonicsCategoriesUnique.filter((mcu:any) => { return mcu.Title === titlesUnique[t] });
            text = this.helpers.getMnemonicText(mnemonicsTitle, this.peglist);
            showTitles.push({
               "Title": titlesUnique[t],
               "Type": Mnemonic_Type_ID[mnemonicsTitle[0].Mnemonic_Type_ID],
               "text": text
            });
         }
         this.showMnemonics.mnemonics.push({
            "name": uniqueCategories[uc],
            "isShow": false,
            "titles": showTitles
         });
      }
   }

}
