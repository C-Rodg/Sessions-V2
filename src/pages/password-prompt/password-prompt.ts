import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'password-prompt',
  templateUrl: 'password-prompt.html'
})
export class PasswordPrompt {
    password: string = "";

    @Output() promptCancel = new EventEmitter();
    @Output() promptUnlock = new EventEmitter();

    // Close the prompt
    cancel() {
        this.promptCancel.emit(true);
    }

    // Check for correct password and close or show error
    accept() {
        if (this.password === '9151') {
            this.promptUnlock.emit('9151');
        } else {
            // Add error to form
            const inputWrapper = document.getElementById('password-prompt-input');
            if (inputWrapper) {
                inputWrapper.classList.add('has-error');
            }
        }
    }
}