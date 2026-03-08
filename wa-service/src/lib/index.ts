// ========================================
// RuleEngine Index
// ========================================

// Main RuleEngine
export { RuleEngine, ruleEngine } from './RuleEngine';

// Core types
export * from './types';

// Rule Engine Rules & Modules
export * from './normalization';
export * from './OpenAIService';
export * from './security';
export * from './WhatsAppSessionManager';

// Templates
export * from './templates/TemplateRegistry';

// Utilities
// Dedupe is a utility, typically imported directly, but can export here if needed.
// export * from './utils/dedupe'; 
