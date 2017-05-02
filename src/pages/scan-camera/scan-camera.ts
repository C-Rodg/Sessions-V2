import { Component, NgZone } from '@angular/core';
import { NavParams, AlertController, ToastController } from 'ionic-angular';

import { ScanCameraService } from '../../providers/scanCameraService';
import { SoundService } from '../../providers/soundService';
import { DisplaySession } from '../../interfaces/display-session';

const notificationTime = 1000;

@Component({
  selector: 'scan-camera',
  templateUrl: 'scan-camera.html'
})
export class ScanCameraPage {
    sessionLocked: boolean = false;
    session: DisplaySession = {};

    openPassword: boolean = false;
    showAcceptedBackground: boolean = false;
    showDeniedBackground: boolean = false;

    constructor(private scanCameraService: ScanCameraService,
      private zone: NgZone,
      private params: NavParams,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      private soundService: SoundService
    ) {
        
    }

    // Get session data
    ngOnInit() {
      const d = this.params.data;
      if (d) {
        this.session = d;
      }      
    }

    // Set OnDataRead function and turn on camera
    ionViewWillEnter() {
      (<any>window).OnDataRead = this.onZoneDataRead.bind(this);      
    }

    // Calculate position and then turn on camera
    ionViewDidEnter() {
      this.scanCameraService.calculatePosition();
      this.scanCameraService.turnOn();
    }

    // Shut off camera on leaving
    ionViewWillLeave() {    
      this.scanCameraService.turnOff();
    }

    // Disallow scanning on other pages
    ionViewDidLeave() {
      (<any>window).OnDataRead = function(){};
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
                text: "Cancel",
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

    // Toggle Torch On/Off
    toggleLight() {
      this.scanCameraService.toggleTorch();
    }

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
      this.sessionLocked = false;      
    }

    // Toggle lock/unlock of sessions
    openPasswordModal() {
      if (this.sessionLocked) {
        this.scanCameraService.turnOff();        
        this.openPassword = true;
      } else {
        this.sessionLocked = true;
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
}