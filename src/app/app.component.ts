import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { SessionsPage } from '../pages/sessions/sessions';
import { SettingsPage } from '../pages/settings/settings';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = SessionsPage;

  pages: Array<{title: string, component: any, icon: string}>;
  pendingUploads : number = 0;

  constructor(public platform: Platform, public statusBar: StatusBar, public splashScreen: SplashScreen) {
    this.initializeApp();

    // Create side menu
    this.pages = [     
      { title: 'Sessions', component: SessionsPage, icon: 'home'},
      { title: 'Sync Sessions', component: '', icon: 'refresh'},
      { title: 'Upload Scans', component: '', icon: 'cloud-upload'},
      { title: 'Settings', component: SettingsPage, icon: 'settings'},
      { title: 'Exit', component: '', icon: 'exit'}
    ];

  }

  // Handle initialization of app
  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  // Click handler for side menu
  openPage(page) {
    if (page.icon === 'home' || page.icon === 'settings') {
      this.nav.setRoot(page.component);
    } else if (page.icon === 'refresh') {
      //TODO: REFRESH SESSIONS/AC...
    } else if (page.icon === 'cloud-upload') {
      // TODO: UPLOAD PENDING COUNTS...
    } else if (page.icon === 'exit') {
      // TODO: EXIT APPLICATION...
    }
  }

  // Calculate Pending Uploads
  getPendingUploads() {
    // TODO: get pending uploads, may need to run in zone to get view to recognize updated count...
  }
}
