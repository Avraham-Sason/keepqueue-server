import { Business, CalendarEvent, MessageTemplate, Review, Service, User, WaitItem } from "./global";

interface ReviewWithUser extends Review {
    user: User;
}

interface CalendarEventWithRelations extends CalendarEvent {
    user: User;
    service: Service;
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
}
