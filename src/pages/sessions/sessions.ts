import { Component } from "@angular/core";
import {
	NavController,
	PickerController,
	LoadingController
} from "ionic-angular";
import { SessionsService } from "../../providers/sessionsService";
import { InformationService } from "../../providers/informationService";
import { ScanCameraPage } from "../scan-camera/scan-camera";
import { ScanSledPage } from "../scan-sled/scan-sled";

@Component({
	selector: "page-sessions",
	templateUrl: "sessions.html"
})
export class SessionsPage {
	// Filters for search text and room, date is held in sessionsService
	showSearchFilter: boolean = false;
	filterSearch: string = "";
	filterRoom: string = "";

	constructor(
		public navCtrl: NavController,
		private pickerCtrl: PickerController,
		private loadingCtrl: LoadingController,
		private sessionsService: SessionsService,
		private infoService: InformationService
	) {}

	// Go to the session detail page
	goToSession(session) {
		this.infoService.getClientInfo().subscribe(
			data => {
				if (this.infoService.getLineaStatus()) {
					this.navCtrl.push(ScanSledPage, session).catch(eee => {
						alert(
							"There seems to be an issue loading the scan page..\n" +
								JSON.stringify(eee)
						);
					});
				} else {
					this.navCtrl.push(ScanCameraPage, session).catch(eee => {
						alert(
							"There seems to be an issue loading the scan page..\n" +
								JSON.stringify(eee)
						);
					});
				}
			},
			err => {
				console.log("error data!");
				console.log(err);
				this.navCtrl.push(ScanCameraPage, session).catch(eee => {
					alert(
						"There seems to be an issue loading the scan page..\n" +
							JSON.stringify(eee)
					);
				});
			}
		);
	}

	// Toggle showing of search filter
	toggleSearchBox() {
		this.showSearchFilter = !this.showSearchFilter;
		this.filterSearch = "";
	}

	// Open custom picker, set current room filter
	openFilterRooms() {
		const pickerRooms = [
			{ text: "-None-", value: "" },
			...this.sessionsService.rooms.map(loc => {
				return { text: loc, value: loc };
			})
		];
		let picker = this.pickerCtrl.create();
		picker.addButton({
			text: "Cancel",
			role: "cancel"
		});
		picker.addButton({
			text: "Done",
			handler: (data: any) => {
				this.filterRoom = data.rooms.value;
			}
		});
		const idx = pickerRooms.findIndex(el => {
			return el.value === this.filterRoom;
		});
		picker.addColumn({
			name: "rooms",
			align: "center",
			selectedIndex: idx,
			columnWidth: "100%",
			options: pickerRooms
		});
		picker.present();
	}
}
