export interface DisplaySession {
    title? : string,
    room? : string,
    startDate? : string,
    rangeDate? : string,
    startTime? : string,
    endTime? : string,
    accessControl? : boolean,
    isLocked? : boolean,
    sessionGuid? : string,
    category?: string,
    capacity?: number,
    description?: string
}