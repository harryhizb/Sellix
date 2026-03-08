"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";

import { CATEGORY_FIELD_CONFIGS } from "./dynamic-form/config";
import { DynamicFormProps } from "./dynamic-form/types";
import { FieldRenderer } from "./dynamic-form/FieldRenderer";
import { PreviewCard } from "./dynamic-form/PreviewCard";

export default function DynamicForm({
    category,
    formData,
    onFormChange,
    mode = "create",
    className = ""
}: DynamicFormProps) {
    const [activeTab, setActiveTab] = useState<string>("basic");
    const [customAttributes, setCustomAttributes] = useState<Array<{ key: string, value: string }>>([]);
    const [newCustomKey, setNewCustomKey] = useState("");
    const [newCustomValue, setNewCustomValue] = useState("");

    const config = CATEGORY_FIELD_CONFIGS[category] || CATEGORY_FIELD_CONFIGS.other;
    const Icon = config.icon;

    useEffect(() => {
        if (formData.custom_attributes && Array.isArray(formData.custom_attributes)) {
            setCustomAttributes(formData.custom_attributes);
        }
    }, [formData.custom_attributes]);

    useEffect(() => {
        if (category === "other" || customAttributes.length > 0) {
            onFormChange("custom_attributes", customAttributes);
        }
    }, [customAttributes, category, onFormChange]);

    const addCustomAttribute = () => {
        if (newCustomKey.trim() && newCustomValue.trim()) {
            setCustomAttributes([...customAttributes, { key: newCustomKey.trim(), value: newCustomValue.trim() }]);
            setNewCustomKey("");
            setNewCustomValue("");
        }
    };

    const removeCustomAttribute = (index: number) => {
        setCustomAttributes(customAttributes.filter((_, i) => i !== index));
    };

    return (
        <div className={className}>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        {Icon && <Icon className="w-6 h-6 text-primary" />}
                        <div>
                            <CardTitle className="text-lg">
                                {mode === "create" ? "Add New" : "Edit"} {config.name} Item
                            </CardTitle>
                            <CardDescription>
                                Configure item details specific to your {config.name.toLowerCase()} business
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid grid-cols-2">
                            <TabsTrigger value="basic">Basic Information</TabsTrigger>
                            <TabsTrigger value="category">Category Attributes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-6 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Item Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., Premium Shoes, Chicken Biryani"
                                            value={formData.name || ""}
                                            onChange={(e) => onFormChange("name", e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price *</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="price"
                                                type="number"
                                                placeholder="0.00"
                                                value={formData.price || ""}
                                                onChange={(e) => onFormChange("price", e.target.value)}
                                                required
                                                min="0"
                                                step="0.01"
                                                className="flex-1"
                                            />
                                            <span className="flex items-center px-3 bg-muted rounded-md text-sm">
                                                {formData.currency || "USD"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Brief description of the item..."
                                            value={formData.description || ""}
                                            onChange={(e) => onFormChange("description", e.target.value)}
                                            rows={4}
                                        />
                                        <p className="text-xs text-muted-foreground">This helps AI understand and present your item better</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="inStock">Availability</Label>
                                    <Switch
                                        id="inStock"
                                        checked={formData.inStock !== false}
                                        onCheckedChange={(checked) => onFormChange("inStock", checked)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {formData.inStock !== false ? "Item is available for customers" : "Item is currently out of stock"}
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="category" className="space-y-6 pt-4">
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-primary mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-medium text-primary">AI-Optimized Fields</p>
                                        <p className="text-sm text-muted-foreground">
                                            These fields are tailored for your {config.name.toLowerCase()} business.
                                            The AI assistant will use this information to provide better customer service.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {config.fields.map((field) => (
                                    <div key={field.key} className="space-y-3">
                                        <FieldRenderer
                                            field={field}
                                            value={formData[field.key]}
                                            formData={formData}
                                            onFormChange={onFormChange}
                                            newCustomKey={newCustomKey}
                                            setNewCustomKey={setNewCustomKey}
                                            newCustomValue={newCustomValue}
                                            setNewCustomValue={setNewCustomValue}
                                            customAttributes={customAttributes}
                                            addCustomAttribute={addCustomAttribute}
                                            removeCustomAttribute={removeCustomAttribute}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t">
                                <h4 className="font-medium mb-3 flex items-center gap-2"><Info className="w-4 h-4" /> Tips for {config.name}</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    {category === "ecommerce" && (
                                        <><li>• Include all color and size variations for accurate AI matching</li><li>• Accurate stock counts prevent over-selling</li><li>• Brand names help AI provide better recommendations</li></>
                                    )}
                                    {category === "restaurant" && (
                                        <><li>• List all main ingredients for allergy awareness</li><li>• Accurate preparation times set proper customer expectations</li><li>• Clear portion sizes reduce order confusion</li></>
                                    )}
                                    {category === "service" && (
                                        <><li>• Accurate durations help with scheduling</li><li>• Specialist names personalize the service experience</li><li>• Skill levels help match customers with appropriate services</li></>
                                    )}
                                    {category === "institute" && (
                                        <><li>• Clear prerequisites ensure students are prepared</li><li>• Detailed materials list shows value proposition</li><li>• Instructor credentials build trust</li></>
                                    )}
                                </ul>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <PreviewCard formData={formData} config={config} />
        </div>
    );
}