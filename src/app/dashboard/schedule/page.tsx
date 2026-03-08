"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/shared/SkeletonLoaders";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar, Clock, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";

interface AppointmentEntry {
    _id: string;
    customerName: string;
    serviceName: string;
    date: string;
    time: string;
    status: string;
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-500",
    confirmed: "bg-blue-500",
    completed: "bg-emerald-500",
    cancelled: "bg-red-500",
    rescheduled: "bg-purple-500",
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function SchedulePage() {
    const { token } = useAuth();
    const { socket } = useSocket();
    const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const fetchAppointments = useCallback(async () => {
        try {
            const res = await fetch("/api/appointments", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setAppointments(data.appointments || []);
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchAppointments();
    }, [token, fetchAppointments]);

    // Listen for real-time updates
    useEffect(() => {
        if (!socket) return;
        const handleRefresh = () => fetchAppointments();
        socket.on('refresh-data', handleRefresh);
        return () => {
            socket.off('refresh-data', handleRefresh);
        };
    }, [socket, fetchAppointments]);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const getAppointmentsForDate = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return appointments.filter((a) => {
            const d = new Date(a.date);
            return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
        });
    };

    const selectedAppointments = selectedDate
        ? appointments.filter((a) => {
            const d = new Date(a.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` === selectedDate;
        })
        : [];

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    if (loading) {
        return (
            <div>
                <div className="mb-8"><h1 className="text-3xl font-bold text-foreground">Schedule</h1><p className="text-muted-foreground mt-2">Calendar view of your appointments</p></div>
                <CardSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
                <p className="text-muted-foreground mt-2">Calendar view of your appointments</p>
            </div>

            {appointments.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <EmptyState
                            icon={<Calendar className="w-16 h-16" />}
                            title="No appointments yet"
                            description="Appointments booked through WhatsApp will appear here in the calendar."
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-5 h-5" /></Button>
                                <CardTitle>{MONTH_NAMES[month]} {year}</CardTitle>
                                <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-5 h-5" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-1">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                    <div key={d} className="text-center text-xs font-medium text-muted-foreground p-2">{d}</div>
                                ))}
                                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dayAppts = getAppointmentsForDate(day);
                                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                    const isSelected = selectedDate === dateStr;
                                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDate(dateStr)}
                                            className={`p-2 text-sm rounded-lg text-center min-h-[48px] relative transition-colors
                                                ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/10 font-bold" : "hover:bg-muted"}
                                            `}
                                        >
                                            {day}
                                            {dayAppts.length > 0 && (
                                                <div className="flex justify-center gap-0.5 mt-1">
                                                    {dayAppts.slice(0, 3).map((a, idx) => (
                                                        <span key={idx} className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[a.status] || "bg-gray-400"}`} />
                                                    ))}
                                                    {dayAppts.length > 3 && <span className="text-[8px] text-muted-foreground">+{dayAppts.length - 3}</span>}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detail Panel */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                {selectedDate ? `Appointments for ${new Date(selectedDate + "T00:00:00").toLocaleDateString()}` : "Select a date"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!selectedDate ? (
                                <p className="text-sm text-muted-foreground">Click on a date to see appointment details.</p>
                            ) : selectedAppointments.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No appointments on this date.</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedAppointments.map((appt) => (
                                        <div key={appt._id} className="border rounded-lg p-3 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">{appt.serviceName || "Service"}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[appt.status] || "bg-gray-400"}`}>{appt.status}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <User className="w-3 h-3" />{appt.customerName}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />{appt.time}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
