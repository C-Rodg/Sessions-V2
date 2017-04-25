import { Component, NgZone } from '@angular/core';
import { NavParams } from 'ionic-angular';

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
        private zone: NgZone
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
      const scannedData = data;
      alert(JSON.stringify(data));
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
      this.sessionLocked = !this.sessionLocked;
    }
}