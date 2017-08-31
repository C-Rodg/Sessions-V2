import { Component, NgZone } from "@angular/core";
import {
	NavController,
	NavParams,
	AlertController,
	ToastController,
	LoadingController,
	Events,
	PopoverController
} from "ionic-angular";

import { ScanCameraService } from "../../providers/scanCameraService";
import { SessionsService } from "../../providers/sessionsService";
import { SettingsService } from "../../providers/settingsService";
import { SoundService } from "../../providers/soundService";
import { ScanSledPage } from "../scan-sled/scan-sled";
import { MoreInfoPopover } from "../more-info-popover/more-info";

import * as moment from "moment";

//const wrongSessionTime = 600000; // 10 minutes
const wrongSessionTime = 60000;
const notificationTime = 1000;

@Component({
	selector: "scan-camera",
	templateUrl: "scan-camera.html"
})
export class ScanCameraPage {
	scannedCount: number = 0;
	accessListCount: number = 0;
	globalCount: number = 0;

	showLocalScans: boolean = true;

	session = {};
	prevSession = {};
	nextSession = {};
	orderedSessions: Array<any> = [];

	leaveCameraMsg: boolean = false;
	wrongSessionInterval: any;

	openPassword: boolean = false;
	showAcceptedBackground: boolean = false;
	showDeniedBackground: boolean = false;

	constructor(
		private scanCameraService: ScanCameraService,
		private sessionsService: SessionsService,
		private settingsService: SettingsService,
		private zone: NgZone,
		private params: NavParams,
		private events: Events,
		private alertCtrl: AlertController,
		private toastCtrl: ToastController,
		private soundService: SoundService,
		private loadingCtrl: LoadingController,
		private popoverCtrl: PopoverController,
		private navCtrl: NavController
	) {
		this.session = this.params.data;
		this.onLineaConnect = this.onLineaConnect.bind(this);
	}

	// Get session scan counts, access list counts, determine prev/next sessions
	ionViewWillEnter() {
		// Get Session Scan counts
		this.getSessionScanCount();

		// If access control, get access list count
		if (this.session["AccessControl"]) {
			this.getAccessListCount();
		}

		// Get room list, determine prev/next sessions..
		this.determineSessionOrder(
			this.session["Location"],
			this.session["SessionGuid"]
		);
	}

	// Set OnDataRead, subscribe to onLineaConnect, calculate position and then turn on camera, check for wrong session
	ionViewDidEnter() {
		(<any>window).OnDataRead = this.onZoneDataRead.bind(this);
		this.events.subscribe("event:onLineaConnect", this.onLineaConnect);
		this.scanCameraService.calculatePosition();
		this.scanCameraService.turnOn();

		this.checkForWrongSession();
		this.wrongSessionInterval = setInterval(
			this.checkForWrongSession.bind(this),
			wrongSessionTime
		);
	}

	// Shut off camera on leaving, disallow scanning, unsubscribe from events
	ionViewWillLeave() {
		this.scanCameraService.turnOff();
		(<any>window).OnDataRead = function() {};
		this.events.unsubscribe("event:onLineaConnect", this.onLineaConnect);
		clearInterval(this.wrongSessionInterval);
	}

	// Check for wrong session loaded
	checkForWrongSession() {
		let currentDate = moment();
		let startDate = moment(
			this.session["StartDateTime"],
			"YYYY-MM-DDTHH:mm:ss.SSS"
		).subtract(2, "h"); // 2 hours before
		let endDate = moment(
			this.session["EndDateTime"],
			"YYYY-MM-DDTHH:mm:ss.SSS"
		).add(5, "m"); // 5 mins after
		let msg = "";
		if (currentDate.isBetween(startDate, endDate, null, "[]")) {
			return false;
		} else if (currentDate.isBefore(startDate)) {
			msg = "Session hasn't started..";
		} else {
			msg = "This session is over..";
		}
		let toast = this.toastCtrl.create({
			message: msg,
			position: "bottom",
			cssClass: "wrong-session",
			showCloseButton: true,
			closeButtonText: "Dismiss",
			dismissOnPageChange: true
		});
		toast.present();
	}

	// Check if user wants to leave camera page
	onLineaConnect() {
		if (!this.leaveCameraMsg) {
			this.leaveCameraMsg = true;
			this.scanCameraService.turnOff();
			let msg = this.alertCtrl.create({
				title: "Sled scanner detected",
				message: "Do you want to leave the camera scanning page?",
				buttons: [
					{
						text: "Stay",
						handler: () => {
							this.leaveCameraMsg = false;
							this.scanCameraService.turnOn();
						}
					},
					{
						text: "Leave",
						handler: () => {
							this.leaveCameraMsg = false;
							this.navCtrl.pop({ animate: false, duration: 0 });
							this.navCtrl.push(ScanSledPage, this.session, {
								animate: false,
								duration: 0
							});
						}
					}
				]
			});
			msg.present();
		}
	}

	// Handle Scanning functionality for onDataRead
	handleScan(d) {
		let scannedData = d[0].Data,
			symbology = d[0].Symbology,
			scannedId = null;

		let checkSymbology = symbology;
		if (checkSymbology != null) {
			checkSymbology = checkSymbology.replace(/\s+/g, "").toUpperCase();
		}

		if (checkSymbology === "CODE3OF9" || checkSymbology === "CODE39") {
			scannedId = scannedData;
		} else if (checkSymbology === "QRCODE") {
			// Test for Validar QR code
			if (scannedData != null && scannedData.substring(0, 4) === "VQC:") {
				scannedData = scannedData.substring(4);
				const scannedFields = scannedData.split(";");
				if (scannedFields != null) {
					for (let i = 0; i < scannedFields.length; i++) {
						const field = scannedFields[i].split(":");
						if (field != null && field.length > 0) {
							// Currently ignoring field[0] === 'T' || 'S'...
							if (field[0] === "ID") {
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

		// Remove extra spaces around ID
		scannedId = scannedId.replace(/^\s+|\s+$/g, "");

		if (scannedId && scannedId.length < 384) {
			if (this.settingsService.capacityCheck && this.session["Capacity"]) {
				this.sessionsService
					.getCount(this.session["SessionGuid"], "distinct=scan")
					.subscribe(
						data => {
							if (data.Count && data.Count >= this.session["Capacity"]) {
								this.soundService.playDenied();
								this.alertDenied("Session at capacity.");
							} else {
								this.pushNewScan(scannedId);
							}
						},
						err => {
							this.pushNewScan(scannedId);
						}
					);
			} else {
				this.pushNewScan(scannedId);
			}
		} else {
			this.soundService.playDenied();
			this.alertDenied("Invalid badgeId value");
			return false;
		}
	}

	// Validate and push new scan
	pushNewScan(id) {
		const newScan = {
			SessionGuid: this.session["SessionGuid"],
			ScanData: id,
			DeviceId: this.settingsService.deviceName,
			ScanDateTime: new Date()
		};
		if (this.session["AccessControl"] && this.settingsService.accessControl) {
			this.sessionsService.getAccess(this.session["SessionGuid"], id).subscribe(
				data => {
					if (data.Fault && data.Fault.Type === "NotFoundFault") {
						this.soundService.playDenied();
						if (this.settingsService.accessControlOverride) {
							// Create confirmation for allow deny attendee
							let confirm = this.alertCtrl.create({
								title: "Not on access list",
								message: "Allow this attendee into session?",
								cssClass: "confirm-entry",
								buttons: [
									{
										text: "Deny",
										role: "cancel",
										handler: () => {
											this.scanCameraService.turnOn();
											this.alertDenied();
										}
									},
									{
										text: "Allow",
										cssClass: "confirm-allow",
										handler: () => {
											this.sessionsService.saveScan(newScan).subscribe(
												data => {
													this.soundService.playAccepted();
													this.scanCameraService.turnOn();
													this.alertAllowed();
													this.scannedCount += 1;
												},
												err => {
													this.scanCameraService.turnOn();
													this.alertDenied(
														"There was an issue saving that scan..."
													);
												}
											);
										}
									}
								]
							});
							this.scanCameraService.turnOff();
							confirm.present();
						} else {
							this.alertDenied();
						}
					} else {
						// Allow entry
						this.sessionsService.saveScan(newScan).subscribe(
							data => {
								this.soundService.playAccepted();
								this.alertAllowed();
								this.scannedCount += 1;
							},
							err => {
								this.soundService.playDenied();
								this.alertDenied("There was an issue saving that scan...");
							}
						);
					}
				},
				err => {
					this.soundService.playDenied();
					this.alertDenied("There was an issue checking the access list...");
				}
			);
		} else {
			this.sessionsService.saveScan(newScan).subscribe(
				data => {
					this.soundService.playAccepted();
					this.alertAllowed();
					this.scannedCount += 1;
				},
				err => {
					this.soundService.playDenied();
					this.alertDenied("There was an issue saving that scan...");
				}
			);
		}
	}

	// Zone function that runs window.OnDataRead
	onZoneDataRead(data) {
		this.zone.run(() => {
			this.handleScan(data);
		});
	}

	// Turn Front/Back camera
	toggleCamera() {
		this.scanCameraService.toggleCamera();
	}

	// Password Prompt - Cancel Event Handler
	promptCancelled() {
		this.scanCameraService.turnOn();
		this.openPassword = false;
	}

	// Password Prompt - Unlock Event Handler
	promptUnlocked() {
		this.scanCameraService.turnOn();
		this.openPassword = false;
		this.session["isLocked"] = false;
	}

	// Toggle lock/unlock of sessions
	openPasswordModal() {
		if (this.session["isLocked"]) {
			this.scanCameraService.turnOff();
			this.openPassword = true;
		} else {
			this.session["isLocked"] = true;
		}
	}

	// Present a success toast notification
	alertAllowed() {
		let toast = this.toastCtrl.create({
			message: "Successfully allowed in!",
			duration: notificationTime,
			position: "top",
			cssClass: "notify-confirm"
		});
		this.showAcceptedBackground = true;
		toast.present();
		setTimeout(
			function() {
				this.showAcceptedBackground = false;
			}.bind(this),
			notificationTime
		);
	}

	// Present a denied toast notification
	alertDenied(errorMsg?) {
		const msg = !errorMsg ? "Attendee denied access." : errorMsg;
		let toast = this.toastCtrl.create({
			message: msg,
			duration: notificationTime,
			position: "top",
			cssClass: "notify-cancel"
		});
		this.showDeniedBackground = true;
		toast.present();

		setTimeout(
			function() {
				this.showDeniedBackground = false;
			}.bind(this),
			notificationTime
		);
	}

	// Get session scan count
	getSessionScanCount() {
		this.sessionsService.getCount(this.session["SessionGuid"]).subscribe(
			data => {
				this.scannedCount = data.Count;
			},
			err => {}
		);
	}

	// Get the access list count
	getAccessListCount() {
		this.sessionsService.getAccessCount(this.session["SessionGuid"]).subscribe(
			data => {
				this.accessListCount = data.Count;
			},
			err => {}
		);
	}

	// Search for all sessions in this room, assign prev/next sessions
	determineSessionOrder(room, guid) {
		const q = room ? `location=${room}` : "";
		this.sessionsService.searchSessions(q).subscribe(data => {
			this.orderedSessions = data;
			const currentSessionIndex = this.getCurrentSessionIndex(
				this.orderedSessions,
				guid
			);
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
		return arr.findIndex(sess => {
			return sess.SessionGuid === guid;
		});
	}

	// Show more info popover
	showPopover(ev) {
		this.scanCameraService.turnOff();
		const sessionDetails = {
			nextSession: this.nextSession,
			prevSession: this.prevSession,
			isLocked: this.session["isLocked"]
		};
		let pop = this.popoverCtrl.create(MoreInfoPopover, sessionDetails);
		pop.present({ ev });
		pop.onDidDismiss(data => {
			if (data === "next") {
				let sess = this.nextSession;
				sess["isLocked"] = this.session["isLocked"] ? true : false;
				const currentPageIdx = this.navCtrl.getActive().index;
				this.navCtrl.remove(currentPageIdx, 1, { duration: 0 }).then(() => {
					this.navCtrl.push(ScanCameraPage, sess, { duration: 0 });
				});
				return false;
			} else if (data === "prev") {
				let sess = this.prevSession;
				sess["isLocked"] = this.session["isLocked"] ? true : false;
				const currentPageIdx = this.navCtrl.getActive().index;
				this.navCtrl.remove(currentPageIdx, 1, { duration: 0 }).then(() => {
					this.navCtrl.insert(1, ScanCameraPage, sess, { duration: 0 });
				});
				return false;
			} else {
				this.scanCameraService.turnOn();
				return false;
			}
		});
	}

	// Click Handler - Refresh Access List
	refreshAccessList() {
		this.scanCameraService.turnOff();
		let loader = this.loadingCtrl.create({
			content: "Refreshing access list...",
			dismissOnPageChange: true
		});
		loader.present();
		this.sessionsService.fetchAccess(this.session["SessionGuid"]).subscribe(
			data => {
				loader.dismiss();
				this.getAccessListCount();
				this.scanCameraService.turnOn();
				let toast = this.toastCtrl.create({
					message: "Access list refreshed!",
					duration: 2500,
					position: "top"
				});
				toast.present();
			},
			err => {
				loader.dismiss();
				this.scanCameraService.turnOn();
				let toast = this.toastCtrl.create({
					message: "Unable to refresh access list...",
					duration: 2500,
					position: "top"
				});
				toast.present();
			}
		);
	}

	// Toggle scan numbers between local and global
	toggleScanNumbers() {
		if (this.showLocalScans) {
			this.showLocalScans = false;
			if (window.navigator.onLine) {
				this.sessionsService
					.sessionCountCentral(this.session["SessionGuid"])
					.subscribe(
						d => {
							this.globalCount = d;
							this.scanCameraService.calculatePosition();
							this.scanCameraService.turnOn();
						},
						err => {}
					);
			}
		} else {
			this.showLocalScans = true;
			this.scanCameraService.calculatePosition();
			this.scanCameraService.turnOn();
		}
	}
}
