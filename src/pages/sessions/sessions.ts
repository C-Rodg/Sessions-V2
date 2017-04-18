import { Component } from '@angular/core';
import { NavController, PickerController } from 'ionic-angular';

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

@Component({
  selector: 'page-sessions',
  templateUrl: 'sessions.html'
})
export class SessionsPage {

  filterDate: string = "2017-04-01T13:47:20.789Z";
  filterRoom: string = "";
  showSearchFilter: boolean = false;
  filterSearch: string = "";
  
  constructor(public navCtrl: NavController, private pickerCtrl: PickerController) {
    
  }

  // Toggle showing of search filter
  toggleSearchBox() {
    this.showSearchFilter = !this.showSearchFilter;
    this.filterSearch = "";
  }

  // Filter by text
  filterSearchText(ev) {
    console.log("SEARCHING");
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
}
