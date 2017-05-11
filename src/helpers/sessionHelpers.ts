import * as moment from 'moment';

// convert server session object to display session object
export function addSessionDisplayValues(session) {
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

// convert list of server session objects to display session objects
export function addSessionDisplayValuesToList(arr) {
    return arr.map(addSessionDisplayValues);
}

// remove display properties from display session object
export function removeSessionDisplayValues(session) {
    delete session.DisplayStartDate;
    delete session.DisplayRangeDate;
    delete session.StartTime;
    delete session.EndTime;
    delete session.isLocked;
    return session;
}

// convert list of display session objects back to server objects
export function removeSessionDisplayValuesFromList(arr) {
    return arr.map(removeSessionDisplayValues);
}