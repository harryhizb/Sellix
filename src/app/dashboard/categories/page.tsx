"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Tag, Loader2 } from "lucide-react";

interface Category {
    _id: string;
    name: string;
    emoji: string;
    createdAt: string;
}

const EMOJI_SUGGESTIONS = ["📦", "👗", "👔", "💍", "📿", "✨", "👟", "🧣", "👜", "🕶️", "🧴", "🏠", "💻", "📱", "🎁", "🌸", "🍕", "🧃"];

export default function CategoriesPage() {
    const { token } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [emoji, setEmoji] = useState("📦");
    const [error, setError] = useState("");

    const fetchCategories = async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/categories", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setCategories(data.categories || []);
        } catch {
            setError("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: name.trim(), emoji }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to create category");
                return;
            }
            setCategories((prev) => [...prev, data.category]);
            setName("");
            setEmoji("📦");
        } catch {
            setError("Network error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this category? Products assigned to it will not be deleted.")) return;
        // Optimistic remove
        setCategories((prev) => prev.filter((c) => c._id !== id));
        try {
            const res = await fetch(`/api/categories?id=${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                // Rollback
                fetchCategories();
            }
        } catch {
            fetchCategories();
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Categories</h1>
                <p className="mt-1 text-white/50 text-sm">Organise your products into browsable categories</p>
            </div>

            {/* Create form */}
            <div className="glass rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">Add Category</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white/80">Name *</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Rings"
                                required
                                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/80">Emoji (optional)</Label>
                            <Input
                                value={emoji}
                                onChange={(e) => setEmoji(e.target.value)}
                                placeholder="📦"
                                maxLength={4}
                                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-11 text-xl"
                            />
                        </div>
                    </div>

                    {/* Quick emoji picker */}
                    <div>
                        <p className="text-xs text-white/40 mb-2">Quick pick:</p>
                        <div className="flex flex-wrap gap-2">
                            {EMOJI_SUGGESTIONS.map((e) => (
                                <button
                                    key={e}
                                    type="button"
                                    onClick={() => setEmoji(e)}
                                    className={`w-9 h-9 rounded-xl text-lg transition-all ${emoji === e
                                        ? "bg-[#25D366]/20 ring-1 ring-[#25D366]"
                                        : "bg-white/[0.04] hover:bg-white/[0.08]"
                                        }`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <Button
                        type="submit"
                        disabled={saving || !name.trim()}
                        className="rounded-full bg-[#25D366] hover:bg-[#1ea855] text-white h-11 px-8 disabled:opacity-50"
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</>
                        ) : (
                            <><Plus className="w-4 h-4 mr-2" /> Add Category</>
                        )}
                    </Button>
                </form>
            </div>

            {/* Category list */}
            <div className="glass rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 text-white/30 animate-spin mx-auto" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Tag className="w-7 h-7 text-white/30" />
                        </div>
                        <h3 className="text-white font-semibold mb-1">No categories yet</h3>
                        <p className="text-white/40 text-sm">Add your first category above to organise your products.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/[0.06]">
                                <th className="py-3 px-6 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Category</th>
                                <th className="py-3 px-6 text-right text-xs font-medium text-white/40 uppercase tracking-wider w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {categories.map((cat) => (
                                <tr key={cat._id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{cat.emoji}</span>
                                            <span className="text-white font-medium">{cat.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button
                                            onClick={() => handleDelete(cat._id)}
                                            className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
