"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton } from "@/components/shared/SkeletonLoaders";
import { Calendar, Clock, User, Phone, CheckCircle, X, RotateCcw, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";

interface Appointment {
    _id: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    date: string;
    time: string;
    status: string;
    notes: string;
    feedback: string;
    rescheduledTo: string;
    rescheduledTime: string;
}

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
    rescheduled: "bg-purple-100 text-purple-800",
};

export default function AppointmentsPage() {
    const { token } = useAuth();
    const { socket } = useSocket();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [rescheduleId, setRescheduleId] = useState<string | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [feedbackId, setFeedbackId] = useState<string | null>(null);
    const [feedbackText, setFeedbackText] = useState("");

    const fetchAppointments = useCallback(async () => {
        try {
            const url = filter !== "all" ? `/api/appointments?status=${filter}` : "/api/appointments";
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setAppointments(data.appointments || []);
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    }, [token, filter]);

    useEffect(() => {
        if (token) fetchAppointments();
    }, [fetchAppointments, token]);

    // Listen for real-time updates
    useEffect(() => {
        if (!socket) return;
        const handleRefresh = () => fetchAppointments();
        socket.on('refresh-data', handleRefresh);
        return () => {
            socket.off('refresh-data', handleRefresh);
        };
    }, [socket, fetchAppointments]);

    const updateStatus = async (id: string, status: string, feedback?: string) => {
        try {
            const res = await fetch(`/api/appointments/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status, feedback }),
            });
            if (res.ok) {
                toast?.success?.(`Appointment ${status}`);
                fetchAppointments();
                setFeedbackId(null);
                setFeedbackText("");
            }
        } catch (error) {
            console.error("Status update error", error);
        }
    };

    const handleReschedule = async () => {
        if (!rescheduleId || !rescheduleDate || !rescheduleTime) return;
        try {
            const res = await fetch(`/api/appointments/${rescheduleId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    status: "rescheduled",
                    rescheduledTo: rescheduleDate,
                    rescheduledTime: rescheduleTime,
                    feedback: feedbackText
                }),
            });
            if (res.ok) {
                toast?.success?.("Appointment rescheduled");
                setRescheduleId(null);
                setRescheduleDate("");
                setRescheduleTime("");
                setFeedbackText("");
                fetchAppointments();
            }
        } catch (error) {
            console.error("Reschedule error", error);
        }
    };

    if (loading) {
        return (
            <div>
                <div className="mb-8"><h1 className="text-3xl font-bold text-foreground">Appointments</h1><p className="text-muted-foreground mt-2">Manage booking requests</p></div>
                <div className="grid gap-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-3xl font-bold text-foreground">Appointments</h1><p className="text-muted-foreground mt-2">Manage booking requests</p></div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {["all", "pending", "confirmed", "completed", "cancelled", "rescheduled"].map((s) => (
                    <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => { setFilter(s); setLoading(true); }} className="capitalize">
                        {s}
                    </Button>
                ))}
            </div>

            {appointments.length === 0 ? (
                <Card><CardContent className="pt-6"><EmptyState icon={<Calendar className="w-16 h-16" />} title="No appointments found" description="Appointments booked by customers will appear here." /></CardContent></Card>
            ) : (
                <div className="grid gap-4">
                    {appointments.map((appt) => (
                        <Card key={appt._id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {appt.serviceName || "Appointment"}
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[appt.status] || "bg-gray-100 text-gray-800"}`}>{appt.status}</span>
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-4 mt-1">
                                            <span className="flex items-center gap-1"><User className="w-4 h-4" />{appt.customerName}</span>
                                            <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{appt.customerPhone}</span>
                                        </CardDescription>
                                    </div>
                                    <div className="text-right text-sm">
                                        <div className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-4 h-4" />{new Date(appt.date).toLocaleDateString()}</div>
                                        <div className="flex items-center gap-1 text-muted-foreground"><Clock className="w-4 h-4" />{appt.time}</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {appt.notes && <p className="text-sm text-muted-foreground mb-2">Notes: {appt.notes}</p>}
                                {appt.feedback && <p className="text-sm text-blue-600 mb-2">Feedback: {appt.feedback}</p>}

                                {/* Reschedule form */}
                                {rescheduleId === appt._id && (
                                    <div className="border rounded-lg p-3 mb-3 space-y-2 bg-muted/30">
                                        <Label className="text-sm font-medium">Reschedule To:</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
                                            <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
                                        </div>
                                        <Input placeholder="Feedback message (optional)" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleReschedule}>Confirm Reschedule</Button>
                                            <Button variant="outline" size="sm" onClick={() => setRescheduleId(null)}>Cancel</Button>
                                        </div>
                                    </div>
                                )}

                                {/* Feedback form */}
                                {feedbackId === appt._id && (
                                    <div className="border rounded-lg p-3 mb-3 space-y-2 bg-muted/30">
                                        <Label className="text-sm font-medium">Send Feedback:</Label>
                                        <Input placeholder="Enter feedback message" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => updateStatus(appt._id, appt.status, feedbackText)}>Send</Button>
                                            <Button variant="outline" size="sm" onClick={() => { setFeedbackId(null); setFeedbackText(""); }}>Cancel</Button>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 flex-wrap">
                                    {appt.status === "pending" && (
                                        <>
                                            <Button size="sm" onClick={() => updateStatus(appt._id, "confirmed")}><CheckCircle className="w-4 h-4 mr-1" />Accept</Button>
                                            <Button size="sm" variant="destructive" onClick={() => updateStatus(appt._id, "cancelled")}><X className="w-4 h-4 mr-1" />Cancel</Button>
                                        </>
                                    )}
                                    {(appt.status === "pending" || appt.status === "confirmed") && (
                                        <Button size="sm" variant="outline" onClick={() => { setRescheduleId(appt._id); setFeedbackText(""); }}><RotateCcw className="w-4 h-4 mr-1" />Reschedule</Button>
                                    )}
                                    {appt.status !== "cancelled" && (
                                        <Button size="sm" variant="outline" onClick={() => { setFeedbackId(appt._id); setFeedbackText(""); }}><MessageSquare className="w-4 h-4 mr-1" />Feedback</Button>
                                    )}
                                    {appt.status === "confirmed" && (
                                        <Button size="sm" variant="outline" onClick={() => updateStatus(appt._id, "completed")}><CheckCircle className="w-4 h-4 mr-1" />Complete</Button>
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
