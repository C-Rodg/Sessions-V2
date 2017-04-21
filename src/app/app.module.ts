import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { SessionsPage } from '../pages/sessions/sessions';
import { SettingsPage } from '../pages/settings/settings';
import { SessionDetailPage } from '../pages/session-detail/session-detail';

import { DeviceModal } from '../pages/settings/device-modal/device-modal';
import { MoreInfoPopover } from '../pages/session-detail/more-info/more-info';

import { FilterDates } from '../pipes/FilterDates';
import { FilterRooms } from '../pipes/FilterRooms';
import { FilterSessionText } from '../pipes/FilterSessionText';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

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
    MoreInfoPopover
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
    MoreInfoPopover
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
