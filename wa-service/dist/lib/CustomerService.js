"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerService = exports.CustomerService = void 0;
const Customer_1 = require("../models/Customer");
class CustomerService {
    constructor() { }
    static getInstance() {
        if (!CustomerService.instance) {
            CustomerService.instance = new CustomerService();
        }
        return CustomerService.instance;
    }
    /**
     * Get or create customer by phone number
     */
    getOrCreateCustomer(businessId, phone, details) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Try to find existing customer
                let customer = yield Customer_1.Customer.findOne({
                    phone,
                    businessId
                });
                if (customer) {
                    // Update customer info if details provided and changed
                    if (details) {
                        let updated = false;
                        if (details.name && details.name !== customer.name) {
                            customer.name = details.name;
                            updated = true;
                        }
                        if (details.email && details.email !== customer.email) {
                            customer.email = details.email;
                            updated = true;
                        }
                        // Update last seen
                        if (!customer.metadata) {
                            customer.metadata = {};
                        }
                        customer.metadata.lastSeen = new Date();
                        updated = true;
                        if (updated) {
                            yield customer.save();
                        }
                    }
                    console.log(`[CustomerService] Found existing customer: ${phone}`);
                    return customer;
                }
                // Create new customer
                customer = yield Customer_1.Customer.create({
                    phone,
                    businessId,
                    name: (details === null || details === void 0 ? void 0 : details.name) || undefined,
                    email: (details === null || details === void 0 ? void 0 : details.email) || undefined,
                    metadata: {
                        firstSeen: new Date(),
                        lastSeen: new Date(),
                        totalOrders: 0,
                        totalSpent: 0,
                        averageOrderValue: 0,
                        customerType: 'new',
                        messageCount: 0,
                        responseTime: 0
                    },
                    preferences: {
                        preferredLanguage: 'en',
                        notificationEnabled: true,
                        marketingOptIn: false
                    },
                    state: {
                        step: 'INITIAL',
                        data: new Map(),
                        fallbackCount: 0,
                        detectedLanguage: 'en',
                        contextHistory: []
                    }
                });
                console.log(`[CustomerService] Created new customer: ${phone}`);
                return customer;
            }
            catch (error) {
                console.error(`[CustomerService] Error getting/creating customer:`, error);
                throw error;
            }
        });
    }
    /**
     * Update customer metrics after successful order
     */
    updateCustomerMetrics(customerId, orderValue) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield Customer_1.Customer.findById(customerId);
                if (!customer) {
                    console.warn(`[CustomerService] Customer not found: ${customerId}`);
                    return;
                }
                yield customer.updateOrderMetrics(orderValue);
                console.log(`[CustomerService] Updated metrics for customer: ${customerId}`);
            }
            catch (error) {
                console.error(`[CustomerService] Error updating customer metrics:`, error);
            }
        });
    }
    /**
     * Get customer by ID
     */
    getCustomerById(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield Customer_1.Customer.findById(customerId);
            }
            catch (error) {
                console.error(`[CustomerService] Error fetching customer:`, error);
                return null;
            }
        });
    }
}
exports.CustomerService = CustomerService;
exports.customerService = CustomerService.getInstance();
