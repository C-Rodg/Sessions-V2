import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({ name: 'filterDates' })
export class FilterDates implements PipeTransform {
    transform(sessions:any, filterDate:any) {
        const filter = moment(filterDate);
        if (filter) {
            return sessions.filter((session) => {
                let startDate = moment(session.StartDateTime),
                    endDate = moment(session.EndDateTime);      
                if (filter.isSameOrAfter(startDate, 'day') && filter.isSameOrBefore(endDate, 'day')) {
                    return true;
                } else {
                    return false;
                } 
            });
        }      
        return sessions;  
    }
}