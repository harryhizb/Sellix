import mongoose from "mongoose";

// Enhanced Order Status Enum for Module 3
enum OrderStatus {
  PENDING = 'pending',        // NEW: Requires owner approval
  CONFIRMED = 'confirmed',    // Owner approved
  PROCESSING = 'processing',  // Being prepared
  SHIPPED = 'shipped',        // Dispatched
  DELIVERED = 'delivered',    // Completed
  CANCELLED = 'cancelled',    // Rejected or cancelled
  REFUNDED = 'refunded'       // Refund processed
}

// Order item schema
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  color: String,
  size: String,
  attributes: mongoose.Schema.Types.Mixed,  // For category-specific attributes
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 }
});

// Delivery tracking schema
const deliveryTrackingSchema = new mongoose.Schema({
  trackingNumber: String,
  carrier: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
  notes: String,
  status: { type: String, default: 'pending' }
});

// Owner approval schema
const ownerApprovalSchema = new mongoose.Schema({
  approved: { type: Boolean, default: false },
  approvedAt: Date,
  approvedBy: { type: String, ref: "User" },
  rejectedAt: Date,
  rejectedBy: { type: String, ref: "User" },
  rejectionReason: String,
  notes: String
});

// Status history entry schema
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    required: true
  },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String, required: true }, // 'customer', 'owner', 'system'
  changedById: { type: mongoose.Schema.Types.ObjectId, refPath: 'changedByType' },
  changedByType: { type: String, enum: ['Customer', 'User', 'System'] },
  note: String,
  metadata: mongoose.Schema.Types.Mixed
});

// Notification history schema
const notificationHistorySchema = new mongoose.Schema({
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
  metadata: mongoose.Schema.Types.Mixed
});

// Enhanced delivery details schema
const deliveryDetailsSchema = new mongoose.Schema({
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
const bookingDetailsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  preferredDate: { type: String, required: true },
  preferredTime: { type: String, required: true },
  phone: { type: String, required: true },
  serviceType: String,
  guestCount: Number,
  bookingNotes: String
});

// Customer information schema
const customerInfoSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, required: true },
  email: String,
  address: String,
  customerType: { type: String, enum: ['new', 'returning', 'vip'], default: 'new' },
  loyaltyPoints: { type: Number, default: 0 }
});

const orderSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
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
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }

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
orderSchema.pre('save', function (next: any) {
  if (this.isNew && !this.orderNumber) {
    // Use timestamp (ms) + random 3-digit suffix to prevent race-condition duplicate keys
    const ts = Date.now().toString().slice(-8); // last 8 digits of ms timestamp
    const rand = Math.floor(Math.random() * 900 + 100); // 100–999
    this.orderNumber = `${ts}${rand}`;
  }

  // Update status history if status changed
  if (this.isModified('status')) {
    if (!this.statusHistory) {
      this.statusHistory = [] as any;
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
orderSchema.methods.generateOrderSummary = function (language: string = 'en', type: 'customer' | 'owner' = 'customer') {
  const itemsSummary = this.items.map((item: any, index: number) => {
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
Address: ${this.deliveryDetails?.address}
Contact: ${this.deliveryDetails?.contact}
Instructions: ${this.deliveryDetails?.instructions || 'None'}

Thank you for your order!`,

      owner: `🔔 *NEW ORDER REQUIRES APPROVAL*
Order #: ${this.orderNumber}
Customer: ${this.customerInfo?.name || 'N/A'} (${this.customerInfo?.phone})
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
Address: ${this.deliveryDetails?.address}
Contact: ${this.deliveryDetails?.contact}
Instructions: ${this.deliveryDetails?.instructions || 'None'}

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
Pata: ${this.deliveryDetails?.address}
Rabitay ka number: ${this.deliveryDetails?.contact}
Hidayaat: ${this.deliveryDetails?.instructions || 'Koi nahi'}

Aapka order dene ka shukriya!`,

      owner: `🔔 *NAYA ORDER APPROVAL CHAHIYE*
Order Number: ${this.orderNumber}
Customer: ${this.customerInfo?.name || 'N/A'} (${this.customerInfo?.phone})
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
Pata: ${this.deliveryDetails?.address}
Rabitay ka number: ${this.deliveryDetails?.contact}
Hidayaat: ${this.deliveryDetails?.instructions || 'Koi nahi'}

*Meharbani kar ke is order ko dashboard mein approve ya reject karein.*`
    }
  };

  return summaryTemplates[language as keyof typeof summaryTemplates]?.[type] || summaryTemplates.en[type];
};

// Instance method to update order status with validation
orderSchema.methods.updateStatus = async function (
  newStatus: OrderStatus,
  changedBy: string,
  changedById: string,
  changedByType: 'Customer' | 'User' | 'System',
  note?: string,
  metadata?: any
) {
  // Validate status transition
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: []
  };

  if (!validTransitions[this.status as OrderStatus]?.includes(newStatus)) {
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
  } else if (newStatus === OrderStatus.CANCELLED && changedByType === 'User') {
    this.ownerApproval = {
      ...this.ownerApproval,
      rejectedAt: new Date(),
      rejectedBy: changedById,
      rejectionReason: note
    };
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
};

// Instance method to add notification
orderSchema.methods.addNotification = function (
  type: string,
  channel: string,
  recipient: string,
  status: string = 'sent',
  messageId?: string,
  error?: string,
  metadata?: any
) {
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
orderSchema.statics.findByStatus = function (businessId: string, status: OrderStatus) {
  return this.find({ businessId, status, isDeleted: false }).sort({ createdAt: -1 });
};

// Static method to get order statistics
orderSchema.statics.getStatistics = async function (businessId: string) {
  const stats = await this.aggregate([
    { $match: { businessId: new mongoose.Types.ObjectId(businessId), isDeleted: false } },
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
};

export const Order = mongoose.model("Order", orderSchema);
export { OrderStatus };