import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class ScanCameraService {

    private camera = {
        visible : "YES",
        camera : "BACK",
        top: 70, // 62
        left: 0,
        width: 320,
        height: 302
    };
    public torch : string = "OFF";
    private endpoint : string = "http://localhost/barcodecontrol";
    private cameraOn: boolean = false;

    constructor(private http: Http) {
        this.calculatePosition = this.calculatePosition.bind(this);
        this.calculatePosition();
        window.addEventListener('orientationchange', () => {
            setTimeout(this.calculatePosition, 700);
        }, false);
    }  // 

    // Calculate position based off of '#target-bottom' element
    calculatePosition() {
        const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const target = document.getElementById('target-bottom');
        this.camera.width = width;
        if (target) {
            const coords = target.getBoundingClientRect();
            if (coords) {                
                this.camera.height = coords.bottom - coords.height - 84;

            } else {
                this.camera.height = 302;
            }
        } else {
            this.camera.height = 302;
        }       
        
        if (this.cameraOn) {
            this.turnOn();
        }        
    }

    turnOn() {
        this.cameraOn = true;
        this.http.post(this.endpoint, this.camera).map(res => res.json()).subscribe((data) => { });
    }

    turnOff() {  
        this.cameraOn = false;
        this.http.post(this.endpoint, { visible: "NO" }).map(res => res.json()).subscribe((data) => {});
    }

    toggleTorch() {
        this.torch = (this.torch === "OFF") ? "ON" : "OFF";
        this.http.post(this.endpoint, {torch: this.torch}).map(res => res.json()).subscribe((data) => {});
    }

    toggleCamera() {
        this.camera.camera = (this.camera.camera === "FRONT") ? "BACK" : "FRONT";
        this.http.post(this.endpoint, this.camera).map(res => res.json()).subscribe((data) => {});
    }
}