"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/SkeletonLoaders";
import { UserCheck, BookOpen, Calendar, User, DollarSign, CheckCircle, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Registration {
    _id: string;
    studentName: string;
    studentPhone: string;
    source: string; // event name or course name
    sourceType: string; // "event" | "course" | "order"
    date: string;
    status: string;
    paymentStatus: string;
    amount: number;
}

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-emerald-100 text-emerald-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
    processing: "bg-indigo-100 text-indigo-800",
};

export default function RegistrationsPage() {
    const { token } = useAuth();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    const fetchRegistrations = useCallback(async () => {
        try {
            const res = await fetch("/api/orders", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.orders) {
                const mapped = data.orders.map((order: any) => {
                    const itemNames = order.items?.map((i: any) => i.name).join(", ") || "N/A";
                    const type = order.type || "order";

                    return {
                        _id: order._id,
                        studentName: order.customerId?.name || order.customerInfo?.name || "Student",
                        studentPhone: order.customerId?.phone || order.customerInfo?.phone || "N/A",
                        source: itemNames,
                        sourceType: type === "booking" ? "Event/Course" : "Registration",
                        date: new Date(order.createdAt).toLocaleDateString(),
                        status: order.status || "pending",
                        paymentStatus: order.paymentMethod === "COD" ? "Cash" : (order.status === "confirmed" || order.status === "delivered") ? "Paid" : "Pending",
                        amount: order.totalAmount || 0,
                    };
                });
                setRegistrations(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch registrations", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchRegistrations();
    }, [token, fetchRegistrations]);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const endpoint = newStatus === "confirmed" ? "confirm" : newStatus === "cancelled" ? "cancel" : "status";
            const url = `/api/orders/${id}/${endpoint}`;
            const res = await fetch(url, {
                method: endpoint === "status" ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                toast?.success?.(`Registration ${newStatus}`);
                fetchRegistrations();
            } else {
                const err = await res.json();
                toast?.error?.(err.error || "Update failed");
            }
        } catch (error) {
            console.error("Status update error", error);
        }
    };

    const filtered = filter === "all" ? registrations : registrations.filter((r) => r.status === filter);

    if (loading) {
        return (
            <div>
                <div className="mb-8"><h1 className="text-3xl font-bold text-foreground">Registrations</h1><p className="text-muted-foreground mt-2">Event and course registrations</p></div>
                <Card><CardContent className="pt-6"><TableSkeleton rows={5} columns={5} /></CardContent></Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div><h1 className="text-3xl font-bold text-foreground">Registrations</h1><p className="text-muted-foreground mt-2">Event and course registrations</p></div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
                    <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="capitalize">{s}</Button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <Card><CardContent className="pt-6"><EmptyState icon={<UserCheck className="w-16 h-16" />} title="No registrations found" description="Student registrations for events and courses will appear here." /></CardContent></Card>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((reg) => (
                        <Card key={reg._id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <BookOpen className="w-5 h-5" />{reg.source}
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[reg.status] || "bg-gray-100"}`}>{reg.status}</span>
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-4 mt-1 flex-wrap">
                                            <span className="flex items-center gap-1"><User className="w-4 h-4" />{reg.studentName} ({reg.studentPhone})</span>
                                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{reg.date}</span>
                                            <span className="text-xs bg-muted px-2 py-0.5 rounded">{reg.sourceType}</span>
                                        </CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg">${reg.amount}</div>
                                        <div className="flex items-center gap-1 text-xs">
                                            <DollarSign className="w-3 h-3" />
                                            <span className={reg.paymentStatus === "Paid" ? "text-emerald-600" : "text-amber-600"}>{reg.paymentStatus}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    {reg.status === "pending" && (
                                        <>
                                            <Button size="sm" onClick={() => updateStatus(reg._id, "confirmed")}><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>
                                            <Button size="sm" variant="destructive" onClick={() => updateStatus(reg._id, "cancelled")}><X className="w-4 h-4 mr-1" />Reject</Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
