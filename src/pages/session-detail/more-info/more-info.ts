import { Component } from '@angular/core';
import { NavParams, LoadingController, ToastController, ViewController } from 'ionic-angular';

import { DisplaySession } from '../../../interfaces/display-session';

@Component({
  selector: 'more-info-popover',
  templateUrl: 'more-info.html'
})
export class MoreInfoPopover {
  pendingCount: Number = 32;
  prevSession: DisplaySession = {};
  nextSession: DisplaySession = {};    

  constructor(private navParams: NavParams,
      private toastCtrl: ToastController,
      private loadingCtrl: LoadingController,
      private viewCtrl: ViewController
  ) {
    
  }
  
  // Parse out prev/next sessions, get pendingUploads
  ngOnInit() {
    const d = this.navParams.data;
    if (d) {
      this.prevSession = d.prevSession;
      this.nextSession = d.nextSession;
      this.pendingCount = d.totalPending;
    }
  }
  
  // Upload Pending Scans
  uploadPending() {
    let loader = this.loadingCtrl.create({
      content: `Uploading ${this.pendingCount} scans...`,
      dismissOnPageChange: true
    });    
    loader.present();
    // TODO: Faking refresh time
    setTimeout(() => {
      loader.dismiss();
      let toast = this.toastCtrl.create({
        message: `Finished uploading ${this.pendingCount} scans!`,
        duration: 2500,
        position: 'top'
      });
      this.pendingCount = 0;
      this.viewCtrl.dismiss();
      toast.present();      
    }, 3000);
  }

  // Go to prev/next session and remove original session from nav stack
  goToSession(dir) {
    this.viewCtrl.dismiss(dir);  
  }

}