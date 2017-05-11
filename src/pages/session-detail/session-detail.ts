import { Component } from '@angular/core';
import { NavController, NavParams, PopoverController, LoadingController, ToastController } from 'ionic-angular';
import * as moment from 'moment';

import { MoreInfoPopover } from './more-info/more-info';
import { ScanCameraPage } from '../scan-camera/scan-camera';
import { ScanSledPage } from '../scan-sled/scan-sled';
import { InformationService } from '../../providers/informationService';
import { SessionsService } from '../../providers/sessionsService';
import { addSessionDisplayValues } from '../../helpers/sessionHelpers';

@Component({
  selector: 'page-session-detail',
  templateUrl: 'session-detail.html'
})
export class SessionDetailPage {

  orderedSessions: Array<any> = [];  
  session = {};
  prevSession = {};
  nextSession = {};

  accessListCount: Number = 84;
  scannedCount: Number = 237;
  pendingUploadCount: Number = 28;



  constructor(public navCtrl: NavController, 
      private params: NavParams,
      private popoverCtrl: PopoverController,
      private toastCtrl: ToastController,
      private loadingCtrl: LoadingController,
      private infoService: InformationService,
      private sessionsService: SessionsService
  ) {  }



  // Convert session to display, determine the Previous and Next Sessions
  ionViewWillEnter() {
    this.session = this.params.data;
    // Get room list, determine prev/next sessions..
    this.determineSessionOrder(this.session['Location'], this.session['SessionGuid']);
    
    // TODO: Get Upload Counts..
    // ...      
  }

  // Search for all sessions in this room, assign prev/next sessions
  determineSessionOrder(room, guid) {
    const q = room ? `location=${room}` : '';
    this.sessionsService.searchSessions(q).subscribe((data) => {
      this.orderedSessions = data.Sessions.sort((sessA, sessB) => {
        return moment(sessA.StartDateTime).diff(moment(sessB.StartDateTime));
      });
      const currentSessionIndex = this.getCurrentSessionIndex(this.orderedSessions, guid);
      if (currentSessionIndex > -1) {
        if (currentSessionIndex !== 0) {
          this.prevSession = addSessionDisplayValues(this.orderedSessions[currentSessionIndex - 1]);
        }
        if (currentSessionIndex !== this.orderedSessions.length - 1) {
          this.nextSession = addSessionDisplayValues(this.orderedSessions[currentSessionIndex + 1]);
        }
      }
    });
  }

  // Helper - get current session index
  getCurrentSessionIndex(arr, guid) {
    return arr.findIndex((sess) => {
      return sess.SessionGuid === guid;
    });
  }

  // Go to the scan page
  getScanPage() {
    this.infoService.getClientInfo().subscribe((data) => {
      if (this.infoService.getLineaStatus()) {
        this.navCtrl.push(ScanSledPage, this.session);
      } else {
        this.navCtrl.push(ScanCameraPage, this.session);
      }
    }, (err) => {
      this.navCtrl.push(ScanCameraPage, this.session);
    });
  }

  // Refresh the Access List
  refreshAccessList() {
    let loader = this.loadingCtrl.create({
      content: 'Refreshing access list...',
      dismissOnPageChange: true
    });    
    loader.present();
    // TODO: Faking refresh time
    setTimeout(() => {
      loader.dismiss();
      let toast = this.toastCtrl.create({
        message: "Access lists refreshed!",
        duration: 2500,
        position: 'top'
      });
      toast.present();
    }, 3000);
  }

  // Show the Popover for pending uploads, next/previous sessions
  showPopover(ev) {
    const sessionDetails = {
      totalPending: this.pendingUploadCount,
      nextSession: this.nextSession,
      prevSession: this.prevSession      
    };
    let pop = this.popoverCtrl.create(MoreInfoPopover, sessionDetails);
    pop.present({ ev });
    pop.onDidDismiss((data) => {
      if (data === 'next' || data === 'prev') {
        const sess = data === 'next' ? this.nextSession : this.prevSession;
        const dir = data === 'next' ? 'forward' : 'back';
        this.navCtrl.push(SessionDetailPage, sess, { animate: true, direction: dir, animation: 'ios-transition'}).then(() => {
          const idx = this.navCtrl.getActive().index;
          this.navCtrl.remove(idx - 1);
        });
      }
    });
  }
  
}