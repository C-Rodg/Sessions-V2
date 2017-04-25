import { Component, NgZone } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { ScanCameraService } from '../../providers/scanCameraService';
import { DisplaySession } from '../../interfaces/display-session';

@Component({
  selector: 'scan-camera',
  templateUrl: 'scan-camera.html'
})
export class ScanCameraPage {
    sessionLocked: boolean = false;
    session: DisplaySession = {};

    constructor(private scanCameraService: ScanCameraService,
      private zone: NgZone,
      private params: NavParams
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
      const scan = data;
      this.zone.run(() => {
        alert(JSON.stringify(data));
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
      this.sessionLocked = !this.sessionLocked;
    }
}