import { Component } from '@angular/core';
import { NavController, NavParams } from '@ionic/angular';
import { Helpers } from '../../providers/helpers/helpers';


@Component({
   selector: 'page-search',
   templateUrl: 'search.html',
   styleUrls: ['./search.scss']
})
export class SearchPage {
   public pageName: string = "Search";
   search: any;
   background_color: any;
   button_color: string = "";
   button_gradient: string = "";
   user: any;

   constructor(public navCtrl: NavController, public helpers: Helpers) {
   }

   async ngOnInit() {
      this.search = {};
      Helpers.currentPageName = this.pageName;
      //this.search.wikiUrl = (this.helpers.isApp())? "https://en.wikipedia.org" : "/WIKIPEDIA"
      this.search.wikiUrl = "https://en.wikipedia.org";
      this.user = Helpers.User;
      this.background_color = Helpers.background_color;
      this.button_color = Helpers.button_color;
      this.button_gradient = Helpers.button_gradient;
      this.search.isShowingMenu = false;
      this.search.subscribedMenuToolbarEvent = this.helpers.menuToolbarEvent.subscribe((isShown) => {
         this.search.isShowingMenu = isShown;
      });
      this.search.subscribedBackgroundColorEvent = this.helpers.backgroundColorEvent.subscribe((bgColor:any) => {
         this.background_color = bgColor;
      });
      this.search.subscribedButtonColorEvent = this.helpers.buttonColorEvent.subscribe((buttonColor:any) => {
         this.button_color = buttonColor.value;
         this.button_gradient = buttonColor.gradient;
      });
   }

   ionViewDidLoad() {
      console.log('ionViewDidLoad SearchPage');
   }

   ionViewWillLeave() {
      this.search.subscribedMenuToolbarEvent.unsubscribe();
      this.search.subscribedBackgroundColorEvent.unsubscribe();
      this.search.subscribedButtonColorEvent.unsubscribe();
   }

   getSuggested() {
      //http://en.wikipedia.org/w/api.php?action=opensearch&search=mariano&namespace=0&format=json
      console.log("getSuggested called, search.input = " + this.search.input);
      var url = this.search.wikiUrl + "/w/api.php?action=opensearch&namespace=0&format=json&search=" + this.search.input;
      Helpers.isLfqHttp = false;
      this.search.results = "";
      this.helpers.makeHttpRequest(url, "GET", {}).then((res) => {
         console.log("res = " + JSON.stringify(res));
         if (res && res[1]) {
            this.search.suggestedList = res[1];
         }
         console.log("this.search.suggestedList = " + this.search.suggestedList);
         //this.search.results = "HELLO";
         Helpers.isLfqHttp = true;
      });
   }

   searchWikipedia(input:any) {
      console.log("searchWikipedia called, search.input = " + input);

      var url = this.search.wikiUrl + "/w/api.php?action=query&prop=extracts&origin=*&format=json&generator=search&gsrnamespace=0&gsrlimit=1&gsrsearch=" + input;
      Helpers.isLfqHttp = false;
      this.search.results = "";
      this.helpers.setProgress("Searching " + input + " ... ", false).then(() => {
         this.helpers.makeHttpRequest(url, "GET", {}).then((res) => {
            console.log("res = " + JSON.stringify(res));
            if (res && res.query && res.query.pages) {
               for (var prop in res.query.pages) {
                  if (res.query.pages[prop] && res.query.pages[prop].title && res.query.pages[prop].extract) {
                     this.search.results += '<div style="text-align:center"><strong>' + res.query.pages[prop].title + ':</strong></div>' + res.query.pages[prop].extract + '<hr style="margin:10px">';
                     console.log("HTML AS JSON = " + JSON.stringify({ html: res.query.pages[prop].extract }));
                  }
               }
            }
            console.log("this.search.results = " + this.search.results);
            //this.search.results = "HELLO";
            Helpers.isLfqHttp = true;
            this.helpers.dismissProgress();
         });
      });
   }

}
