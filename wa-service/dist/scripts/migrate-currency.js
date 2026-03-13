"use strict";
/**
 * migrate-currency.ts
 *
 * One-time migration: update all businesses with currency "USD" to "PKR"
 * Run with: npx ts-node src/scripts/migrate-currency.ts
 */
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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-saas';
function migrate() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(MONGODB_URI);
            console.log('Connected to MongoDB');
            const db = mongoose_1.default.connection.db;
            const result = yield db.collection('businesses').updateMany({ 'settings.currency': 'USD' }, { $set: { 'settings.currency': 'PKR' } });
            console.log(`✅ Updated ${result.modifiedCount} business(es) from USD → PKR`);
            yield mongoose_1.default.disconnect();
            process.exit(0);
        }
        catch (err) {
            console.error('Migration failed:', err);
            process.exit(1);
        }
    });
}
migrate();
