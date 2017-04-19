import { Component } from '@angular/core';
import { NavController, PickerController } from 'ionic-angular';
import { SessionDetailPage } from '../session-detail/session-detail'
import * as moment from 'moment';

// TODO: REPLACE WITH ACTUAL API CALLS
const roomsArray = [
  { text: '-None-', value: '' },
  { text: 'Maple Room 1', value: 'Maple Room 1' },
  { text: 'Maple Room 2', value: 'Maple Room 2' },
  { text: 'Maple Room 3', value: 'Maple Room 3' },
  { text: 'Maple Room 6', value: 'Maple Room 6' },
  { text: 'Kaveri 1', value: 'Kaveri 1' },
  { text: 'Kaveri 2', value: 'Kaveri 2' },
  { text: 'Kaveri 3', value: 'Kaveri 3' },
];

const sessionsArray = [
  { Topic: 'Pre Con - Training Workshop Desktop I', Location: 'Kaveri 1', StartDateTime: '2017-04-01T13:00:20.789Z', EndDateTime: '2017-04-01T15:00:20.789Z', TrackAttendance: true},
  { Topic: 'Pre Con - Training Workshop Desktop II', Location: 'Kaveri 1', StartDateTime: '2017-03-29T13:00:20.789Z', EndDateTime: '2017-03-29T15:00:20.789Z', TrackAttendance: false},
  { Topic: 'Certification', Location: 'Kaveri 2', StartDateTime: '2017-04-02T13:00:20.789Z', EndDateTime: '2017-04-02T15:00:20.789Z', TrackAttendance: true},
  { Topic: 'Desktop I', Location: 'Kaveri 3', StartDateTime: '2017-04-02T08:00:20.789Z', EndDateTime: '2017-04-02T10:00:20.789Z', TrackAttendance: true},
  { Topic: 'Desktop II', Location: 'Maple Room 1', StartDateTime: '2017-04-01T10:00:20.789Z', EndDateTime: '2017-04-01T12:00:20.789Z', TrackAttendance: true},
  { Topic: 'Desktop III', Location: 'Maple Room 2', StartDateTime: '2017-03-29T12:00:20.789Z', EndDateTime: '2017-03-29T14:00:20.789Z', TrackAttendance: false},
  { Topic: 'Server 10 Qualified Associate I', Location: 'Maple Room 3', StartDateTime: '2017-04-02T14:00:20.789Z', EndDateTime: '2017-04-02T17:00:20.789Z', TrackAttendance: false},
  { Topic: 'Server 10 Qualified Associate II', Location: 'Maple Room 3', StartDateTime: '2017-04-02T16:00:20.789Z', EndDateTime: '2017-04-02T18:00:20.789Z', TrackAttendance: true},
  { Topic: 'Server 10 Qualified Associate III', Location: 'Maple Room 2', StartDateTime: '2017-04-01T16:00:20.789Z', EndDateTime: '2017-04-01T19:00:20.789Z', TrackAttendance: false},
  { Topic: 'Server Administration I', Location: 'Maple Room 1', StartDateTime: '2017-04-01T12:00:20.789Z', EndDateTime: '2017-04-01T14:00:20.789Z', TrackAttendance: false},
  { Topic: 'Server Administration II', Location: 'Maple Room 6', StartDateTime: '2017-04-01T08:00:20.789Z', EndDateTime: '2017-04-01T10:00:20.789Z', TrackAttendance: true},
  { Topic: 'Server Administration III', Location: 'Kaveri 1', StartDateTime: '2017-04-02T10:00:20.789Z', EndDateTime: '2017-04-02T12:00:20.789Z', TrackAttendance: false},
  { Topic: 'Multi-Day Event', Location: 'Maple Room 1', StartDateTime: '2017-03-29T14:00:20.789Z', EndDateTime: '2017-04-03T12:00:20.789Z', TrackAttendance: true},
];

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
  
  constructor(public navCtrl: NavController, private pickerCtrl: PickerController) {
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
          StartTime: moment(session.StartDateTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('hh:mm A'),
          EndTime: moment(session.EndDateTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('hh:mm A')
        };
    });
  }

  // Go to the session detail page
  goToSession(session) {
    console.log("GO TO THIS SESSION", session);
    this.navCtrl.push(SessionDetailPage);
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

}
