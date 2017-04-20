import { Component } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

@Component({
  selector: 'device-modal',
  templateUrl: 'device-modal.html'
})
export class DeviceModal {
    
    name: string = "";

    constructor(private viewCtrl: ViewController, private params: NavParams) {
        this.name = this.params.get('name');
    }

    dismiss() {
      this.viewCtrl.dismiss({name: this.name});
    }
    
}