import { Component } from '@angular/core';
import { NavController, PickerController, LoadingController } from 'ionic-angular';
import { SessionsService } from '../../providers/sessionsService';
import { SessionDetailPage } from '../session-detail/session-detail'

@Component({
  selector: 'page-sessions',
  templateUrl: 'sessions.html'
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
      private sessionsService: SessionsService      
    ) { 
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
      const pickerRooms =  [{text: '-None-', value: ''}, ...this.sessionsService.rooms.map((loc) => {
        return { text: loc, value: loc };
      })];
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
      const idx = pickerRooms.findIndex((el) => {
        return el.value === this.filterRoom;
      });
      picker.addColumn({
        name: 'rooms',
        align: 'center',
        selectedIndex: idx,
        columnWidth: '100%',
        options: pickerRooms
      });      
      picker.present();
  }
}
