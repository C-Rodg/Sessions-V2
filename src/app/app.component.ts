import { Component, ViewChild, NgZone } from '@angular/core';
import { Nav,  LoadingController, ToastController, AlertController, MenuController, Events } from 'ionic-angular';

import { SessionsPage } from '../pages/sessions/sessions';
import { SettingsPage } from '../pages/settings/settings';
import { ScanCameraPage } from '../pages/scan-camera/scan-camera';
import { InformationService } from '../providers/informationService';
import { SessionsService } from '../providers/sessionsService';
import { SettingsService } from '../providers/settingsService';
import { EventGuid } from '../helpers/eventGuid';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = SessionsPage;

  pages: Array<{title: string, component: any, icon: string}>;
  pendingUploads : number = 0;

  constructor(
    private infoService: InformationService,
        private sessionsService: SessionsService,
        private settingsService: SettingsService,
        private loadingCtrl: LoadingController,
        private toastCtrl: ToastController,
        private menuCtrl: MenuController,
        private alertCtrl: AlertController,
        private events: Events,
        private zone: NgZone        
  ) {

    // Create side menu
    this.pages = [     
      { title: 'Sessions', component: SessionsPage, icon: 'home'},
      { title: 'Sync Sessions', component: '', icon: 'refresh'},
      { title: 'Upload Scans', component: '', icon: 'cloud-upload'},
      { title: 'Settings', component: SettingsPage, icon: 'settings'},
      { title: 'Exit', component: '', icon: 'exit'}
    ]; 

    const syncTime = window.localStorage.getItem(`${EventGuid.guid}_sync`);
    let loader = this.loadingCtrl.create({
      content: 'Loading Sessions...',
      dismissOnPageChange: true
    });
    if (!syncTime) {          
      loader.present(); 
    }
    
    // Start up application, if fails just try to set SessionToken, assign allSessions
    this.infoService.startUpApplication().subscribe((data) => {
      this.sessionsService.startUpSessions().subscribe(d => {
        loader.dismiss();
        this.startBackgroundUpload();
      }, (err) => {
        loader.dismiss();
        this.startBackgroundUpload();
      });
    }, (err) => {
      this.infoService.getAuthToken().subscribe((token) => {
        this.sessionsService.startUpSessions().subscribe((d) => {
          loader.dismiss();
          this.startBackgroundUpload();
        }, (err) => {
          loader.dismiss();
          this.startBackgroundUpload();
        });
      }, (err) => {
        loader.dismiss();
        this.startBackgroundUpload();
      });
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
    });
  }

  // Click handler for side menu
  openPage(page) {    
    if (page.icon === 'home' || page.icon === 'settings') {
      this.nav.setRoot(page.component);
    } else if (page.icon === 'refresh') {
        this.resyncSessions();
    } else if (page.icon === 'cloud-upload') {
      this.uploadPendingRecords();
    } else if (page.icon === 'exit') {
      window.location.href = "http://localhost/navigate/home";  
    }
  }

  // Refresh sessions and access lists
  resyncSessions() {
      let loader = this.loadingCtrl.create({
        content: 'Syncing Sessions...',
        dismissOnPageChange: true
      });    
      loader.present();
      this.sessionsService.refreshSessionsThenAccessLists().subscribe((data) => {
        loader.dismiss();
        let toast = this.toastCtrl.create({
          message: "Finished syncing sessions!",
          duration: 2500,
          position: 'top'
        });
        toast.present();
      }, (err) => {
        loader.dismiss();
        let toast = this.toastCtrl.create({
          message: "Unable to sync sessions at this time...",
          duration: 2500,
          position: 'top'
        });
        toast.present();
      });   
  }

  // Upload pending records
  uploadPendingRecords() {
      let loader = this.loadingCtrl.create({
        content: `Uploading ${this.pendingUploads} Scans...`,
        dismissOnPageChange: true
      });
      loader.present();    
      this.sessionsService.uploadAllPending().subscribe((data) => {
        loader.dismiss();
        let errorCount = 0;
        if (data) {
          data.forEach((sched) => {
            if (sched.hasOwnProperty('error') && sched['error']) {
              errorCount++;
            }
          });
        }
        const msg = (this.pendingUploads && (data.length - errorCount > 0)) ? `Finished uploading ${data.length - errorCount} scans!` : 'No scans to upload...';
        let toast = this.toastCtrl.create({
          message: msg,
          duration: 2500,
          position: 'top'
        });
        toast.present();
        if (errorCount > 0) {
          let toast = this.toastCtrl.create({
            message: `${errorCount} scans were unable to be uploaded..`,
            showCloseButton: true,
            position: 'bottom',
            cssClass: 'wrong-session'
          });
          toast.present();
        }
        this.getPendingUploads();
      }, (err) => {
        loader.dismiss();
        let toast = this.toastCtrl.create({
          message: err || 'Unable to upload all pending scans...',
          duration: 2500,
          position: 'top'
        });
        toast.present();
        this.getPendingUploads();
      });
      return false;
  }

  // Calculate Pending Uploads
  getPendingUploads() {
    this.sessionsService.getTotalCount('uploaded=no&error=no').subscribe((data) => {
      this.zone.run(()=> {
        this.pendingUploads = data.Count;
      });      
    });
  }

  // Start background upload
  startBackgroundUpload() {
    this.sessionsService.initializeBackgroundUpload(this.settingsService.backgroundUploadWait);
  }
}
