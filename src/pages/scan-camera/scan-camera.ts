import { Component, NgZone } from '@angular/core';
import { NavController, NavParams, AlertController, ToastController, LoadingController, Events, PopoverController } from 'ionic-angular';

import { ScanCameraService } from '../../providers/scanCameraService';
import { SessionsService } from '../../providers/sessionsService';
import { SoundService } from '../../providers/soundService';
import { ScanSledPage } from '../scan-sled/scan-sled';
import { MoreInfoPopover } from '../more-info-popover/more-info';

const notificationTime = 1000;

@Component({
  selector: 'scan-camera',
  templateUrl: 'scan-camera.html'
})
export class ScanCameraPage {

    pendingUploadCount: number = 0;
    scannedCount: number = 0;
    accessListCount: number = 0;
    session = {};
    prevSession = {};
    nextSession = {};
    orderedSessions: Array<any> = [];

    leaveCameraMsg: boolean = false;
    

    openPassword: boolean = false;
    showAcceptedBackground: boolean = false;
    showDeniedBackground: boolean = false;

    constructor(
      private scanCameraService: ScanCameraService,
      private sessionsService: SessionsService,
      private zone: NgZone,
      private params: NavParams,
      private events: Events,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      private soundService: SoundService,
      private loadingCtrl: LoadingController,
      private popoverCtrl: PopoverController,
      private navCtrl: NavController
    ) {
        this.session = this.params.data;
        this.onLineaConnect = this.onLineaConnect.bind(this);
    }

    // Get session scan counts, access list counts, determine prev/next sessions
    ionViewWillEnter() {             
      console.log("Entering scan-camera");
      // Get Session Scan counts
      this.getSessionScanCount();

      // If access control, get access list count
      if (this.session['AccessControl']) {
        this.getAccessListCount();
      }

      // Get room list, determine prev/next sessions..
      this.determineSessionOrder(this.session['Location'], this.session['SessionGuid']);
    }

    // Set OnDataRead, subscribe to onLineaConnect, calculate position and then turn on camera
    ionViewDidEnter() {
      console.log("DidEnter scan-camera");
      //alert("IONVIEWDIDENTER!");
      (<any>window).OnDataRead = this.onZoneDataRead.bind(this);       
      this.events.subscribe('event:onLineaConnect', this.onLineaConnect);       
      this.scanCameraService.calculatePosition();
      this.scanCameraService.turnOn();
    }

    // Shut off camera on leaving, disallow scanning, unsubscribe from events
    ionViewWillLeave() { 
      console.log("WillLeave scan-camera");
      //alert("IONVIEWWILLLEAVE...");   
      this.scanCameraService.turnOff();
      (<any>window).OnDataRead = function(){};
      this.events.unsubscribe('event:onLineaConnect', this.onLineaConnect);
    }

    // Check if user wants to leave camera page
    onLineaConnect() {
      if (!this.leaveCameraMsg) {
        this.leaveCameraMsg = true;
        this.scanCameraService.turnOff();
        let msg = this.alertCtrl.create({
          title: "Sled scanner detected",
          message: "Do you want to leave the camera scanning page?",
          buttons: [
            {
              text: 'Stay',
              handler: () => {
                this.leaveCameraMsg = false;
                this.scanCameraService.turnOn();
              }
            },
            {
              text: "Leave", 
              handler: () => {
                this.leaveCameraMsg = false;
                this.navCtrl.pop({ animate: false });
                this.navCtrl.push(ScanSledPage, this.session, {animate: false});
              }
            }
          ]
        });
        msg.present(); 
      }
    }

    // Zone function that runs window.OnDataRead
    onZoneDataRead(data) {
      
       // TESTING to show 3 different routes - accepted, denied, denied with prompt...
      const allowed = Math.round(Math.random());
      const secondCheck = Math.round(Math.random());

      const scannedDate = data;
      this.zone.run(() => {        
        if (allowed) {
          if (secondCheck) {
            this.soundService.playAccepted();
            this.alertAllowed();
          } else {
            this.soundService.playDenied();
            this.alertDenied();
          }          
        } else {
          this.scanCameraService.turnOff();
          let confirm = this.alertCtrl.create({
            title: 'Not on access list',
            message: "Allow this attendee into session?",
            cssClass: 'confirm-entry',
            buttons: [
              {
                text: "Deny",
                role: 'cancel',
                cssClass: 'confirm-cancel',                
                handler: () => {
                  // Don't allow
                  this.soundService.playDenied();
                  this.scanCameraService.turnOn();
                  this.alertDenied();
                }
              },
              {
                text: "Allow",
                cssClass: 'confirm-allow',
                handler: () => {
                  // Allow attendee
                  this.soundService.playAccepted();
                  this.scanCameraService.turnOn();
                  this.alertAllowed();
                }
              }
            ]
          });
          confirm.present();
        }
      });      
    }

    // Toggle Torch On/Off -- NOT IMPLEMENTED WITH AVE-SESSIONS
    // toggleLight() {
    //   this.scanCameraService.toggleTorch();
    // }

    // Turn Front/Back camera
    toggleCamera() {
      this.scanCameraService.toggleCamera();
    }    

    // Password Prompt - Cancel Event Handler
    promptCancelled() {
      this.scanCameraService.turnOn();
      this.openPassword = false;      
    }

    // Password Prompt - Unlock Event Handler
    promptUnlocked() {
      this.scanCameraService.turnOn();
      this.openPassword = false;
      this.session['isLocked'] = false;      
    }

    // Toggle lock/unlock of sessions
    openPasswordModal() {
      if (this.session['isLocked']) {
        this.scanCameraService.turnOff();        
        this.openPassword = true;
      } else {
        this.session['isLocked'] = true;
      }
    }

    // Present a success toast notification
    alertAllowed() {
      let toast = this.toastCtrl.create({
        message: "Successfully allowed in!",
        duration: notificationTime,
        position: 'top',
        cssClass: 'notify-confirm'
      });
      this.showAcceptedBackground = true;
      toast.present();
      setTimeout(function() {
        this.showAcceptedBackground = false;
      }.bind(this), notificationTime);
    }

    // Present a denied toast notification
    alertDenied() {      
      let toast = this.toastCtrl.create({
        message: "Attendee denied access.",
        duration: notificationTime,
        position: 'top',
        cssClass: 'notify-cancel'
      });
      this.showDeniedBackground = true;
      toast.present();

      setTimeout(function() {
        this.showDeniedBackground = false;
      }.bind(this), notificationTime);
    }

    // Get session scan count
    getSessionScanCount() {
      this.sessionsService.getCount(this.session['SessionGuid']).subscribe((data) => {      
        this.scannedCount = data.Count;
      }, (err) => { });
    }

    // Get the access list count
    getAccessListCount() {
      this.sessionsService.getAccessCount(this.session['SessionGuid']).subscribe((data) => {
        this.accessListCount = data.Count;
      }, (err) => { });
    }

    // Search for all sessions in this room, assign prev/next sessions
    determineSessionOrder(room, guid) {
      const q = room ? `location=${room}` : '';
      this.sessionsService.searchSessions(q).subscribe((data) => {
        this.orderedSessions = data;
        const currentSessionIndex = this.getCurrentSessionIndex(this.orderedSessions, guid);
        if (currentSessionIndex > -1) {
          if (currentSessionIndex !== 0) {
            this.prevSession = this.orderedSessions[currentSessionIndex - 1];
          }
          if (currentSessionIndex !== this.orderedSessions.length - 1) {
            this.nextSession = this.orderedSessions[currentSessionIndex + 1];
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

    // Show more info popover
    showPopover(ev) {
      this.scanCameraService.turnOff();
      const sessionDetails = {
        totalPending: this.pendingUploadCount,
        nextSession: this.nextSession,
        prevSession: this.prevSession,
        isLocked: this.session['isLocked']
      };
      let pop = this.popoverCtrl.create(MoreInfoPopover, sessionDetails);
      pop.present({ ev });
      pop.onDidDismiss((data) => {        
        if (data === 'next' || data === 'prev') {
          let sess = data === 'next' ? this.nextSession : this.prevSession;
          sess['isLocked'] = this.session['isLocked'] ? true : false;
          const dir = data === 'next' ? 'forward' : 'back';
          // this.navCtrl.popToRoot({ animate: false }).then(() => {
          //   this.navCtrl.push(ScanCameraPage, sess, { animate: true, direction: dir, animation: 'ios-transition' });
          // });
          console.log("POPOVER DISMISSED");
          this.navCtrl.pop({animate: false}).then(() => {
            console.log("POPPED SCAN PAGE");
            this.navCtrl.push(ScanCameraPage, sess, { animate: true, direction: dir, animation: 'ios-transition' }).then(() => {
              console.log("PUSHED NEW SCAN PAGE");
            });
          });
          
          // this.navCtrl.push(ScanCameraPage, sess, { animate: true, direction: dir, animation: 'ios-transition'}).then(() => {
          //   const idx = this.navCtrl.getActive().index;
          //   this.navCtrl.remove(idx - 1).then(() => {
          //     this.scanCameraService.turnOn();
          //   });
          // });
        } else {
          this.scanCameraService.turnOn();
        }
      });
    }

    // Click Handler - Refresh Access List
    refreshAccessList() {
      this.scanCameraService.turnOff();
      let loader = this.loadingCtrl.create({
        content: 'Refreshing access list...',
        dismissOnPageChange: true
      });    
      loader.present();
      this.sessionsService.fetchAccess(this.session['SessionGuid']).subscribe((data) => {
        loader.dismiss();
        this.scanCameraService.turnOn();
        let toast = this.toastCtrl.create({
          message: "Access list refreshed!",
          duration: 2500,
          position: 'top'
        });
        toast.present();
      }, (err) => {
        loader.dismiss();
        this.scanCameraService.turnOn();
        let toast = this.toastCtrl.create({
          message: "Unable to refresh access list...",
          duration: 2500,
          position: 'top'
        });
        toast.present();
      });
    }
}