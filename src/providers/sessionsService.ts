import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';
import { InformationService } from './informationService';
import { EventGuid } from '../helpers/event-guid';


@Injectable()
export class SessionsService {

    allSessions = [];

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

    fetchSessions() {
        let headers = new Headers();
        headers.append('Authorization', `ValidarSession token="${this.infoService.getCurrentToken()}"`);
        return this.http.get(`${this.infoService.event.Event.SessionUrl}/ListAttendanceTrackingScheduleItemSessions/${EventGuid.guid}`, headers).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else {
                return res;
            }
        }).catch((err) => {
            if (err && err.Fault && err.Fault.Type === 'InvalidSessionFault') {
                return this.infoService.updateToken().flatMap(() => {
                    return Observable.throw("UpdatedToken");
                });
            } else {
                return Observable.throw(err);
            }
        });
    }

    fetchAccess(scheduleItemGuid) {
        let headers = new Headers();
        headers.append('Authorization', `ValidarSession token="${this.infoService.getCurrentToken()}"`);
        return this.http.get(`${this.infoService.event.Event.AccessControlUrl}/${EventGuid.guid}/SessionAccessList/${scheduleItemGuid}`, headers).map(res => res.json()).map((res) => {
            if (res.Fault) {
                alert("Load session access list fault: " + res.Fault.Type);
            } else {
                return this.saveAccessList(scheduleItemGuid, res);
            }
        }).catch((err) => {
            if (err && err.Fault && err.Fault.Type === 'InvalidSessionFault') {
                return this.infoService.updateToken().flatMap(() => {
                    return Observable.throw("UpdatedToken");
                });
            } else {
                return Observable.throw(err);
            }
        });
    }

    saveAccessList(sessionGuid, registrantRecords) {
        return this.http.put(`http://localhost/events/${EventGuid.guid}/sessions/${sessionGuid}/accesslist`, JSON.stringify(registrantRecords)).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else {
                return res;
            }
        });
    }

    sessionCountCentral(scheduleItemGuid) {
        let headers = new Headers();
        headers.append('Authorization', `ValidarSession token="${this.infoService.getCurrentToken()}"`);
        return this.http.get(`${this.infoService.event.Event.SessionUrl}/CountAttendeesAtSession/${EventGuid.guid}/${scheduleItemGuid}`, headers).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else {
                return res;
            }
        }).catch((err) => {
            if (err && err.Fault && err.Fault.Type === 'InvalidSessionFault') {
                this.infoService.updateToken().flatMap(() => {
                    return Observable.throw("UpdatedToken");
                });
            } else {
                return Observable.throw(err);
            }
        });
    }

    saveScan(scan) {
        return this.http.put(`http://localhost/events/${EventGuid.guid}/sessions/scans`, JSON.stringify(scan)).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            }
            return res;
        });
    }

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

    all() {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else {
                this.allSessions = [];
                res.Sessions.forEach((session) => {
                    // TODO: PROCESS SESSION w/ ProcessSessionDate(session); and set filter/order by?
                    this.allSessions.push(session);
                });
                // return res or this.allSessions?
                return res;
            }
        });
    }

    searchSessions(options) {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions?${options}`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else {
                // TODO: PROCESS SESSION and return?
                return res;
            }
        });
    }

    countSessions(options) {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/count?${options}`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else if (res.hasOwnProperty("Count") && res.Sessions !== null) {
                return res.Count;
            } else {
                return Observable.throw("Invalid response object returned by the ajax call.");
            }
        });
    }

    get(sessionGuid) {
        if (this.allSessions.length > 0) {
            const match = this.allSessions.filter((session) => {
                return session.SessionGuid === sessionGuid;
            })[0];
            return Observable.of(match);
        } else {
            return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/${sessionGuid}`).map(res => res.json()).map((res) => {
                if (res.Fault) {
                    return Observable.throw(res.Fault);
                } else if (res.Session) {
                    // TODO: PROCESS SESSION and return..
                    return res.Session;
                } else {
                    Observable.throw("Invalid response object returned by the ajax call.");
                }
            });
        }
    }

    getAccess(sessionGuid, badgeId) {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/${sessionGuid}/accessList/${badgeId}`).map(res => res.json());
    }

    getScans(sessionGuid, options) {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/${sessionGuid}/scans?${options}`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else if (res.hasOwnProperty('SessionScans') && res.SessionScans !== null) {
                return res.SessionScans;
            } else {
                return Observable.throw("Invalid response object returned by the ajax call.");
            }
        });
    }

    getAllScans(options) {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/scans?${options}`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else if (res.hasOwnProperty("SessionScans") && res.SessionScans !== null) {
                return res.SessionScans;
            } else {
                return Observable.throw("Invalid response object returned by the ajax call.");
            }
        });
    }

    getCount(sessionGuid, options) {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/${sessionGuid}/scans/count?${options}`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            }
            return res;
        });
    }

    getTotalCount(options) {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/scans/count?${options}`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            }
            return res;
        });
    }

    getAccessCount(sessionGuid) {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/${sessionGuid}/accessList/count`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            }
            return res;
        });
    }

    getUniqueLocations() {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/locations`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            }
            return res;
        });
    }

    getUniqueStartDates() {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/startdates`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            }
            return res;
        });
    }
}