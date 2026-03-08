import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Order, OrderStatus } from "@/models/Order";
import { User } from "@/models/User";
import { Customer } from "@/models/Customer";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  try {
    const { id } = params;
    const body = await req.json();
    const { rejectionReason, note } = body;

    if (!rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    await dbConnect();
    
    // @ts-ignore
    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const order = await Order.findOne({ _id: id, businessId: user.businessId });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Check if order can be rejected
    if (order.status !== OrderStatus.PENDING) {
      return NextResponse.json({ 
        error: `Order cannot be rejected because it is ${order.status}` 
      }, { status: 400 });
    }

    // Update order status to CANCELLED
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    
    // Set owner approval details
    order.ownerApproval = {
      approved: false,
      rejectedAt: new Date(),
      rejectedBy: user._id.toString(),
      rejectionReason: rejectionReason,
      notes: note || 'Order rejected by owner'
    };

    // Add to status history
    order.statusHistory.push({
      status: OrderStatus.CANCELLED,
      changedAt: new Date(),
      changedBy: user.name || user.email,
      changedById: user._id,
      changedByType: 'User',
      note: `Order rejected: ${rejectionReason}`
    });

    await order.save();

    // Notify customer via WhatsApp
    const customer = await Customer.findById(order.customerId);
    if (customer) {
      // Generate rejection message
      const language = order.language || 'en';
      
      let rejectMsg = '';
      if (language === 'ur_roman') {
        rejectMsg = `❌ Maazrat, aapka order #${order.orderNumber} cancel ho gaya hai.\n\n`;
        rejectMsg += `Wajah: ${rejectionReason}\n\n`;
        rejectMsg += `Agar aapko koi sawal hai toh humse rabta karein.`;
      } else {
        rejectMsg = `❌ We're sorry, your order #${order.orderNumber} has been cancelled.\n\n`;
        rejectMsg += `Reason: ${rejectionReason}\n\n`;
        rejectMsg += `Please contact us if you have any questions.`;
      }

      // Here you would integrate with your WhatsApp service
      console.log(`Notifying customer ${customer.phone}: ${rejectMsg}`);

      // Add notification record
      order.notifications.push({
        type: 'owner_rejected',
        sentAt: new Date(),
        channel: 'whatsapp',
        recipient: customer.phone,
        status: 'sent',
        message: rejectMsg.substring(0, 100)
      });
      
      await order.save();
    }

    return NextResponse.json({ 
      success: true, 
      order,
      message: "Order rejected successfully" 
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error rejecting order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}