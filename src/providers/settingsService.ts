import { Injectable } from '@angular/core';
import { EventGuid } from '../helpers/eventGuid';
import { InformationService } from './informationService';

@Injectable()
export class SettingsService {

    backgroundUploadWait : Number = 4;
    accessControl : boolean = true;
    accessControlOverride: boolean = true;
    capacityCheck: boolean = false;
    deviceName: string = "";

    constructor(private infoService: InformationService) {
        const settings = this.loadStoredSettings();
        if (settings) {
            this.assignSettings(settings);
        }
        const clientName = this.infoService.getClientName();
        if (!this.deviceName && clientName) {
            this.deviceName = clientName;
        }
    }

    // Set Primitive Value
    setValue(val, prop) {
        this[prop] = val;
        this.storeCurrentSettings();
    }

    // Store current settings to local storage
    storeCurrentSettings() {
        const settings = {
            backgroundUploadWait: this.backgroundUploadWait,
            accessControl: this.accessControl,
            accessControlOverride: this.accessControlOverride,
            capacityCheck: this.capacityCheck,
            deviceName: this.deviceName
        };
        window.localStorage.setItem(EventGuid.guid, JSON.stringify(settings));
    }

    // Assign Settings to class instance
    assignSettings(settings) {
        for (let prop in settings) {
            if (settings.hasOwnProperty(prop) && this.hasOwnProperty(prop)) {
                this[prop] = settings[prop];
            }
        }
    }

    // Load Settings from Local Storage
    loadStoredSettings() {
        const settingsStr = window.localStorage.getItem(EventGuid.guid);
        try {
            return JSON.parse(settingsStr);
        } catch (e) {
            return false;
        }
    }

}