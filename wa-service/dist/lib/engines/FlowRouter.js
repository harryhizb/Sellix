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
exports.flowRouter = exports.FlowRouter = void 0;
const types_1 = require("../types");
const CartEngine_1 = require("./CartEngine");
const BookingEngine_1 = require("./BookingEngine");
const InquiryEngine_1 = require("./InquiryEngine");
const InstituteEngine_1 = require("./InstituteEngine");
const TemplateRegistry_1 = require("../templates/TemplateRegistry");
const OrderService_1 = require("../OrderService");
const BusinessService_1 = require("../BusinessService");
const WhatsAppSessionManager_1 = require("../WhatsAppSessionManager");
const cartEngine = new CartEngine_1.CartEngine();
const bookingEngine = new BookingEngine_1.BookingEngine();
const inquiryEngine = new InquiryEngine_1.InquiryEngine();
const instituteEngine = new InstituteEngine_1.InstituteEngine();
function resolveCapabilities(context) {
    return (context.capabilities || {
        supportsProducts: false,
        supportsServices: false,
        supportsBooking: false,
        supportsCart: false,
        supportsInformation: false,
    });
}
function parseButtonId(message) {
    const m = message.trim();
    if (m.startsWith("cmd_add_cart_"))
        return { cmd: "add_cart", payload: m.replace("cmd_add_cart_", "") };
    if (m.startsWith("cmd_book_"))
        return { cmd: "book", payload: m.replace("cmd_book_", "") };
    if (m === "cmd_browse")
        return { cmd: "browse" };
    if (m === "cmd_cart" || m === "cmd_view_cart")
        return { cmd: "view_cart" };
    if (m === "cmd_checkout")
        return { cmd: "checkout" };
    if (m === "cmd_clear_cart")
        return { cmd: "clear_cart" };
    if (m === "cmd_menu" || m === "menu")
        return { cmd: "menu" };
    if (m === "cmd_track")
        return { cmd: "track" };
    if (m === "cmd_info" || m === "cmd_about")
        return { cmd: "info" };
    if (m === "cmd_contact")
        return { cmd: "contact" };
    if (m === "confirm")
        return { cmd: "confirm" };
    if (m === "cancel")
        return { cmd: "cancel" };
    if (m === "edit")
        return { cmd: "edit" };
    return null;
}
class FlowRouter {
    route(session, context, message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const caps = resolveCapabilities(context);
            const msgLower = message.trim().toLowerCase();
            const btn = parseButtonId(message.trim());
            if (btn) {
                switch (btn.cmd) {
                    case "browse":
                        if (caps.supportsInformation)
                            return instituteEngine.handleBrowseCourses(session, context);
                        if (caps.supportsBooking)
                            return bookingEngine.handleBrowse(session, context);
                        if (caps.supportsCart)
                            return cartEngine.handleBrowse(session, context);
                        return inquiryEngine.handleBrowse(session, context);
                    case "view_cart":
                        return cartEngine.handleCart(session, "view", context);
                    case "checkout":
                        return cartEngine.handleCheckout(session, message, context);
                    case "clear_cart":
                        session.cart = [];
                        return {
                            response: TemplateRegistry_1.TemplateRegistry.cartCleared(),
                            newState: types_1.BotState.MAIN_MENU,
                            updatedSession: session,
                        };
                    case "add_cart": {
                        const product = (_a = session.meta) === null || _a === void 0 ? void 0 : _a.focusingProduct;
                        if (!product)
                            return cartEngine.handleBrowse(session, context);
                        return cartEngine.handleViewingProduct(session, "add", context);
                    }
                    case "book": {
                        const service = (_b = session.meta) === null || _b === void 0 ? void 0 : _b.focusingProduct;
                        if (!service)
                            return bookingEngine.handleBrowse(session, context);
                        return bookingEngine.askBookingDetails(session, context);
                    }
                    case "track":
                        return {
                            response: TemplateRegistry_1.TemplateRegistry.askOrderId(),
                            newState: types_1.BotState.TRACKING_ORDER,
                            updatedSession: session,
                        };
                    case "confirm":
                        if (caps.supportsBooking)
                            return bookingEngine.processBooking(session, context);
                        return cartEngine.processOrder(session, context);
                    case "cancel":
                        session.cart = [];
                        session.deliveryDetails = undefined;
                        return {
                            response: TemplateRegistry_1.TemplateRegistry.cartCleared(),
                            newState: types_1.BotState.MAIN_MENU,
                            updatedSession: session,
                        };
                    case "edit":
                        if (caps.supportsBooking)
                            return bookingEngine.askBookingDetails(session, context);
                        return cartEngine.handleCheckout(session, message, context);
                    default:
                        return null;
                }
            }
            switch (session.conversationState) {
                case types_1.BotState.MAIN_MENU: {
                    if (msgLower === "1") {
                        // FIX: removed dead console.log that was after a return statement
                        if (caps.supportsInformation)
                            return instituteEngine.handleBrowseCourses(session, context);
                        if (caps.supportsServices || caps.supportsBooking)
                            return bookingEngine.handleBrowse(session, context);
                        if (caps.supportsProducts || caps.supportsCart)
                            return cartEngine.handleBrowse(session, context);
                        return inquiryEngine.handleBrowse(session, context);
                    }
                    if (msgLower === "2") {
                        return {
                            response: TemplateRegistry_1.TemplateRegistry.askOrderId(),
                            newState: types_1.BotState.TRACKING_ORDER,
                            updatedSession: session,
                        };
                    }
                    if (msgLower === '3') {
                        console.log("[DEBUG] context.policies =", JSON.stringify(context.policies, null, 2));
                        return {
                            response: TemplateRegistry_1.TemplateRegistry.policies(context),
                            newState: types_1.BotState.VIEWING_POLICY,
                            updatedSession: session
                        };
                    }
                    if (msgLower === "4") {
                        // Notify the owner that a customer is requesting help
                        BusinessService_1.businessService.getBusinessContext(session.businessId).then((ctx) => __awaiter(this, void 0, void 0, function* () {
                            if (ctx === null || ctx === void 0 ? void 0 : ctx.contactPhone) {
                                const cleanPhone = String(ctx.contactPhone).replace(/\D/g, "");
                                const ownerJid = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
                                const customerPhone = session.userId.split("@")[0];
                                const ownerMsg = `🆘 *Customer Help Request*\n\n` +
                                    `Customer *${customerPhone}* has selected the *Contact & Support* option and may need assistance.\n\n` +
                                    `📱 Open your dashboard to respond:\n` +
                                    `${process.env.DASHBOARD_URL || 'http://localhost:3000'}/dashboard/chat`;
                                yield WhatsAppSessionManager_1.whatsappSessionManager.sendMessage(session.businessId, ownerJid, { text: ownerMsg });
                            }
                        })).catch(err => console.error("[FlowRouter] Failed to notify owner on option 4:", err));
                        return {
                            response: TemplateRegistry_1.TemplateRegistry.contactUs(context),
                            newState: types_1.BotState.MAIN_MENU,
                            updatedSession: session,
                        };
                    }
                    if (msgLower.includes("browse") ||
                        msgLower.includes("product") ||
                        msgLower.includes("catalog")) {
                        if (caps.supportsCart)
                            return cartEngine.handleBrowse(session, context);
                        if (caps.supportsBooking)
                            return bookingEngine.handleBrowse(session, context);
                    }
                    if (msgLower.includes("service") ||
                        msgLower.includes("book") ||
                        msgLower.includes("appoint")) {
                        if (caps.supportsBooking)
                            return bookingEngine.handleBrowse(session, context);
                    }
                    if (msgLower.includes("cart"))
                        return cartEngine.handleCart(session, "view", context);
                    if (msgLower.includes("track") || msgLower.includes("order")) {
                        return {
                            response: TemplateRegistry_1.TemplateRegistry.askOrderId(),
                            newState: types_1.BotState.TRACKING_ORDER,
                            updatedSession: session,
                        };
                    }
                    if (msgLower.includes("info") || msgLower.includes("about"))
                        return inquiryEngine.handleBrowse(session, context);
                    return null;
                }
                case types_1.BotState.VIEWING_POLICY:
                    console.log("[DEBUG policies context]", JSON.stringify(context.policies, null, 2));
                    if (msgLower === "menu" || msgLower.includes("back")) {
                        const storeUrl = context.slug ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/store/${context.slug}` : undefined;
                        return {
                            response: TemplateRegistry_1.TemplateRegistry.mainMenu(context.name || "Menu", caps, storeUrl),
                            newState: types_1.BotState.MAIN_MENU,
                            updatedSession: session,
                        };
                    }
                    return {
                        response: TemplateRegistry_1.TemplateRegistry.policies(context),
                        newState: types_1.BotState.VIEWING_POLICY,
                        updatedSession: session,
                    };
                case types_1.BotState.TRACKING_ORDER: {
                    const orderNumber = message.trim().replace(/^#/, ""); // remove leading #
                    if (!orderNumber) {
                        return {
                            response: TemplateRegistry_1.TemplateRegistry.askOrderId(),
                            newState: types_1.BotState.TRACKING_ORDER,
                            updatedSession: session,
                        };
                    }
                    try {
                        const order = yield OrderService_1.orderService.getOrderByNumber(orderNumber, session.businessId);
                        if (!order) {
                            return {
                                response: `❌ Order #${orderNumber} not found. Please check the number and try again.`,
                                newState: types_1.BotState.TRACKING_ORDER,
                                updatedSession: session,
                            };
                        }
                        // Format order status message
                        const statusMessage = `📦 *Order #${order.orderNumber}*\n\n` +
                            `Status: ${order.status || "Processing"}\n` +
                            `Date: ${new Date(order.createdAt).toLocaleDateString()}\n` +
                            `Total: ${order.totalAmount} ${order.currency || "USD"}\n\n` +
                            `Items:\n` +
                            order.items
                                .map((item) => `• ${item.name} x${item.quantity || item.qty}`)
                                .join("\n");
                        return {
                            response: statusMessage + "\n\nType MENU to go back.",
                            newState: types_1.BotState.MAIN_MENU,
                            updatedSession: session,
                        };
                    }
                    catch (error) {
                        console.error("[FlowRouter] Error tracking order:", error);
                        return {
                            response: "❌ Sorry, there was an error retrieving your order. Please try again later.",
                            newState: types_1.BotState.MAIN_MENU,
                            updatedSession: session,
                        };
                    }
                }
                case types_1.BotState.BROWSING_PRODUCTS:
                    if (caps.supportsInformation) {
                        return instituteEngine.handleCourseBrowsing(session, message, context);
                    }
                    if (caps.supportsBooking) {
                        return bookingEngine.handleServiceBrowsing(session, message, context);
                    }
                    if (caps.supportsCart) {
                        return cartEngine.handleProductBrowsing(session, message, context);
                    }
                    if (caps.supportsInformation) {
                        return inquiryEngine.handleInquiryCollection(session, message, context);
                    }
                    return null;
                case types_1.BotState.BROWSING_COURSES:
                    return instituteEngine.handleCourseBrowsing(session, message, context);
                case types_1.BotState.VIEWING_PRODUCT:
                    if (caps.supportsInformation) {
                        return instituteEngine.handleViewingCourse(session, message, context);
                    }
                    if (caps.supportsBooking) {
                        return bookingEngine.handleViewingService(session, message, context);
                    }
                    return cartEngine.handleViewingProduct(session, message, context);
                case types_1.BotState.SELECTING_VARIANT:
                    return cartEngine.handleVariantSelection(session, message, context);
                case types_1.BotState.AWAITING_QUANTITY:
                    // This is where "2" should land — handleQuantityInput, NOT tracking
                    return cartEngine.handleQuantityInput(session, message, context);
                case types_1.BotState.COLLECTING_PRODUCT_NOTES:
                    return cartEngine.handleProductNotes(session, message, context);
                case types_1.BotState.CART_ACTIVE:
                    return cartEngine.handleCart(session, message, context);
                case types_1.BotState.COLLECTING_DETAILS:
                    if (caps.supportsBooking) {
                        return bookingEngine.handleCollectingDetails(session, message, context);
                    }
                    return cartEngine.handleCollectingDetails(session, message, context);
                case types_1.BotState.CONFIRMING_ORDER: {
                    const norm = msgLower.replace(/[^a-z0-9\s]/g, "").trim();
                    if (norm === "menu" || norm === "0")
                        return null;
                    if (norm.includes("confirm") || norm === "1") {
                        if (caps.supportsBooking)
                            return bookingEngine.processBooking(session, context);
                        return cartEngine.processOrder(session, context);
                    }
                    if (norm.includes("edit") || norm.includes("change") || norm === "3") {
                        if (caps.supportsBooking)
                            return bookingEngine.askBookingDetails(session, context);
                        return cartEngine.handleCheckout(session, message, context);
                    }
                    if (norm.includes("cancel") || norm === "no" || norm === "2") {
                        session.cart = [];
                        session.deliveryDetails = undefined;
                        return {
                            response: TemplateRegistry_1.TemplateRegistry.cartCleared(),
                            newState: types_1.BotState.MAIN_MENU,
                            updatedSession: session,
                        };
                    }
                    // Re-show order summary using CartEngine (which computes correct totals)
                    const confirmMsg = caps.supportsBooking
                        ? bookingEngine.getConfirmationMessage(session, context)
                        : cartEngine.getConfirmationMessage(session, context);
                    return {
                        response: confirmMsg,
                        newState: types_1.BotState.CONFIRMING_ORDER,
                        updatedSession: session,
                    };
                }
                case types_1.BotState.IDLE:
                case types_1.BotState.GREETING:
                    if (caps.supportsInformation &&
                        !caps.supportsCart &&
                        !caps.supportsBooking) {
                        return inquiryEngine.handleGreeting(session, context);
                    }
                    return null;
                default:
                    return null;
            }
        });
    }
    getBrowseResponse(session, context) {
        const caps = resolveCapabilities(context);
        if (caps.supportsBooking)
            return bookingEngine.handleBrowse(session, context);
        if (caps.supportsCart)
            return cartEngine.handleBrowse(session, context);
        if (caps.supportsInformation)
            return inquiryEngine.handleBrowse(session, context);
        return cartEngine.handleBrowse(session, context); // fallback
    }
}
exports.FlowRouter = FlowRouter;
exports.flowRouter = new FlowRouter();
