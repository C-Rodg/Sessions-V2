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

  filterRoom: string = "";
  roomListOpts: Array<any> = [];
  
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
    this.getRooms();    
  }

  // Get the unique rooms, generate roomList object
  getRooms() {
    this.roomListOpts = [{text: '-None-', value: ''}, ...this.sessionsService.rooms.map((loc) => {
      return { text: loc, value: loc };
    })];    
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
      const idx = this.roomListOpts.findIndex((el) => {
        return el.value === this.filterRoom;
      });
      picker.addColumn({
        name: 'rooms',
        align: 'center',
        selectedIndex: idx,
        columnWidth: '100%',
        options: this.roomListOpts
      });      
      picker.present();
  }
}
