import { Component, NgZone } from '@angular/core';
import { NavController, NavParams, AlertController, ToastController, LoadingController, PopoverController } from 'ionic-angular';

import { ScanSledService } from '../../providers/scanSledService';
import { SessionsService } from '../../providers/sessionsService';
import { SoundService } from '../../providers/soundService';
import { SettingsService } from '../../providers/settingsService';
import { MoreInfoPopover } from '../more-info-popover/more-info';

const notificationTime = 1000;

@Component({
  selector: 'scan-sled',
  templateUrl: 'scan-sled.html'
})
export class ScanSledPage {
    
    pendingUploadCount: number = 0;
    scannedCount: number = 0;
    accessListCount: number = 0;
    session = {};
    prevSession = {};
    nextSession = {};
    orderedSessions: Array<any> = [];

    showAcceptedBackground: boolean = false;
    showDeniedBackground: boolean = false;
    openPassword: boolean = false;
    
    constructor(
        private scanSledService: ScanSledService,
        private sessionsService: SessionsService,
        private soundService: SoundService,
        private settingsService: SettingsService,
        private navCtrl: NavController,
        private params: NavParams,
        private zone: NgZone,
        private popoverCtrl: PopoverController,
        private alertCtrl: AlertController,
        private toastCtrl: ToastController,
        private loadingCtrl: LoadingController
    ) {     
      this.session = this.params.data;
    }

    ionViewWillEnter() {
      // Get session scan count
      this.getSessionScanCount();

      // If access control, get access list count
      if (this.session['AccessControl']) {
        this.getAccessListCount();
      }

      // TODO: GET PENDING COUNT 

      // Get room list, determine prev/next sessions..
      this.determineSessionOrder(this.session['Location'], this.session['SessionGuid']);
    }

    // Bind OnDataRead to this class, enable scan button
    ionViewDidEnter() {
      (<any>window).OnDataRead = this.onZoneDataRead.bind(this);
      this.scanSledService.sendScanCommand('enableButtonScan');
    } 

    // Disable button scan on leaving, disable OnDataRead function
    ionViewWillLeave() {
      this.removeScanClickClass();
      this.scanSledService.sendScanCommand('disableButtonScan');
      (<any>window).OnDataRead = function(){};
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

    // Check capacity, parse badge, check access list, check settings, save or deny scan..
    handleScan(d) {
      // If capacityCheck is enabled, and current count is >= capacity, block
      if (this.settingsService.capacityCheck && this.session['Capacity'] && this.session['Capacity'] >= this.scannedCount) {
        this.soundService.playDenied();
        this.alertDenied('Session at capacity.');
        return false;
      }
    
      let scannedData = d[0].Data,
          symbology = d[0].Symbology,
          scannedId = null;

      let checkSymbology = symbology;
      if (checkSymbology != null) {
        checkSymbology = checkSymbology.replace(/\s+/g, '').toUpperCase();
      }

      if (checkSymbology === 'CODE3OF9' || checkSymbology === 'CODE39') {
        scannedId = scannedData;
      } else if (checkSymbology === 'QRCODE') {
        // Test for Validar QR code
        if (scannedData != null && scannedData.substring(0,4) === 'VQC:') {
          scannedData = scannedData.substring(4);
          const scannedFields = scannedData.split(';');
          if (scannedFields != null) {
            for (let i = 0; i < scannedFields.length; i++) {
              const field = scannedFields[i].split(':');
              if (field != null && field.length > 0) {
                // Currently ignoring field[0] === 'T' || 'S', not used..
                if (field[0] === 'ID') {
                  scannedId = field[1];
                }
              }
            }
          }
        } else {
          scannedId = scannedData;
        }
      } else {
        this.soundService.playDenied();
        this.alertDenied(`Not setup to support barcode symbology: ${symbology}`);
        return false;
      }

      // Remove extra spaces around id
      scannedId = scannedId.replace(/^\s+|\s+$/g, '');
      
      if (scannedId && scannedId.length < 384) {
        const newScan = {
          "SessionGuid": this.session['SessionGuid'],
          "ScanData": scannedId,
          "DeviceId": this.settingsService.deviceName,
          "ScanDateTime": new Date()
        };
        // Check for access control
        if (this.session['AccessControl'] && this.settingsService.accessControl) {
          this.sessionsService.getAccess(this.session['SessionGuid'], scannedId).subscribe((data) => {
            if (data.Fault && data.Fault.Type === 'NotFoundFault') {
              this.soundService.playDenied();              
              if (this.settingsService.accessControlOverride) {
                // Create confirmation for allow/deny attendee
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
                        this.alertDenied();
                      }
                    },
                    {
                      text: "Allow",
                      cssClass: 'confirm-allow',
                      handler: () => {
                        // Allow attendee
                        this.sessionsService.saveScan(newScan).subscribe((data) => {
                          this.scanSledService.sendScanCommand('enableButtonScan');
                          this.soundService.playAccepted();
                          this.alertAllowed();
                          this.scannedCount += 1;
                        }, (err) => {
                          this.scanSledService.sendScanCommand('enableButtonScan');
                          this.alertDenied('There was an issue saving that scan...');
                        });
                      }
                    }
                  ]
                });
                confirm.present();
              } else {
                this.alertDenied();
              }
            } else {
              // Allow entry
              this.sessionsService.saveScan(newScan).subscribe((data) => {
                this.soundService.playAccepted();
                this.alertAllowed();
                this.scannedCount += 1;
              }, (err) => {
                this.soundService.playDenied();
                this.alertDenied('There was an issue saving that scan...');
              });
            }
          }, (err) => {
            this.soundService.playDenied();
            this.alertDenied('There was an issue checking the access list...');
          });
        } else {          
          this.sessionsService.saveScan(newScan).subscribe((data) => {
            this.soundService.playAccepted();
            this.alertAllowed();
            this.scannedCount += 1;
          }, (err) => {
            this.soundService.playDenied();
            this.alertDenied('There was an issue saving that scan...');
          });
        }
      } else {
        this.soundService.playDenied();
        this.alertDenied('Invalid badgeId value');
        return false;
      }

    }

    // Zone function that sends badge data to be parsed
    onZoneDataRead(data) {
      this.zone.run(() => {
        this.removeScanClickClass();
        this.handleScan(data);        
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
    alertDenied(errorMsg?) {
      const msg = !errorMsg ? 'Attendee denied access.' : errorMsg;      
      let toast = this.toastCtrl.create({
        message: msg,
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

    // Click Handler - Refresh access list
    refreshAccessList() {
      let loader = this.loadingCtrl.create({
        content: 'Refreshing access list...',
        dismissOnPageChange: true
      });    
      loader.present();
      this.sessionsService.fetchAccess(this.session['SessionGuid']).subscribe((data) => {        
        loader.dismiss();
        let toast = this.toastCtrl.create({
          message: "Access list refreshed!",
          duration: 2500,
          position: 'top'
        });
        toast.present();
      }, (err) => {
        loader.dismiss();
        let toast = this.toastCtrl.create({
          message: "Unable to refresh access list...",
          duration: 2500,
          position: 'top'
        });
        toast.present();
      });
    }

    // Show Popover more info
    showPopover(ev) {
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
          this.navCtrl.push(ScanSledPage, sess, { animate: true, direction: dir, animation: 'ios-transition'}).then(() => {
            const idx = this.navCtrl.getActive().index;
            this.navCtrl.remove(idx - 1);
          });
        }
      });
    }
}