import { BrowserModule } from "@angular/platform-browser";
import { ErrorHandler, NgModule } from "@angular/core";
import { IonicApp, IonicErrorHandler, IonicModule } from "ionic-angular";
import { HttpModule } from "@angular/http";

import { MyApp } from "./app.component";
import { SessionsPage } from "../pages/sessions/sessions";
import { SettingsPage } from "../pages/settings/settings";
import { ScanSledPage } from "../pages/scan-sled/scan-sled";
import { ScanCameraPage } from "../pages/scan-camera/scan-camera";
import { PasswordPrompt } from "../pages/password-prompt/password-prompt";

import { ScanCameraService } from "../providers/scanCameraService";
import { ScanSledService } from "../providers/scanSledService";
import { SoundService } from "../providers/soundService";
import { InformationService } from "../providers/informationService";
import { SessionsService } from "../providers/sessionsService";
import { SettingsService } from "../providers/settingsService";

import { DeviceModal } from "../pages/settings/device-modal/device-modal";
import { MoreInfoPopover } from "../pages/more-info-popover/more-info";

import { FilterDates } from "../pipes/FilterDates";
import { FilterRooms } from "../pipes/FilterRooms";
import { FilterSessionText } from "../pipes/FilterSessionText";

@NgModule({
	declarations: [
		MyApp,
		SessionsPage,
		SettingsPage,
		FilterDates,
		FilterRooms,
		FilterSessionText,
		DeviceModal,
		MoreInfoPopover,
		ScanSledPage,
		ScanCameraPage,
		PasswordPrompt
	],
	imports: [
		BrowserModule,
		HttpModule,
		IonicModule.forRoot(MyApp, {
			mode: "md"
			//,alertEnter: 'alert-wp-pop-in'
		})
	],
	bootstrap: [IonicApp],
	entryComponents: [
		MyApp,
		SessionsPage,
		SettingsPage,
		DeviceModal,
		MoreInfoPopover,
		ScanSledPage,
		ScanCameraPage
	],
	providers: [
		{ provide: ErrorHandler, useClass: IonicErrorHandler },
		ScanCameraService,
		ScanSledService,
		SoundService,
		InformationService,
		SessionsService,
		SettingsService
	]
})
export class AppModule {}
