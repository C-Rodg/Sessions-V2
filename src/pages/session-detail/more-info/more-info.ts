import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

@Component({
  selector: 'more-info-popover',
  templateUrl: 'more-info.html'
})
export class MoreInfoPopover {
  pendingCount: Number = 32;
  prevName: string = "Pre Con - Training Workshop Desktop III";
  prevDate: string = "Tues, Apr 2nd, 2017";
  

  constructor(private navParams: NavParams) {
    
  }

  ngOnInit() {
    if (this.navParams.data) {

    }
  }

}