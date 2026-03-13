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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStatus = exports.Order = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Enhanced Order Status Enum for Module 3
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["REFUNDED"] = "refunded"; // Refund processed
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
// Order item schema
const orderItemSchema = new mongoose_1.default.Schema({
    productId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    color: String,
    size: String,
    attributes: mongoose_1.default.Schema.Types.Mixed, // For category-specific attributes
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 }
});
// Delivery tracking schema
const deliveryTrackingSchema = new mongoose_1.default.Schema({
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    notes: String,
    status: { type: String, default: 'pending' }
});
// Owner approval schema
const ownerApprovalSchema = new mongoose_1.default.Schema({
    approved: { type: Boolean, default: false },
    approvedAt: Date,
    approvedBy: { type: String, ref: "User" },
    rejectedAt: Date,
    rejectedBy: { type: String, ref: "User" },
    rejectionReason: String,
    notes: String
});
// Status history entry schema
const statusHistorySchema = new mongoose_1.default.Schema({
    status: {
        type: String,
        enum: Object.values(OrderStatus),
        required: true
    },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, required: true }, // 'customer', 'owner', 'system'
    changedById: { type: mongoose_1.default.Schema.Types.ObjectId, refPath: 'changedByType' },
    changedByType: { type: String, enum: ['Customer', 'User', 'System'] },
    note: String,
    metadata: mongoose_1.default.Schema.Types.Mixed
});
// Notification history schema
const notificationHistorySchema = new mongoose_1.default.Schema({
    type: {
        type: String,
        enum: ['new_order', 'owner_approved', 'owner_rejected', 'order_processing',
            'order_shipped', 'order_delivered', 'order_cancelled', 'status_update'],
        required: true
    },
    sentAt: { type: Date, default: Date.now },
    channel: {
        type: String,
        enum: ['whatsapp', 'email', 'dashboard', 'sms'],
        required: true
    },
    recipient: { type: String, required: true },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent'
    },
    messageId: String,
    error: String,
    metadata: mongoose_1.default.Schema.Types.Mixed
});
// Enhanced delivery details schema
const deliveryDetailsSchema = new mongoose_1.default.Schema({
    address: { type: String, required: true },
    contact: { type: String, required: true },
    city: String,
    area: String,
    landmark: String,
    instructions: String,
    timePreference: String,
    preferredDeliveryDate: Date,
    preferredDeliveryTime: String,
    deliveryFee: { type: Number, default: 0 },
    deliveryNotes: String
});
// Booking details schema (for service category)
const bookingDetailsSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    preferredDate: { type: String, required: true },
    preferredTime: { type: String, required: true },
    phone: { type: String, required: true },
    serviceType: String,
    guestCount: Number,
    bookingNotes: String
});
// Customer information schema
const customerInfoSchema = new mongoose_1.default.Schema({
    name: String,
    phone: { type: String, required: true },
    email: String,
    address: String,
    customerType: { type: String, enum: ['new', 'returning', 'vip'], default: 'new' },
    loyaltyPoints: { type: Number, default: 0 }
});
const orderSchema = new mongoose_1.default.Schema({
    businessId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Business",
        required: true,
        index: true
    },
    customerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true
    },
    // Order information
    orderNumber: { type: String, unique: true, index: true },
    items: [orderItemSchema],
    // Pricing details
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "USD" },
    // Order lifecycle
    status: {
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.PENDING,
        index: true
    },
    // Payment information
    paymentMethod: {
        type: String,
        enum: ["COD", "online", "card", "bank_transfer", "wallet"],
        default: "COD"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded", "partially_paid"],
        default: "pending"
    },
    paymentId: String,
    paidAt: Date,
    // Owner approval system
    ownerApproval: ownerApprovalSchema,
    // Order type (order vs booking)
    type: {
        type: String,
        enum: ['order', 'booking', 'registration', 'enrollment'],
        default: 'order',
        index: true
    },
    // Enhanced delivery information
    deliveryDetails: deliveryDetailsSchema,
    deliveryTracking: deliveryTrackingSchema,
    // Booking information (for service category)
    bookingDetails: bookingDetailsSchema,
    // Customer information
    customerInfo: customerInfoSchema,
    // Order metadata
    notes: String,
    specialInstructions: String,
    urgency: { type: String, enum: ["normal", "urgent", "express"], default: "normal" },
    source: { type: String, enum: ["whatsapp", "web", "phone", "in_store"], default: "whatsapp" },
    // Module 5: Multilingual support
    language: { type: String, enum: ["en", "ur_roman", "mixed"], default: "en" },
    // Notification system
    notifications: [notificationHistorySchema],
    // Status history for audit trail
    statusHistory: [statusHistorySchema],
    // Metadata
    metadata: {
        businessCategory: String,
        businessTone: String,
        aiConfidence: Number,
        language: String,
        contextSwitches: Number,
        conversationId: String,
        sessionId: String,
        ipAddress: String,
        userAgent: String
    },
    // Timestamps for lifecycle tracking
    confirmedAt: Date,
    processedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    refundedAt: Date,
    // Soft delete support
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Virtual for order summary
orderSchema.virtual('formattedOrderNumber').get(function () {
    return `ORD-${this.orderNumber}`;
});
// Virtual for order age
orderSchema.virtual('ageInHours').get(function () {
    const now = Date.now();
    const created = this.createdAt instanceof Date ? this.createdAt.getTime() : new Date(this.createdAt).getTime();
    return Math.floor((now - created) / (1000 * 60 * 60));
});
// Pre-save middleware to handle status history
orderSchema.pre('save', function (next) {
    if (this.isNew && !this.orderNumber) {
        // Use timestamp (ms) + random 3-digit suffix to prevent race-condition duplicate keys
        const ts = Date.now().toString().slice(-8); // last 8 digits of ms timestamp
        const rand = Math.floor(Math.random() * 900 + 100); // 100–999
        this.orderNumber = `${ts}${rand}`;
    }
    // Update status history if status changed
    if (this.isModified('status')) {
        if (!this.statusHistory) {
            this.statusHistory = [];
        }
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date(),
            changedBy: this.customerId ? 'customer' : 'system',
            changedById: this.customerId,
            changedByType: 'Customer',
            note: `Status changed to ${this.status}`
        });
        // Update timestamps based on status
        switch (this.status) {
            case OrderStatus.CONFIRMED:
                this.confirmedAt = new Date();
                break;
            case OrderStatus.PROCESSING:
                this.processedAt = new Date();
                break;
            case OrderStatus.SHIPPED:
                this.shippedAt = new Date();
                break;
            case OrderStatus.DELIVERED:
                this.deliveredAt = new Date();
                break;
            case OrderStatus.CANCELLED:
                this.cancelledAt = new Date();
                break;
            case OrderStatus.REFUNDED:
                this.refundedAt = new Date();
                break;
        }
    }
    next();
});
// Instance method to generate professional order summary
orderSchema.methods.generateOrderSummary = function (language = 'en', type = 'customer') {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const itemsSummary = this.items.map((item, index) => {
        const itemTotal = item.quantity * item.price;
        if (language === 'ur_roman') {
            return `${index + 1}. ${item.name} (${item.quantity} x ${this.currency} ${item.price}) = ${this.currency} ${itemTotal}`;
        }
        return `${index + 1}. ${item.name} (${item.quantity} x ${this.currency} ${item.price}) = ${this.currency} ${itemTotal}`;
    }).join('\n');
    const summaryTemplates = {
        en: {
            customer: `📋 *ORDER SUMMARY*
Order #: ${this.orderNumber}
Status: ${this.status.toUpperCase()}
Date: ${new Date(this.createdAt).toLocaleDateString()}

🛒 *ITEMS*
${itemsSummary}

💰 *PRICING*
Subtotal: ${this.currency} ${this.subtotal}
Tax: ${this.currency} ${this.taxAmount}
Discount: ${this.currency} ${this.discountAmount}
Delivery: ${this.currency} ${this.deliveryFee}
*Total: ${this.currency} ${this.totalAmount}*

📦 *DELIVERY*
Address: ${(_a = this.deliveryDetails) === null || _a === void 0 ? void 0 : _a.address}
Contact: ${(_b = this.deliveryDetails) === null || _b === void 0 ? void 0 : _b.contact}
Instructions: ${((_c = this.deliveryDetails) === null || _c === void 0 ? void 0 : _c.instructions) || 'None'}

Thank you for your order!`,
            owner: `🔔 *NEW ORDER REQUIRES APPROVAL*
Order #: ${this.orderNumber}
Customer: ${((_d = this.customerInfo) === null || _d === void 0 ? void 0 : _d.name) || 'N/A'} (${(_e = this.customerInfo) === null || _e === void 0 ? void 0 : _e.phone})
Status: ${this.status.toUpperCase()}
Date: ${new Date(this.createdAt).toLocaleDateString()}

🛒 *ITEMS*
${itemsSummary}

💰 *PRICING*
Subtotal: ${this.currency} ${this.subtotal}
Tax: ${this.currency} ${this.taxAmount}
Discount: ${this.currency} ${this.discountAmount}
Delivery: ${this.currency} ${this.deliveryFee}
*Total: ${this.currency} ${this.totalAmount}*

📦 *DELIVERY*
Address: ${(_f = this.deliveryDetails) === null || _f === void 0 ? void 0 : _f.address}
Contact: ${(_g = this.deliveryDetails) === null || _g === void 0 ? void 0 : _g.contact}
Instructions: ${((_h = this.deliveryDetails) === null || _h === void 0 ? void 0 : _h.instructions) || 'None'}

*Please approve or reject this order in your dashboard.*`
        },
        ur_roman: {
            customer: `📋 *ORDER KI TAFSIL*
Order Number: ${this.orderNumber}
Halat: ${this.status.toUpperCase()}
Tareekh: ${new Date(this.createdAt).toLocaleDateString()}

🛒 *CHEEZAIN*
${itemsSummary}

💰 *QEEMAT*
Jama: ${this.currency} ${this.subtotal}
Tax: ${this.currency} ${this.taxAmount}
Discount: ${this.currency} ${this.discountAmount}
Delivery: ${this.currency} ${this.deliveryFee}
*Kul: ${this.currency} ${this.totalAmount}*

📦 *DELIVERY*
Pata: ${(_j = this.deliveryDetails) === null || _j === void 0 ? void 0 : _j.address}
Rabitay ka number: ${(_k = this.deliveryDetails) === null || _k === void 0 ? void 0 : _k.contact}
Hidayaat: ${((_l = this.deliveryDetails) === null || _l === void 0 ? void 0 : _l.instructions) || 'Koi nahi'}

Aapka order dene ka shukriya!`,
            owner: `🔔 *NAYA ORDER APPROVAL CHAHIYE*
Order Number: ${this.orderNumber}
Customer: ${((_m = this.customerInfo) === null || _m === void 0 ? void 0 : _m.name) || 'N/A'} (${(_o = this.customerInfo) === null || _o === void 0 ? void 0 : _o.phone})
Halat: ${this.status.toUpperCase()}
Tareekh: ${new Date(this.createdAt).toLocaleDateString()}

🛒 *CHEEZAIN*
${itemsSummary}

💰 *QEEMAT*
Jama: ${this.currency} ${this.subtotal}
Tax: ${this.currency} ${this.taxAmount}
Discount: ${this.currency} ${this.discountAmount}
Delivery: ${this.currency} ${this.deliveryFee}
*Kul: ${this.currency} ${this.totalAmount}*

📦 *DELIVERY*
Pata: ${(_p = this.deliveryDetails) === null || _p === void 0 ? void 0 : _p.address}
Rabitay ka number: ${(_q = this.deliveryDetails) === null || _q === void 0 ? void 0 : _q.contact}
Hidayaat: ${((_r = this.deliveryDetails) === null || _r === void 0 ? void 0 : _r.instructions) || 'Koi nahi'}

*Meharbani kar ke is order ko dashboard mein approve ya reject karein.*`
        }
    };
    return ((_s = summaryTemplates[language]) === null || _s === void 0 ? void 0 : _s[type]) || summaryTemplates.en[type];
};
// Instance method to update order status with validation
orderSchema.methods.updateStatus = function (newStatus, changedBy, changedById, changedByType, note, metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // Validate status transition
        const validTransitions = {
            [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
            [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
            [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
            [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
            [OrderStatus.CANCELLED]: [],
            [OrderStatus.REFUNDED]: []
        };
        if (!((_a = validTransitions[this.status]) === null || _a === void 0 ? void 0 : _a.includes(newStatus))) {
            throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
        }
        // Update owner approval if needed
        if (newStatus === OrderStatus.CONFIRMED && changedByType === 'User') {
            this.ownerApproval = {
                approved: true,
                approvedAt: new Date(),
                approvedBy: changedById,
                rejectedAt: null,
                rejectedBy: null,
                rejectionReason: null,
                notes: note
            };
        }
        else if (newStatus === OrderStatus.CANCELLED && changedByType === 'User') {
            this.ownerApproval = Object.assign(Object.assign({}, this.ownerApproval), { rejectedAt: new Date(), rejectedBy: changedById, rejectionReason: note });
        }
        // Update status
        this.status = newStatus;
        // Add to status history
        this.statusHistory.push({
            status: newStatus,
            changedAt: new Date(),
            changedBy,
            changedById,
            changedByType,
            note,
            metadata
        });
        return this.save();
    });
};
// Instance method to add notification
orderSchema.methods.addNotification = function (type, channel, recipient, status = 'sent', messageId, error, metadata) {
    this.notifications.push({
        type,
        sentAt: new Date(),
        channel,
        recipient,
        status,
        messageId,
        error,
        metadata
    });
    return this.save();
};
// Static method to find orders by status
orderSchema.statics.findByStatus = function (businessId, status) {
    return this.find({ businessId, status, isDeleted: false }).sort({ createdAt: -1 });
};
// Static method to get order statistics
orderSchema.statics.getStatistics = function (businessId) {
    return __awaiter(this, void 0, void 0, function* () {
        const stats = yield this.aggregate([
            { $match: { businessId: new mongoose_1.default.Types.ObjectId(businessId), isDeleted: false } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                    avgOrderValue: { $avg: '$totalAmount' }
                }
            }
        ]);
        return stats;
    });
};
exports.Order = mongoose_1.default.model("Order", orderSchema);
