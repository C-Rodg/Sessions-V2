import { Component } from '@angular/core';
import { NavParams, LoadingController, ToastController, ViewController } from 'ionic-angular';

import { SessionsService } from '../../providers/sessionsService';

@Component({
  selector: 'more-info-popover',
  templateUrl: 'more-info.html'
})
export class MoreInfoPopover {
  pendingCount: number = 0;
  prevSession: any = {};
  nextSession: any = {}; 
  locked: boolean = false;   

  constructor(
      private sessionsService: SessionsService,
      private navParams: NavParams,
      private toastCtrl: ToastController,
      private loadingCtrl: LoadingController,
      private viewCtrl: ViewController
  ) { }
  
  // Parse out prev/next sessions, get pendingUploads
  ngOnInit() {
    const d = this.navParams.data;
    if (d) {
      this.prevSession = d.prevSession;
      this.nextSession = d.nextSession;
      this.locked = d.isLocked;
    }
  }

  ionViewWillEnter() {
    this.sessionsService.getTotalCount('uploaded=no&error=no').subscribe((data) => {
      this.pendingCount = data.Count;
    });
  }
  
  // Upload Pending Scans
  uploadPending() {
    let loader = this.loadingCtrl.create({
      content: `Uploading ${this.pendingCount} scans...`,
      dismissOnPageChange: true
    });    
    loader.present();    
    this.sessionsService.refreshSessionsThenAccessLists().subscribe((data) => {
      loader.dismiss();
      const msg = this.pendingCount ? `Finished uploading ${this.pendingCount} scans!` : 'No scans to upload...';
      let toast = this.toastCtrl.create({
        message: msg,
        duration: 2500,
        position: 'top'
      });
      this.viewCtrl.dismiss();
      toast.present();
    }, (err) => {
      loader.dismiss();
      let toast = this.toastCtrl.create({
        message: err || `Unable to upload all pending scans...`,
        duration: 2500,
        position: 'top'
      });
      this.viewCtrl.dismiss();
      toast.present();
    });
  }

  // Go to prev/next session and remove original session from nav stack
  goToSession(dir) {
    this.viewCtrl.dismiss(dir);  
  }

}