"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DynamicField } from "./types";

interface PreviewCardProps {
    formData: Record<string, any>;
    config: { name: string; icon: any; fields: DynamicField[] };
}

export function PreviewCard({ formData, config }: PreviewCardProps) {
    const Icon = config.icon;

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="text-lg">AI Preview</CardTitle>
                <CardDescription>How the AI might display this item to customers</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                            {Icon && <Icon className="w-8 h-8 text-primary/60" />}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold">{formData.name || "Item Name"}</h4>
                                {formData.price && (
                                    <span className="font-bold">{formData.currency || "USD"} {formData.price}</span>
                                )}
                            </div>
                            {formData.description && <p className="text-sm text-muted-foreground">{formData.description}</p>}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {config.fields.slice(0, 3).map((field) => {
                                    const value = formData[field.key];
                                    if (!value) return null;
                                    return (
                                        <Badge key={field.key} variant="secondary">
                                            {field.label}: {Array.isArray(value) ? value.slice(0, 2).join(', ') : value}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-xs text-muted-foreground border-t pt-4">
                        <p>✅ The AI assistant will use these details to:</p>
                        <ul className="mt-1 space-y-1">
                            <li>• Answer customer questions accurately</li>
                            <li>• Show relevant attributes when asked</li>
                            <li>• Match customer preferences with products</li>
                            <li>• Provide professional order summaries</li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
