import mongoose, { Schema, Document } from 'mongoose';

export interface IWhatsAppCredential extends Document {
  businessId: string;
  credentialsGzip: Buffer;
  updatedAt: Date;
}

const WhatsAppCredentialSchema = new Schema(
  {
    businessId: { type: String, required: true, unique: true, index: true },
    credentialsGzip: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export const WhatsAppCredential = mongoose.model<IWhatsAppCredential>(
  'WhatsAppCredential',
  WhatsAppCredentialSchema
);
