import { Component } from '@angular/core';
import { NavController, NavParams, PopoverController } from 'ionic-angular';
import * as moment from 'moment';
import { MoreInfoPopover } from './more-info/more-info';

@Component({
  selector: 'page-session-detail',
  templateUrl: 'session-detail.html'
})
export class SessionDetailPage {

  sessionTitle: string = "";
  room: string = "";
  startDate: string = "";
  rangeDate: string = "";
  startTime: string = "";
  endTime: string = "";
  accessListCount: Number = 84;
  scannedCount: Number = 237;
  pendingUploadCount: Number = 28;
  accessControl: Boolean = false;

  constructor(public navCtrl: NavController, 
      private params: NavParams,
      private popoverCtrl: PopoverController
  ) {
    if (this.params.data) {
      const { Topic, TrackAttendance, Location, StartDateTime, EndDateTime } = this.params.data;
      this.sessionTitle = Topic;
      this.room = Location;
      const start = moment(StartDateTime);
      const end = moment(EndDateTime);
      this.startTime = start.format("h:mm A");
      this.endTime = end.format("h:mm A");
      if (start.isSame(end, 'day')) {
        this.startDate = start.format("ddd, MMM Do, YYYY");
      } else {
        this.startDate = start.format("ddd, MMM Do") + " - ";
        this.rangeDate = end.format("ddd, MMM Do, YYYY");
      }
      this.accessControl = TrackAttendance;

      // Get prev/next session, total pending uploads      
    }
  }

  getScanPage() {

  }

  showPopover(ev) {
    const sessionDetails = {
      totalPending: this.pendingUploadCount,
      nextSession: {
        title: 'Desktop IV',
        startTime: '4:00 PM',
        endTime: '7:00 PM',
        date: 'Tues, Apr 2nd, 2017'
      },
      prevSession: {
        title: 'Desktop II',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        date: 'Mon, Apr 1st, 2017'
      }
    };
    let pop = this.popoverCtrl.create(MoreInfoPopover, sessionDetails);
    pop.present({ ev });
  }
  
}
