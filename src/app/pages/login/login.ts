//declare var AdMob;

import { ChangeDetectorRef, Component } from '@angular/core';
import { NavController, Platform, LoadingController, AlertController, ToastController } from '@ionic/angular';
//import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Storage } from '@ionic/storage-angular';

import { DB_Type_ID, Helpers, Op_Type, Op_Type_ID, SyncQuery } from '../../providers/helpers/helpers';
//import { SplashScreen } from '@ionic-native/splash-screen';
import { NgZone } from '@angular/core';
//import { BehaviorSubject } from 'rxjs/Rx';
//import { Http, RequestOptions } from '@angular/http';

import { HttpClient, HttpHeaders } from '@angular/common/http';
//import { HomePage } from '../pages/home/home';
//import { HTTP } from '@ionic-native/http';
//import { AdMob } from '@admob-plus/ionic';
//import { GooglePlus } from '@ionic-native/google-plus';
import "@codetrix-studio/capacitor-google-auth";
import { Plugins } from '@capacitor/core';

//import { MenuComponent } from '../../components/menu/menu';
import { AdsProvider } from '../../providers/ads/ads';
import { HomePage } from '../home/home';
import { HomePageModule } from '../home/home.module';
import { GoogleAuth,  User } from '@codetrix-studio/capacitor-google-auth';

@Component({
   selector: 'page-login',
   templateUrl: 'login.html',
   styleUrls: ['./login.scss'],
})
export class LoginPage {
   public pageName: string = "Login";
   private isOnInitCalled: boolean = false;
   public database_misc: any;//: SQLiteObject;
   public database_acrostics: any;//: SQLiteObject;
   loginPage: any;
   progressLoader: any;
   button_login_color: string = "#bf95ef";
   button_logout_color: string = "rgb(232, 184, 175)";
   button_logout_google_color: string = "rgb(219, 158, 148)";

   home: any;
   myShared: any;
   which_db: any;
   table_sqls_array: any;
   httpJson: any;
   countTables!: number;

   callback: any;
   table_index!: number;
   table_count!: number;
   params: any;

   background_color: any;
   button_color!: string;
   button_gradient!: string;
   isAdBannerRemoved!: boolean;
   oldToken: any;
   isUploadedOldToken!: boolean;
   isUploadedRefreshedToken!: boolean;

   //private databaseReady: BehaviorSubject<boolean>;
   //private admob: AdMob
   //private googlePlus: GooglePlus
   //private splashScreen: SplashScreen
   //private nativeHttp: HTTP
   //private sqlite: SQLite
   //public menu: MenuComponent, 
   //private http: HttpClient, 
   constructor(public nav: NavController, public platform: Platform, private alertCtrl: AlertController, public toastCtrl: ToastController, public storage: Storage, public progress: LoadingController, public ngZone: NgZone, public helpers: Helpers, private detector: ChangeDetectorRef, private ads: AdsProvider) {
      console.log("LoginPage constructor called");
      this.loginPage = {};
      this.loginPage.button_color = Helpers.button_colors[0].value;
      this.platform.ready().then(() => {
         //this.nativeHttp.setDataSerializer('json');
      });
   }

   async ngOnInit() {
      console.log("LoginPage ngOnInit called");
      Helpers.currentPageName = this.pageName;
      await this.storage.create();
      this.isAdBannerRemoved = false;
      console.log("LoginPage ngOnInit called this.loginPage.button_color = " + JSON.stringify(this.loginPage.button_color));
      this.loginPage.isClickedAds = true;
      this.loginPage.googleUser = null;
      this.loginPage.isMustGuestLoginGoogle = true;
      //---------SET TO TRUE FOR TESTING DB  CHANGES: -----------------------
      this.loginPage.isResetDB = false;
      //--------------------------------------------------------------------
      this.loginPage.logged_in = false;
      this.loginPage.username = null;
      this.loginPage.password = null;
      this.loginPage.isNewUser = false;
      this.loginPage.isForgotPassword = false;
      this.loginPage.isForgotUsername = false;
      this.loginPage.loginStatus = "";
      this.loginPage.reentered_password = "";
      this.loginPage.newUserEmail = "";
      this.loginPage.isProductVerified = false;
      this.database_misc = this.helpers.getDatabaseMisc();
      this.finishInit()
   }

   finishInit() {
      console.log("Login finishInit called");
      this.storage.get("IS_LOGGED_IN").then((isLoggedIn: any) => {
         console.log("Login finishInit GOT IS_LOGGED_IN = " + isLoggedIn);
         this.loginPage.logged_in = isLoggedIn;
         this.setUsername().then(() => {
            this.storage.get('BUTTON_COLOR').then((val: any) => {
               console.log('BUTTON_COLOR=' + val);
               if (val != null) {
                  var buttonColor = JSON.parse(val);
                  this.button_color = buttonColor.value;
                  this.button_gradient = buttonColor.gradient;
                  Helpers.button_color = buttonColor.value;
                  Helpers.button_gradient = buttonColor.gradient;
               } else {
                  Helpers.button_color = Helpers.button_colors[0].value;
                  Helpers.button_gradient = Helpers.button_colors[0].gradient;
               }
               console.log("this.loginPage.color = " + JSON.stringify(this.loginPage.color));
               this.storage.get('BACKGROUND_COLOR').then((val: any) => {
                  if (val != null) {
                     Helpers.background_color = val;
                     this.background_color = val;
                  } else {
                     this.storage.set('BACKGROUND_COLOR', Helpers.background_color).then(() => {
                        this.background_color = Helpers.background_color;
                     });
                  }
                  console.log("Login, this.background_color = " + this.background_color);
                  this.loginPage.isWorkOffline = false;
                  this.storage.get("IS_WORK_OFFLINE").then((val: any) => {
                     console.log("FINISHED GET IS_WORK_OFFLINE! val = " + val);
                     if (val != null) {
                        console.log("SET this.loginPage.isWorkOffline = " + this.loginPage.isWorkOffline);
                        this.loginPage.isWorkOffline = Helpers.isWorkOffline;
                        this.detector.detectChanges();
                     }
                     //this.helpers.isClickedAds().then((isClickedAds) => {
                     //  this.loginPage.isClickedAds = isClickedAds;
                     //  this.storage.get("ADS_TO_CLICK").then((val) => {
                     //     console.log("FINISHED ADS_TO_CLICK!");
                     //     if (val != null) {
                     //        Helpers.ADS_TO_CLICK = val;
                     //     }
                     //     console.log("Helpers.ADS_TO_CLICK = " + Helpers.ADS_TO_CLICK);
                     //     console.log("Helpers.TRIAL_PERIOD_DAYS = " + Helpers.TRIAL_PERIOD_DAYS);
                     //     this.loginPage.adsToClick = Helpers.ADS_TO_CLICK;
                     //     console.log("SET this.loginPage.adsToClick = " + this.loginPage.adsToClick);
                     //  });
                     //});

                     this.loginPage.subscribedOnlineEvent = this.helpers.onlineEvent.subscribe(() => {
                        console.log("onlineEvent HAPPENEED this.loginPage.isWorkOffline = " + this.loginPage.isWorkOffline);
                        this.loginPage.isWorkOffline = false;
                     });

                     this.loginPage.subscribedOnlineEvent = this.helpers.offlineEvent.subscribe(() => {
                        console.log("offlineEvent HAPPENEED this.loginPage.isWorkOffline = " + this.loginPage.isWorkOffline);
                        this.loginPage.isWorkOffline = true;
                     });




                     //this.loginPage.subscribedOnlineEvent = this.helpers.onlineEvent.subscribe({                    {
                     //   next: (isOnline: boolean) => {
                     //      this.loginPage.isWorkOffline = isOnline;
                     //   }
                     //});
                     //this.loginPage.subscribedOfflineEvent = this.helpers.offlineEvent.subscribe(() => {
                     //   this.loginPage.isWorkOffline = true;
                     //});
                  });
               });
            });
         });
      });
   }


   setUsername(): Promise<boolean> {
      console.log("setUsername called.");
      return new Promise((resolve, reject) => {
         if (this.loginPage.logged_in === true) {
            this.storage.get("DEVICE").then((device: any) => {
               if (device != null) {
                  console.log("GOT STORAGE DEVICE = " + JSON.stringify(device));
                  Helpers.device = JSON.parse(device);
               }
               this.storage.get("USER").then((user: any) => {
                  if (user != null) {
                     Helpers.User = JSON.parse(user);
                     this.loginPage.user = user;
                     this.loginPage.username = user.Username;
                     resolve(true);
                  } else {
                     resolve(false);
                  }
               });
            });
         } else {
            console.log("setUsername resolving NOT LOGGED IN.");
            resolve(false);
         }
      });
   }

   ngAfterViewInit() {//FIRED IF PAGE NOT CACHED: ONLY ONCE:
      console.log('LoginPage ngAfterViewInit called');
      //this.databaseReady = new BehaviorSubject(false);
      this.platform.ready().then(() => {
         console.log("LoginPage ionViewDidLoad platform.ready called");
         //this.launchBannnerAd().then(() => {
         //CHECK IF USER ALLOWED TO USE APP:
         //TO DO: 1)logout, 2)inform must pay popup, 3)do in app purchase...
         //if (Helpers.isUserAllowedUsedApp === false) {
         //SHOW POPUP...
         //   this.showTrialExpired();
         //} else {
         console.log("Helpers.isAppInitiated = " + Helpers.isAppInitiated);
         if (Helpers.isAppInitiated === false) {
            this.storage.get("AUTO SYNC").then((val: any) => {
               if (val == null) {
                  this.storage.set("AUTO SYNC", false);
               }
               this.resetDatabase().then(() => {
                  this.storage.get('CAN_WORK_OFFLINE').then((val: any) => {
                     if (val != null) {
                        Helpers.canWorkOffline = val;
                     }
                     console.log("CAN_WORK_OFFLINE=" + Helpers.canWorkOffline);
                     //IF DATABASE ALREADY FILLED ---------------------------------------------------------->
                     if (Helpers.canWorkOffline === true) {
                        //this.databaseReady.next(true);
                        this.helpers.setProgress("Loading database ,please wait...", false).then(async () => {
                           console.log("SET PRAGMA KEYS ON!!!");
                           await this.helpers.setDatabaseMisc();
                           console.log("CREATED MISC DB!!!");
                           //if (this.helpers.isApp()) {
                           await this.helpers.setDatabaseAcrostics();
                           console.log("CREATED ACROSTICS DB!!!");
                           this.helpers.dismissProgress();
                           this.finishIonViewDidLoad();
                        });
                     } else {//IF Helpers.isWorkOffline===false
                        this.finishIonViewDidLoad();
                     }
                  });//END GET IF CAN_WORK_OFFLINE
               });// DEBUG: SETS DATABASE TO FALSE TO IMPORT IT EVERY TIME...
            });
         } else {//IF APP ALREADY INITIALIZED, JUST GO BACK TO LOGIN SCREEN(MAY WANT TO LOGOUT...)
            this.finishIonViewDidLoad();
         }
         //}//END IS STILL ALLOWED..
      });//END platform ready..
      //});
   }

   finishIonViewDidLoad() {
      console.log("finishIonViewDidLoad called");
      if (Helpers.canWorkOffline === true) {
         this.helpers.enableForeignKeys().then(() => {
            this.doFinishIonViewDidLoad();
         }, (error: any) => {
            console.log("ERROR SETTING PRAGMA KEYS ON: " + JSON.stringify(error));
            this.doFinishIonViewDidLoad();
         });
      }
   }

   doFinishIonViewDidLoad() {
      var self = this;
      this.storage.get("IS_LOGGED_IN").then((isLoggedIn: any) => {
         this.loginPage.logged_in = isLoggedIn;
         if (this.loginPage.logged_in === true) {
            this.setUsername().then((res) => {
               if (res) {
                  this.loginPage.loginStatus = "Welcome " + Helpers.User.Username + ".";
                  Helpers.setLoginStatus(true);
                  if (Helpers.isAppInitiated === false) {
                     Helpers.isAppInitiated = true;
                     //Helpers.isUserAllowedUsedApp = true;
                     this.goHome();
                  }
               }
            });
         } else {
            this.loginPage.loginStatus = "Logged out.";
            this.loginInit();
         }
      });

   }

   //loginInit: ONLY SETS IF GUEST/USERS MUST LOGIN WITH GOOGLE
   loginInit() {
      console.log("loginInit called");
      this.loginPage.isMustGuestLoginGoogle = true;
      this.loginPage.isLoggedInGoogle = true;//TRUE: ENABLE LOGIN WITH GOOGLE
      this.helpers.setProgress("Logging in...", false).then(() => {
         if (Helpers.isWorkOffline === false) {
            this.loginGoogleSilent().then((googleUser) => {
               this.loginPage.googleUser = googleUser;
               console.log("loginGoogleSilent resolved, this.loginPage.googleUser = " + JSON.stringify(this.loginPage.googleUser));
               var url = "/lfq_directory/php/login_init.php";
               this.helpers.makeHttpRequest(url, "POST", {}).then((data: any) => {
                  //console.log("login_get_guest.php returned, res=" + JSON.stringify(data));
                  this.loginPage.sessionDevices = data["DEVICES"];
                  this.helpers.dismissProgress();
                  if (data["SUCCESS"] === true) {
                     this.finishLoginInit();
                  } else {
                     this.loginPage.isLoggedInGoogle = false;
                     this.helpers.alertLfqError(data["ERROR"]);
                  }
               }, (error: any) => {
                  this.helpers.dismissProgress();
                  this.helpers.alertServerError(error.message);
               });
            });
         } else {
            var sql = "SELECT a.Device_Number,a.GOOGLE_ID,ud.Username FROM " + Helpers.TABLES_MISC.sync_device_table + " AS a ";
            sql += "INNER JOIN " + Helpers.TABLES_MISC.userdata + " AS ud ON ud.ID=a.User_ID ";
            sql += "WHERE a.Device_Number='" + Helpers.device.Device_Number + "'";
            this.helpers.query(Helpers.database_misc, sql, 'query', []).then((data: any) => {
               this.helpers.dismissProgress();
               this.loginPage.sessionDevices = [];
               for (var i = 0; i < data.values.length; i++) {
                  this.loginPage.sessionDevices.push({ "Device_Number": data["Device_Number"], "GOOGLE_ID": data["GOOGLE_ID"], "Username": data["Username"] });
               }
               this.finishLoginInit();
            }, (error: any) => {
               this.helpers.dismissProgress();
               this.loginPage.isLoggedInGoogle = false;
               this.helpers.alertLfqError(error.message);
            });
         }
      });
   }

   loginGoogleSilent(): Promise<any> {
      console.log("loginGoogleSilent called");
      return new Promise((resolve, reject) => {
         //if (this.helpers.isApp() === false) {
         //   resolve(null);
         //} else {
         //this.helpers.checkIsGooglePlayServicesAllowed().then(isGoogleAllowed => {
         //if (isGoogleAllowed === true) {
         //this.googlePlus.trySilentLogin().then((googleUser:any) => {
         var googleUser: any;
         resolve(googleUser);
         //});
         //} else {
         //   resolve(null);
         //}
         //});
         //}
      });
   }

   finishLoginInit() {
      console.log("finishLoginInit called");
      if (this.loginPage.sessionDevices == null || this.loginPage.sessionDevices.length === 0) {
         this.loginPage.isLoggedInGoogle = false;
      } else {
         for (var d = 0; d < this.loginPage.sessionDevices.length; d++) {
            if (this.loginPage.sessionDevices[d].Username === "GUEST") {
               this.loginPage.isMustGuestLoginGoogle = false;
            }
            if (!this.loginPage.sessionDevices[d].GOOGLE_ID) {
               this.loginPage.isLoggedInGoogle = false;
            }
         }
      }
   }

   ionViewWillLeave() {
      //if (this.isAdBannerRemoved === false) {
      //  this.isAdBannerRemoved = true;
      //this.admob.banner.remove();
      //}
   }

   ngOnDestroy() {
      //if (this.isAdBannerRemoved === false) {
      //  this.isAdBannerRemoved = true;
      //this.admob.banner.remove().then(()=>{
      //this.pushObject.unregister();
      //});
      //} else {
      //this.pushObject.unregister();
      //}
      this.loginPage.subscribedOnlineEvent.unsubscribe();
      this.loginPage.subscribedOfflineEvent.unsubscribe();
   }


   resetDatabase(): Promise<void> {
      return new Promise((resolve, reject) => {
         if (this.loginPage.isResetDB === false) {
            resolve();
         } else {
            this.storage.set('CAN_WORK_OFFLINE', false).then(() => {
               resolve();
            });
         }
      });
   }

   setPasswordMethod(method: any) {
      console.log("setResetPasswordMethod called, method=" + method);
      if (method === "FORGOT_USERNAME") {
         this.loginPage.isForgotUsername = true;
         this.loginPage.isForgotPassword = false;
      } else {
         this.loginPage.isForgotUsername = false;
         this.loginPage.isForgotPassword = true;
      }
      this.loginPage.resetPasswordMethod = method;
      this.loginPage.resetPasswordMethod = "BY_SMS";
   }

   getForgotLogin() {
      console.log("getForgotLogin called");
      var params = null;
      if (this.loginPage.resetPasswordMethod === "BY_SMS") {
         var phoneAlert = this.helpers.isValidPhone(String(this.loginPage.phone).trim());
         if (phoneAlert != null) {
            this.helpers.myAlert("Alert", "<b>" + phoneAlert + "</b>", "", "Dismiss");
            return;
         }
         var phone = this.loginPage.phone.replace(/\D/g, "");
         params = {
            field: phone,
            column: "Phone",
            isResetPassword: this.loginPage.isForgotPassword
         }
      } else if (this.loginPage.isForgotUsername === true && this.loginPage.resetPasswordMethod === "BY_EMAIL") {
         var emailAlert = this.helpers.isValidEmail(this.loginPage.email);
         if (emailAlert != null) {
            this.helpers.myAlert("Alert", "<b>" + emailAlert + "</b>", "", "Dismiss");
            return;
         }
         params = {
            field: String(this.loginPage.email).trim(),
            column: "Email",
            isResetPassword: false
         }
      } else if (this.loginPage.isForgotPassword === true && this.loginPage.resetPasswordMethod === "BY_EMAIL") {
         if (!this.loginPage.forgotUsername || String(this.loginPage.forgotUsername).trim() === '') {
            this.helpers.myAlert("Alert", "<b>Please enter your username.</b>", "", "Dismiss");
            return;
         }
         params = {
            field: String(this.loginPage.forgotUsername).trim(),
            column: "Username",
            isResetPassword: true
         }
      }
      this.getForgotUserInfo(params).then((data) => {
         if (data["SUCCESS"] === true) {
            var hash = this.loginPage.isForgotPassword === true ? data["Hash"] : null;
            this.sendForgotLogin(data["Username"], data["Email"], hash);
         } else {//END data.values.length>0
            this.helpers.dismissProgress();
            this.helpers.myAlert("Alert", "<b>" + data["ERROR"] + "</b>", "", "Dismiss");
         }
      }, error => {
         this.helpers.dismissProgress();
         this.helpers.alertLfqError("Sorry, error getting user info:" + error.message);
      });
   }

   getForgotUserInfo(params: any): Promise<any> {
      return new Promise((resolve, reject) => {
         this.helpers.setProgress("Getting user data ,please wait...", false).then(() => {
            var url = "/lfq_directory/php/get_forgot_user_info.php";
            this.helpers.makeBrowserHttpRequest(url, "POST", params).then((data: any) => {
               resolve(data);
            }, (error: any) => {
               reject(error);
            });
         });
      });
   }

   sendForgotLogin(username: any, email: any, hash: any) {
      // --------------------------------------------------------------
      var subject = "";
      var message = "";
      var progressText = "";
      //GET MESSAGE: --------------------------------------------
      if (this.loginPage.isForgotUsername === true) {
         subject = "RE: LFQ username";
         message = "Your username is " + username;
         progressText = "username";
      } else if (this.loginPage.isForgotPassword === true) {
         subject = "RE: LFQ password";
         message = 'Click <a href="https://learnfactsquick.com/#/password_reset/' + hash + '">here</a> to reset your password';
         progressText = "password reset link";
      }
      if (this.loginPage.resetPasswordMethod === "BY_EMAIL") {
         var url = "/lfq_app_php/email.php";
         var params = {
            username: username,
            subject: subject,
            message: message
         }
         this.helpers.setProgress("Emailing your " + progressText + " to " + email, true).then(() => {
            this.helpers.makeHttpRequest(url, "POST", params).then((data: any) => {
               console.log("email.php returned, res=" + JSON.stringify(data));
               this.helpers.dismissProgress();
               if (data["SUCCESS"] === true) {
                  this.helpers.myAlert("SUCCESS", "", "Emailed your " + progressText + " to " + email, "OK");
               } else {
                  this.helpers.alertLfqError(data["ERROR"]);
               }
            }, (error: any) => {
               this.helpers.dismissProgress();
               this.helpers.alertServerError("Error sending forgot login: " + error.message);
            });
         });
      }
      else if (this.loginPage.resetPasswordMethod === "BY_SMS") {
         var phone = String(this.loginPage.phone).replace(/\D/g, '');
         var options = {
            replaceLineBreaks: true//true to replace \n by a new line, false by default
         };
         console.log("CALLING this.sms.send(" + phone + "," + message + "," + JSON.stringify(options));
         this.helpers.makeHttpRequest("/lfq_app_php/send_sms.php", "POST", { PHONE: phone, MESSAGE: message }).then((data: any) => {
            this.helpers.dismissProgress();
            if (data && data.result === "SUCCESS") {
               this.helpers.myAlert("Alert", "<b>Successfully sent " + progressText + ".</b>", "", "Dismiss");
            } else {
               this.helpers.myAlert("Alert", "<b>Failed to send " + progressText + ".</b>", "", "Dismiss");
            }
         }, (error: any) => {
            this.helpers.dismissProgress();
            this.helpers.alertServerError("Error sending forgot login: " + error.message);
         });
      }//END IF METHOD=BY_SMS
   }

   clickNewUser() {
      console.log("clickNewUser called");
      this.loginPage.username = "";
      this.loginPage.user_id = "";
      this.loginPage.password = "";
      this.loginPage.confirmPassword = "";
      this.loginPage.newUserEmail = "";
   }

   login(isLoginWithGoogle: boolean) {
      console.log("login called., this.loginPage.isNewUser=" + this.loginPage.isNewUser + ", this.loginPage.username=" + this.loginPage.username + ", this.loginPage.password=" + this.loginPage.password);
      console.log("login Helpers.isWorkOffline = " + Helpers.isWorkOffline);
      if (Helpers.isWorkOffline === false) {//IF DATABASE NOT FILLED ---------------------------------------------------------->
         console.log("DATABASE NOT FILLED");
         var checkLoginUser = true;
         if (!isLoginWithGoogle) {
            checkLoginUser = this.checkLoginUser(this.loginPage.username, this.loginPage.password);
         }
         console.log("checkLoginUser = " + checkLoginUser + ", isLoginWithGoogle = " + isLoginWithGoogle);
         //LOGIN ONLINE, THEN FILL DATABASE....:
         //CHECK IF USER CAN USE APP FIRST, OR INSERT NEW ROW(BACKEND) INTO 
         if ((isLoginWithGoogle === true && this.loginPage.isNewUser === false) || (isLoginWithGoogle === false && this.loginPage.isNewUser === false && checkLoginUser === true) || (this.loginPage.isNewUser === true && this.checkNewUserInput() === true)) {
            var url = "/lfq_app_php/login.php";
            console.log("HASHING PASSWORD!!!");
            var googleID = (this.loginPage.googleUser) ? this.loginPage.googleUser.userId : null;
            var googleIDHashed = (googleID) ? this.helpers.hash(googleID) : null;
            var passwordHashed = (isLoginWithGoogle === false || this.loginPage.username === "GUEST") ? this.helpers.hash(this.loginPage.password) : null;
            var phone = this.loginPage.newUserPhone == null ? null : String(this.loginPage.newUserPhone).replace(/\D/g, '');
            console.log("CALLING login.php, DEVICE = " + JSON.stringify(Helpers.device));
            var params = {
               "DEVICE_NUMBER": Helpers.device.Device_Number,
               "USERNAME": this.loginPage.username,
               "PASSWORD": passwordHashed,
               "EMAIL": this.loginPage.newUserEmail,
               "PHONE": phone,
               "GOOGLE_ID": googleIDHashed,
               "GOOGLE_EMAIL": (this.loginPage.googleUser) ? this.loginPage.googleUser.email : null,
               "IS_LOGIN_WITH_GOOGLE": isLoginWithGoogle,
               "IS_NEW_USER": this.loginPage.isNewUser
            }
            this.helpers.setProgress("Logging in...", false).then(() => {
               this.helpers.makeHttpRequest(url, "POST", params).then((data: any) => {
                  console.log("login.php returned, res=" + JSON.stringify(data));
                  if (data["SUCCESS"] === true) {
                     //Helpers.TRIAL_PERIOD_DAYS = data["TRIAL_PERIOD_DAYS"];
                     //this.storage.set("TRIAL_PERIOD_DAYS", Helpers.TRIAL_PERIOD_DAYS).then(() => {
                     //Helpers.MIN_AD_CLICKS = data["MIN_AD_CLICKS"];
                     //this.storage.set("MIN_AD_CLICKS", Helpers.MIN_AD_CLICKS).then(() => {
                     Helpers.databaseSize = data["DATABASE_SIZE"];
                     this.storage.set("DATABASE_SIZE", Helpers.databaseSize).then(() => {
                        if (this.loginPage.isNewUser === false) {
                           this.helpers.dismissProgress();
                           this.handleLoginResult(data, false);
                        } else {//FOR NEW USER:
                           this.helpers.dismissProgress();
                           if (data["IS_FOUND_OLD_USER"] === true) {
                              this.checkNewUserAlreadyExists(data["USERNAME_ALREADY"], data["PASSWORD_ALREADY"]);
                           } else {
                              this.handleLoginResult(data, true);
                           }
                        }
                        //});
                        //});
                     });
                  } else {//BACKEND SCRIPT ERROR:   
                     this.helpers.dismissProgress();
                     this.helpers.alertLfqError(data["ERROR"]);
                  }
               }, (error: any) => {
                  this.helpers.alertServerError("Sorry. Error logging in: " + error.message);
                  this.helpers.dismissProgress();
               });
            });
         }
      } else {//IF OFFLINE
         if (this.loginPage.isNewUser === false) {
            var isValidated = true;
            if (isLoginWithGoogle === false) {
               var validateLoginResult = this.checkLoginUser(this.loginPage.username, this.loginPage.password)
               if (validateLoginResult !== true) {
                  isValidated = false;
                  this.handleLoginResult(validateLoginResult, false);
               }
            }
            if (isValidated === true) {
               this.helpers.setProgress("Logging in ,please wait...", false).then(() => {
                  var returnData = { "USER": null, "IS_LOGGED_IN": false, "IS_ALLOWED": true };
                  var sql_string = "";
                  if (isLoginWithGoogle === true && this.loginPage.username !== 'GUEST') {
                     console.log("googleUser = " + JSON.stringify(this.loginPage.googleUser));
                     sql_string = "SELECT * FROM " + Helpers.TABLES_MISC.userdata + " WHERE GOOGLE_ID='" + this.loginPage.googleUser.userId + "' AND Username!='GUEST'";
                  } else {
                     var passwordHashed = this.helpers.hash(this.loginPage.password);
                     sql_string = "SELECT * FROM " + Helpers.TABLES_MISC.userdata + " WHERE Username='" + this.loginPage.username + "' AND Password='" + passwordHashed + "' LIMIT 1"
                     console.log("CAN I NOT LOGIN IN ARGGG?? sql_string=" + sql_string);
                  }
                  this.helpers.query(Helpers.database_misc, sql_string, 'query', []).then((data: any) => {
                     //data["IS_LOGGED_IN"], data["USER"], data["IS_ALLOWED"]);
                     console.log("RETURNED FROM LOGIN SQL, data.values.length=" + data.values.length);

                     if (data.values.length > 0) {
                        Helpers.logged_in = true;
                        Helpers.User = data.values[0];
                        this.helpers.setDevice(false).then(() => {
                           delete Helpers.User.Password;
                           returnData["USER"] = Helpers.User;
                           returnData["IS_LOGGED_IN"] = true;
                           //this.helpers.getPaidAllowed(this.loginPage.isNewUser).then((paidAllowed) => {
                           //returnData["IS_PAID"] = paidAllowed["IS_PAID"];
                           //returnData["IS_ALLOWED"] = paidAllowed["IS_ALLOWED"];
                           //if (paidAllowed["IS_NEW"] === true) {
                           //INSERT INTO sync_device_table:----------------------------------------------------->
                           //var cols = ["DATE_INSTALLED", "IS_PAID", "Sync_Time", "Device_Number", "User_ID", "GOOGLE_ID"];
                           //var vals = [this.helpers.getCurrentTimestamp(), '0', this.helpers.getCurrentTimestamp(), Helpers.device.Device_Number, Helpers.User.ID, this.loginPage.googleUser.id];
                           //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                           //var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.sync_device_table, Op_Type_ID.INSERT, cols, vals, null)];
                           //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
                           //this.helpers.autoSync(queries, Op_Type_ID.INSERT, null, null, null, null).then((res) => {
                           //   this.helpers.dismissProgress();
                           //   this.handleLoginResult(returnData, false);
                           //});
                           //} else {
                           this.helpers.dismissProgress();
                           this.handleLoginResult(returnData, false);
                           //}
                           //});
                        });
                     } else {
                        Helpers.logged_in = false;
                        this.helpers.dismissProgress();
                        this.helpers.myAlert("ALERT", "<b>Wrong username/password. Please try again.</b>", "", "Dismiss");
                        this.handleLoginResult(returnData, false);
                     }
                  });
               });
            }
         } else {//CREATE NEW USER:
            if (this.checkNewUserInput() === true) {
               //----------------------------------------------------------------------
               var returnData = { "IS_LOGGED_IN": false, "USER": null, "IS_PAID": false, "IS_ALLOWED": true };
               this.helpers.setProgress("Creating new user ,please wait...", false).then(() => {
                  //this.helpers.getPaidAllowed(this.loginPage.isNewUser).then((paidAllowed) => {
                  //UPDATE sync_device_table:
                  //returnData["IS_PAID"] = paidAllowed["IS_PAID"];
                  //returnData["IS_ALLOWED"] = paidAllowed["IS_ALLOWED"];
                  //if (paidAllowed["IS_ALLOWED"] === false) {
                  //   this.handleLoginResult(returnData, false);
                  //} else {
                  //LOGIN NEW USER:
                  var passwordHashed = this.helpers.hash(this.loginPage.password);
                  var sql = "SELECT * FROM " + Helpers.TABLES_MISC.userdata + " WHERE Username='" + this.loginPage.username + "' OR Password='" + passwordHashed + "' LIMIT 1";
                  this.helpers.query(this.database_misc, sql, 'query', []).then((data: any) => {
                     console.log("BACK FROM SEE IF USERNAME, PASSWORD ALREADY EXSITS, data.values.length=" + data.values.length);
                     if (data.values.length > 0) {
                        this.helpers.dismissProgress();
                        this.checkNewUserAlreadyExists(data.values[0].Username, data.values[0].Password);
                     } else {
                        var cols = ["Username", "Password", "Email", "DATE_INSTALLED", "IS_PAID", "GOOGLE_ID"];
                        var vals = [this.loginPage.username, passwordHashed, this.loginPage.newUserEmail, this.helpers.getMysqlTime(), '0', this.loginPage.googleUser.userId];
                        //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                        var queries = [new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.userdata, Op_Type_ID.INSERT, cols, vals, {})];
                        //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
                        this.helpers.autoSync(queries, Op_Type_ID.INSERT, null, null, null, null).then((res: any) => {
                           //GET BACK USER CREATED:
                           if (res.isSuccess === true) {
                              var sql = "SELECT * FROM " + Helpers.TABLES_MISC.userdata + " WHERE Username='" + this.loginPage.username + "' and Password='" + passwordHashed + "' LIMIT 1";
                              this.helpers.query(this.database_misc, sql, 'query', []).then((data: any) => {
                                 returnData["USER"] = data.values[0];
                                 Helpers.User = data.values[0];
                                 this.helpers.setDevice(false).then(() => {
                                    //INSERT INTO sync_device_table:----------------------------------------------------->
                                    var colsSync = ["DATE_INSTALLED", "Sync_Time", "Device_Number", "User_ID", "GOOGLE_ID"];
                                    var valsSync = [this.helpers.getCurrentTimestamp(), this.helpers.getCurrentTimestamp(), Helpers.device.Device_Number, Helpers.User.ID, this.loginPage.googleUser.userId];
                                    var wheresSDT = { "Device_Number": Helpers.device.Device_Number, "User_ID": Helpers.User.ID };
                                    var colsReviews = ["User_ID", "Time1", "Time2", "Time3", "Time4", "Time5", "Time6", "Time7"];
                                    var valsReviews = ["ID", "0", "1", "5", "20", "50", "100", "180"];
                                    var colsPeglists = ["User_ID", "Number", "Entry"];
                                    var colsCelebrity = ["User_ID", "Number", "First_Name", "Last_Name", "Action1", "Action2", "Information"];
                                    //SyncQuery(IS_APP,User_ID_Old,DB_Type_ID,Table_name,Act_Type_ID,Cols,Vals,Wheres)
                                    var queries = [
                                       new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.sync_device_table, Op_Type_ID.INSERT, colsSync, [valsSync], wheresSDT),
                                       new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.user_review_time, Op_Type_ID.INSERT, colsReviews, valsReviews, null),
                                       new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.peglist, Op_Type_ID.INSERT_SELECT, colsPeglists, colsPeglists, { "ID": 1, "Insert_Table": Helpers.TABLES_MISC.peglist, "From_Table": Helpers.TABLES_MISC.peglist }),
                                       new SyncQuery(null, null, DB_Type_ID.DB_MISC, Helpers.TABLES_MISC.celebrity_number, Op_Type_ID.INSERT_SELECT, colsCelebrity, valsReviews, { "ID": 1, "Insert_Table": Helpers.TABLES_MISC.celebrity_number, "From_Table": Helpers.TABLES_MISC.celebrity_number })
                                    ];
                                    //autoSync(queries, opTypeId, userIdOld, names, entryOld, entry, image)
                                    this.helpers.autoSync(queries, Op_Type_ID.INSERT, null, null, null, null).then((res: any) => {
                                       this.helpers.dismissProgress();
                                       if (res.isSuccess === true) {
                                          returnData["IS_LOGGED_IN"] = true;
                                          this.handleLoginResult(returnData, true);
                                       } else {
                                          console.log("ERROR:" + res.results);
                                          this.loginPage.loginStatus = "Sorry. Error creating user tables: " + res.results;
                                          this.helpers.dismissProgress();
                                       }
                                    });
                                 });
                              }).catch((error: any) => {
                                 console.log("ERROR:" + error.message);
                                 this.loginPage.loginStatus = "Sorry. Getting new user error:" + error.message;
                                 this.helpers.dismissProgress();
                              });
                           } else {
                              console.log("ERROR:" + res.results);
                              this.loginPage.loginStatus = "Sorry. Error creating new user:" + res.results;
                              this.helpers.dismissProgress();
                           }
                        });
                     }
                  }).catch((error: any) => {
                     console.log("ERROR:" + error.message);
                     this.loginPage.loginStatus = "Sorry. retieving old user error:" + error.message;
                     this.helpers.dismissProgress();
                  });
                  //}
                  //});
               });//END PROGRESS.
            }//END CHECK NEW USER INPUT.
         }
      }
   }//END login()

   public checkLoginUser(username: any, password: any): any {
      if (username == null) {
         this.helpers.myAlert("ALERT", "<b>Please enter username.</b>", "", "Dismiss");
         var results = "MUST ENTER USERNAME.";
         Helpers.logged_in = false;
         return results;
      }
      if (password == null) {
         this.helpers.myAlert("ALERT", "<b>Please enter password.</b>", "", "Dismiss");
         var results = "MUST ENTER PASSWORD.";
         Helpers.logged_in = false;
         return results;
      }
      if (password.length < 4 || username.length < 4) {
         this.helpers.myAlert("ALERT", "<b>Username and Password length must be greater than 3.</b>", "", "Dismiss");
         results = "Username and Password length must be greater than 3.";
         Helpers.logged_in = false;
         return results;
      }
      return true;
   }

   checkNewUserAlreadyExists(username: any, password: any): boolean {
      console.log("checkNewUserAlreadyExists called");
      if (username != null && username === this.loginPage.username) {
         console.log("username=" + username);
         //this.helpers.dismissProgress();         
         this.helpers.myAlert("Alert", "Username: '" + this.loginPage.username + "', already used.", "", "Dismiss");
         return false;
      }
      else if (password != null && password === this.loginPage.password) {
         console.log("password=" + password);
         //this.helpers.dismissProgress();         
         this.helpers.myAlert("Alert", "Password already used.", "", "Dismiss");
         return false;
      } else {
         return true;
      }
   }

   handleLoginResult(data: any, isNewUser: any) {
      console.log("handleLoginResult called , data=" + JSON.stringify(data));
      //data["IS_LOGGED_IN"], data["USER"], data["IS_ALLOWED"]);
      this.loginPage.logged_in = data["IS_LOGGED_IN"];
      var user = data["USER"];
      //var isAllowed = data["IS_ALLOWED"];
      //Helpers.isUserAllowedUsedApp = isAllowed;
      //if (Helpers.isInAppPurchase === false || isAllowed === true || this.loginPage.username === "harryman75") {
      if (this.loginPage.logged_in === true) {
         var usernameHashed = this.helpers.usernameHash(user.Username);
         this.helpers.setEncryptionKey(usernameHashed);
         this.loginPage.loginStatus = user.Username + " logged in.";
         this.storage.set("IS_LOGGED_IN", true);
         this.storage.set("USER", JSON.stringify(user));
         Helpers.User = user;
         console.log("Helpers.User = " + JSON.stringify(Helpers.User));

         //var mnes = [{"ID":"1","Entry_Mnemonic":"DiVaGate"},{"ID":"5","Entry_Mnemonic":"300 aMaSS "},{"ID":"6","Entry_Mnemonic":"RaiLiNg"},{"ID":"7","Entry_Mnemonic":"FaNs"},{"ID":"8","Entry_Mnemonic":"DiPLoPia"},{"ID":"9","Entry_Mnemonic":"DiVaGate"},{"ID":"12","Entry_Mnemonic":"aFFLaTus"},{"ID":"13","Entry_Mnemonic":"DeVoLVement"},{"ID":"14","Entry_Mnemonic":"RewoRKed"},{"ID":"15","Entry_Mnemonic":"iDoLaTress"},{"ID":"16","Entry_Mnemonic":"DiVested"},{"ID":"17","Entry_Mnemonic":"FiChu"},{"ID":"18","Entry_Mnemonic":"DiSeNFrachisement"},{"ID":"19","Entry_Mnemonic":"DeFiBRillation "},{"ID":"20","Entry_Mnemonic":"ReFiTted"},{"ID":"21","Entry_Mnemonic":"RayLeSsly"},{"ID":"22","Entry_Mnemonic":"huGeLy"},{"ID":"23","Entry_Mnemonic":"CLoG"},{"ID":"24","Entry_Mnemonic":"aDMissibility"},{"ID":"25","Entry_Mnemonic":"LayeR"},{"ID":"26","Entry_Mnemonic":"heRNia"},{"ID":"27","Entry_Mnemonic":"MaNuFactured"},{"ID":"28","Entry_Mnemonic":"ReCeDer"},{"ID":"29","Entry_Mnemonic":"RewoRKed"},{"ID":"30","Entry_Mnemonic":"aGeNeSiS"},{"ID":"31","Entry_Mnemonic":"GRuMbled"},{"ID":"35","Entry_Mnemonic":"MaSSeuSe"},{"ID":"36","Entry_Mnemonic":"RaiSed"},{"ID":"37","Entry_Mnemonic":"iNQuiSitive"},{"ID":"38","Entry_Mnemonic":"ToNeLeSs"},{"ID":"39","Entry_Mnemonic":"eMuLouSly"},{"ID":"40","Entry_Mnemonic":"aLoft"},{"ID":"41","Entry_Mnemonic":"auDaCiouS "},{"ID":"42","Entry_Mnemonic":"eaRLy"},{"ID":"43","Entry_Mnemonic":"aMaSs"},{"ID":"44","Entry_Mnemonic":"uNaBLy"},{"ID":"45","Entry_Mnemonic":"FaCed"},{"ID":"46","Entry_Mnemonic":"ouTSide"},{"ID":"47","Entry_Mnemonic":"BaSe"},{"ID":"48","Entry_Mnemonic":"DuaLiSt"},{"ID":"49","Entry_Mnemonic":"aReaL"},{"ID":"50","Entry_Mnemonic":"QuoiN"},{"ID":"51","Entry_Mnemonic":"iNSiStent"},{"ID":"95","Entry_Mnemonic":"QuieSCent"},{"ID":"96","Entry_Mnemonic":"BouNTiFul"},{"ID":"97","Entry_Mnemonic":"CeMeNt"},{"ID":"101","Entry_Mnemonic":"QuieSCent"},{"ID":"102","Entry_Mnemonic":"BouNTiFul"},{"ID":"103","Entry_Mnemonic":"CeMeNt"},{"ID":"109","Entry_Mnemonic":"uNSTiMulated"},{"ID":"110","Entry_Mnemonic":"aRRowheaD"},{"ID":"111","Entry_Mnemonic":"ouTPaCed"},{"ID":"112","Entry_Mnemonic":"CHeaP"},{"ID":"113","Entry_Mnemonic":"NaiF"},{"ID":"114","Entry_Mnemonic":"BaBbler"},{"ID":"117","Entry_Mnemonic":"oPTiMizer"},{"ID":"123","Entry_Mnemonic":"uNReMitting"}];
         //SELECT CONCAT('{"ID":"',ID,'","Entry_Info":"',Entry_Info,'"}') FROM `user_number_entry` WHERE TRIM(Entry_Info)<>'' ORDER BY ID
         //var mnes = [{"ID":"1","Entry_Info":"Erica's I-phone number."},{"ID":"2","Entry_Info":"Erica's I-phone number."},{"ID":"3","Entry_Info":"Erica's I-phone number."},{"ID":"4","Entry_Info":"Erica's I-phone number."},{"ID":"5","Entry_Info":"Eiffel tower's height(300m)."},{"ID":"6","Entry_Info":"Patronas Twin Towers height. In Malaysia. Are the tallest twin towers in the world."},{"ID":"7","Entry_Info":"Colliseum of Rome, year built."},{"ID":"8","Entry_Info":"Sydney Opera House year built."},{"ID":"9","Entry_Info":"Erica's younger brother, Tan YuZhang's phone number."},{"ID":"10","Entry_Info":"Erica's younger brother, Tan YuZhang's phone number."},{"ID":"11","Entry_Info":"Erica's younger brother, Tan YuZhang's phone number."},{"ID":"12","Entry_Info":"Great Wall of China length in km."},{"ID":"13","Entry_Info":"Big Ben year built."},{"ID":"14","Entry_Info":"Parthenon: Year started to be built(BC). A temple on Athenian Acropolis in Greece dedicated to Athena constructed in 447BC at height of power and completed in 438BC. It replaced an earlier Parthenon destroyed by Persian invasion of 480BC. Its aligned to the Hyades. Used as a treasury. In 5thCAD, it was converted to a Christian church dedicated to Mary. Turned into a mosque by Ottoman conquest in early 1460s. On 1687-9-26 an Ottoman amunition dump inside was ignited by Venetians and severely damaged it. In 1806, Thomas Bruce, the Earl of Elgin removed the surviving sculptured and where sold to the UK museum in 1816."},{"ID":"15","Entry_Info":"Statue of Liberty's height in feet."},{"ID":"16","Entry_Info":"Statue of Liberty's date dedicated(1886-10-28). In NYâ€™s harbor on Bedloe Island in front of Manhattan. Designed by Frederic Bartholdi and dedicated 1886-10-28 by Grover Cleveland. Was financed by France and its head and armed sent by crates, but its altar built by the US with some financial trouble. It represents Libertas, the Roman goddess of freedom. She holds a torch in her right hand and a tablet of the law inscribed with the date July 4, 1776. She has a broken chain at her feet. It is 151ft tall."},{"ID":"17","Entry_Info":"Statue of Liberty's date dedicated(1886-10-28). In NYâ€™s harbor on Bedloe Island in front of Manhattan. Designed by Frederic Bartholdi and dedicated 1886-10-28 by Grover Cleveland. Was financed by France and its head and armed sent by crates, but its altar built by the US with some financial trouble. It represents Libertas, the Roman goddess of freedom. She holds a torch in her right hand and a tablet of the law inscribed with the date July 4, 1776. She has a broken chain at her feet. It is 151ft tall."},{"ID":"18","Entry_Info":"Statue of Liberty's date dedicated(1886-10-28). In NYâ€™s harbor on Bedloe Island in front of Manhattan. Designed by Frederic Bartholdi and dedicated 1886-10-28 by Grover Cleveland. Was financed by France and its head and armed sent by crates, but its altar built by the US with some financial trouble. It represents Libertas, the Roman goddess of freedom. She holds a torch in her right hand and a tablet of the law inscribed with the date July 4, 1776. She has a broken chain at her feet. It is 151ft tall."},{"ID":"19","Entry_Info":"Tower Bridge in London. Built in 1894."},{"ID":"20","Entry_Info":"original height(481ft)"},{"ID":"21","Entry_Info":"modern height(450ft)"},{"ID":"22","Entry_Info":"Number of tons weighing(65=6,500,000)"},{"ID":"23","Entry_Info":"Square feet covering(756)"},{"ID":"24","Entry_Info":"Number of acres covering(13) "},{"ID":"25","Entry_Info":"beginning angle of inclination."},{"ID":"26","Entry_Info":"ending angle of inclination."},{"ID":"27","Entry_Info":"Seneferu's 3rd, last and only true pyramid, the Northern Pyramid's, height in feet."},{"ID":"28","Entry_Info":"original height(471ft)"},{"ID":"29","Entry_Info":"height now(447ft)"},{"ID":"30","Entry_Info":"Zoser's Step Pyramid(1st of big pyramids of Egypt). First the number of tiers(6) then it's height(200ft) together as one word."},{"ID":"31","Entry_Info":"Marib Dam, Wadi Phana valley, Yemen collapse year."},{"ID":"35","Entry_Info":"Built in 3000BC"},{"ID":"36","Entry_Info":"40ft high."},{"ID":"37","Entry_Info":"Birs Nimrud ziggurat,built by Nebuchadrezzar with Nabu(god of writing, son of marduk) its deity, It's height was 270ft. Mistaken for tower of Babel. Nebuchadrezar noted it crumbled becuase drainage pipes useless."},{"ID":"38","Entry_Info":"It's year built(1250)"},{"ID":"39","Entry_Info":"its length along each side of its base(350ft)"},{"ID":"40","Entry_Info":"number of levels(5)"},{"ID":"41","Entry_Info":"height(170ft)"},{"ID":"42","Entry_Info":"foundation height(45ft)"},{"ID":"43","Entry_Info":"(30 cubits)"},{"ID":"44","Entry_Info":"it's length of a side of its square base(295X295ft)"},{"ID":"45","Entry_Info":"Tower of Babel's(Etemenanki's) foundation height(45ft)(30 cubits), it's length of a sid eof its square base(295X295ft),its number of levels estimated by Herodotus(8) and its acutal number of levels(7)."},{"ID":"46","Entry_Info":"Circumference of outer wall(10miles)"},{"ID":"47","Entry_Info":"the height of inner city wall(90ft)"},{"ID":"48","Entry_Info":"Nubuchadrezzar's 2nd palace or throne room dimensions(150X45ft)"},{"ID":"49","Entry_Info":"Nubuchadrezzar's 2nd palace or throne room dimensions(150X45ft)"},{"ID":"50","Entry_Info":"The width of the processional route leading to Marduk's temple(72ft)."},{"ID":"51","Entry_Info":"Aqarduf ziggurat's present height(200ft)."},{"ID":"95","Entry_Info":"Nataie's Phone Number"},{"ID":"96","Entry_Info":"Nataie's Phone Number"},{"ID":"97","Entry_Info":"Nataie's Phone Number"},{"ID":"101","Entry_Info":"Nataie's Phone Number"},{"ID":"102","Entry_Info":"Nataie's Phone Number"},{"ID":"103","Entry_Info":"Nataie's Phone Number"},{"ID":"109","Entry_Info":"year"},{"ID":"110","Entry_Info":"date"},{"ID":"114","Entry_Info":"Lucas Birthday"},{"ID":"117","Entry_Info":"Dad's Birth Day!"},{"ID":"123","Entry_Info":"The number of Earth-days for Venus to spin."}];
         //var mnes = [{"ID":"1","Entry_Mnemonic_Info":"lose clarity or turn aside especially from the main subject of attention or course of argument in writing, thinking, or speaking<br />626 aGiNG <br />071 SKeweD having an oblique or slanting direction or position<br />38 MoVement"},{"ID":"6","Entry_Mnemonic_Info":"a barrier consisting of a horizontal bar and supports, material for making rails or rails collectively"},{"ID":"8","Entry_Mnemonic_Info":"visual impairment in which an object is seen as two objects"},{"ID":"9","Entry_Mnemonic_Info":"lose clarity or turn aside especially from the main subject of attention or course of argument in writing, thinking, or speaking<br />9490 PuRPoSely with intention, in an intentional manner<br />4097 ReSPeCtfully in a respectful manner"},{"ID":"12","Entry_Mnemonic_Info":"a strong creative impulse, divine inspiration"},{"ID":"13","Entry_Mnemonic_Info":"the delegation of authority -especially from a central to a regional government-"},{"ID":"17","Entry_Mnemonic_Info":"a lightweight triangular scarf worn by a woman. 1028 disenfranchisement"},{"ID":"24","Entry_Mnemonic_Info":"acceptability by virtue of being admissible"},{"ID":"25","Entry_Mnemonic_Info":"thin structure composed of a single thickness of cells, a hen that lays eggs, single thickness of usually some homogeneous substance, a relatively thin sheetlike expanse or region lying over or under another, an abstract place usually conceived as having depth, verb make or form a layer"},{"ID":"26","Entry_Mnemonic_Info":"rupture in smooth muscle tissue through which a bodily structure protrudes"},{"ID":"30","Entry_Mnemonic_Info":"imperfect development, nondevelopment of a part"},{"ID":"35","Entry_Mnemonic_Info":"a female massager"},{"ID":"38","Entry_Mnemonic_Info":"lacking in tone or expression"},{"ID":"39","Entry_Mnemonic_Info":"in a competitively imitative manner"},{"ID":"42","Entry_Mnemonic_Info":"at or near the beginning of a period of time or course of events or before the usual or expected time, being or occurring at an early stage of development, of an early stage in the development of a language or literature, very young, belonging to the distant past, expected in the near future, adv. before the usual time or the time expected, in good time, during an early stage"},{"ID":"45","Entry_Mnemonic_Info":"having a face or facing especially of a specified kind or number, often used in combination"},{"ID":"48","Entry_Mnemonic_Info":"an adherent of dualism"},{"ID":"49","Entry_Mnemonic_Info":"of or relating to or involving an area"},{"ID":"50","Entry_Mnemonic_Info":"the keystone of an arch, expandable metal or wooden wedge used by printers to lock up a form within a chase, -architecture- solid exterior angle of a building, especially one formed by a cornerstone"},{"ID":"111","Entry_Mnemonic_Info":"Im slow"},{"ID":"114","Entry_Mnemonic_Info":"Annoyingly repeats himself "},{"ID":"117","Entry_Mnemonic_Info":"He's forever the optimist."},{"ID":"123","Entry_Mnemonic_Info":"Uninterrupted in time and indefinitely long continuing."}];
         var mnes = [{ "ID": "1", "Title": "Aqarduf ziggurat's, present height" }, { "ID": "2", "Title": "Babylon Dimenstions" }, { "ID": "3", "Title": "Big Ben, year built" }, { "ID": "4", "Title": "Birs Nimrud Ziggurat, built by Nebuchadrezzar" }, { "ID": "5", "Title": "Cheops Pyrimad at Giza, heights & weight" }, { "ID": "6", "Title": "Chephren Pyramid at Giza(2nd biggest) dimensions" }, { "ID": "7", "Title": "Colliseum of Rome, year built" }, { "ID": "8", "Title": "Dad's Birthday" }, { "ID": "9", "Title": "Eiffel Tower's height" }, { "ID": "10", "Title": "Erica's I-phone number." }, { "ID": "11", "Title": "Erica's younger brother, Tan YuZhang's phone number." }, { "ID": "12", "Title": "Great Wall of China, length" }, { "ID": "13", "Title": "Keith's Birthday" }, { "ID": "14", "Title": "Leslie's Birhday" }, { "ID": "15", "Title": "Lucas Birthday " }, { "ID": "16", "Title": "Marib Dam, Wadi Phana valley, Yemen, date collapsed" }, { "ID": "17", "Title": "Natalie's Phone Number" }, { "ID": "18", "Title": "Parthenon, a temple on Athenian Acropolis in Greece dedicated to Athena" }, { "ID": "19", "Title": "Patronas Twin Towers. In Malaysia. Are the tallest twin towers in the world." }, { "ID": "20", "Title": "Seneferu's 3rd, last and only true pyramid, the Northern Pyramid" }, { "ID": "21", "Title": "Seneferu's Bent pyramid of Egypt" }, { "ID": "22", "Title": "Statue of Liberty on Bedloe Island of Manhattan Designed by Frederic Bartholdi, date dedicated" }, { "ID": "23", "Title": "Statue of Liberty" }, { "ID": "24", "Title": "Sydney Opera House" }, { "ID": "25", "Title": "Tchoga Zanbil ziggurat close to Elam's capital Susa" }, { "ID": "26", "Title": "Tower Bridge in London" }, { "ID": "27", "Title": "Tower of Babel(Etemenanki) Estimations by Herodotus" }, { "ID": "28", "Title": "White Temple built at Warka in desert border with Uruk or Erech" }, { "ID": "29", "Title": "Zoser's Step Pyramid(1st of big pyramids of Egypt)" }, { "ID": "35", "Title": "Venus, days to spin" }];
         var sqls = [], enc: any = "", entEncs = [], ids = [], isEnc = true, badWord = "";;
         for (var ud = 0; ud < mnes.length; ud++) {
            enc = this.helpers.encryptData(String(mnes[ud].Title));
            entEncs.push(enc);
            ids.push(mnes[ud].ID);
            if (String(mnes[ud].Title) !== this.helpers.decryptData(enc)) {
               badWord = mnes[ud].Title;
               isEnc = false;
               break;
            }
            //entEnc = userDat[ud].Entry;
            //sqls.push("UPDATE " + Helpers.db_prefix + "misc.user_number SET Title='" + this.helpers.mysql_real_escape_string(entEnc) + "' WHERE ID='" + mnes[ud].ID + "';");
         }
         console.log('ENCODED WORDS  = array("' + entEncs.join('", "') + '")');
         console.log('ENCODED WORD IDS  = array("' + ids.join('", "') + '")');
         console.log("ENCODED WORD SUCCESS?:" + isEnc + ", BAD WORD:" + badWord);

         console.log("BEFORE this.helpers.setDevice, Helpers.device = " + JSON.stringify(Helpers.device));
         this.helpers.setDevice(true).then(async () => {
            console.log("handleLoginResult AFTER setDevice Helpers.device = " + JSON.stringify(Helpers.device));
            //Helpers.isAppPaid = data["IS_PAID"];
            //this.storage.set("IS_APP_PAID", data["IS_PAID"]).then(() => {
            //var ownershipMessage = "";
            //console.log("Helpers.isAppPaid = " + Helpers.isAppPaid);
            //if (Helpers.isInAppPurchase === true && Helpers.isAppPaid === false) {
            //   ownershipMessage += '<br />**Note:<br />You do not own this app.';
            //}
            if (this.loginPage.isNewUser === true) {
               var welcome_message = 'Confirm this message to go to home screen.<br />In the home screen you can get started right away or you can click on the `Help Menu` button in lower right corner for further help.<br />Thank You!<br />...And <span style="font-style:italic;color:purple;font-weight:bold;font-family:Courier New">Happy Learning!</span>';
               var isNewUserMessage = isNewUser === true ? "new user, " : "";
               let alert = await this.alertCtrl.create({
                  header: "Welcome " + isNewUserMessage + this.loginPage.username + "!",
                  subHeader: "<b>Welcome To Learn Facts Quick!</b>",
                  message: welcome_message,
                  buttons: ['Continue']
               });
               alert.present();
               alert.onDidDismiss().then(() => {
                  this.goHome();
               });
            } else {
               this.goHome();
            }
            //});
         });
      } else {
         var displayUsername = "";
         if (this.loginPage.username != null) {
            displayUsername = this.loginPage.username;
         }
         this.loginPage.loginStatus = displayUsername + " not found.";
      }
      //} else {
      //   this.showTrialExpired();
      //}
   }

   checkNewUserInput(): boolean {
      console.log("checkNewUserInput called. CREATING NEW USER: username=" + this.loginPage.username + ", password=" + this.loginPage.password + ", confirmPassword=" + this.loginPage.confirmPassword);
      if (this.loginPage.username == null || this.loginPage.username.trim() === '') {
         this.helpers.myAlert("Alert", "<b>Please enter username.</b>", "", "Dismiss");
         return false;
      }
      else if (this.loginPage.password == null || this.loginPage.password.trim() === '') {
         this.helpers.myAlert("Alert", "<b>Please enter password.</b>", "", "Dismiss");
         return false;
      }
      else if (this.loginPage.confirmPassword == null || this.loginPage.confirmPassword.trim() === '') {
         this.helpers.myAlert("Alert", "<b>Please enter re-enter(confirm) password.</b>", "", "Dismiss");
         return false;
      }
      else if (this.loginPage.password.trim() !== this.loginPage.confirmPassword.trim()) {
         this.helpers.myAlert("Alert", "<b>Password and re-entered password don't match.</b>", "", "Dismiss");
         return false;
      }
      else if (this.loginPage.newUserEmail != null) {
         var emailAlert = this.helpers.isValidEmail(String(this.loginPage.newUserEmail).trim());
         if (emailAlert != null) {
            this.helpers.myAlert("Alert", "<b>" + emailAlert + "</b>", "", "Dismiss");
            return false;
         }
      } else if (this.loginPage.newUserPhone != null) {
         var phoneAlert = this.helpers.isValidPhone(String(this.loginPage.newUserPhone).trim());
         if (phoneAlert != null) {
            this.helpers.myAlert("Alert", "<b>" + phoneAlert + "</b>", "", "Dismiss");
            return false;
         }
      }
      return true;
   }

   logout() {
      console.log("logout called.");
      this.loginPage.loginStatus = "LOGGED OUT. Bye.. ";
      if (Helpers.User) {
         this.loginPage.loginStatus += Helpers.User.Username;
      }
      this.helpers.logout().then(() => {
         this.loginPage.logged_in = false;
         this.loginPage.username = "";
         this.loginPage.username = "";
         this.loginPage.password = "";
      });
   }

   /*
   showTrialExpired() {
      console.log("showTrialExpired called");
      var continueResponse = 0;
      let alert = this.alertCtrl.create({
         title: "7 week trial has ended. Do you enjoy using Learn Facts Quick? Please click here to continue..",
         cssClass: "ratePopup",
         buttons: [
            {
               text: 'Cancel',
               cssClass: 'cancelRatePopupButton',
               handler: () => {
                  console.log('Dismiss pay for app called.');
                  continueResponse = 0;
                  return true;
               }
            },
            {
               text: 'Continue',
               cssClass: 'confirmRatePopupButton',
               handler: () => {
                  console.log('Continue use app button clicked');
                  continueResponse = 1;
                  return true;
               }
            }
         ]
      });
      alert.present();
      alert.onDidDismiss(() => {
         console.log("Continue app popup dismissed, rateResponse = " + continueResponse);
         if (continueResponse === 1) {
            //GO TO IN APP PURCHASE->
            this.helpers.purchase();
            //this.saveProductOwnedLfq();
         } else {//IF CLOSED?
            //....
         }
      });
   }
   */

   goHome() {
      console.log("goHome called.");
      if (this.helpers.isApp() && Helpers.User && Helpers.User.Username !== 'harryman75') {
         this.ads.runAds();
      }
      this.nav.navigateForward('home');
   }



   launchBannnerAd(): Promise<void> {
      console.log("launchBannnerAd called");
      return new Promise((resolve, reject) => {
         try {
            var appId = "ca-app-pub-8514966468184377~2676528443";
            var bannerId = "ca-app-pub-8514966468184377/6669410040";
            //const bannerConfig: AdMobFreeBannerConfig = {
            //   isTesting: false, // Remove in production
            //   autoShow: false,
            //   id: bannerId,
            //   size: "LARGE_BANNER"
            //};
            //this.admob.banner.config(bannerConfig);
            //this.admob.banner.prepare().then(() => {
            //   console.log("AD LAUNCED SUCCESSFULLY!!!");
            //   this.admob.banner.show().then(() => {
            //      resolve();
            //   });
            //}).catch(e => {
            //   console.log("ADMOB FREE ERROR: " + e)
            //   resolve();
            //});
         } catch (error: any) {
            console.log("START AD MOB ERROR=" + error.message);
         }
      });
   }

   checkNewEmailFormat() {
      if (String(this.loginPage.newUserEmail).trim() === '') {
         console.log("SETTING this.loginPage.newUserEmail= NULL!");
         this.loginPage.newUserEmail = null;
         this.loginPage.isNewEmailValid = true;
      } else {
         this.loginPage.isNewEmailValid = this.helpers.isValidEmail(this.loginPage.newUserEmail) != null ? false : true;
      }
   }
   checkNewPhoneFormat() {
      this.loginPage.newUserPhone = this.loginPage.newUserPhone.replace(/[a-z]/ig, "");
      if (String(this.loginPage.newUserPhone).trim() === '') {
         this.loginPage.newUserPhone = null;
         this.loginPage.isNewPhoneValid = true;
      } else {
         this.loginPage.isNewPhoneValid = this.helpers.isValidPhone(this.loginPage.newUserPhone) != null ? false : true;
      }
   }
   checkEmailFormat() {
      this.loginPage.isEmailValid = this.helpers.isValidEmail(this.loginPage.email) != null ? false : true;
   }
   checkPhoneFormat() {
      this.loginPage.isPhoneValid = this.helpers.isValidPhone(this.loginPage.phone) != null ? false : true;
   }

   doLogin() {
      console.log("doLogin called");
      this.helpers.logout().then(() => {
         //if (this.loginModal.isNewUser === false) {
         //   this.login(false);
         //} else {
         //this.helpers.checkIsGooglePlayServicesAllowed().then(isGoogleAllowed => {
         //var isDoGoogleLogin = (isGoogleAllowed === true && this.helpers.isApp() === true && this.loginPage.isLoggedInGoogle === false && this.platform.is('android') === true) ? true : false;
         var isDoGoogleLogin = (this.helpers.isApp() === true && this.loginPage.isLoggedInGoogle === false && this.platform.is('android') === true) ? true : false;
         console.log("doLogin isDoGoogleLogin = " + isDoGoogleLogin);
         this.logInWithGoogle(isDoGoogleLogin).then((res) => {
            if (isDoGoogleLogin === true && (res !== true && parseInt(res) !== 10)) {
               if (res !== true) {
                  alert("Please try again to login with Google, error: " + JSON.stringify(res));
               } else {
                  this.login(true);
               }
            } else {
               this.login(false);
            }
         });
         //});
      });
   }

   loginGuest() {
      console.log("loginGuest called");
      //this.helpers.checkIsGooglePlayServicesAllowed().then(isGoogleAllowed => {
      //var isDoGoogleLogin = (isGoogleAllowed === true && this.helpers.isApp() === true && this.loginPage.isMustGuestLoginGoogle === true) ? true : false;
      var isDoGoogleLogin = (this.helpers.isApp() === true && this.loginPage.isMustGuestLoginGoogle === true) ? true : false;
      this.logInWithGoogle(isDoGoogleLogin).then((res) => {
         this.loginPage.isNewUser = false;
         this.loginPage.username = "GUEST";
         this.loginPage.password = "1234567";
         if (isDoGoogleLogin === true && (res !== true && parseInt(res) !== 10)) {
            if (res !== true) {
               alert("Please try again to login with Google, error: " + JSON.stringify(res));
            } else {
               this.login(true);
            }
         } else {
            this.login(false);
         }
      });
      //});
   }

   doLogInWithGoogle() {
      console.log("doLogInWithGoogle called");
      //this.helpers.checkIsGooglePlayServicesAllowed().then(isGoogleAllowed => {
      //  if (isGoogleAllowed === false) {
      //     alert("Google API not supported on your device. Please do regular login.");
      //   } else {
      this.logInWithGoogle(true).then((res) => {
         if (res !== true && parseInt(res) !== 10) {
            alert("Please try again to login with Google, error: " + JSON.stringify(res));
         } else {
            this.loginPage.username = null;
            this.loginPage.isNewUser = false;
            this.login(true);
         }
      });
      //}
      //});
   }

   logInWithGoogle(isDo: boolean): Promise<any> {
      console.log("Login.loginWithGoogle called");
      return new Promise((resolve, reject) => {
         if (isDo == false) {
            resolve(true);
         } else {
            //if (this.helpers.isApp() === false) {
            //   resolve("Cordova not available");
            //} else {
            //this.googlePlus.login({}).then(async (googleUser: null) => {
            GoogleAuth.signIn().then((googleUser:User)=>{
               console.log("Login.loginWithGoogle GoogleAuth.signIn RESOLVED googleUser = " + JSON.stringify(googleUser))
               this.loginPage.isLoggedInSocial = (googleUser != null);
               this.loginPage.googleUser = googleUser;
               var res = this.loginPage.isLoggedInSocial === true ? true : "Google user not found.";
               resolve(res);
            }).catch((err: any) => {
               console.log("RESOLVING googlePlus.login ERROR:" + JSON.stringify(err));
               resolve(err);
            });
         }
      });
   }

   logoutGoogle() {
      console.log("logoutGoogle called");
      var self = this;
      //self.googlePlus.logout().then(() => {
      //self.googlePlus.disconnect().then((googleLogoutRes: any) => {
      //   console.log("logoutGoogle googleLogoutRes = " + JSON.stringify(googleLogoutRes));
      //  self.helpers.myAlert("Alert", "", "Logged out of google", "OK");
      //});
      //});
   }


}

interface myObject {
   [key: string]: any;
}


//ALERT Store Error {"code": 6777001, "message":"Init failed - Setup failed. BILLING_UNAVAILABLE: Billing service unavailable on device."}
//Error This version of the application is not configured for billing through the Google Play. Check the help center for more information.


