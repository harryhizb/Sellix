import { SessionContext, BotState, RuleEngineResponse } from "../types";
import { CartEngine } from "./CartEngine";
import { BookingEngine } from "./BookingEngine";
import { InquiryEngine } from "./InquiryEngine";
import { InstituteEngine } from "./InstituteEngine";
import { TemplateRegistry } from "../templates/TemplateRegistry";
import { orderService } from "../OrderService";
import { businessService } from "../BusinessService";
import { whatsappSessionManager } from "../WhatsAppSessionManager";

const cartEngine = new CartEngine();
const bookingEngine = new BookingEngine();
const inquiryEngine = new InquiryEngine();
const instituteEngine = new InstituteEngine();

function resolveCapabilities(context: any): {
  supportsProducts: boolean;
  supportsServices: boolean;
  supportsBooking: boolean;
  supportsCart: boolean;
  supportsInformation: boolean;
} {
  return (
    context.capabilities || {
      supportsProducts: false,
      supportsServices: false,
      supportsBooking: false,
      supportsCart: false,
      supportsInformation: false,
    }
  );
}

function parseButtonId(
  message: string,
): { cmd: string; payload?: string } | null {
  const m = message.trim();
  if (m.startsWith("cmd_add_cart_"))
    return { cmd: "add_cart", payload: m.replace("cmd_add_cart_", "") };
  if (m.startsWith("cmd_book_"))
    return { cmd: "book", payload: m.replace("cmd_book_", "") };
  if (m === "cmd_browse") return { cmd: "browse" };
  if (m === "cmd_cart" || m === "cmd_view_cart") return { cmd: "view_cart" };
  if (m === "cmd_checkout") return { cmd: "checkout" };
  if (m === "cmd_clear_cart") return { cmd: "clear_cart" };
  if (m === "cmd_menu" || m === "menu") return { cmd: "menu" };
  if (m === "cmd_track") return { cmd: "track" };
  if (m === "cmd_info" || m === "cmd_about") return { cmd: "info" };
  if (m === "cmd_contact") return { cmd: "contact" };
  if (m === "confirm") return { cmd: "confirm" };
  if (m === "cancel") return { cmd: "cancel" };
  if (m === "edit") return { cmd: "edit" };
  return null;
}

export class FlowRouter {
  async route(
    session: SessionContext,
    context: any,
    message: string,
  ): Promise<RuleEngineResponse | null> {
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
            response: TemplateRegistry.cartCleared(),
            newState: BotState.MAIN_MENU,
            updatedSession: session,
          };

        case "add_cart": {
          const product = session.meta?.focusingProduct;
          if (!product) return cartEngine.handleBrowse(session, context);
          return cartEngine.handleViewingProduct(session, "add", context);
        }

        case "book": {
          const service = session.meta?.focusingProduct;
          if (!service) return bookingEngine.handleBrowse(session, context);
          return bookingEngine.askBookingDetails(session, context);
        }

        case "track":
          return {
            response: TemplateRegistry.askOrderId(),
            newState: BotState.TRACKING_ORDER,
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
            response: TemplateRegistry.cartCleared(),
            newState: BotState.MAIN_MENU,
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
      case BotState.MAIN_MENU: {
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
            response: TemplateRegistry.askOrderId(),
            newState: BotState.TRACKING_ORDER,
            updatedSession: session,
          };
        }

        if (msgLower === '3') {
          console.log("[DEBUG] context.policies =", JSON.stringify(context.policies, null, 2));
          return {
            response: TemplateRegistry.policies(context),
            newState: BotState.VIEWING_POLICY,
            updatedSession: session
          };
        }

        if (msgLower === "4") {
          // Notify the owner that a customer is requesting help
          businessService.getBusinessContext(session.businessId).then(async (ctx) => {
            if (ctx?.contactPhone) {
              const cleanPhone = String(ctx.contactPhone).replace(/\D/g, "");
              const ownerJid = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
              const customerPhone = session.userId.split("@")[0];
              const ownerMsg =
                `🆘 *Customer Help Request*\n\n` +
                `Customer *${customerPhone}* has selected the *Contact & Support* option and may need assistance.\n\n` +
                `📱 Open your dashboard to respond:\n` +
                `${process.env.DASHBOARD_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/chat`;
              await whatsappSessionManager.sendMessage(session.businessId, ownerJid, { text: ownerMsg });
            }
          }).catch(err => console.error("[FlowRouter] Failed to notify owner on option 4:", err));

          return {
            response: TemplateRegistry.contactUs(context),
            newState: BotState.MAIN_MENU,
            updatedSession: session,
          };
        }

        if (
          msgLower.includes("browse") ||
          msgLower.includes("product") ||
          msgLower.includes("catalog")
        ) {
          if (caps.supportsCart)
            return cartEngine.handleBrowse(session, context);
          if (caps.supportsBooking)
            return bookingEngine.handleBrowse(session, context);
        }
        if (
          msgLower.includes("service") ||
          msgLower.includes("book") ||
          msgLower.includes("appoint")
        ) {
          if (caps.supportsBooking)
            return bookingEngine.handleBrowse(session, context);
        }
        if (msgLower.includes("cart"))
          return cartEngine.handleCart(session, "view", context);
        if (msgLower.includes("track") || msgLower.includes("order")) {
          return {
            response: TemplateRegistry.askOrderId(),
            newState: BotState.TRACKING_ORDER,
            updatedSession: session,
          };
        }
        if (msgLower.includes("info") || msgLower.includes("about"))
          return inquiryEngine.handleBrowse(session, context);

        return null;
      }

      case BotState.VIEWING_POLICY:
        console.log(
          "[DEBUG policies context]",
          JSON.stringify(context.policies, null, 2),
        );
        if (msgLower === "menu" || msgLower.includes("back")) {
          const storeUrl = context.slug ? `${process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/store/${context.slug}` : undefined;
          return {
            response: TemplateRegistry.mainMenu(context.name || "Menu", caps, storeUrl),
            newState: BotState.MAIN_MENU,
            updatedSession: session,
          };
        }
        return {
          response: TemplateRegistry.policies(context),
          newState: BotState.VIEWING_POLICY,
          updatedSession: session,
        };

      case BotState.TRACKING_ORDER: {
        const orderNumber = message.trim().replace(/^#/, ""); // remove leading #
        if (!orderNumber) {
          return {
            response: TemplateRegistry.askOrderId(),
            newState: BotState.TRACKING_ORDER,
            updatedSession: session,
          };
        }

        try {
          const order = await orderService.getOrderByNumber(
            orderNumber,
            session.businessId,
          );
          if (!order) {
            return {
              response: `❌ Order #${orderNumber} not found. Please check the number and try again.`,
              newState: BotState.TRACKING_ORDER,
              updatedSession: session,
            };
          }

          // Format order status message
          const statusMessage =
            `📦 *Order #${order.orderNumber}*\n\n` +
            `Status: ${order.status || "Processing"}\n` +
            `Date: ${new Date(order.createdAt).toLocaleDateString()}\n` +
            `Total: ${order.totalAmount} ${order.currency || "USD"}\n\n` +
            `Items:\n` +
            order.items
              .map((item: any) => `• ${item.name} x${item.quantity || item.qty}`)
              .join("\n");

          return {
            response: statusMessage + "\n\nType MENU to go back.",
            newState: BotState.MAIN_MENU,
            updatedSession: session,
          };
        } catch (error) {
          console.error("[FlowRouter] Error tracking order:", error);
          return {
            response:
              "❌ Sorry, there was an error retrieving your order. Please try again later.",
            newState: BotState.MAIN_MENU,
            updatedSession: session,
          };
        }
      }

      case BotState.BROWSING_CATEGORIES:
        return cartEngine.handleCategoryBrowsing(session, message, context);

      case BotState.BROWSING_PRODUCTS:
        if (caps.supportsInformation) {
          return instituteEngine.handleCourseBrowsing(
            session,
            message,
            context,
          );
        }
        if (caps.supportsBooking) {
          return bookingEngine.handleServiceBrowsing(session, message, context);
        }
        if (caps.supportsCart) {
          return cartEngine.handleProductBrowsing(session, message, context);
        }
        if (caps.supportsInformation) {
          return inquiryEngine.handleInquiryCollection(
            session,
            message,
            context,
          );
        }
        return null;

      case BotState.BROWSING_COURSES:
        return instituteEngine.handleCourseBrowsing(session, message, context);

      case BotState.VIEWING_PRODUCT:
        if (caps.supportsInformation) {
          return instituteEngine.handleViewingCourse(session, message, context);
        }
        if (caps.supportsBooking) {
          return bookingEngine.handleViewingService(session, message, context);
        }
        return cartEngine.handleViewingProduct(session, message, context);

      case BotState.SELECTING_VARIANT:
        return cartEngine.handleVariantSelection(session, message, context);

      case BotState.AWAITING_QUANTITY:
        // This is where "2" should land — handleQuantityInput, NOT tracking
        return cartEngine.handleQuantityInput(session, message, context);

      case BotState.COLLECTING_PRODUCT_NOTES:
        return cartEngine.handleProductNotes(session, message, context);

      case BotState.CART_ACTIVE:
        return cartEngine.handleCart(session, message, context);

      case BotState.COLLECTING_DETAILS:
        if (caps.supportsBooking) {
          return bookingEngine.handleCollectingDetails(
            session,
            message,
            context,
          );
        }
        return cartEngine.handleCollectingDetails(session, message, context);

      case BotState.CONFIRMING_ORDER: {
        const norm = msgLower.replace(/[^a-z0-9\s]/g, "").trim();

        if (norm === "menu" || norm === "0") return null;

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
            response: TemplateRegistry.cartCleared(),
            newState: BotState.MAIN_MENU,
            updatedSession: session,
          };
        }

        // Re-show order summary using CartEngine (which computes correct totals)
        const confirmMsg = caps.supportsBooking
          ? bookingEngine.getConfirmationMessage(session, context)
          : cartEngine.getConfirmationMessage(session, context);

        return {
          response: confirmMsg,
          newState: BotState.CONFIRMING_ORDER,
          updatedSession: session,
        };
      }

      case BotState.IDLE:
      case BotState.GREETING:
        if (
          caps.supportsInformation &&
          !caps.supportsCart &&
          !caps.supportsBooking
        ) {
          return inquiryEngine.handleGreeting(session, context);
        }
        return null;

      default:
        return null;
    }
  }

  getBrowseResponse(
    session: SessionContext,
    context: any,
  ): Promise<RuleEngineResponse> {
    const caps = resolveCapabilities(context);
    if (caps.supportsBooking)
      return bookingEngine.handleBrowse(session, context);
    if (caps.supportsCart) return cartEngine.handleBrowse(session, context);
    if (caps.supportsInformation)
      return inquiryEngine.handleBrowse(session, context);
    return cartEngine.handleBrowse(session, context); // fallback
  }
}

export const flowRouter = new FlowRouter();