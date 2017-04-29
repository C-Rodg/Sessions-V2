import { Component, NgZone } from '@angular/core';
import { NavParams, AlertController, ToastController } from 'ionic-angular';

import { ScanCameraService } from '../../providers/scanCameraService';
import { DisplaySession } from '../../interfaces/display-session';

@Component({
  selector: 'scan-camera',
  templateUrl: 'scan-camera.html'
})
export class ScanCameraPage {
    sessionLocked: boolean = false;
    session: DisplaySession = {};

    password: string = "";
    openPassword: boolean = false;

    constructor(private scanCameraService: ScanCameraService,
      private zone: NgZone,
      private params: NavParams,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController
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
      
       // TESTING
      const allowed = Math.round(Math.random());

      const scannedDate = data;
      this.zone.run(() => {        
        if (allowed) {
          this.alertAllowed();
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
                  this.scanCameraService.turnOn();
                  this.alertDenied();
                }
              },
              {
                text: "Allow",
                cssClass: 'confirm-allow',
                handler: () => {
                  // Allow attendee
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

    // Toggle lock session
    toggleLockSession() {
      if (this.sessionLocked) {        
        let prompt = this.alertCtrl.create({
          title: 'Session Locked',
          message: 'Please enter the password to unlock this session...',
          inputs: [{
            name: 'password',
            placeholder: 'Password'
          }],
          buttons: [
            {
              text: 'Cancel',
              handler: data => {
                this.scanCameraService.turnOn();
              }
            },
            {
              text: 'Unlock',
              handler: data => {
                if (data.password === '9151') {
                  this.scanCameraService.turnOn();
                  this.sessionLocked = false;
                }
              }
            }
          ]
        });
        this.scanCameraService.turnOff();
        prompt.present();        
      } else {
        this.sessionLocked = true;
      }      
    }

    // Toggle lock/unlock of sessions
    openPasswordModal() {
      if (this.sessionLocked) {
        this.scanCameraService.turnOff();
        this.password = "";
        this.openPassword = true;
      } else {
        this.sessionLocked = true;
      }
    }

    // Cancel button on password modal clicked
    cancelPassword() {
      this.scanCameraService.turnOn();
      this.openPassword = false;
      this.password = '';
    }

    // Unlock button on password modal clicked
    unlockSession() {
      if (this.password === '9151') {
        this.scanCameraService.turnOn();
        this.openPassword = false;
        this.sessionLocked = false;
      }
    }

    // Present a success toast notification
    alertAllowed() {
      let toast = this.toastCtrl.create({
        message: "Successfully allowed in!",
        duration: 1000,
        position: 'top',
        cssClass: 'notify-confirm'
      });
      toast.present();
    }

    // Present a denied toast notification
    alertDenied() {
      let toast = this.toastCtrl.create({
        message: "Attendee denied access.",
        duration: 1000,
        position: 'top',
        cssClass: 'notify-cancel'
      });
      toast.present();
    }
}