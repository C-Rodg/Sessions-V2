import { Component } from '@angular/core';
import { NavController, PickerController } from 'ionic-angular';
import { SessionsService } from '../../providers/sessionsService';
import { SessionDetailPage } from '../session-detail/session-detail'
import * as moment from 'moment';

import { roomsArray, sessionsArray } from '../../test-data/mock-data';

@Component({
  selector: 'page-sessions',
  templateUrl: 'sessions.html'
})
export class SessionsPage {

  filterDate: string = "2017-03-29T13:47:20.789Z";
  filterRoom: string = "";
  showSearchFilter: boolean = false;
  filterSearch: string = "";
  fullSessionList: Array<any> = [];
  roomList: Array<any> = [];
  
  constructor(
      public navCtrl: NavController, 
      private pickerCtrl: PickerController,
      private sessionsService: SessionsService      
    ) {
    this.fullSessionList = this.parseDateValues(sessionsArray);   
    this.roomList = roomsArray; 
  }

  // Helper - Parse dates/times for display values
  parseDateValues(arr) {
    return arr.map((session) => {
        return {
          Topic: session.Topic,
          TrackAttendance: session.TrackAttendance,
          Location: session.Location,
          StartDateTime: session.StartDateTime,
          EndDateTime: session.EndDateTime,
          StartTime: moment(session.StartDateTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('h:mm A'),
          EndTime: moment(session.EndDateTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('h:mm A')
        };
    });
  }

  // Go to the session detail page
  goToSession(session) {    
    this.navCtrl.push(SessionDetailPage, session);
  }

  // Toggle showing of search filter
  toggleSearchBox() {
    this.showSearchFilter = !this.showSearchFilter;
    this.filterSearch = "";
  }

  // Open custom picker, set current room filter
  openFilterRooms() {
      let picker = this.pickerCtrl.create();
      picker.addButton({
        text: 'Cancel',
        role: 'cancel'
      });
      picker.addButton({
        text: 'Done',
        handler: (data: any) => {
            this.filterRoom = data.rooms.value;         
        }
      });
      const idx = this.roomList.findIndex((el) => {
        return el.value === this.filterRoom;
      });
      picker.addColumn({
        name: 'rooms',
        align: 'center',
        selectedIndex: idx,
        columnWidth: '100%',
        options: this.roomList
      });      
      picker.present();
  }

  testMethod() {
    const scheduleGuidAC = 'eb31279e-a9fc-44f2-8cae-372d17ed7c5d';
    const scheduleGuidNoAC= 'a5fbc15d-1983-4c2a-b753-37fff0d9adda';
    this.sessionsService.sessionCountCentral(scheduleGuidAC).subscribe((data) => {
      alert(JSON.stringify(data));
    }, (err) => {
      alert("ERROR!");
      alert(JSON.stringify(err));
    });
  }

}
