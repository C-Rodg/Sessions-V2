import { Component } from '@angular/core';
import { NavController, PickerController } from 'ionic-angular';
import { SessionDetailPage } from '../session-detail/session-detail'

// TODO: sort by text? - except -none-
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
  { topic: 'Pre Con - Training Workshop Desktop I', location: 'Kaveri 1', start: '08:00 AM', end: '10:00 AM'},
  { topic: 'Pre Con - Training Workshop Desktop II', location: 'Kaveri 1', start: '10:00 AM', end: '12:00 PM'},
  { topic: 'Certification', location: 'Kaveri 2', start: '08:00 AM', end: '10:00 AM'},
  { topic: 'Desktop I', location: 'Kaveri 3', start: '08:00 AM', end: '10:00 AM'},
  { topic: 'Desktop II', location: 'Maple Room 1', start: '08:00 AM', end: '10:00 AM'},
  { topic: 'Desktop III', location: 'Maple Room 2', start: '10:00 AM', end: '12:00 PM'},
  { topic: 'Server 10 Qualified Associate I', location: 'Maple Room 3', start: '12:00 PM', end: '02:00 PM'},
  { topic: 'Server 10 Qualified Associate II', location: 'Maple Room 3', start: '02:00 PM', end: '04:00 PM'},
  { topic: 'Server 10 Qualified Associate III', location: 'Maple Room 2', start: '04:00 PM', end: '06:00 PM'},
  { topic: 'Server Administration I', location: 'Maple Room 1', start: '10:00 AM', end: '12:00 PM'},
  { topic: 'Server Administration II', location: 'Maple Room 6', start: '03:00 PM', end: '05:00 PM'},
  { topic: 'Server Administration III', location: 'Kaveri 1', start: '01:00 PM', end: '03:00 PM'},
];

@Component({
  selector: 'page-sessions',
  templateUrl: 'sessions.html'
})
export class SessionsPage {

  filterDate: string = "2017-04-01T13:47:20.789Z";
  filterRoom: string = "";
  showSearchFilter: boolean = false;
  filterSearch: string = "";
  sessionList: Array<any> = [];
  filteredSessions: Array<any> = [];
  
  constructor(public navCtrl: NavController, private pickerCtrl: PickerController) {
    this.sessionList = sessionsArray;
  }

  // Change in Date Event
  updateDateFilter() {
    console.log(this.filterDate);
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

  // Filter by text
  onSearchInput(val) {
    console.log(val);
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
          console.log(data);
          this.filterRoom = data.rooms.value;
        }
      });
      const idx = roomsArray.findIndex((el) => {
        return el.value === this.filterRoom;
      });
      picker.addColumn({
        name: 'rooms',
        align: 'center',
        selectedIndex: idx,
        columnWidth: '100%',
        options: roomsArray
      });      
      picker.present();
  }

  // DEV - LOG VALUE
  logFilter() {
    console.log(this.filterDate);
  }
}
