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

  popoverPage: any;

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

      this.popoverPage = this.popoverCtrl.create(MoreInfoPopover);
    }
  }

  getScanPage() {

  }

  showPopover(ev) {
    this.popoverPage.present({ ev });
  }
  
}
