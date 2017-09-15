import { Component } from "@angular/core";
import {
	NavController,
	ToastController,
	LoadingController,
	ModalController,
	Events,
	AlertController
} from "ionic-angular";

import { DeviceModal } from "./device-modal/device-modal";
import { InformationService } from "../../providers/informationService";
import { SettingsService } from "../../providers/settingsService";
import { SessionsService } from "../../providers/sessionsService";

declare var Rollbar: any;

@Component({
	selector: "page-settings",
	templateUrl: "settings.html"
})
export class SettingsPage {
	aboutDevice: any = {
		appInfo: "",
		deviceInfo: "",
		scannerStatus: "disconnected",
		cameraFront: "checkmark",
		cameraBack: "checkmark"
	};

	pendingUploads: number = 0;
	errorCount: number = 0;

	constructor(
		public navCtrl: NavController,
		private toastCtrl: ToastController,
		private loadingCtrl: LoadingController,
		private modalCtrl: ModalController,
		private alertCtrl: AlertController,
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
		this.events.subscribe("event:onLineaConnect", this.buildAboutSection);

		this.getPendingUploads();
		this.getErrorCount();
	}

	// Get pending uploads
	getPendingUploads() {
		this.sessionsService
			.getTotalCount("uploaded=no&error=no")
			.subscribe(data => {
				this.pendingUploads = data.Count;
			});
	}

	// Get Error Count
	getErrorCount() {
		this.sessionsService
			.getTotalCount("uploaded=no&error=yes")
			.subscribe(data => {
				this.errorCount = data.Count;
			});
	}

	// Unsubscribe from events
	ionViewWillLeave() {
		this.events.unsubscribe("event:onLineaConnect", this.buildAboutSection);
	}

	// Build About Section strings
	buildAboutSection() {
		const a = this.aboutDevice;
		a.appInfo = this.infoService.getAppVersion();
		a.deviceInfo = this.infoService.getDeviceInfo();
		a.scannerStatus = this.infoService.getLineaStatus()
			? "connected"
			: "disconnected";
		a.cameraFront = this.infoService.getCameraStatus("FrontCamera")
			? "checkmark"
			: "close";
		a.cameraBack = this.infoService.getCameraStatus("RearCamera")
			? "checkmark"
			: "close";
	}

	// Click handler - leave app
	handleChangeEvents() {
		window.location.href = "http://localhost/navigate/home";
	}

	// Click handler - resync sessions
	handleSyncSessions() {
		let loader = this.loadingCtrl.create({
			content: "Syncing sessions...",
			dismissOnPageChange: true
		});
		loader.present();
		this.sessionsService.refreshSessionsThenAccessLists().subscribe(
			data => {
				loader.dismiss();
				let toast = this.toastCtrl.create({
					message: "Finished syncing sessions!",
					duration: 2500,
					position: "top"
				});
				toast.present();
			},
			err => {
				loader.dismiss();
				let toast = this.toastCtrl.create({
					message: "Unable to sync sessions at this time...",
					duration: 2500,
					position: "top"
				});
				toast.present();
			}
		);
	}

	// Click handler - upload pending scans
	handleUploadScans() {
		let loader = this.loadingCtrl.create({
			content: `Uploading ${this.pendingUploads} scans...`,
			dismissOnPageChange: true
		});
		loader.present();
		this.sessionsService.uploadAllPending().subscribe(
			data => {
				loader.dismiss();
				let errorCount = 0;
				if (data) {
					data.forEach(sched => {
						if (sched.hasOwnProperty("error") && sched["error"]) {
							errorCount++;
						}
					});
				}

				const msg =
					this.pendingUploads && data.length - errorCount > 0
						? `Finished uploading ${data.length - errorCount} scans!`
						: "No scans to upload...";
				let toast = this.toastCtrl.create({
					message: msg,
					duration: 2500,
					position: "top"
				});
				toast.present();
				if (errorCount > 0) {
					let toast = this.toastCtrl.create({
						message: `${errorCount} scans were unable to be uploaded..`,
						showCloseButton: true,
						position: "bottom",
						cssClass: "wrong-session"
					});
					toast.present();
				}
				this.getPendingUploads();
				this.getErrorCount();
			},
			err => {
				loader.dismiss();
				let toast = this.toastCtrl.create({
					message: err || `Unable to upload all pending scans...`,
					duration: 2500,
					position: "top"
				});
				toast.present();
				this.getPendingUploads();
				this.getErrorCount();
			}
		);
	}

	// Click handler - edit device name
	handleEditDeviceName() {
		let modal = this.modalCtrl.create(DeviceModal, {
			name: this.settingsService.deviceName
		});
		modal.onDidDismiss(data => {
			this.settingsService.setValue(data.name, "deviceName");
		});
		modal.present();
	}

	// Change in background upload wait time
	startNewUploadTime() {
		this.settingsService.storeCurrentSettings();
		this.sessionsService.initializeBackgroundUpload(
			this.settingsService.backgroundUploadWait
		);
	}

	// Change in toggles
	saveSettings() {
		this.settingsService.storeCurrentSettings();
	}

	// Service to send diagnostics to Validar
	sendDiagnosticsToValidar() {
		this.sessionsService.getAllScans("uploaded=no&error=no").subscribe(data => {
			const deviceData = {
				errorType: "AVE-Session Diagnostic",
				eventName: this.infoService.event.Event.Name,
				clientName: this.infoService.client.ClientName,
				sessions: data
			};
			if (data && data.length > 0) {
				Rollbar.critical(JSON.stringify(deviceData), null, () => {
					let toast = this.toastCtrl.create({
						message: `Diagnostic information sent!`,
						duration: 2500,
						position: "top"
					});
					toast.present();
				});
			}
		});
	}

	// Send Diagnostics button clicked
	sendDiagnostics() {
		let confirm = this.alertCtrl.create({
			title: "Send Diagnostics to Validar?",
			message:
				"You are about to send client diagnostic information used for troubleshooting to Validar. Do you wish to proceed?",
			buttons: [
				{
					text: "Cancel",
					role: "cancel"
				},
				{
					text: "Send",
					handler: () => {
						this.sendDiagnosticsToValidar();
					}
				}
			]
		});
		confirm.present();
	}
}
