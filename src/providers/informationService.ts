import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ClientInfo } from '../interfaces/client-info';

@Injectable()
export class InformationService {

    client: ClientInfo;

    constructor(private http: Http) { }

    startUpApplication() {
        return this.getClientInfo();
    }

    //////////////////////////////////
    //  Client Info 
    //////////////////////////////////

    getClientInfo() {
        return this.http.get('http://localhost/clientinfo').map(res => res.json()).map((res) => {
            this.client = res;
            return res;
        });
    }

    getAppVersion() : string {
        const c = this.client;
        return `${c.Application} version ${c.ApplicationVersion}`;
    }

    getDeviceInfo()  : string {
        const c = this.client;
        const sys = c.SystemName === 'iPhone OS' ? 'iOS' : c.SystemName;
        return `${c.DeviceType} running ${sys} ${c.SystemVersion}`;
    }

    getCameraStatus(camera) : boolean {
        return this.client[camera]; // FrontCamera, RearCamera
    }

    getLineaStatus() : boolean {
        return (!this.client.Scanner || this.client.Scanner === 'None') ? false : true;
    }

}