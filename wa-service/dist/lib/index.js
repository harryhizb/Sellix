"use strict";
// ========================================
// RuleEngine Index
// ========================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ruleEngine = exports.RuleEngine = void 0;
// Main RuleEngine
var RuleEngine_1 = require("./RuleEngine");
Object.defineProperty(exports, "RuleEngine", { enumerable: true, get: function () { return RuleEngine_1.RuleEngine; } });
Object.defineProperty(exports, "ruleEngine", { enumerable: true, get: function () { return RuleEngine_1.ruleEngine; } });
// Core types
__exportStar(require("./types"), exports);
// Rule Engine Rules & Modules
__exportStar(require("./normalization"), exports);
__exportStar(require("./OpenAIService"), exports);
__exportStar(require("./security"), exports);
__exportStar(require("./WhatsAppSessionManager"), exports);
// Templates
__exportStar(require("./templates/TemplateRegistry"), exports);
// Utilities
// Dedupe is a utility, typically imported directly, but can export here if needed.
// export * from './utils/dedupe'; 
