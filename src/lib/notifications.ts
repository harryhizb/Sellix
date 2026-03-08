import { env } from "./env";

// Notification service to communicate with wa-service
export async function notifyCustomerViaWhatsApp(
    businessId: string,
    customerPhone: string,
    message: string
): Promise<boolean> {
    try {
        // Call wa-service API to send message
        const response = await fetch(`${env.WA_SERVICE_URL}/api/send-message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                businessId,
                to: customerPhone,
                message
            })
        });

        return response.ok;
    } catch (error) {
        console.error("Failed to send WhatsApp notification:", error);
        return false;
    }
}
