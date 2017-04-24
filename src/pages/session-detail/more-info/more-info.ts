import { Component } from '@angular/core';
import { NavParams, LoadingController, ToastController, ViewController } from 'ionic-angular';


interface Session {
  title? : string,
  room? : string,
  startDate? : string,
  rangeDate? : string,
  startTime? : string,
  endTime? : string,
  accessControl? : boolean
}

@Component({
  selector: 'more-info-popover',
  templateUrl: 'more-info.html'
})
export class MoreInfoPopover {
  pendingCount: Number = 32;
  prevSession: Session = {};
  nextSession: Session = {};    

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
    // this.viewCtrl.dismiss().then(() => {
    //   console.log(this.navCtrl.getActive().index);
    //   const sess = (dir === 'next') ? this.nextSession : this.prevSession;
    //   this.navCtrl.push(SessionDetailPage, sess).then(() => {
    //     const idx = this.navCtrl.getActive().index;
    //     console.log(idx);
    //     this.navCtrl.remove(idx - 1);
    //   });
    // })    
  }

}