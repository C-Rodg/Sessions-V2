import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, LoadingController, ToastController } from 'ionic-angular';
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
  pendingUploads : number = 23;

  constructor(public platform: Platform, 
        public statusBar: StatusBar, 
        public splashScreen: SplashScreen,
        private loadingCtrl: LoadingController,
        private toastCtrl: ToastController   
  ) {
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
      // TODO: SYNC SESSIONS AND REFRESH ACCESS LISTS
      let loader = this.loadingCtrl.create({
        content: 'Syncing Sessions...',
        dismissOnPageChange: true
      });    
      loader.present();
      // TODO: Faking time to hide...
      setTimeout(() => {
        loader.dismiss();
        let toast = this.toastCtrl.create({
          message: "Finished syncing sessions!",
          duration: 2500,
          position: 'top'
        });
        toast.present();
      }, 3000);
    } else if (page.icon === 'cloud-upload') {
      // TODO: UPLOAD PENDING COUNTS...
      let loader = this.loadingCtrl.create({
        content: `Uploading ${this.pendingUploads} Scans...`,
        dismissOnPageChange: true
      });
      loader.present();
      // TODO: Faking time to hide...
      setTimeout(() => {
        loader.dismiss();
        let toast = this.toastCtrl.create({
          message: `Finished uploading ${this.pendingUploads} scans!`,
          duration: 2500,
          position: 'top'
        });
        toast.present();
        this.pendingUploads = 0;
      }, 3200);
    } else if (page.icon === 'exit') {
      window.location.href = "http://localhost/navigate/home";  
    }
  }

  // Calculate Pending Uploads
  getPendingUploads() {
    // TODO: get pending uploads, may need to run in zone to get view to recognize updated count...
  }
}
