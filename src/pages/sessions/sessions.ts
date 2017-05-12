import { Component } from '@angular/core';
import { NavController, PickerController, LoadingController } from 'ionic-angular';
import { SessionsService } from '../../providers/sessionsService';
import { SessionDetailPage } from '../session-detail/session-detail'
import * as moment from 'moment';

@Component({
  selector: 'page-sessions',
  templateUrl: 'sessions.html'
})
export class SessionsPage {

  scheduleStartDate: string = "";
  scheduleEndDate: string = "";
  filterDate: string = "";

  filterRoom: string = "";
  roomList: Array<any> = [];
  
  showSearchFilter: boolean = false;
  filterSearch: string = "";
  
  constructor(
      public navCtrl: NavController, 
      private pickerCtrl: PickerController,
      private loadingCtrl: LoadingController,
      private sessionsService: SessionsService      
    ) { 
  }

  ionViewWillEnter() {
    this.getDates();
    this.getRooms();    
  }

  // Get the unique rooms, generate roomList object
  getRooms() {
    this.sessionsService.getUniqueLocations().subscribe((data) => {
      if (data.Locations && data.Locations.length > 0) {
        const sortedRooms = data.Locations.sort();
        let roomObj = sortedRooms.map((loc) => {
          return { text: loc, value: loc };
        });
        roomObj.unshift({text: '-None-', value: ''});
        this.roomList = roomObj;
      }
    });
  }

  // Get the unique schedule dates, assign filter date to a time between start/end dates
  getDates() {    
    this.sessionsService.getUniqueStartDates().subscribe((data) => {
      if (data.StartDates && data.StartDates.length > 0) { 
        const uniqueDates = data.StartDates.sort();     
        const startDate = moment(uniqueDates[0], 'YYYY-MM-DD');
        const endDate = moment(uniqueDates[uniqueDates.length - 1], 'YYYY-MM-DD');
        const now = moment();
        if (now.isBetween(startDate, endDate, 'day', '[]')) {
          this.filterDate = now.format('YYYY-MM-DD');
        } else if (now.isAfter(endDate)) {
          this.filterDate = endDate.format('YYYY-MM-DD');
        } else {
          this.filterDate = startDate.format('YYYY-MM-DD');
        }
        this.scheduleStartDate = startDate.format('YYYY-MM-DD');
        this.scheduleEndDate = endDate.format('YYYY-MM-DD');
      }
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
}
