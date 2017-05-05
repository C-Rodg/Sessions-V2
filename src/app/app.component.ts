import { Component, ViewChild, NgZone } from '@angular/core';
import { Nav,  LoadingController, ToastController, AlertController, MenuController, Events } from 'ionic-angular';

import { SessionsPage } from '../pages/sessions/sessions';
import { SettingsPage } from '../pages/settings/settings';
import { ScanCameraPage } from '../pages/scan-camera/scan-camera';

import { InformationService } from '../providers/informationService';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = SessionsPage;

  pages: Array<{title: string, component: any, icon: string}>;
  pendingUploads : number = 23;

  constructor(
        private loadingCtrl: LoadingController,
        private toastCtrl: ToastController,
        private menuCtrl: MenuController,
        private alertCtrl: AlertController,
        private events: Events,
        private zone: NgZone,
        private infoService: InformationService
  ) {

    // Create side menu
    this.pages = [     
      { title: 'Sessions', component: SessionsPage, icon: 'home'},
      { title: 'Sync Sessions', component: '', icon: 'refresh'},
      { title: 'Upload Scans', component: '', icon: 'cloud-upload'},
      { title: 'Settings', component: SettingsPage, icon: 'settings'},
      { title: 'Exit', component: '', icon: 'exit'}
    ];

    this.infoService.startUpApplication().subscribe((data) => {
      //alert(JSON.stringify(data));
    }, (err) => {
      //alert(JSON.stringify(err));
    });

    (<any>window).OnLineaConnect = this.onZoneOnAppActive.bind(this);
  }

  // Handle OnLineaConnect function call depending on the current page
  onZoneOnAppActive() {
    this.zone.run(() => {
      this.infoService.getClientInfo().subscribe((data) => {
        let view = this.nav.getActive();
        if (view.instance instanceof ScanCameraPage) {
          this.events.publish('event:onLineaConnect');
        } else if (view.instance instanceof SettingsPage) {
          this.events.publish('event:onLineaConnect');
        }
      }, (err) => {

      });
    })
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
