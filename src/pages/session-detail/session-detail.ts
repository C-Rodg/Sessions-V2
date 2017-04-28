import { Component } from '@angular/core';
import { NavController, NavParams, PopoverController, LoadingController, ToastController } from 'ionic-angular';
import * as moment from 'moment';
import { MoreInfoPopover } from './more-info/more-info';
import { ScanCameraPage } from '../scan-camera/scan-camera';
import { ScanSledPage } from '../scan-sled/scan-sled';

import { DisplaySession } from '../../interfaces/display-session';

import { sessionsArray } from '../../test-data/mock-data';

@Component({
  selector: 'page-session-detail',
  templateUrl: 'session-detail.html'
})
export class SessionDetailPage {

  orderedSessions: Array<any> = [];  
  session : DisplaySession = {};
  prevSession: DisplaySession = {};
  nextSession: DisplaySession = {};

  accessListCount: Number = 84;
  scannedCount: Number = 237;
  pendingUploadCount: Number = 28;



  constructor(public navCtrl: NavController, 
      private params: NavParams,
      private popoverCtrl: PopoverController,
      private toastCtrl: ToastController,
      private loadingCtrl: LoadingController
  ) {  }

  // Parse out Session details
  ngOnInit() {
    const d = this.params.data;
    if (d) {
      // If navParam is already in view format do nothing, else convert..
      if (d.hasOwnProperty('title') && d.hasOwnProperty('room') && d.hasOwnProperty('startDate')) {
        this.session = d;
      } else {
        this.session = this.convertServerSessionToDisplay(d);
      }               
    }
    // TODO: Get Upload Counts..
  }  

  // Determine the Previous and Next Sessions
  ionViewWillEnter() {
    this.orderedSessions = this.orderSessions(sessionsArray, this.session.room);
    const currentSessionIndex = this.getCurrentSessionIndex(this.orderedSessions, this.session.title);
    if (currentSessionIndex > -1) {
      if (currentSessionIndex !== 0) {
        this.prevSession = this.convertServerSessionToDisplay(this.orderedSessions[currentSessionIndex - 1]);
      }
      if (currentSessionIndex !== this.orderedSessions.length -1) {
        this.nextSession = this.convertServerSessionToDisplay(this.orderedSessions[currentSessionIndex + 1]);
      }
    }
  }

  // Helper - Convert server session to display session
  convertServerSessionToDisplay(serverSess) {
    const { Topic, TrackAttendance, Location, StartDateTime, EndDateTime } = serverSess;
    const start = moment(StartDateTime);
    const end = moment(EndDateTime);
    let session: DisplaySession = {
      title: Topic,
      room: Location,
      startTime: start.format("h:mm A"),
      endTime: end.format("h:mm A"),
      accessControl: TrackAttendance
    };
    if (start.isSame(end, 'day')) {
      session.startDate = start.format('ddd, MMM Do, YYYY');
    } else {
      session.startDate = start.format('ddd, MMM Do') + ' - ';
      session.rangeDate = end.format('ddd, MMM Do, YYYY');
    }
    return session;
  }

  // Helper - Filter and order room sessions
  orderSessions(arr, room) {
    return arr.filter((session) => {
      return session.Location === room;
    }).sort((a, b) => {
      return moment(a.StartDateTime).diff(moment(b.StartDateTime));
    });
  }

  // Helper - get current session index
  getCurrentSessionIndex(arr, name) {
    return arr.findIndex((sess) => {
      return sess.Topic === name;
    });
  }

  // Go to the scan page
  getScanPage() {
    // TODO: TESTING go to camera for access control sessions...
    if (this.session.accessControl) {
      this.navCtrl.push(ScanCameraPage, this.session);
    } else {
      this.navCtrl.push(ScanSledPage, this.session);
    }    
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
    // TODO: Create correct session details and present popover
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