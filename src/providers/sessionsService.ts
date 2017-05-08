import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { InformationService } from './informationService';
import { EventGuid } from '../helpers/event-guid';


@Injectable()
export class SessionsService {
    constructor(private http: Http, private infoService: InformationService) { }

    //////////////////////////////////
    //  Uploading Services 
    //////////////////////////////////

    upload(scan) {
        const url = `${this.infoService.event.Event.SessionUrl}/UploadSessionScan/${EventGuid.guid}`;
        let { SessionScanGuid, SessionGuid, DeviceId, ScanData, ScanDateTime } = scan;
        const d = {
            "scheduleItemGuid": SessionGuid,
            "sessionScanKey": SessionScanGuid,
            "deviceId": DeviceId,
            "badgeId": ScanData,
            "scanDateTime": ScanDateTime.substr(0, ScanDateTime.length - 5) // Remove ms & utc flag from date before '.000Z'
        };
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Authorization', `ValidarSession token="${this.infoService.getCurrentToken()}"`);
        return this.http.post(url, d, headers).map(res => res.json()).flatMap(() => {
            return this.markUploaded(SessionScanGuid);
        }).catch((err) => {
            if (err && err.Fault && err.Fault.Type) {
                if (err.Fault.Type === 'AlreadyExistsFault') {
                    return this.markUploaded(SessionScanGuid);
                } else if (err.Fault.Type === 'NotTrackingAttendanceFault') {
                    return this.markError(SessionScanGuid);
                } else if (err.Fault.Type === 'InvalidSessionFault') {
                    return this.infoService.updateToken().flatMap(() => {
                        return Observable.throw("UpdatedToken");
                    });
                } else {
                    alert("Upload error: " + JSON.stringify(err));
                    return Observable.throw(err);
                }
            }
            return Observable.throw(err);
        });
    }

    updateCounts() {
        // TODO: update totalscans, pending, errors, currentSession.pending, currentSession.errors
    }


    //////////////////////////////////
    //  Sessions Services 
    //////////////////////////////////

    markUploaded(scanGuid) {
        return this.http.put(`http://localhost/events/${EventGuid.guid}/sessions/scans/${scanGuid}/uploaded`, {}).map(res => res.json()).map((res) => {
            if (!res) {
                return Observable.throw('Invalid response object returned by the ajax call');
            }
            return res;
        });
    }

    markError(scanGuid) {
        return this.http.put(`http://localhost/events/${EventGuid.guid}/sessions/scans/${scanGuid}/error`, {}).map(res => res.json()).map((res) => {
            if (!res) {
                return Observable.throw('Invalid response object returned by the ajax call');
            }
            return res;
        });
    }
}