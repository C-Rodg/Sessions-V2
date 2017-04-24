import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterSessionText' })
export class FilterSessionText implements PipeTransform {
    transform(sessions:any, filterText:any) {        
        if (filterText) {
            const filter = filterText.toUpperCase();
            return sessions.filter((session) => {
                return session.Topic.toUpperCase().indexOf(filter) > -1;
            });
        }      
        return sessions;  
    }
}