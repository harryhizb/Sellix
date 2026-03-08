"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton } from "@/components/shared/SkeletonLoaders";
import { BookOpen, Plus, Pencil, Trash2, GraduationCap, DollarSign, Clock, X, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Scholarship {
    name: string;
    discountAmount: number;
    eligibility: string;
}

interface Course {
    _id: string;
    name: string;
    courseType: string;
    duration: string;
    description: string;
    admissionFee: number;
    scholarships: Scholarship[];
    isActive: boolean;
}

const COURSE_TYPES = [
    { value: "diploma", label: "Diploma" },
    { value: "degree", label: "Degree" },
    { value: "fsc", label: "FSC" },
    { value: "other", label: "Other" },
];

const EMPTY_FORM = {
    name: "",
    courseType: "other",
    duration: "",
    description: "",
    admissionFee: 0,
    scholarships: [] as Scholarship[],
};

export default function CoursesPage() {
    const { token } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await fetch("/api/courses", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setCourses(data.courses || []);
        } catch (error) {
            console.error("Failed to fetch courses", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchCourses();
    }, [token, fetchCourses]);

    const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };

    const openEdit = (course: Course) => {
        setForm({
            name: course.name, courseType: course.courseType, duration: course.duration,
            description: course.description, admissionFee: course.admissionFee,
            scholarships: course.scholarships || [],
        });
        setEditingId(course._id);
        setShowForm(true);
    };

    const addScholarship = () => {
        setForm({ ...form, scholarships: [...form.scholarships, { name: "", discountAmount: 0, eligibility: "" }] });
    };

    const updateScholarship = (idx: number, field: string, value: string | number) => {
        const updated = [...form.scholarships];
        (updated[idx] as any)[field] = value;
        setForm({ ...form, scholarships: updated });
    };

    const removeScholarship = (idx: number) => {
        setForm({ ...form, scholarships: form.scholarships.filter((_, i) => i !== idx) });
    };

    const handleSave = async () => {
        if (!form.name) { toast?.error?.("Course name is required") ?? alert("Course name is required"); return; }
        setSaving(true);
        try {
            const url = editingId ? `/api/courses/${editingId}` : "/api/courses";
            const method = editingId ? "PATCH" : "POST";
            const res = await fetch(url, {
                method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                toast?.success?.(editingId ? "Course updated" : "Course created");
                setShowForm(false);
                fetchCourses();
            } else {
                const err = await res.json();
                toast?.error?.(err.error || "Failed to save") ?? alert(err.error || "Failed");
            }
        } catch (error) { console.error("Save error", error); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this course?")) return;
        try {
            const res = await fetch(`/api/courses/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { toast?.success?.("Course deleted"); fetchCourses(); }
        } catch (error) { console.error("Delete error", error); }
    };

    if (loading) {
        return (
            <div>
                <div className="mb-8"><h1 className="text-3xl font-bold text-foreground">Courses</h1><p className="text-muted-foreground mt-2">Manage your educational programs</p></div>
                <div className="grid md:grid-cols-2 gap-4">{[1, 2].map((i) => <CardSkeleton key={i} />)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-3xl font-bold text-foreground">Courses</h1><p className="text-muted-foreground mt-2">Manage your educational programs</p></div>
                <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Course</Button>
            </div>

            {showForm && (
                <Card className="border-primary/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>{editingId ? "Edit Course" : "Add Course"}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div><Label>Course Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Science" /></div>
                            <div>
                                <Label>Course Type</Label>
                                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.courseType} onChange={(e) => setForm({ ...form, courseType: e.target.value })}>
                                    {COURSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 4 Years" /></div>
                            <div><Label>Admission Fee</Label><Input type="number" value={form.admissionFee} onChange={(e) => setForm({ ...form, admissionFee: Number(e.target.value) })} /></div>
                        </div>
                        <div><Label>Description</Label><textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Course details..." /></div>

                        {/* Scholarships */}
                        <div className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold flex items-center gap-2"><Award className="w-4 h-4" /> Scholarships</Label>
                                <Button variant="outline" size="sm" onClick={addScholarship}><Plus className="w-3 h-3 mr-1" />Add</Button>
                            </div>
                            {form.scholarships.map((s, idx) => (
                                <div key={idx} className="grid md:grid-cols-4 gap-2 items-end">
                                    <div><Label className="text-xs">Name</Label><Input value={s.name} onChange={(e) => updateScholarship(idx, "name", e.target.value)} placeholder="Scholarship name" /></div>
                                    <div><Label className="text-xs">Discount/Amount</Label><Input type="number" value={s.discountAmount} onChange={(e) => updateScholarship(idx, "discountAmount", Number(e.target.value))} /></div>
                                    <div><Label className="text-xs">Eligibility</Label><Input value={s.eligibility} onChange={(e) => updateScholarship(idx, "eligibility", e.target.value)} placeholder="Criteria" /></div>
                                    <Button variant="ghost" size="icon" onClick={() => removeScholarship(idx)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingId ? "Update Course" : "Add Course"}</Button>
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {courses.length === 0 && !showForm ? (
                <Card><CardContent className="pt-6"><EmptyState icon={<BookOpen className="w-16 h-16" />} title="No courses yet" description="Add courses so students can inquire and register through WhatsApp." action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Your First Course</Button>} /></CardContent></Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {courses.map((course) => (
                        <Card key={course._id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="w-5 h-5" />{course.name}</CardTitle>
                                        <CardDescription className="mt-1 capitalize">{course.courseType}</CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(course)}><Pencil className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(course._id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    {course.duration && <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span>{course.duration}</span></div>}
                                    <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" /><span>Fee: ${course.admissionFee}</span></div>
                                    {course.scholarships?.length > 0 && <div className="flex items-center gap-2"><Award className="w-4 h-4 text-muted-foreground" /><span>{course.scholarships.length} scholarship(s)</span></div>}
                                    {course.description && <p className="text-muted-foreground pt-1">{course.description}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
