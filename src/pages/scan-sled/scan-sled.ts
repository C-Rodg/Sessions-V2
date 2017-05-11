import { Component, NgZone } from '@angular/core';
import { NavParams, AlertController, ToastController, LoadingController } from 'ionic-angular';

import { ScanSledService } from '../../providers/scanSledService';
import { SoundService } from '../../providers/soundService';

const notificationTime = 1000;

@Component({
  selector: 'scan-sled',
  templateUrl: 'scan-sled.html'
})
export class ScanSledPage {
    session = {};

    showAcceptedBackground: boolean = false;
    showDeniedBackground: boolean = false;
    openPassword: boolean = false;
    
    constructor(private params: NavParams,
        private scanSledService: ScanSledService,
        private soundService: SoundService,
        private zone: NgZone,
        private alertCtrl: AlertController,
        private toastCtrl: ToastController,
        private loadingCtrl: LoadingController
    ) {     
      this.session = this.params.data;
    }

    // Bind OnDataRead to this class, enable scan button
    ionViewWillEnter() {
      (<any>window).OnDataRead = this.onZoneDataRead.bind(this);
      this.scanSledService.sendScanCommand('enableButtonScan');
    }

    // Disable button scan on leaving, disable OnDataRead function
    ionViewWillLeave() {
      this.removeScanClickClass();
      this.scanSledService.sendScanCommand('disableButtonScan');
      (<any>window).OnDataRead = function(){};
    }  

    // Zone function that parses badge data
    onZoneDataRead(data) {
      // TESTING - show the 3 paths - accepted, denied, denied with prompt
      const allowed = Math.round(Math.random());
      const secondCheck = Math.round(Math.random());

      const scannedData = data;
      //alert(JSON.stringify(data));
      this.zone.run(() => {
        this.removeScanClickClass();
        if (allowed) {
          if (secondCheck) {
             this.soundService.playAccepted();
            this.alertAllowed();
          } else {
            this.soundService.playDenied();
            this.alertDenied();
          }         
        } else {
          this.scanSledService.sendScanCommand('disableButtonScan');
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
                  this.scanSledService.sendScanCommand('enableButtonScan');
                  this.soundService.playDenied();
                  this.alertDenied();
                }
              },
              {
                text: "Allow",
                cssClass: 'confirm-allow',
                handler: () => {
                  // Allow attendee
                  this.scanSledService.sendScanCommand('enableButtonScan');
                  this.soundService.playAccepted();
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

    // Add css class for scan button
    scanBtnClicked(event, status) {
      event.preventDefault();
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

    // Toggle lock/unlock of sessions
    openPasswordModal() {
      if (this.session['isLocked']) {
        this.openPassword = true;
      } else {
        this.session['isLocked'] = true;
      }
    }

    // Password Prompt - Cancel Event Handler
    promptCancelled() {
      this.openPassword = false;      
    }

    // Password Prompt - Unlock Event Handler
    promptUnlocked() {
      this.openPassword = false;
      this.session['isLocked'] = false;      
    }

    // Click Handler - Refresh access list
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
}