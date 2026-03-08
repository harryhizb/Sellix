"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton } from "@/components/shared/SkeletonLoaders";
import { Briefcase, Plus, Pencil, Trash2, Clock, DollarSign, Calendar, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Service {
    _id: string;
    name: string;
    category: string;
    duration: number;
    price: number;
    currency: string;
    description: string;
    availabilityDays: string[];
    bufferTime: number;
    isActive: boolean;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const EMPTY_FORM = {
    name: "",
    category: "general",
    duration: 60,
    price: 0,
    currency: "USD",
    description: "",
    availabilityDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    bufferTime: 15,
};

export default function ServicesPage() {
    const { token } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const fetchServices = useCallback(async () => {
        try {
            const res = await fetch("/api/services", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setServices(data.services || []);
        } catch (error) {
            console.error("Failed to fetch services", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchServices();
    }, [token, fetchServices]);

    const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };

    const openEdit = (s: Service) => {
        setForm({
            name: s.name, category: s.category, duration: s.duration, price: s.price,
            currency: s.currency, description: s.description,
            availabilityDays: s.availabilityDays, bufferTime: s.bufferTime,
        });
        setEditingId(s._id);
        setShowForm(true);
    };

    const toggleDay = (day: string) => {
        const days = form.availabilityDays.includes(day)
            ? form.availabilityDays.filter((d) => d !== day)
            : [...form.availabilityDays, day];
        setForm({ ...form, availabilityDays: days });
    };

    const handleSave = async () => {
        if (!form.name || form.price == null) { toast?.error?.("Name and price required") ?? alert("Name and price required"); return; }
        setSaving(true);
        try {
            const url = editingId ? `/api/services/${editingId}` : "/api/services";
            const method = editingId ? "PATCH" : "POST";
            const res = await fetch(url, {
                method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                toast?.success?.(editingId ? "Service updated" : "Service created");
                setShowForm(false); fetchServices();
            } else {
                const err = await res.json();
                toast?.error?.(err.error || "Failed") ?? alert(err.error || "Failed");
            }
        } catch (error) { console.error("Save error", error); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this service?")) return;
        try {
            const res = await fetch(`/api/services/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { toast?.success?.("Service deleted"); fetchServices(); }
        } catch (error) { console.error("Delete error", error); }
    };

    if (loading) {
        return (
            <div>
                <div className="mb-8"><h1 className="text-3xl font-bold text-foreground">Services</h1><p className="text-muted-foreground mt-2">Manage your service offerings</p></div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-3xl font-bold text-foreground">Services</h1><p className="text-muted-foreground mt-2">Manage your service offerings</p></div>
                <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Service</Button>
            </div>

            {showForm && (
                <Card className="border-primary/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>{editingId ? "Edit Service" : "Add Service"}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div><Label>Service Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Hair Cut" /></div>
                            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Beauty" /></div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div><Label>Duration (minutes)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} /></div>
                            <div><Label>Price *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
                            <div><Label>Buffer Time (minutes)</Label><Input type="number" value={form.bufferTime} onChange={(e) => setForm({ ...form, bufferTime: Number(e.target.value) })} /></div>
                        </div>
                        <div><Label>Description</Label><textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Service details..." /></div>
                        <div>
                            <Label>Availability Days</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {DAYS.map((day) => (
                                    <Button key={day} type="button" variant={form.availabilityDays.includes(day) ? "default" : "outline"} size="sm" onClick={() => toggleDay(day)} className="capitalize">
                                        {day.slice(0, 3)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingId ? "Update Service" : "Add Service"}</Button>
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {services.length === 0 && !showForm ? (
                <Card><CardContent className="pt-6"><EmptyState icon={<Briefcase className="w-16 h-16" />} title="No services yet" description="Add your services so customers can book them through WhatsApp." action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Your First Service</Button>} /></CardContent></Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                        <Card key={service._id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{service.name}</CardTitle>
                                        <CardDescription className="capitalize">{service.category}</CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(service)}><Pencil className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(service._id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between"><span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-4 h-4" />Duration</span><span className="font-medium">{service.duration} min</span></div>
                                    <div className="flex items-center justify-between"><span className="flex items-center gap-1 text-muted-foreground"><DollarSign className="w-4 h-4" />Price</span><span className="font-bold text-lg">{service.currency} {service.price}</span></div>
                                    <div className="flex items-center justify-between"><span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-4 h-4" />Available</span><span className="text-xs">{service.availabilityDays.map(d => d.slice(0, 3)).join(", ")}</span></div>
                                    {service.description && <p className="text-muted-foreground pt-1">{service.description}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
