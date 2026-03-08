import { z } from "zod";

export const signupSchema = z.object({
    businessName: z.string().min(2, "Business name is required"),
    name: z.string().min(2, "Your name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phone: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});
