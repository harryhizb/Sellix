import { Customer } from '../models/Customer';
import { UserDetails } from './types';

export class CustomerService {
    private static instance: CustomerService;

    private constructor() { }

    public static getInstance(): CustomerService {
        if (!CustomerService.instance) {
            CustomerService.instance = new CustomerService();
        }
        return CustomerService.instance;
    }

    /**
     * Get or create customer by phone number
     */
    async getOrCreateCustomer(
        businessId: string,
        phone: string,
        details?: UserDetails
    ): Promise<any> {
        try {
            // Try to find existing customer
            let customer = await Customer.findOne({
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
                        await customer.save();
                    }
                }

                console.log(`[CustomerService] Found existing customer: ${phone}`);
                return customer;
            }

            // Create new customer
            customer = await Customer.create({
                phone,
                businessId,
                name: details?.name || undefined,
                email: details?.email || undefined,
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

        } catch (error) {
            console.error(`[CustomerService] Error getting/creating customer:`, error);
            throw error;
        }
    }

    /**
     * Update customer metrics after successful order
     */
    async updateCustomerMetrics(customerId: string, orderValue: number): Promise<void> {
        try {
            const customer = await Customer.findById(customerId);

            if (!customer) {
                console.warn(`[CustomerService] Customer not found: ${customerId}`);
                return;
            }

            await customer.updateOrderMetrics(orderValue);
            console.log(`[CustomerService] Updated metrics for customer: ${customerId}`);

        } catch (error) {
            console.error(`[CustomerService] Error updating customer metrics:`, error);
        }
    }

    /**
     * Get customer by ID
     */
    async getCustomerById(customerId: string): Promise<any> {
        try {
            return await Customer.findById(customerId);
        } catch (error) {
            console.error(`[CustomerService] Error fetching customer:`, error);
            return null;
        }
    }
}

export const customerService = CustomerService.getInstance();
