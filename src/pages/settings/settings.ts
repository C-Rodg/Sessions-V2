import { Component } from '@angular/core';
import { NavController, ToastController, LoadingController, ModalController, Events } from 'ionic-angular';

import { DeviceModal } from './device-modal/device-modal';
import { InformationService } from '../../providers/informationService';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {

  aboutDevice : any = {
    appInfo : "",
    deviceInfo: "",
    scannerStatus: "disconnected", 
    cameraFront: "checkmark",
    cameraBack: "checkmark"
  };
  
  deviceName: string = "iTouch 084";
  pendingUploads: Number = 18;
  backgroundUploadWait: Number = 4;
  accessControl: Boolean = true;
  accessControlOverride: Boolean = true;
  capacityCheck: Boolean = false; 

  constructor(public navCtrl: NavController,
      private toastCtrl: ToastController,
      private loadingCtrl: LoadingController,
      private modalCtrl: ModalController,
      private infoService: InformationService,
      private events: Events
  ) {
    this.buildAboutSection = this.buildAboutSection.bind(this);
  }

  // Check client and create about section on enter
  ionViewWillEnter() {
    this.infoService.getClientInfo().subscribe(this.buildAboutSection);
    this.events.subscribe('event:onLineaConnect', this.buildAboutSection);
  }

  // Unsubscribe from events
  ionViewWillLeave() {
    this.events.unsubscribe('event:onLineaConnect', this.buildAboutSection);
  }

  // Build About Section strings
  buildAboutSection() {
    const a = this.aboutDevice;
    a.appInfo = this.infoService.getAppVersion();
    a.deviceInfo = this.infoService.getDeviceInfo();
    a.scannerStatus = (this.infoService.getLineaStatus()) ? 'connected' : 'disconnected';
    a.cameraFront = (this.infoService.getCameraStatus('FrontCamera')) ? 'checkmark' : 'close';
    a.cameraBack = (this.infoService.getCameraStatus('RearCamera')) ? 'checkmark' : 'close';
  }

  // Click handler - leave app
  handleChangeEvents() {
    window.location.href = "http://localhost/navigate/home";
  }

  // Click handler - resync sessions
  handleSyncSessions() {
    let loader = this.loadingCtrl.create({
      content: 'Syncing sessions...',
      dismissOnPageChange: true
    });
    loader.present();
    // TODO: FAKING SYNC SESSION TIME
    setTimeout(() => {
      loader.dismiss();
      let toast = this.toastCtrl.create({
        message: "Finished syncing sessions!",
        duration: 2500,
        position: 'top'
      });
      toast.present();
    }, 2000);
  }

  // Click handler - upload pending scans
  handleUploadScans() {
    let loader = this.loadingCtrl.create({
      content: `Uploading ${this.pendingUploads} scans...`,
      dismissOnPageChange: true
    });
    loader.present();
    // TODO: FAKING UPLOAD SCANS TIME
    setTimeout(() => {
      loader.dismiss();
      let toast = this.toastCtrl.create({
        message: `Finished uploading ${this.pendingUploads} scans!`,
        duration: 2500,
        position: 'top'
      });
      toast.present();
      this.pendingUploads = 0;
    }, 4000);
  }

  // Click handler - edit device name
  handleEditDeviceName() {
    let modal = this.modalCtrl.create(DeviceModal, { name: this.deviceName });
    modal.onDidDismiss(data => {
      this.deviceName = data.name;
    });
    modal.present();
  }

  // Change in background upload wait time
  startNewUploadTime() {

  }

  // Change in toggles
  saveSettings() {

  }

}
