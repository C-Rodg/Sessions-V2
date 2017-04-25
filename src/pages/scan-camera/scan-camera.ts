import { Component, NgZone } from '@angular/core';
import { ScanCameraService } from '../../providers/scanCameraService';

@Component({
  selector: 'scan-camera',
  templateUrl: 'scan-camera.html'
})
export class ScanCameraPage {
    constructor(private scanCameraService: ScanCameraService,
      private zone: NgZone
    ) {
        
    }

    // Shut off camera on leaving
    ionViewWillLeave() {
      this.scanCameraService.turnOff();
    }

    // Disallow scanning on other pages
    ionViewDidLeave() {
      (<any>window).OnDataRead = function(){};
    }
}