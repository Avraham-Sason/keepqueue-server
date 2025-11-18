import { jsonFailed, jsonOK } from "../helpers";
import { cacheManager, logger } from "../managers";
import { RouterService, BusinessWithRelations, StringObject, CalendarEventWithRelations, Customer } from "../types";
import { checkCondition } from "./helpers";
import { GetAvailabilityByServiceIdModel, GetBusinessCustomersModel, GetBusinessModel, GetCollectionModel, GetUserByIdModel } from "./schemes";
import { computeBusinessAvailability } from "../actions/businesses/appointments/helpers";

export const S_getCollection: RouterService = async (req, res, next) => {
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

export const S_getBusiness: RouterService = async (req, res, next) => {
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

        const businessServices = services.filter((s) => s.businessId === business.id);

        const businessMessageTemplates = messageTemplates.filter((m) => m.businessId === business.id);

        const businessCalendar = calendar
            .filter((e) => e.businessId === business.id)
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
            .filter((w) => w.businessId === business.id)
            .map((w) => ({
                ...w,
                user: getUserById(w.userId),
                service: getServiceById(w.serviceId),
            }));

        const businessReviews = reviews
            .filter((r) => r.businessId === business.id)
            .map((r) => ({
                ...r,
                user: getUserById(r.userId),
            }));

        const businessCustomers = users.filter((c) => "businessIds" in c && c.businessIds.includes(business.id!)) as Customer[];

        const result: BusinessWithRelations = {
            ...business,
            services: businessServices,
            calendar: businessCalendar,
            waitlist: businessWaitlist,
            messageTemplates: businessMessageTemplates,
            reviews: businessReviews,
            availability: computeBusinessAvailability(business, business.operationSchedule),
            customers: businessCustomers,
        };

        res.json(jsonOK(result));
    } catch (error) {
        next(error);
    }
};

export const S_getAvailabilityByServiceId: RouterService = async (req, res, next) => {
    const { serviceId } = req.body as GetAvailabilityByServiceIdModel;
    try {
        const servicesMap = cacheManager.get("servicesMap", new Map());
        const businessesMap = cacheManager.get("businessesMap", new Map());
        const service = servicesMap.get(serviceId);
        if (!service) {
            const mgs = `Service not found for service ${serviceId}`;
            logger.error(mgs);
            res.json(jsonFailed(mgs));
            return;
        }
        const business = businessesMap.get(service.businessId);
        if (!business) {
            const mgs = `Business not found for service ${serviceId}`;
            logger.error(mgs);
            res.json(jsonFailed(mgs));
            return;
        }

        // Use service operation schedule if available, otherwise use business schedule
        const operationSchedule =
            service.operationSchedule && service.operationSchedule.length > 0 ? service.operationSchedule : business.operationSchedule;

        const availability = computeBusinessAvailability(business, operationSchedule);

        // Filter availability slots to only include those that can accommodate the service duration
        const serviceDurationMin = service.durationMin || 30;
        const paddingBefore = service.paddingBefore || 0;
        const paddingAfter = service.paddingAfter || 0;
        const totalDurationMin = serviceDurationMin + paddingBefore + paddingAfter;
        const totalDurationMs = totalDurationMin * 60 * 1000;

        const filteredAvailability = availability.filter((slot) => {
            const slotDurationMs = slot.end.toMillis() - slot.start.toMillis();
            return slotDurationMs >= totalDurationMs;
        });

        res.json(jsonOK(filteredAvailability));
    } catch (error) {
        next(error);
    }
};

export const S_getBusinessCustomers: RouterService = async (req, res, next) => {
    const { businessId } = req.body as GetBusinessCustomersModel;
    try {
        const allCustomers = cacheManager.get("customers", []) as Customer[];
        const customers = allCustomers.filter((c) => c.businessIds.includes(businessId));
        res.json(jsonOK(customers));
    } catch (error) {
        next(error);
    }
};

export const S_getUserById: RouterService = async (req, res, next) => {
    const { userId } = req.body as GetUserByIdModel;
    try {
        const allUsers = cacheManager.get("usersMap", new Map());
        const user = allUsers.get(userId);
        if (!user) {
            const mgs = `User not found for user ${userId}`;
            logger.error(mgs);
            res.json(jsonFailed(mgs));
            return;
        }
        return res.json(jsonOK(user));
    } catch (error) {
        next(error);
    }
};
