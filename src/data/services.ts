import { jsonFailed, jsonOK } from "../helpers";
import { cacheManager } from "../managers";
import { RouterService, BusinessWithRelations, StringObject, CalendarEventWithRelations } from "../types";
import { checkCondition } from "./helpers";
import { GetBusinessModel, GetCollectionModel } from "./schemes";
import { computeBusinessAvailability } from "../actions/businesses/appointments/helpers";

export const SGetCollection: RouterService = async (req, res, next) => {
    try {
        const { collectionName, conditions, conditionsType = "and" } = req.body as GetCollectionModel;
        let data = cacheManager.get(collectionName, []) as any[];
        if (conditions && conditions.length > 0) {
            data = data.filter((item) => {
                if (conditionsType === "and") {
                    return conditions.every((condition) => checkCondition(item, condition));
                } else {
                    return conditions.some((condition) => checkCondition(item, condition));
                }
            });
        }
        res.json(jsonOK(data));
    } catch (error) {
        next(error);
    }
};

export const SGetBusiness: RouterService = async (req, res, next) => {
    const { businessId, ownerId } = req.body as GetBusinessModel;
    if (!businessId && !ownerId) {
        res.json(jsonFailed("Business ID or owner ID is required"));
        return;
    }

    const [users, usersMap, businesses, businessesMap, services, servicesMap, calendar, waitlist, messageTemplates, reviews] = [
        cacheManager.get("users", []),
        cacheManager.get("usersMap", new Map()),
        cacheManager.get("businesses", []),
        cacheManager.get("businessesMap", new Map()),
        cacheManager.get("services", []),
        cacheManager.get("servicesMap", new Map()),
        cacheManager.get("calendar", []),
        cacheManager.get("waitlist", []),
        cacheManager.get("messageTemplates", []),
        cacheManager.get("reviews", []),
    ];

    const getUserById = (id: string) => usersMap.get(id) || users.find((u) => u.id === id)!;
    const getServiceById = (id: string) => servicesMap.get(id) || services.find((s) => s.id === id)!;

    try {
        let business = null;
        if (businessId) {
            business = businessesMap.get(businessId) || businesses.find((b) => b.id === businessId);
        } else {
            business = businesses.find((b) => b.ownerId === ownerId);
        }
        if (!business) {
            res.json(jsonFailed("Business not found"));
            return;
        }

        const businessServices = services.filter((s) => s.businessId === businessId);
        const businessMessageTemplates = messageTemplates.filter((m) => m.businessId === businessId);

        const businessCalendar = calendar
            .filter((e) => e.businessId === businessId)
            .map((e) => {
                const data: CalendarEventWithRelations = {
                    ...e,
                    user: getUserById(e.userId),
                };
                if (e.serviceId) {
                    data.service = getServiceById(e.serviceId);
                }
                return data;
            });

        const businessWaitlist = waitlist
            .filter((w) => w.businessId === businessId)
            .map((w) => ({
                ...w,
                user: getUserById(w.userId),
                service: getServiceById(w.serviceId),
            }));

        const businessReviews = reviews
            .filter((r) => r.businessId === businessId)
            .map((r) => ({
                ...r,
                user: getUserById(r.userId),
            }));

        const result: BusinessWithRelations = {
            ...business,
            services: businessServices,
            calendar: businessCalendar,
            waitlist: businessWaitlist,
            messageTemplates: businessMessageTemplates,
            reviews: businessReviews,
            availability: computeBusinessAvailability(business, business.operationSchedule),
        };

        res.json(jsonOK(result));
    } catch (error) {
        next(error);
    }
};
