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
    const { estimatedDeliveryTime, note } = body;

    await dbConnect();
    
    // @ts-ignore
    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const order = await Order.findOne({ _id: id, businessId: user.businessId });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Check if order can be approved
    if (order.status !== OrderStatus.PENDING) {
      return NextResponse.json({ 
        error: `Order cannot be approved because it is ${order.status}` 
      }, { status: 400 });
    }

    // Update order status to CONFIRMED
    order.status = OrderStatus.CONFIRMED;
    order.confirmedAt = new Date();
    
    // Set owner approval details
    order.ownerApproval = {
      approved: true,
      approvedAt: new Date(),
      approvedBy: user._id.toString(),
      notes: note || 'Order approved by owner'
    };

    // Add to status history
    order.statusHistory.push({
      status: OrderStatus.CONFIRMED,
      changedAt: new Date(),
      changedBy: user.name || user.email,
      changedById: user._id,
      changedByType: 'User',
      note: note || 'Order approved by owner'
    });

    await order.save();

    // Notify customer via WhatsApp
    const customer = await Customer.findById(order.customerId);
    if (customer) {
      // Generate confirmation message
      const language = order.language || 'en';
      const currency = order.currency || 'USD';
      
      let confirmMsg = '';
      if (language === 'ur_roman') {
        confirmMsg = `✅ Aapka order #${order.orderNumber} approve ho gaya hai! Hum ise process kar rahe hain.\n\n`;
        confirmMsg += `Kul amount: ${currency} ${order.totalAmount}\n`;
        if (estimatedDeliveryTime) {
          confirmMsg += `Estimated delivery: ${estimatedDeliveryTime}\n`;
        }
        confirmMsg += `\nShukriya aapka order dene ke liye!`;
      } else {
        confirmMsg = `✅ Your order #${order.orderNumber} has been approved! We are now processing it.\n\n`;
        confirmMsg += `Total amount: ${currency} ${order.totalAmount}\n`;
        if (estimatedDeliveryTime) {
          confirmMsg += `Estimated delivery: ${estimatedDeliveryTime}\n`;
        }
        confirmMsg += `\nThank you for your order!`;
      }

      // Here you would integrate with your WhatsApp service
      // For now, we'll log it
      console.log(`Notifying customer ${customer.phone}: ${confirmMsg}`);

      // Add notification record
      order.notifications.push({
        type: 'owner_approved',
        sentAt: new Date(),
        channel: 'whatsapp',
        recipient: customer.phone,
        status: 'sent',
        message: confirmMsg.substring(0, 100)
      });
      
      await order.save();
    }

    return NextResponse.json({ 
      success: true, 
      order,
      message: "Order approved successfully" 
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error approving order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}