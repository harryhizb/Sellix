"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/SkeletonLoaders";
import { Badge } from "@/components/ui/badge"; // Ensure this exists or use className
import { Users as UsersIcon, MessageSquare, Phone, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

interface Customer {
    _id: string;
    name?: string;
    phone: string;
    isLockedToHuman: boolean;
    takeoverDetails?: {
        ownerName: string;
        startedAt: string;
    };
    metadata?: Record<string, any>;
}

export default function CustomersPage() {
    const { token } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showOnlyTakeover, setShowOnlyTakeover] = useState(false);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/customers", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers || []);
            }
        } catch (error) {
            console.error("Failed to fetch customers", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchCustomers();
    }, [token, fetchCustomers]);

    const filteredCustomers = showOnlyTakeover
        ? customers.filter(c => c.isLockedToHuman)
        : customers;

    return (
        <div>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Customers</h1>
                    <p className="text-muted-foreground mt-2">View and manage your customer base</p>
                </div>
                <Button
                    variant={showOnlyTakeover ? "default" : "outline"}
                    onClick={() => setShowOnlyTakeover(!showOnlyTakeover)}
                    className="gap-2 border-primary/20 hover:bg-primary/5"
                >
                    <Lock className="w-4 h-4" />
                    {showOnlyTakeover ? "Showing Active Takeovers" : "Filter Takeovers"}
                </Button>
            </div>

            <div className="grid gap-4 px-4 md:px-0 pb-8">
                {filteredCustomers.map((customer) => (
                    <Card key={customer._id} className="border border-border shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                                        {customer.name || "Unknown Customer"}
                                        {customer.isLockedToHuman && (
                                            <Badge variant="destructive" className="ml-2 flex items-center gap-1 text-xs">
                                                <Lock className="w-3 h-3" />
                                                Human Control
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground">{customer.phone}</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <a href={`/dashboard/chat?customer=${customer._id}`}>
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Chat
                                    </a>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                {customer.isLockedToHuman && customer.takeoverDetails && (
                                    <p className="mt-2 text-warning-foreground bg-warning/10 p-2 rounded border border-warning/20">
                                        Currently managed by <strong>{customer.takeoverDetails.ownerName || 'Staff'}</strong>
                                        <br />
                                        <span className="text-xs opacity-80">
                                            Started: {new Date(customer.takeoverDetails.startedAt).toLocaleString()}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
