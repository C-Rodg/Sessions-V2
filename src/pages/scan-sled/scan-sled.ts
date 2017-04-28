import { Component, NgZone } from '@angular/core';
import { NavParams, AlertController, ToastController } from 'ionic-angular';

import { ScanSledService } from '../../providers/scanSledService';
import { DisplaySession } from '../../interfaces/display-session';

@Component({
  selector: 'scan-sled',
  templateUrl: 'scan-sled.html'
})
export class ScanSledPage {
    session: DisplaySession = {};
    sessionLocked: boolean = false;
    
    constructor(private params: NavParams,
        private scanSledService: ScanSledService,
        private zone: NgZone,
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

    // Bind OnDataRead to this class, enable scan button
    ionViewWillEnter() {
      (<any>window).OnDataRead = this.onZoneDataRead.bind(this);
      this.scanSledService.sendScanCommand('enableButtonScan');
    }

    // Disable button scan on leaving
    ionViewWillLeave() {
      this.removeScanClickClass();
      this.scanSledService.sendScanCommand('disableButtonScan');
    }

    // Remove scanning function
    ionViewDidLeave() {
      (<any>window).OnDataRead = function(){};
    }    

    // Zone function that parses badge data
    onZoneDataRead(data) {
      // TESTING
      const allowed = Math.round(Math.random());

      const scannedData = data;
      //alert(JSON.stringify(data));
      this.zone.run(() => {
        this.removeScanClickClass();
        if (allowed) {
          this.alertAllowed();
        } else {
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
                  this.alertDenied();
                }
              },
              {
                text: "Allow",
                cssClass: 'confirm-allow',
                handler: () => {
                  // Allow attendee
                  this.alertAllowed();
                }
              }
            ]
          });
          confirm.present();
        }
      });
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
        message: "Attendee denied access",
        duration: 1000,
        position: 'top',
        cssClass: 'notify-cancel'
      });
      toast.present();
    }

    // Add css class for scan button
    scanBtnClicked(event, status) {
      if (status) {
        event.currentTarget.classList.add('scan-clicked');
        this.scanSledService.sendScanCommand('startScan');
      } else {
        event.currentTarget.classList.remove('scan-clicked');
        this.scanSledService.sendScanCommand('stopScan');
      }
    }

    // Remove CSS class for scan button click
    removeScanClickClass() {
      const scanBtn = document.getElementById('scan-btn-card');
      if (scanBtn) {
        scanBtn.classList.remove('scan-clicked');
      }
      return false;
    }

    // Toggle Locking of session
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
                // Do nothing...
              }
            },
            {
              text: 'Unlock',
              handler: data => {
                if (data.password === '9151') {
                  this.sessionLocked = false;
                }
              }
            }
          ]
        });
        prompt.present();
      } else {
        this.sessionLocked = !this.sessionLocked;
      }      
    }
}