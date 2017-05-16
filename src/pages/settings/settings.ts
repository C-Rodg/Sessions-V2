import { Component } from '@angular/core';
import { NavController, ToastController, LoadingController, ModalController, Events } from 'ionic-angular';

import { DeviceModal } from './device-modal/device-modal';
import { InformationService } from '../../providers/informationService';
import { SettingsService } from '../../providers/settingsService';
import { SessionsService } from '../../providers/sessionsService';

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
  
  pendingUploads: Number = 18;

  constructor(public navCtrl: NavController,
      private toastCtrl: ToastController,
      private loadingCtrl: LoadingController,
      private modalCtrl: ModalController,
      private infoService: InformationService,
      private settingsService: SettingsService,
      private sessionsService: SessionsService,
      private events: Events
  ) {
    this.buildAboutSection = this.buildAboutSection.bind(this);
  }

  // Check client and create about section on enter
  ionViewWillEnter() {
    this.infoService.getClientInfo().subscribe(this.buildAboutSection);
    this.events.subscribe('event:onLineaConnect', this.buildAboutSection);

    // TODO: GET PENDING UPLOADS
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
    this.sessionsService.refreshSessionsThenAccessLists().subscribe((data) => {
      loader.dismiss();
      let toast = this.toastCtrl.create({
        message: "Finished syncing sessions!",
        duration: 2500,
        position: 'top'
      });
      toast.present();
    }, (err) => {
      loader.dismiss();
      let toast = this.toastCtrl.create({
        message: "Unable to sync sessions at this time...",
        duration: 2500,
        position: 'top'
      });
      toast.present();
    });
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
    let modal = this.modalCtrl.create(DeviceModal, { name: this.settingsService.deviceName });
    modal.onDidDismiss(data => {
      this.settingsService.setValue(data.name, 'deviceName');
    });
    modal.present();
  }

  // Change in background upload wait time
  startNewUploadTime() {
    this.settingsService.storeCurrentSettings();
    this.sessionsService.initializeBackgroundUpload(this.settingsService.backgroundUploadWait);
  }

  // Change in toggles
  saveSettings() {
    this.settingsService.storeCurrentSettings();
  }

}
