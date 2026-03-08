"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton } from "@/components/shared/SkeletonLoaders";
import { CalendarDays, Plus, Pencil, Trash2, Users, Clock, DollarSign, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Event {
    _id: string;
    name: string;
    dateTime: string;
    registrationType: "free" | "paid";
    registrationFee: number;
    allowedParticipants: number;
    registrationDeadline: string;
    description: string;
    confirmationMethod: "manual" | "auto_after_payment";
    paymentInstructions: string;
    registeredCount: number;
    isActive: boolean;
}

const EMPTY_FORM = {
    name: "",
    dateTime: "",
    registrationType: "free" as "free" | "paid",
    registrationFee: 0,
    allowedParticipants: 100,
    registrationDeadline: "",
    description: "",
    confirmationMethod: "manual" as "manual" | "auto_after_payment",
    paymentInstructions: "",
};

export default function EventsPage() {
    const { token } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch("/api/events", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setEvents(data.events || []);
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchEvents();
    }, [token, fetchEvents]);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (event: Event) => {
        setForm({
            name: event.name,
            dateTime: event.dateTime ? new Date(event.dateTime).toISOString().slice(0, 16) : "",
            registrationType: event.registrationType,
            registrationFee: event.registrationFee,
            allowedParticipants: event.allowedParticipants,
            registrationDeadline: event.registrationDeadline
                ? new Date(event.registrationDeadline).toISOString().slice(0, 16)
                : "",
            description: event.description,
            confirmationMethod: event.confirmationMethod,
            paymentInstructions: event.paymentInstructions,
        });
        setEditingId(event._id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.dateTime) {
            toast?.error?.("Name and date/time are required") ?? alert("Name and date/time are required");
            return;
        }
        setSaving(true);
        try {
            const url = editingId ? `/api/events/${editingId}` : "/api/events";
            const method = editingId ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                toast?.success?.(editingId ? "Event updated" : "Event created");
                setShowForm(false);
                fetchEvents();
            } else {
                const err = await res.json();
                toast?.error?.(err.error || "Failed to save") ?? alert(err.error || "Failed to save");
            }
        } catch (error) {
            console.error("Save error", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this event?")) return;
        try {
            const res = await fetch(`/api/events/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                toast?.success?.("Event deleted");
                fetchEvents();
            }
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    if (loading) {
        return (
            <div>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Events</h1>
                    <p className="text-muted-foreground mt-2">Manage your events and registrations</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => <CardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Events</h1>
                    <p className="text-muted-foreground mt-2">Manage your events and registrations</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <Card className="border-primary/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>{editingId ? "Edit Event" : "Create Event"}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Event Name *</Label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Annual Seminar" />
                            </div>
                            <div>
                                <Label>Event Date &amp; Time *</Label>
                                <Input type="datetime-local" value={form.dateTime} onChange={(e) => setForm({ ...form, dateTime: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Registration Type</Label>
                                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.registrationType} onChange={(e) => setForm({ ...form, registrationType: e.target.value as "free" | "paid" })}>
                                    <option value="free">Free</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                            {form.registrationType === "paid" && (
                                <div>
                                    <Label>Registration Fee</Label>
                                    <Input type="number" value={form.registrationFee} onChange={(e) => setForm({ ...form, registrationFee: Number(e.target.value) })} />
                                </div>
                            )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Allowed Participants</Label>
                                <Input type="number" value={form.allowedParticipants} onChange={(e) => setForm({ ...form, allowedParticipants: Number(e.target.value) })} />
                            </div>
                            <div>
                                <Label>Registration Deadline</Label>
                                <Input type="datetime-local" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <Label>Description</Label>
                            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Event details..." />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Confirmation Method</Label>
                                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.confirmationMethod} onChange={(e) => setForm({ ...form, confirmationMethod: e.target.value as "manual" | "auto_after_payment" })}>
                                    <option value="manual">Manual Approval</option>
                                    <option value="auto_after_payment">Auto Approval After Payment</option>
                                </select>
                            </div>
                            {form.registrationType === "paid" && (
                                <div>
                                    <Label>Payment Instructions</Label>
                                    <Input value={form.paymentInstructions} onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })} placeholder="e.g. Bank transfer to..." />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : editingId ? "Update Event" : "Create Event"}
                            </Button>
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Event List */}
            {events.length === 0 && !showForm ? (
                <Card>
                    <CardContent className="pt-6">
                        <EmptyState
                            icon={<CalendarDays className="w-16 h-16" />}
                            title="No events yet"
                            description="Create events for students and participants to register through WhatsApp."
                            action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create Your First Event</Button>}
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {events.map((event) => (
                        <Card key={event._id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{event.name}</CardTitle>
                                        <CardDescription className="mt-1">
                                            {event.registrationType === "paid" ? `Fee: $${event.registrationFee}` : "Free Event"}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(event)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(event._id)}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                        <span>{new Date(event.dateTime).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span>{event.registeredCount || 0} / {event.allowedParticipants} registered</span>
                                    </div>
                                    {event.registrationType === "paid" && (
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                                            <span>${event.registrationFee}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span>{event.confirmationMethod === "manual" ? "Manual Approval" : "Auto Approval"}</span>
                                    </div>
                                    {event.description && (
                                        <p className="text-muted-foreground pt-1">{event.description}</p>
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
