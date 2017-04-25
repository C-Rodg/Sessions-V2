import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { SessionsPage } from '../pages/sessions/sessions';
import { SettingsPage } from '../pages/settings/settings';
import { SessionDetailPage } from '../pages/session-detail/session-detail';
import { ScanSledPage } from '../pages/scan-sled/scan-sled';
import { ScanCameraPage } from '../pages/scan-camera/scan-camera';

import { DeviceModal } from '../pages/settings/device-modal/device-modal';
import { MoreInfoPopover } from '../pages/session-detail/more-info/more-info';

import { FilterDates } from '../pipes/FilterDates';
import { FilterRooms } from '../pipes/FilterRooms';
import { FilterSessionText } from '../pipes/FilterSessionText';

@NgModule({
  declarations: [
    MyApp,
    SessionsPage,
    SettingsPage,
    SessionDetailPage,
    FilterDates,
    FilterRooms,
    FilterSessionText,
    DeviceModal,
    MoreInfoPopover,
    ScanSledPage,
    ScanCameraPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {
      mode: 'md'
    }),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    SessionsPage,
    SettingsPage,
    SessionDetailPage,
    DeviceModal,
    MoreInfoPopover,
    ScanSledPage,
    ScanCameraPage
  ],
  providers: [
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
