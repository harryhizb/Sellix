"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSTANTS = exports.SCORING = exports.Intent = exports.BotState = exports.BusinessType = void 0;
var BusinessType;
(function (BusinessType) {
    BusinessType["ECOMMERCE"] = "ECOMMERCE";
    BusinessType["RESTAURANT"] = "RESTAURANT";
    BusinessType["SERVICE"] = "SERVICE";
    BusinessType["ORGANIZATION"] = "ORGANIZATION";
    BusinessType["INSTITUTE"] = "INSTITUTE";
})(BusinessType || (exports.BusinessType = BusinessType = {}));
var BotState;
(function (BotState) {
    BotState["IDLE"] = "IDLE";
    BotState["GREETING"] = "GREETING";
    BotState["MAIN_MENU"] = "MAIN_MENU";
    BotState["BROWSING_PRODUCTS"] = "BROWSING_PRODUCTS";
    BotState["VIEWING_PRODUCT"] = "VIEWING_PRODUCT";
    BotState["SELECTING_VARIANT"] = "SELECTING_VARIANT";
    BotState["AWAITING_QUANTITY"] = "AWAITING_QUANTITY";
    BotState["COLLECTING_PRODUCT_NOTES"] = "COLLECTING_PRODUCT_NOTES";
    BotState["PRODUCT_SELECTED"] = "PRODUCT_SELECTED";
    BotState["CART_ACTIVE"] = "CART_ACTIVE";
    BotState["COLLECTING_DETAILS"] = "COLLECTING_DETAILS";
    BotState["ORDER_DETAILS_PENDING"] = "ORDER_DETAILS_PENDING";
    BotState["CONFIRMING_ORDER"] = "CONFIRMING_ORDER";
    BotState["ORDER_CONFIRMATION"] = "ORDER_CONFIRMATION";
    BotState["PAYMENT_PENDING"] = "PAYMENT_PENDING";
    BotState["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    BotState["ORDER_PLACED"] = "ORDER_PLACED";
    BotState["HUMAN_HANDOFF"] = "HUMAN_HANDOFF";
    BotState["AWAITING_HUMAN_REASON"] = "AWAITING_HUMAN_REASON";
    BotState["TRACKING_ORDER"] = "TRACKING_ORDER";
    BotState["VIEWING_POLICY"] = "VIEWING_POLICY";
    BotState["BROWSING_COURSES"] = "BROWSING_COURSES";
    BotState["BROWSING_EVENTS"] = "BROWSING_EVENTS";
    BotState["BROWSING_SERVICES"] = "BROWSING_SERVICES";
})(BotState || (exports.BotState = BotState = {}));
var Intent;
(function (Intent) {
    Intent["GREETING"] = "greeting";
    Intent["PRODUCT_INQUIRY"] = "product_inquiry";
    Intent["ADD_TO_CART"] = "add_to_cart";
    Intent["VIEW_CART"] = "view_cart";
    Intent["REMOVE_FROM_CART"] = "remove_from_cart";
    Intent["PLACE_ORDER"] = "place_order";
    Intent["CONTROL"] = "control_intent";
    Intent["CONFIRMATION"] = "confirmation";
    Intent["CANCEL"] = "cancel";
    Intent["HELP"] = "help";
    Intent["RESTART"] = "restart";
    Intent["MENU"] = "menu";
    Intent["UNKNOWN"] = "unknown";
    Intent["FALLBACK"] = "fallback";
})(Intent || (exports.Intent = Intent = {}));
exports.SCORING = {
    HARD_MATCH: 1.0,
    STRONG_MATCH: 0.8,
    WEAK_MATCH: 0.6,
    AMBIGUOUS: 0.4
};
exports.CONSTANTS = {
    SESSION_TIMEOUT_MS: 15 * 60 * 1000,
    MAX_FALLBACKS: 3,
    MAX_CART_QTY: 10,
    BATCH_WINDOW_MS: 2000,
    AI_TRIGGER_THRESHOLD: 0.6
};
