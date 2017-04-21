import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as moment from 'moment';

@Component({
  selector: 'page-session-detail',
  templateUrl: 'session-detail.html'
})
export class SessionDetailPage {
  sessionTitle: string = "";
  room: string = "";
  date: string = "";
  startTime: string = "";
  endTime: string = "";
  accessListCount: Number = 84;
  scannedCount: Number = 0;
  pendingUploadCount: Number = 0;

  constructor(public navCtrl: NavController, private params: NavParams) {
    if (this.params.data) {
      const { Topic, TrackAttendance, Location, StartDateTime, EndDateTime } = this.params.data;
      this.sessionTitle = Topic;
      this.room = Location;
      const start = moment(StartDateTime);
      const end = moment(EndDateTime);
      this.startTime = start.format("h:mm A");
      this.endTime = end.format("h:mm A");
      if (start.isSame(end, 'day')) {
        this.date = start.format("dddd, MMM Do, YYYY");
      } else {
        this.date = start.format("ddd, MMM Do") + " - " + end.format("ddd, MMM Do, YYYY"); 
      }
    }
  }

  getScanPage() {

  }

  refreshAccessList() {

  }

  uploadPendingScans() {

  }
  
}
