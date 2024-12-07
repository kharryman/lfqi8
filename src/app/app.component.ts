import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SQLiteService } from './services/sqlite.service';
import { GoogleAuth, InitOptions } from '@codetrix-studio/capacitor-google-auth';
import { Helpers } from './providers/helpers/helpers';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  public isWeb: boolean = false;
  private initPlugin: boolean = false;
  constructor(
    private platform: Platform,
    private sqlite: SQLiteService,
    public helpers: Helpers
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(async () => {
      
      const initOptions:InitOptions = {
        clientId: '779902744578-pvr5rei9ja8ul09omp0a5def4l6b7d4b.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: (this.helpers.isApp() === true)
      };
      await GoogleAuth.initialize(initOptions);      
      this.sqlite.initializePlugin().then(async (ret:any) => {
        this.initPlugin = ret;
        if( this.sqlite.platform === "web") {
          this.isWeb = true;
          await customElements.whenDefined('jeep-sqlite');
          const jeepSqliteEl = document.querySelector('jeep-sqlite');
          if(jeepSqliteEl != null) {
            await this.sqlite.initWebStore();
            console.log('app.component.ts SQLITE isStoreOpen ' + (await jeepSqliteEl.isStoreOpen()));
          } else {
            console.log('app.component.ts SQLITE jeepSqliteEl is null');
          }
        }

        console.log('app.component.ts SQLITE in App  this.initPlugin '  + this.initPlugin);
      });
    });
  }
}