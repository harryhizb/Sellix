"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, MessageCircle, Truck, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Order {
    _id: string;
    orderNumber: string;
    type?: 'order' | 'booking';  // NEW
    customerInfo: {
        name: string;
        phone: string;
    };
    totalAmount: number;
    currency: string;
    status: string;
    createdAt: string;
    items: any[];
    isPaused?: boolean;
    deliveryDetails?: {
        city?: string;
        address?: string;
    };
    bookingDetails?: {
        preferredDate?: string;
        preferredTime?: string;
    };
}

export default function OrdersTable() {
    const { token, user } = useAuth();
    const { socket } = useSocket();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (token && user?.businessId) {
            fetchOrders();
        }
    }, [token, user?.businessId]);

    // Listen for real-time updates from wa-service
    useEffect(() => {
        if (!socket) return;

        const handleRefresh = (data: any) => {
            console.log("Socket Refresh Data event received:", data);
            fetchOrders();
        };

        socket.on('refresh-data', handleRefresh);

        return () => {
            socket.off('refresh-data', handleRefresh);
        };
    }, [socket]);

    const fetchOrders = async () => {
        if (!token || !user?.businessId) {
            setError("Authentication required");
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const response = await fetch(`/api/orders?businessId=${user.businessId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch orders: ${response.status}`);
            }

            const data = await response.json();
            if (data.orders) {
                setOrders(data.orders);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch orders";
            setError(errorMessage);
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, status: string) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status,
                    businessId: user?.businessId
                }),
            });

            if (response.ok) {
                await fetchOrders();
            } else {
                const errorData = await response.json();
                console.error("Failed to update status:", errorData);
            }
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const handleTakeover = (customerId: string, customerPhone: string) => {
        // Navigate to chat interface for this customer
        router.push(`/dashboard/chat?customerId=${customerId}&phone=${customerPhone}`);
    };

    const handleConfirm = async (orderId: string) => {
        if (!confirm('Confirm this order/booking?')) return;

        try {
            const response = await fetch(`/api/orders/${orderId}/confirm`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ note: 'Approved from dashboard' })
            });

            if (response.ok) {
                await fetchOrders(); // Refresh
            } else {
                const error = await response.json();
                alert(`Failed to confirm: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to confirm order:', error);
            alert('Failed to confirm order');
        }
    };

    const handleCancel = async (orderId: string) => {
        const reason = prompt('Reason for cancellation?');
        if (!reason) return;

        try {
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            if (response.ok) {
                await fetchOrders(); // Refresh
            } else {
                const error = await response.json();
                alert(`Failed to cancel: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to cancel order:', error);
            alert('Failed to cancel order');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 rounded-md border">
                <p className="text-muted-foreground">Loading orders...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-8 rounded-md border bg-destructive/5">
                <p className="text-destructive">{error}</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex items-center justify-center py-8 rounded-md border">
                <p className="text-muted-foreground">No orders found</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order._id}>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>
                                <div>{order.customerInfo?.name || "Unknown"}</div>
                                <div className="text-sm text-muted-foreground">
                                    {order.customerInfo?.phone}
                                </div>
                                {/* Show booking or delivery details */}
                                {order.type === 'booking' && order.bookingDetails ? (
                                    <div className="text-sm text-muted-foreground mt-1">
                                        📅 {order.bookingDetails.preferredDate} {order.bookingDetails.preferredTime}
                                    </div>
                                ) : order.deliveryDetails?.city ? (
                                    <div className="text-sm text-muted-foreground mt-1">
                                        📍 {order.deliveryDetails.city}
                                    </div>
                                ) : null}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            order.status === "confirmed"
                                                ? "default"
                                                : order.status === "pending"
                                                    ? "secondary"
                                                    : order.status === "cancelled"
                                                        ? "destructive"
                                                        : "outline"
                                        }
                                    >
                                        {order.status}
                                    </Badge>
                                    {/* Simple type badge */}
                                    {order.type === 'booking' && (
                                        <Badge variant="outline" className="text-xs">
                                            Booking
                                        </Badge>
                                    )}
                                    {order.isPaused && (
                                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                            Takeover
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {order.currency} {order.totalAmount}
                            </TableCell>
                            <TableCell>
                                {format(new Date(order.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(order._id)}>
                                            Copy Order ID
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />

                                        {/* Pending Actions */}
                                        {order.status === 'pending' && (
                                            <>
                                                <DropdownMenuItem onClick={() => updateStatus(order._id, "processing")}>
                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Accept Order
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    const reason = prompt("Enter reason for rejection:");
                                                    if (reason) updateStatus(order._id, "cancelled");
                                                }}>
                                                    <XCircle className="mr-2 h-4 w-4 text-red-600" /> Reject Order
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}

                                        {/* Processing/Confirmed Actions */}
                                        {(order.status === 'confirmed' || order.status === 'processing') && (
                                            <>
                                                <DropdownMenuItem onClick={() => updateStatus(order._id, "shipped")}>
                                                    <Truck className="mr-2 h-4 w-4 text-blue-600" /> Dispatch Order
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}

                                        <DropdownMenuItem onClick={() => handleTakeover(order._id, order.customerInfo?.phone)}>
                                            <MessageCircle className="mr-2 h-4 w-4" /> Chat with Customer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
