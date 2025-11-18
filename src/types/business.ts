import { Business, CalendarEvent, Customer, MessageTemplate, Review, Service, TS, User, WaitItem } from "./global";

interface ReviewWithUser extends Review {
    user: User;
}

export interface CalendarEventWithRelations extends CalendarEvent {
    user: User;
    service?: Service;
}

interface WaitItemWithRelations extends WaitItem {
    user: User;
    service: Service;
}

export interface BusinessWithRelations extends Business {
    services: Service[];
    calendar: CalendarEventWithRelations[];
    waitlist: WaitItemWithRelations[];
    messageTemplates: MessageTemplate[];
    reviews: ReviewWithUser[];
    availability: AvailabilitySlot[];
    customers: Customer[];
}

export interface AvailabilitySlot {
    start: TS;
    end: TS;
}
