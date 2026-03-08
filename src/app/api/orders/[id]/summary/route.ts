import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

export async function GET(
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
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language") || "en";
    const type = searchParams.get("type") || "customer";

    await dbConnect();
    
    // @ts-ignore
    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const order = await Order.findOne({ _id: id, businessId: user.businessId })
      .populate("customerId", "name phone email")
      .lean();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Generate professional summary
    const summary = generateProfessionalSummary(order, language, type as 'customer' | 'owner');

    return NextResponse.json({ 
      success: true, 
      summary,
      order 
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating order summary:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateProfessionalSummary(order: any, language: string, type: 'customer' | 'owner'): string {
  const items = order.items.map((item: any, index: number) => {
    const itemTotal = item.price * item.quantity;
    if (language === 'ur_roman') {
      return `${index + 1}. ${item.name} (${item.quantity} x ${order.currency} ${item.price}) = ${order.currency} ${itemTotal}`;
    }
    return `${index + 1}. ${item.name} (${item.quantity} x ${order.currency} ${item.price}) = ${order.currency} ${itemTotal}`;
  }).join('\n');

  const subtotal = order.subtotal || order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const taxAmount = order.taxAmount || 0;
  const discountAmount = order.discountAmount || 0;
  const deliveryFee = order.deliveryFee || 0;
  const totalAmount = order.totalAmount || subtotal + taxAmount - discountAmount + deliveryFee;

  if (language === 'ur_roman') {
    if (type === 'customer') {
      return `📋 *ORDER KI TAFSIL*

Order Number: ${order.orderNumber}
Halat: ${order.status.toUpperCase()}
Tareekh: ${new Date(order.createdAt).toLocaleDateString()}

🛒 *CHEEZAIN*
${items}

💰 *QEEMAT*
Jama: ${order.currency} ${subtotal}
Tax: ${order.currency} ${taxAmount}
Discount: ${order.currency} ${discountAmount}
Delivery: ${order.currency} ${deliveryFee}
*Kul: ${order.currency} ${totalAmount}*

📦 *DELIVERY*
Pata: ${order.deliveryDetails?.address}
Rabitay ka number: ${order.deliveryDetails?.contact}
Hidayaat: ${order.deliveryDetails?.instructions || 'Koi nahi'}

Aapka order dene ka shukriya!`;
    } else {
      return `🔔 *ORDER TAFSIL*

Order Number: ${order.orderNumber}
Customer: ${order.customerId?.name || 'N/A'} (${order.customerId?.phone})
Halat: ${order.status.toUpperCase()}
Tareekh: ${new Date(order.createdAt).toLocaleDateString()}

🛒 *CHEEZAIN*
${items}

💰 *QEEMAT*
Jama: ${order.currency} ${subtotal}
Tax: ${order.currency} ${taxAmount}
Discount: ${order.currency} ${discountAmount}
Delivery: ${order.currency} ${deliveryFee}
*Kul: ${order.currency} ${totalAmount}*

📦 *DELIVERY*
Pata: ${order.deliveryDetails?.address}
Rabitay ka number: ${order.deliveryDetails?.contact}
Hidayaat: ${order.deliveryDetails?.instructions || 'Koi nahi'}`;
    }
  } else {
    if (type === 'customer') {
      return `📋 *ORDER SUMMARY*

Order #: ${order.orderNumber}
Status: ${order.status.toUpperCase()}
Date: ${new Date(order.createdAt).toLocaleDateString()}

🛒 *ITEMS*
${items}

💰 *PRICING*
Subtotal: ${order.currency} ${subtotal}
Tax: ${order.currency} ${taxAmount}
Discount: ${order.currency} ${discountAmount}
Delivery: ${order.currency} ${deliveryFee}
*Total: ${order.currency} ${totalAmount}*

📦 *DELIVERY*
Address: ${order.deliveryDetails?.address}
Contact: ${order.deliveryDetails?.contact}
Instructions: ${order.deliveryDetails?.instructions || 'None'}

Thank you for your order!`;
    } else {
      return `📋 *ORDER SUMMARY*

Order #: ${order.orderNumber}
Customer: ${order.customerId?.name || 'N/A'} (${order.customerId?.phone})
Status: ${order.status.toUpperCase()}
Date: ${new Date(order.createdAt).toLocaleDateString()}

🛒 *ITEMS*
${items}

💰 *PRICING*
Subtotal: ${order.currency} ${subtotal}
Tax: ${order.currency} ${taxAmount}
Discount: ${order.currency} ${discountAmount}
Delivery: ${order.currency} ${deliveryFee}
*Total: ${order.currency} ${totalAmount}*

📦 *DELIVERY*
Address: ${order.deliveryDetails?.address}
Contact: ${order.deliveryDetails?.contact}
Instructions: ${order.deliveryDetails?.instructions || 'None'}`;
    }
  }
}