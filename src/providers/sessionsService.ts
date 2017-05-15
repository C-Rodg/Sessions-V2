import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';
import * as moment from 'moment';

import { InformationService } from './informationService';
import { EventGuid } from '../helpers/eventGuid';


@Injectable()
export class SessionsService {

    backgroundInterval = null;
    allSessions = [];
    activeSession = null;
    filterDate: string = "";
    scheduleStartDate: string = "";
    scheduleEndDate: string = "";
    rooms: any = [];

    constructor(private http: Http, private infoService: InformationService) { 
        this.activeSession = localStorage.getItem('ActiveSession');
    }

    // Assign props - allSessions, scheduleStartDate, scheduleEndDate, filterDate, and rooms
    startUpSessions() {
        return this.all().flatMap(() => this.refreshRoomsAndDates());
    }

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
        return this.http.post(url, d, { headers }).map(res => res.json()).flatMap(() => {
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

    // Get all sessions from central
    fetchSessions() {
        let headers = new Headers();
        headers.append('Authorization', `ValidarSession token="${this.infoService.getCurrentToken()}"`);
        return this.http.get(`${this.infoService.event.Event.SessionUrl}/ListAttendanceTrackingScheduleItemSessions/${EventGuid.guid}`, { headers }).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else {
                return res.ScheduleItemSessions;
            }
        }).catch((err) => {
            let error = err.json();
            if (error.Fault && error.Fault.Type === 'InvalidSessionFault') {
                return this.infoService.updateToken().flatMap(() => {
                    return this.http.get(`${this.infoService.event.Event.SessionUrl}/ListAttendanceTrackingScheduleItemSessions/${EventGuid.guid}`, { headers }).map(res => res.json()).map((d) => {
                        if (d.Fault) {
                            return Observable.throw(d.Fault);
                        } else {
                            return d.ScheduleItemSessions;
                        }
                    })
                });
            } else {
                 return Observable.throw(err);
            }
        });
    }    

    // For a scheduleItemGuid, fetch the access control list and then save to local
    fetchAccess(scheduleItemGuid) {
        let headers = new Headers();
        headers.append('Authorization', `ValidarSession token="${this.infoService.getCurrentToken()}"`);
        return this.http.get(`${this.infoService.event.Event.AccessControlUrl}/${EventGuid.guid}/SessionAccessList/${scheduleItemGuid}`, { headers }).map(res => res.json()).map((res) => {
            if (res.Fault) {
                alert("Load session access list fault: " + res.Fault.Type);
                return Observable.throw(res.Fault);
            } 
            return res;
        }).flatMap((res) => {
            return this.saveAccessList(scheduleItemGuid, res);
        })        
        .catch((err) => {
            let error = err.json();
            if (error.Fault && error.Fault.Type === 'InvalidSessionFault') {
                return this.infoService.updateToken().flatMap(() => {
                    return this.http.get(`${this.infoService.event.Event.AccessControlUrl}/${EventGuid.guid}/SessionAccessList/${scheduleItemGuid}`, { headers }).map(res => res.json())
                        .flatMap((res) => this.saveAccessList(scheduleItemGuid, res));
                });
            } else {
                return Observable.throw(err);
            }
        });
    }

    // For a session guid and array of reg records, save the access list to local
    saveAccessList(sessionGuid, registrantRecords) {
        return this.http.put(`http://localhost/events/${EventGuid.guid}/sessions/${sessionGuid}/accesslist`, JSON.stringify(registrantRecords)).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else {
                return res;
            }
        });
    }

    // For a scheduleItemGuid, get the total session count from Central
    sessionCountCentral(scheduleItemGuid) {
        let headers = new Headers();
        headers.append('Authorization', `ValidarSession token="${this.infoService.getCurrentToken()}"`);
        return this.http.get(`${this.infoService.event.Event.SessionUrl}/CountAttendeesAtSession/${EventGuid.guid}/${scheduleItemGuid}`, { headers }).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else {
                return res;
            }
        }).catch((err) => {
            let error = err.json();
            if (error.Fault && error.Fault.Type === 'InvalidSessionFault') {
                return this.infoService.updateToken().flatMap(() => {
                    return this.http.get(`${this.infoService.event.Event.SessionUrl}/CountAttendeesAtSession/${EventGuid.guid}/${scheduleItemGuid}`, { headers }).map(res => res.json());
                });
            } else {
                return Observable.throw(err);
            }
        });
    }

    // Get all local sessions, assign prop allSessions
    all() {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else {
                this.allSessions = this.sortByStartDate(this.convertListToDisplaySession(res.Sessions));
                return this.allSessions;
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
            if (res.Fault) {
                return Observable.throw(res.Fault);
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

    searchSessions(options) {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions?${options}`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            } else {
                return this.sortByStartDate(this.convertListToDisplaySession(res.Sessions));
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
                    return this.convertToDisplaySession(res.Session); // is this just one session? or an array?
                } else {
                    Observable.throw("Invalid response object returned by the ajax call.");
                }
            });
        }
    }

    getAccess(sessionGuid, badgeId) {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/${sessionGuid}/accessList/${badgeId}`).map(res => res.json());
    }

    getAccessList(sessionGuid, options) {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/${sessionGuid}/accessList?${options}`).map(res => res.json());
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

    getActive() {   // TODO: PARSE OUT ACTIVE SESSION FROM JSON?
        if (this.activeSession) {
            return this.activeSession;
        } else {
            this.activeSession = localStorage.getItem('ActiveSession');
            if (this.activeSession) {
                return this.activeSession;
            } else {
                return false;
            }
        }
    }

    setActive(s) {
        if (s) {
            localStorage.setItem('ActiveSession', JSON.stringify(s));
            this.activeSession = s;
        }
    }

    // Return an array of unique room locations
    getUniqueLocations() {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/locations`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            }
            return res;
        });
    }

    // Return array of unique start dates
    getUniqueStartDates() {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessions/startdates`).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            }
            return res;
        });
    }    

    // Convert sessions to database format and save
    saveSessionList(sessions) {
        let i = 0, len = sessions.length;
        for(; i < len; i++) {
            if (sessions[i].StartDateTime !== null) {
                sessions[i].StartDateTime = new Date(sessions[i].StartDateTime);
            }
            if (sessions[i].EndDateTime !== null) {
                sessions[i].EndDateTime = new Date(sessions[i].EndDateTime);
            }
            sessions[i].SessionGuid = sessions[i].ScheduleItemGuid;
            sessions[i].SessionKey = sessions[i].ScheduleItemKey;
        }
        return this.http.put(`http://localhost/events/${EventGuid.guid}/sessions`, JSON.stringify(sessions)).map(res => res.json()).map((res) => {
            if (res.Fault) {
                return Observable.throw(res.Fault);
            }
            return res;
        });
    }

    // Get from central, save list, re-assign this.allSessions (local), and save to database
    refreshSessionsAndSave() {
        return this.fetchSessions().flatMap((data) => {
            return this.saveSessionList(data);
        }).flatMap((d) => {
            return this.all();
        });
    }

    // Get Access Lists from central and save to local
    refreshAccessListsAndSave() {
        const accessControlSessions = this.allSessions.filter((session) => {
            return session.AccessControl;
        });
        if(accessControlSessions.length === 0) {
            return Observable.of(null);
        }
        const accessListRequests = accessControlSessions.map((session) => {
            return this.fetchAccess(session.SessionGuid).map((d) => d)
                .catch((err) => {
                    return Observable.of(null);
                });
        });
        return Observable.forkJoin(accessListRequests);
    }

    // Refresh sessions and access lists, update local props - allSessions, rooms, scheduleStartDate, scheduleEndDate
    refreshSessionsThenAccessLists() {
        return this.refreshSessionsAndSave().flatMap(() => this.refreshAccessListsAndSave()).flatMap(() => this.refreshRoomsAndDates());
    }

    // Update scheduleStartDate, scheduleEndDate, set filterDate if not yet set
    refreshRoomsAndDates() {
        return this.getUniqueLocations().map((res) => {
            if (res && res.Locations) {
                this.rooms = res.Locations.sort();
            }
            return res;         
        }).flatMap(() => this.getUniqueStartDates()).map((d) => {
            if (d && d.StartDates) {
                const uniqueDates = d.StartDates.sort();
                const startDate = moment(uniqueDates[0], 'YYYY-MM-DD');
                const endDate = moment(uniqueDates[uniqueDates.length - 1], 'YYYY-MM-DD');
                this.scheduleStartDate = startDate.format('YYYY-MM-DD');
                this.scheduleEndDate = endDate.format('YYYY-MM-DD');
                // If filter date hasn't yet been set
                if (!this.filterDate) {
                    const now = moment();
                    if (now.isBetween(startDate, endDate, 'day', '[]')) {
                        this.filterDate = now.format('YYYY-MM-DD');
                    } else if (now.isAfter(endDate)) {
                        this.filterDate = endDate.format('YYYY-MM-DD');
                    } else {
                        this.filterDate = startDate.format('YYYY-MM-DD');
                    }
                }                
            }
            return d;
        });
    }

    /////////////////////////////////////
    //      Background Uploading
    /////////////////////////////////////

    initializeBackgroundUpload(mins) {
        clearInterval(this.backgroundInterval);
        if(mins === 0) {
            return false;
        }
        const time = mins * 60 * 1000;
        this.backgroundInterval = setInterval(() => {
            this.backgroundUploadAction();
        }, time);
    }

    backgroundUploadAction() {
        //alert("Get pending uploads and uploading..");
        // TODO: Get pending uploads and upload...
    }

    /////////////////////////////////////
    //      Helpers
    /////////////////////////////////////


    // Convert list of sessions to display session objects
    private convertListToDisplaySession(arr) {
        return arr.map(this.convertToDisplaySession);
    }

    // convert server session object to display session object, fix UTC time
    private convertToDisplaySession(session) {
        if (session !== null) {
            
            if (session.hasOwnProperty("Topic") && session.Topic.indexOf("|") > 0) {
                session.Topic = session.Topic.substr(session.Topic.indexOf('|') + 1, session.Topic.length);
            }
            if (session.hasOwnProperty("StartDateTime") && session.StartDateTime !== null) {
                session.StartDateTime = session.StartDateTime.replace(/Z/, "");
            }
            if (session.hasOwnProperty("EndDateTime") && session.EndDateTime !== null) {
                session.EndDateTime = session.EndDateTime.replace(/Z/, "");
            }

            const AccessControl = session.Category.toUpperCase() === 'ACCESS CONTROL' ? true : false;
            const start = moment(session.StartDateTime, 'YYYY-MM-DDTHH:mm:ss.SSS');
            const end = moment(session.EndDateTime, 'YYYY-MM-DDTHH:mm:ss.SSS');
            let displayDates = {};
            if (start.isSame(end, 'day')) {
                displayDates['DisplayStartDate'] = start.format('ddd, MMM Do, YYYY');
            } else {
                displayDates['DisplayStartDate'] = start.format('ddd, MMM Do') + ' - ';
                displayDates['DisplayRangeDate'] = end.format('ddd, MMM Do, YYYY');
            }
            return Object.assign({}, session, displayDates, {
                AccessControl,        
                StartTime: start.format('h:mm A'),
                EndTime: end.format('h:mm A'),       
                isLocked: false
            });
        }
    }

    // Remove props from list of display session props
    private removeListDisplaySessionProps(arr) {
        return arr.map(this.removeDisplaySessionProps);
    }

    // Remove props from display session object
    private removeDisplaySessionProps(session) {
        if (session !== null) {
            delete session.DisplayStartDate;
            delete session.DisplayRangeDate;
            delete session.StartTime;
            delete session.EndTime;
            delete session.isLocked;            
        }        
        return session;
    }

    // Sort by start date
    sortByStartDate(arr) {
        return arr.sort((sessA, sessB) => {
            return moment(sessA.StartDateTime).diff(moment(sessB.StartDateTime));
        });
    }
}