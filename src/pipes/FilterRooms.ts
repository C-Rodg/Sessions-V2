import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterRooms' })
export class FilterRooms implements PipeTransform {
    transform(sessions:any, filterRoom:any) {
        if (filterRoom) {
            return sessions.filter((session) => {
                return session.Location === filterRoom;
            });
        }      
        return sessions;  
    }
}