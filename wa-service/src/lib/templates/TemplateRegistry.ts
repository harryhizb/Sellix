import { CartItem, SessionContext } from '../types';
import { formatMoney } from '../utils/formatUtils';
import { getItemDiscount } from '../utils/discountUtils';
import { calculateTotal } from '../utils/cartUtils';

export interface BaileysButton {
    buttonId: string;
    buttonText: { displayText: string };
    type: number;
}

export interface BaileysMessage {
    text?: string;
    caption?: string;
    footer?: string;
    image?: { url: string };
    buttons?: BaileysButton[];
    headerType?: number;
}

export class TemplateRegistry {

    // ──────────────────────────────────────────────────────────────────────────
    // COMMONS & GLOBAL
    // ──────────────────────────────────────────────────────────────────────────

    static greeting(businessName: string, capabilities?: any, storeUrl?: string): BaileysMessage {
        const supportsProducts = capabilities?.supportsProducts || capabilities?.supportsCart;
        const supportsServices = capabilities?.supportsServices || capabilities?.supportsBooking;
        const supportsInfo = capabilities?.supportsInformation;

        let menuText = `👋 *Welcome to ${businessName}!*\n\n`;

        if (storeUrl) {
            menuText += `🛍️ *Shop Online:*\n${storeUrl}\n\n`;
            menuText += `Or choose an option below:\n\n`;
        } else {
            menuText += `We're here to help you. What would you like to do today?\n\n`;
        }

        menuText += `━━━━━━━━━━━━━━━━━━━━\n`;
        menuText += `📋 *MAIN MENU*\n`;
        menuText += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        let optionNum = 1;

        if (supportsProducts) {
            menuText += `${optionNum}️⃣ 🛍️ Browse Products\n`;
            menuText += `   View our catalog and shop\n\n`;
            optionNum++;
        } else if (supportsServices) {
            menuText += `${optionNum}️⃣ 🛠️ Browse Services\n`;
            menuText += `   View our services and book\n\n`;
            optionNum++;
        } else if (supportsInfo) {
            menuText += `${optionNum}️⃣ 📚 Browse Information\n`;
            menuText += `   Learn more about us\n\n`;
            optionNum++;
        }

        menuText += `${optionNum}️⃣ 📦 Track My Order\n`;
        menuText += `   Check your order status\n\n`;
        optionNum++;

        menuText += `${optionNum}️⃣ 📜 Our Policies\n`;
        menuText += `   Delivery, returns & payment\n\n`;
        optionNum++;

        menuText += `${optionNum}️⃣ 📞 Contact Support\n`;
        menuText += `   Get help from our team\n\n`;

        menuText += `━━━━━━━━━━━━━━━━━━━━\n`;
        menuText += `💡 *Tip:* Reply with a number (1-${optionNum}) to select\n`;
        menuText += `_Type MENU anytime to return here_`;

        return { text: menuText };
    }

    static mainMenu(businessName: string, capabilities?: any, storeUrl?: string): BaileysMessage {
        // Reuse the greeting template for consistency
        return this.greeting(businessName, capabilities, storeUrl);
    }

    static policies(context: any): BaileysMessage {
        let text = `📜 *Our Policies*\n\n`;
        let hasPolicy = false;

        const deliveryPolicy = context.policies?.delivery;
        const refundPolicy = context.policies?.refund;
        const paymentPolicy = context.policies?.payment;

        // ─── Delivery Policy ────────────────────────────────────────────
        if (deliveryPolicy) {
            const isObj = typeof deliveryPolicy === 'object' && deliveryPolicy !== null;
            const desc = isObj ? (deliveryPolicy.description || deliveryPolicy.descriptions?.en) : deliveryPolicy;
            const charges = isObj ? deliveryPolicy.charges : null;
            const timeframe = isObj ? deliveryPolicy.timeframe : null;
            const areas = isObj && Array.isArray(deliveryPolicy.areas) && deliveryPolicy.areas.length > 0 ? deliveryPolicy.areas : null;

            if (desc || charges || timeframe || areas) {
                text += `🚚 *Delivery Policy:*\n`;
                if (desc) text += `${desc}\n`;
                if (charges) text += `💰 Charges: ${charges}\n`;
                if (timeframe) text += `⏱ Timeframe: ${timeframe}\n`;
                if (areas) text += `📍 Areas: ${areas.join(', ')}\n`;
                text += `\n`;
                hasPolicy = true;
            }
        }

        // ─── Refund Policy ───────────────────────────────────────────────
        if (refundPolicy) {
            const isObj = typeof refundPolicy === 'object' && refundPolicy !== null;
            const desc = isObj ? (refundPolicy.description || refundPolicy.descriptions?.en) : refundPolicy;
            const duration = isObj ? refundPolicy.durationDays : null;
            const conditions = isObj ? refundPolicy.conditions : null;

            if (desc || duration || conditions) {
                text += `↩️ *Refund Policy:*\n`;
                if (desc) text += `${desc}\n`;
                if (duration) text += `📅 Duration: ${duration} days\n`;
                if (conditions) text += `📋 Conditions: ${conditions}\n`;
                text += `\n`;
                hasPolicy = true;
            }
        }

        // ─── Payment Policy ──────────────────────────────────────────────
        if (paymentPolicy) {
            const isObj = typeof paymentPolicy === 'object' && paymentPolicy !== null;
            const instructions = isObj ? (paymentPolicy.instructions || paymentPolicy.instructionsMultilingual?.en) : paymentPolicy;
            const methods = isObj && Array.isArray(paymentPolicy.methods) && paymentPolicy.methods.length > 0 ? paymentPolicy.methods : null;

            if (instructions || methods) {
                text += `💳 *Payment Info:*\n`;
                if (methods) text += `Accepted Methods: ${methods.join(', ').toUpperCase()}\n`;
                if (instructions) text += `${instructions}\n`;
                text += `\n`;
                hasPolicy = true;
            }
        }

        if (!hasPolicy) {
            text += `No specific policies are listed at this time.\n\n`;
        }

        text += `_Type MENU to go back._`;
        return { text };
    }

    static aboutUs(context: any): BaileysMessage {
        const text =
            `🏢 *About ${context.name || 'Us'}*\n\n` +
            `📍 *Location:*\n${context.address || 'Not specified'}\n\n` +
            `📝 *Description:*\n${context.description || 'Welcome to our business.'}\n\n` +
            `⏰ *Working Hours:*\n` +
            (context.operatingHours?.enabled ? '(See schedule in main menu or message us)' : 'Available Online') + `\n\n` +
            `_Type MENU to return._`;

        return { text };
    }

    static contactUs(context: any): BaileysMessage {
        const text =
            `📞 *Contact & Support*\n\n` +
            `📍 *Address:*\n${context.address || 'N/A'}\n\n` +
            `💬 *Need personal assistance?*\nType *OWNER* and a team member will join this chat.\n\n` +
            `_Type MENU to go back._`;

        return { text };
    }

    static fallbackMessage(): BaileysMessage {
        return {
            text: "I didn't quite catch that. Please reply with a valid number from the menu.\n\n_Type MENU to see options again._"
        };
    }

    static timeoutMessage(): BaileysMessage {
        return {
            text: `⏳ Your session has timed out due to inactivity.\n\nPlease type *hi* or *menu* to start again.`
        };
    }

    static aiErrorMessage(): BaileysMessage {
        return {
            text: `⚠️ I'm currently experiencing some technical difficulties. Please try again in a moment.`
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // E-COMMERCE / PRODUCTS
    static categoryList(categories: Array<any>): BaileysMessage {
        if (categories.length === 0) {
            return { text: `📂 *Categories*\n\nNo categories available at the moment.\n\n_Type MENU to go back._` };
        }

        let text = `📂 *Shop by Category*\n\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `Reply with a number to view products:\n\n`;

        categories.forEach((c, idx) => {
            text += `${idx + 1}️⃣ ${c.emoji ? c.emoji + ' ' : ''}${c.name}\n\n`;
        });

        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `\n💡 *Tip:* Reply with a number (1-${categories.length}) to select a category\n`;
        text += `_Type MENU to return to main menu._`;
        
        return { text };
    }

    static productList(products: Array<any>, currency: string): BaileysMessage {
        if (products.length === 0) {
            return { text: `🛍️ *Product Catalog*\n\nNo products available at the moment.\n\n_Type MENU to go back._` };
        }

        let text = `🛍️ *Product Catalog*\n\n`;
        text += `Showing ${products.length} product${products.length > 1 ? 's' : ''}\n\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `Reply with a number to view details:\n\n`;

        products.forEach((p, idx) => {
            const originalPrice = p.price || 0;
            const discount = getItemDiscount({ ...p, unitPrice: originalPrice, qty: 1 } as any);
            const effectivePrice = originalPrice - discount;
            const hasDiscount = discount > 0;

            let priceStr;
            if (hasDiscount) {
                priceStr = `~${formatMoney(originalPrice, currency)}~ ${formatMoney(effectivePrice, currency)} 🏷️`;
            } else {
                priceStr = originalPrice ? formatMoney(originalPrice, currency) : 'Price on request';
            }

            text += `${idx + 1}️⃣ ${p.name}\n`;
            text += `   💵 ${priceStr}\n`;
            if (p.description) {
                const shortDesc = p.description.length > 40 ? p.description.substring(0, 40) + '...' : p.description;
                text += `   _${shortDesc}_\n`;
            }
            text += `\n`;
        });

        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `\n💡 *Tip:* Reply with a number (1-${products.length}) to see product details\n`;
        text += `_Type MENU to return to main menu._`;
        return { text };
    }

    static productFlow(product: any, currency: string): BaileysMessage {
        const originalPrice = product.price || 0;
        const discount = getItemDiscount({ ...product, unitPrice: originalPrice, qty: 1 } as any);
        const effectivePrice = originalPrice - discount;
        const hasDiscount = discount > 0;

        let text = `🛍️ *${product.name}*\n\n`;

        // Price section initially
        if (hasDiscount) {
            text += `💵 *Price:* ~${formatMoney(originalPrice, currency)}~ ${formatMoney(effectivePrice, currency)}\n\n`;
        } else {
            text += `💵 *Price:* ${formatMoney(effectivePrice, currency)}\n\n`;
        }

        // Stock status
        if (product.stock !== undefined) {
            if (product.stock > 10) {
                text += `✅ *In Stock* (${product.stock} available)\n\n`;
            } else if (product.stock > 0) {
                text += `⚠️ *Low Stock* (Only ${product.stock} left!)\n\n`;
            } else {
                text += `❌ *Out of Stock*\n\n`;
            }
        }

        // Description
        if (product.description) {
            text += `📝 *Description:*\n${product.description}\n\n`;
        }

        // Discount details after description
        if (hasDiscount) {
            text += `🏷️ *DISCOUNT APPLIED:* ${formatMoney(discount, currency)} OFF!\n`;
            text += `💰 *You Save:* ${formatMoney(discount, currency)} (${Math.round((discount / originalPrice) * 100)}%)\n\n`;
        }

        // Variants info
        if (product.variants && product.variants.length > 0) {
            text += `🎨 *Available Options:* ${product.variants.length} variants\n`;
            text += `You'll select options after adding to cart.\n\n`;
        }

        // Action menu
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `*What would you like to do?*\n\n`;
        text += `1️⃣ *Add to Cart* 🛒\n`;
        text += `2️⃣ *Back to Catalog* ←\n`;
        text += `3️⃣ *Main Menu* 🏠\n\n`;
        text += `_Reply with 1, 2, or 3_`;

        const msg: BaileysMessage = { text };

        // Send multiple images (at least 3 if available)
        const imageUrls: string[] = [];

        // Collect all available images
        if (product.imageUrl) {
            imageUrls.push(product.imageUrl);
        }
        if (product.images && Array.isArray(product.images)) {
            product.images.forEach((img: any) => {
                if (img.secureUrl && !imageUrls.includes(img.secureUrl)) {
                    imageUrls.push(img.secureUrl);
                }
            });
        }

        // Store all images in the message for the caller to send
        if (imageUrls.length > 0) {
            // Take first image as main thumbnail with caption
            msg.image = { url: imageUrls[0] };
            msg.caption = text;
            delete msg.text;

            // Store additional images in footer metadata for the message handler to extract
            const additionalImages = imageUrls.slice(1, 3); // Send up to 3 images total
            if (additionalImages.length > 0) {
                // Add metadata about additional images
                msg.footer = `📸 ${Math.min(imageUrls.length, 3)} images sent`;
                // Store additional image URLs in a custom property that the message handler will process
                (msg as any).additionalImageUrls = additionalImages;
            }
        }

        return msg;
    }

    static variantSelection(product: any): BaileysMessage {
        let text = `Please select an option for *${product.name}*:\n\n`;
        product.variants.forEach((v: any, index: number) => {
            const attrStr = v.attributes ? Object.entries(v.attributes).map(([k, val]) => `${val}`).join(', ') : '';
            const priceStr = v.price ? ` (+${v.price})` : '';
            text += `${index + 1}. ${v.name || attrStr}${priceStr}\n`;
        });
        text += `\n_Reply with a number or type MENU to go back._`;
        return { text };
    }

    static askQuantity(product: any): BaileysMessage {
        return {
            text: `How many *${product.name}* would you like to add?\n\nReply with a number (e.g., 1, 2, 5).`
        };
    }

    static cartUpdated(addedItem: CartItem, allItems: CartItem[], total: number, currency: string): BaileysMessage {
        const itemsStr = allItems.map((item, idx) =>
            `${idx + 1}. ${item.qty}x ${item.name} — ${formatMoney((item.unitPrice || 0) * item.qty, currency)}`
        ).join('\n');

        return {
            text:
                `✅ *Added to Cart!*\n\n` +
                `🛒 *Your Cart (${allItems.length} item${allItems.length > 1 ? 's' : ''}):*\n` +
                `${itemsStr}\n\n` +
                `*Total:* ${formatMoney(total, currency)}\n\n` +
                `Reply with a number:\n1️⃣ Checkout\n2️⃣ Keep Shopping\n3️⃣ Main Menu`
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Cart Summary - Clear and professional layout
    // Actions: 1 = Checkout, 2 = Keep Shopping, 3 = Main Menu
    // Clear cart is only via explicit keyword "clear cart" or cmd_clear_cart.
    // ──────────────────────────────────────────────────────────────────────────
    static cartSummary(items: CartItem[], total: number, currency: string): BaileysMessage {
        if (items.length === 0) {
            return { text: `🛒 *Your Shopping Cart*\n\nYour cart is empty.\n\nBrowse our catalog to add items!\n\n_Type MENU to browse products._` };
        }

        let text = `🛒 *Your Shopping Cart*\n\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `*Items (${items.length}):*\n\n`;

        let subtotal = 0;
        let totalDiscount = 0;

        items.forEach((item, idx) => {
            const itemSubtotal = (item.unitPrice || 0) * item.qty;
            const itemDiscount = getItemDiscount(item);
            const itemTotal = itemSubtotal - itemDiscount;

            subtotal += itemSubtotal;
            totalDiscount += itemDiscount;

            text += `${idx + 1}. ${item.name}\n`;
            if (itemDiscount > 0) {
                text += `   ${item.qty} × ${formatMoney(item.unitPrice || 0, currency)} = ~${formatMoney(itemSubtotal, currency)}~ ${formatMoney(itemTotal, currency)}\n`;
                text += `   🏷️ _Save ${formatMoney(itemDiscount, currency)}_\n`;
            } else {
                text += `   ${item.qty} × ${formatMoney(item.unitPrice || 0, currency)} = ${formatMoney(itemTotal, currency)}\n`;
            }

            if (item.size || item.color) {
                const attrs = [];
                if (item.size) attrs.push(`Size: ${item.size}`);
                if (item.color) attrs.push(`Color: ${item.color}`);
                text += `   _${attrs.join(' | ')}_\n`;
            }
            if (item.specialInstructions) {
                text += `   📝 _${item.specialInstructions}_\n`;
            }
            text += `\n`;
        });

        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        if (totalDiscount > 0) {
            text += `💰 *Subtotal:* ${formatMoney(subtotal, currency)}\n`;
            text += `🏷️ *Total Discount:* -${formatMoney(totalDiscount, currency)}\n`;
        }
        text += `💰 *Cart Total:* ${formatMoney(total, currency)}\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        text += `*What would you like to do?*\n\n`;
        text += `1️⃣ *Proceed to Checkout* 💳\n`;
        text += `2️⃣ *Continue Shopping* 🛍️\n`;
        text += `3️⃣ *Return to Main Menu* 🏠\n\n`;
        text += `💡 *To remove an item:* Type "remove 1" (where 1 is the item number)\n`;
        text += `💡 *To clear cart:* Type "clear cart"\n\n`;
        text += `_Reply with 1, 2, or 3_`;

        return { text };
    }

    static cartEmpty(): BaileysMessage {
        return { text: `🛒 Your cart is empty!\n\nBrowse our catalog to add items.\n\n_Type MENU to go back._` };
    }

    static cartFull(): BaileysMessage {
        return { text: `Your cart is full. Please checkout or remove items first.\n\nReply:\n1️⃣ View Cart\n2️⃣ Checkout` };
    }

    static cartCleared(): BaileysMessage {
        return { text: `🛒 Your cart has been cleared.\n\n_Type MENU to browse products._` };
    }

    static askCheckoutDetails(): BaileysMessage {
        return {
            text: `📝 *Delivery Information*\n\n` +
                `Please provide your delivery details in a single message:\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `*Required:* Name, Address, City, Phone Number\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `*Example:*\n` +
                `_Ali Khan, House 123 Street 4, Lahore, 03001234567_\n\n` +
                `💡 *Want to add special instructions?*\n` +
                `Include them at the end after a dash (-):\n` +
                `_Ali Khan, House 123, Lahore, 03001234567 - Please deliver after 6 PM_`
        };
    }

    static orderSummary(session: SessionContext, currency: string, orderData?: any): BaileysMessage {
        const cart = session.cart || [];

        // Use computed values from orderData if available (passed from CartEngine.computeOrderTotals)
        const subtotal = orderData ? orderData.subtotal : cart.reduce((s, item) => s + ((item.unitPrice || 0) * item.qty), 0);
        const discount = orderData ? orderData.discountAmount : (subtotal - calculateTotal(cart));
        const deliveryFee = orderData ? orderData.deliveryFee : 0;
        const total = orderData ? orderData.totalAmount : (subtotal - discount + deliveryFee);

        const dd: any = session.deliveryDetails || {};

        let text = `🧾 *Order Summary*\n\n`;

        // Delivery Details Section
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `📍 *Delivery Information:*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `👤 *Name:* ${dd.name || 'N/A'}\n`;
        text += `📍 *Address:* ${dd.address || 'N/A'}${dd.city ? `, ${dd.city}` : ''}\n`;
        text += `📞 *Phone:* ${dd.phone || 'N/A'}\n`;

        // Show special instructions if provided
        if (dd.instructions) {
            text += `\n📝 *Special Instructions:*\n`;
            text += `_${dd.instructions}_\n`;
        }

        text += `\n`;

        // Items Section
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `📦 *Order Items:*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        cart.forEach((item, idx) => {
            const itemSubtotal = (item.unitPrice || 0) * item.qty;
            const itemDiscount = getItemDiscount(item);
            const itemTotal = itemSubtotal - itemDiscount;

            text += `${idx + 1}. ${item.name}\n`;
            if (itemDiscount > 0) {
                text += `   ${item.qty} × ${formatMoney(item.unitPrice || 0, currency)} = ~${formatMoney(itemSubtotal, currency)}~ ${formatMoney(itemTotal, currency)}\n`;
                text += `   🏷️ _Item Savings: ${formatMoney(itemDiscount, currency)}_\n`;
            } else {
                text += `   ${item.qty} × ${formatMoney(item.unitPrice || 0, currency)} = ${formatMoney(itemTotal, currency)}\n`;
            }

            if (item.size || item.color) {
                const attrs = [];
                if (item.size) attrs.push(`Size: ${item.size}`);
                if (item.color) attrs.push(`Color: ${item.color}`);
                text += `   _${attrs.join(' | ')}_\n`;
            }
            text += `\n`;
        });

        // Financial Summary
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `💰 *Payment Summary:*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `Subtotal: ${formatMoney(subtotal, currency)}\n`;

        if (discount > 0) {
            text += `Discount: -${formatMoney(discount, currency)}\n`;
        }
        if (deliveryFee > 0) {
            text += `Delivery Fee: ${formatMoney(deliveryFee, currency)}\n`;
        }

        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `*TOTAL: ${formatMoney(total, currency)}*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Action Menu
        text += `*Ready to place your order?*\n\n`;
        text += `1️⃣ *Confirm Order* ✅\n`;
        text += `   Place order and proceed\n\n`;
        text += `2️⃣ *Cancel* ❌\n`;
        text += `   Discard this order\n\n`;
        text += `3️⃣ *Edit Details* ✏️\n`;
        text += `   Change delivery information\n\n`;
        text += `_Reply with 1, 2, or 3_`;

        return { text };
    }

    static orderSuccess(orderNumber: string, customerName: string): BaileysMessage {
        return {
            text: `✅ *Order Placed Successfully!*\n\n` +
                `Hi ${customerName},\n\n` +
                `Thank you for your order. We've received it and will process it shortly.\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `*Order Number:* #${orderNumber}\n` +
                `*Status:* PENDING\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `📱 *What's Next?*\n` +
                `• We'll confirm your order soon\n` +
                `• You'll receive updates on your order status\n` +
                `• Reply with *#${orderNumber}* anytime to track your order\n\n` +
                `💬 *Need help?* Reply with *OWNER* to speak with our team.\n\n` +
                `_Type MENU to browse more products._`
        };
    }

    static ownerNewOrder(order: any): string {
        const typeLabel = order.type === 'booking' ? 'BOOKING' : 'ORDER';
        const isBooking = order.type === 'booking';

        let msg = `🔔 *New ${typeLabel} Received!*\n\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `*${typeLabel} Number:* #${order.orderNumber}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Customer Information
        msg += `👤 *Customer Details:*\n`;
        msg += `*Name:* ${order.customerInfo?.name || 'Guest'}\n`;
        msg += `*Phone:* ${order.customerInfo?.phone || 'Not provided'}\n`;
        if (order.customerInfo?.email) {
            msg += `*Email:* ${order.customerInfo.email}\n`;
        }
        msg += `\n`;

        // Items
        if (order.items && order.items.length > 0) {
            msg += `📦 *Items Ordered:*\n`;
            order.items.forEach((item: any, idx: number) => {
                const qty = item.quantity || item.qty || 1;
                const price = item.price || item.unitPrice || 0;
                const total = item.total || (price * qty);
                msg += `${idx + 1}. ${item.name} x${qty}\n`;
                if (item.size || item.color) {
                    const attrs = [];
                    if (item.size) attrs.push(`Size: ${item.size}`);
                    if (item.color) attrs.push(`Color: ${item.color}`);
                    msg += `   _${attrs.join(', ')}_\n`;
                }
            });
            msg += `\n`;
        }

        // Financial Summary
        msg += `💰 *Order Summary:*\n`;
        if (order.subtotal && order.subtotal !== order.totalAmount) {
            msg += `*Subtotal:* ${formatMoney(order.subtotal, order.currency || 'PKR')}\n`;
        }
        if (order.discountAmount && order.discountAmount > 0) {
            msg += `*Discount:* -${formatMoney(order.discountAmount, order.currency || 'PKR')}\n`;
        }
        if (order.deliveryFee && order.deliveryFee > 0) {
            msg += `*Delivery:* ${formatMoney(order.deliveryFee, order.currency || 'PKR')}\n`;
        }
        msg += `*Total:* ${formatMoney(order.totalAmount, order.currency || 'PKR')}\n\n`;

        // Delivery/Booking Details
        if (isBooking && order.bookingDetails) {
            msg += `📅 *Booking Details:*\n`;
            if (order.bookingDetails.preferredDate) {
                msg += `*Date:* ${order.bookingDetails.preferredDate}\n`;
            }
            if (order.bookingDetails.preferredTime) {
                msg += `*Time:* ${order.bookingDetails.preferredTime}\n`;
            }
            if (order.bookingDetails.serviceType) {
                msg += `*Service:* ${order.bookingDetails.serviceType}\n`;
            }
            msg += `\n`;
        } else if (order.deliveryDetails) {
            msg += `🚚 *Delivery Address:*\n`;
            msg += `${order.deliveryDetails.address || 'Not provided'}\n`;
            if (order.deliveryDetails.city) {
                msg += `${order.deliveryDetails.city}\n`;
            }
            if (order.deliveryDetails.instructions) {
                msg += `\n*Instructions:* ${order.deliveryDetails.instructions}\n`;
            }
            msg += `\n`;
        }

        // Special Instructions
        if (order.specialInstructions) {
            msg += `📝 *Special Instructions:*\n`;
            msg += `${order.specialInstructions}\n\n`;
        }

        // Action Required
        msg += `⚡ *Action Required:*\n`;
        msg += `Please review and confirm this ${typeLabel.toLowerCase()} in your dashboard.\n\n`;
        msg += `👉 ${process.env.DASHBOARD_URL || 'http://localhost:3000'}/dashboard/orders`;

        return msg;
    }

    static formatOrderStatusUpdate(order: any, status: string, note?: string): string {
        const statusConfig: Record<string, { emoji: string; title: string; description: string }> = {
            'pending': { emoji: '⏳', title: 'Order Received', description: 'Your order has been received and is awaiting confirmation.' },
            'confirmed': { emoji: '✅', title: 'Order Confirmed', description: 'Your order has been confirmed and is being prepared.' },
            'processing': { emoji: '📦', title: 'Order Processing', description: 'Your order is being processed and packed.' },
            'shipped': { emoji: '🚚', title: 'Order Shipped', description: 'Your order has been shipped and is on its way.' },
            'delivered': { emoji: '🎉', title: 'Order Delivered', description: 'Your order has been delivered. Enjoy!' },
            'cancelled': { emoji: '❌', title: 'Order Cancelled', description: 'Your order has been cancelled.' },
            'rejected': { emoji: '🚫', title: 'Order Rejected', description: 'Unfortunately, your order could not be fulfilled.' }
        };

        const config = statusConfig[status.toLowerCase()] || { emoji: '📦', title: 'Order Update', description: 'Your order status has been updated.' };
        const typeLabel = order.type === 'booking' ? 'Booking' : 'Order';

        let msg = `${config.emoji} *${config.title}*\n\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `*${typeLabel} Number:* #${order.orderNumber}\n`;
        msg += `*Status:* ${status.toUpperCase()}\n`;

        // Add items summary if available
        if (order.items && order.items.length > 0) {
            msg += `\n*Items:*\n`;
            order.items.slice(0, 5).forEach((item: any) => {
                const qty = item.quantity || item.qty || 1;
                msg += `• ${item.name} x${qty}\n`;
            });
            if (order.items.length > 5) {
                msg += `• ... and ${order.items.length - 5} more item(s)\n`;
            }
        }

        // Add total if available
        if (order.totalAmount) {
            const currency = order.currency || 'USD';
            msg += `\n*Total:* ${formatMoney(order.totalAmount, currency)}\n`;
        }

        msg += `━━━━━━━━━━━━━━━━━━━━\n`;

        // Add the status description
        msg += `\n${config.description}\n`;

        // Add owner's note if provided - HIGHLIGHTED for delivery info
        if (note && note.trim()) {
            msg += `\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `💬 *Message from ${order.businessName || 'the store'}:*\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `_${note.trim()}_\n`;

            // If note contains delivery-related keywords, add extra emphasis
            const deliveryKeywords = ['delivery', 'deliver', 'arrive', 'shipping', 'shipped', 'day', 'days', 'hours', 'hour', 'tomorrow', 'today'];
            const hasDeliveryInfo = deliveryKeywords.some(keyword => note.toLowerCase().includes(keyword));
            if (hasDeliveryInfo) {
                msg += `\n🚚 *Please save this delivery information!*\n`;
            }
        }

        // Add appropriate next steps based on status
        if (status.toLowerCase() === 'shipped') {
            msg += `\n📱 *Tracking your order:*\n`;
            msg += `Reply with *TRACK* to get the latest delivery status.\n`;
        } else if (status.toLowerCase() === 'delivered') {
            msg += `\n✨ We hope you love your purchase!\n`;
            msg += `Reply with *MENU* to browse more products.\n`;
        } else if (status.toLowerCase() === 'cancelled' || status.toLowerCase() === 'rejected') {
            msg += `\n💬 *Questions?*\n`;
            msg += `Reply with *OWNER* to speak with our team.\n`;
        } else if (status.toLowerCase() === 'confirmed') {
            msg += `\n📱 *What's Next?*\n`;
            msg += `• We'll prepare your order carefully\n`;
            msg += `• You'll receive updates when it ships\n`;
            msg += `• Reply with *#${order.orderNumber}* to track anytime\n`;
        } else {
            msg += `\n📱 *Need help?*\n`;
            msg += `Reply with *MENU* for options or *OWNER* to speak with us.\n`;
        }

        return msg;
    }

    static askOrderId(): BaileysMessage {
        return {
            text: `📦 *Track Your Order*\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `Please share your *Order ID* (e.g. *#1234*) and we'll check the status right away.\n\n` +
                `_Type MENU to go back._`
        };
    }

    static productAddedConfirmation(product: any): BaileysMessage {
        return {
            text: `✅ Added *${product.name}* to your cart.\n\nAny special instructions for this item? (Reply 'no' to skip)\n\n_Or type MENU to go back._`
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SERVICES / BOOKING
    // ──────────────────────────────────────────────────────────────────────────

    static serviceList(services: Array<any>, currency: string): BaileysMessage {
        if (services.length === 0) {
            return { text: `No services found.\n\n_Type MENU to go back._` };
        }

        let text = `🛠️ *Our Services*\n\nPlease reply with the number to view details:\n\n`;
        services.forEach((s, idx) => {
            const priceStr = s.price ? `- ${currency} ${s.price.toFixed(2)}` : '';
            text += `${idx + 1}. ${s.name} ${priceStr}\n`;
        });

        text += `\n_Type MENU to go back._`;
        return { text };
    }

    static serviceFlow(service: any, currency: string): BaileysMessage {
        const text = `🛠️ *${service.name}*\n\n` +
            `Duration: ${service.duration || 60} mins\n` +
            `Price: ${currency} ${service.price.toFixed(2)}\n\n` +
            `${service.description || ''}\n\n` +
            `Reply with a number:\n1️⃣ Book Appointment\n2️⃣ Back`;

        const msg: BaileysMessage = { text };

        const imgUrl = service.imageUrl || (service.images && service.images.length > 0 ? service.images[0].secureUrl : null);
        if (imgUrl) {
            msg.image = { url: imgUrl };
            msg.caption = msg.text;
            delete msg.text;
        }

        return msg;
    }

    static askBookingDate(dates: string[]): BaileysMessage {
        let text = `📅 *Select Date:*\n\n`;
        if (dates && dates.length > 0) {
            dates.forEach((d, i) => text += `${i + 1}️⃣ ${d}\n`);
            text += `\nReply with a date number.`;
        } else {
            text += `Reply with your preferred date (e.g., Tomorrow, Monday).`;
        }
        return { text };
    }

    static askBookingTime(times: string[]): BaileysMessage {
        let text = `⏰ *Select Time:*\n\n`;
        if (times && times.length > 0) {
            times.forEach((t, i) => text += `${i + 1}️⃣ ${t}\n`);
            text += `\nReply with a time number.`;
        } else {
            text += `Reply with your preferred time (e.g., 2 PM).`;
        }
        return { text };
    }

    static askBookingNamePhone(): BaileysMessage {
        return { text: `Almost done! Please reply with your Name and Phone Number.\nExample: Ali Khan, 03001234567` };
    }

    static bookingConfirmation(details: any, currency: string): BaileysMessage {
        const text = `📅 *Appointment Confirmation*\n\n` +
            `Service: ${details.serviceName}\n` +
            `Date: ${details.date}\n` +
            `Time: ${details.time}\n` +
            `Customer: ${details.name}\n` +
            `Phone: ${details.phone}\n\n` +
            `Reply with a number:\n1️⃣ Confirm\n2️⃣ Cancel`;
        return { text };
    }

    static ownerNewBooking(booking: any): string {
        return `📢 *New Booking Received!*\n\n` +
            `Service: ${booking.serviceName}\n` +
            `Date: ${booking.date}\n` +
            `Time: ${booking.time}\n` +
            `Customer: ${booking.name}\n` +
            `Phone: ${booking.phone}\n\n` +
            `Check Dashboard: ${process.env.DASHBOARD_URL || 'http://localhost:3000'}/dashboard/appointments`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // INFORMATIVE / INSTITUTE (NO CART, NO ORDERS)
    // ──────────────────────────────────────────────────────────────────────────

    static instituteGreeting(businessName: string): BaileysMessage {
        const menuText =
            `👋 Welcome to *${businessName}*!\n` +
            `How can we help you today?\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `1️⃣ Courses 🎓\n` +
            `2️⃣ Admissions 📝\n` +
            `3️⃣ Events 📅\n` +
            `4️⃣ Scholarships 🎓\n` +
            `5️⃣ About Us ℹ️\n` +
            `6️⃣ Contact 📞\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `_Reply with a number._`;

        return { text: menuText };
    }

    static instituteCourses(courses: any[]): BaileysMessage {
        if (!courses || courses.length === 0) return { text: `No courses currently listed.\n\n_Type MENU to go back._` };

        let text = `🎓 *Our Courses*\n\n`;
        courses.forEach((c, i) => text += `${i + 1}️⃣ ${c.name}\n`);
        text += `\n_Reply with a number to get details._`;
        return { text };
    }

    static instituteCourseDetail(course: any): BaileysMessage {
        let text = `🎓 *${course.name}*\n\n`;
        const duration = course.attributes?.duration || 'Not specified';
        const fee = course.attributes?.fee || (course.price ? `${course.currency} ${course.price}` : 'Not specified');

        text += `Duration: ${duration}\n`;
        text += `Fee: ${fee}\n`;
        text += `\n${course.description || ''}\n\n`;

        if (course.attributes?.admissionLink) text += `To apply, visit:\n${course.attributes.admissionLink}\n\n`;
        text += `_Type MENU to return._`;
        return { text };
    }

    static instituteAdmissions(context: any): BaileysMessage {
        const text = `📝 *Admissions*\n\n` +
            `Procedure:\n${context.policies?.payment?.instructions || 'Please contact administration for details.'}\n\n` +
            `For more details contact:\n${context.contactPhone || 'N/A'}\n\n` +
            `_Type MENU to return._`;
        return { text };
    }

    static instituteEvents(events: any[]): BaileysMessage {
        if (!events || events.length === 0) return { text: `No upcoming events.\n\n_Type MENU to go back._` };

        let text = `📅 *Upcoming Events*\n\n`;
        events.forEach((e, i) => {
            text += `${i + 1}️⃣ ${e.name}\n`;
            if (e.attributes?.date) text += `Date: ${e.attributes.date}\n`;
            text += `\n`;
        });
        text += `_Reply with event number for details._`;
        return { text };
    }
}
