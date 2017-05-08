import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/map';

import { ClientInfo } from '../interfaces/client-info';
import { EventGuid } from '../helpers/eventGuid';
import { EventInfo } from '../interfaces/event-info';

@Injectable()
export class InformationService {

    client: ClientInfo;
    event: EventInfo;
    currentToken = {
        SessionToken: ""
    };

    constructor(private http: Http) { }

    startUpApplication() {
        const eventInfo = this.getEventInformation();
        const clientInfo = this.getClientInfo();
        return Observable.forkJoin([eventInfo, clientInfo])
            .flatMap(() => {
                return this.updateToken();
            });
    }

    //////////////////////////////////
    //  Login Services 
    //////////////////////////////////

    getAuthToken() {
        return this.http.get(`http://localhost/events/${EventGuid.guid}/sessiontoken`).map(res => res.json()).map((res) => {
            if (res && res.SessionToken) {
                this.currentToken.SessionToken = res.SessionToken;
                return res;
            } else {
                Observable.throw("Invalid response object returned by the ajax call.");
            }
        });
    }

    getCurrentToken() {
        return this.currentToken.SessionToken;
    }

    saveToken(loginArgs) {
        alert("saving...");
        this.currentToken.SessionToken = loginArgs.SessionToken;        
        return this.http.put(`http://localhost/events/${EventGuid.guid}/sessiontoken`, this.currentToken).map(res => res.json());
    }

    initiateChallenge() {
        const { LoginUrl, AuthCode, AuthGuid } = this.event.Event;
        let loginArgs = {
            loginRestUrl: LoginUrl,
            authCode: AuthCode,
            authGuid: AuthGuid
        };
        alert("Initiating...");
        return this.http.post(`${loginArgs.loginRestUrl}/InitiateChallenge/${loginArgs.authGuid}`, loginArgs).map(res => res.json()).map((res) => {
            loginArgs['challenge'] = res;
            return loginArgs;
        });
    }

    computeHash(loginArgs) {
        let req = {
            authcode: loginArgs.authCode,
            nonce: loginArgs.challenge.Nonce
        };
        alert('computing...');
        return this.http.post(`http://localhost/digestauthentication/computehash`, req).map(res => res.json()).map((res) => {
            loginArgs.hash = res.Hash;
            return loginArgs;
        });
    }   

    validateChallenge(loginArgs) {
        let urlHash = loginArgs.hash.replace(/\//g, "_");
        urlHash = urlHash.replace(/\+/g, "-");
        alert("validating...");
        return this.http.post(`${loginArgs.loginRestUrl}/ValidateChallenge/${loginArgs.challenge.ChallengeGuid}/${encodeURIComponent(urlHash)}`, loginArgs).map(res => res.json()).map((res) => {
            let loginResult = {
                SessionToken: res.SessionToken
            };
            return loginResult;
        });
    }

    updateToken() {
        return this.initiateChallenge()
            .flatMap(data => this.computeHash(data))
            .flatMap(data => this.validateChallenge(data))
            .flatMap(data => this.saveToken(data));
    }


    //////////////////////////////////
    //  Event Info 
    //////////////////////////////////

    getEventInformation() {
        return this.http.get(`http://localhost/events/${EventGuid.guid}`).map(res => res.json()).map((res) => {
            this.event = res;        
            return res;
        });
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