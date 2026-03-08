"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DynamicField } from "./types";

interface FieldRendererProps {
    field: DynamicField;
    value: any;
    formData: Record<string, any>;
    onFormChange: (key: string, val: any) => void;
    newCustomKey: string;
    setNewCustomKey: (val: string) => void;
    newCustomValue: string;
    setNewCustomValue: (val: string) => void;
    customAttributes: Array<{ key: string, value: string }>;
    addCustomAttribute: () => void;
    removeCustomAttribute: (index: number) => void;
}

export function FieldRenderer({
    field, value, formData, onFormChange,
    newCustomKey, setNewCustomKey, newCustomValue, setNewCustomValue,
    customAttributes, addCustomAttribute, removeCustomAttribute
}: FieldRendererProps) {
    const FieldIcon = field.icon;

    switch (field.type) {
        case "text":
            return (
                <div className="space-y-2">
                    <Label htmlFor={field.key} className="flex items-center gap-2">
                        {FieldIcon && <FieldIcon className="w-4 h-4" />}
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Input
                                    id={field.key}
                                    type="text"
                                    placeholder={field.placeholder}
                                    value={value || ""}
                                    onChange={(e) => onFormChange(field.key, e.target.value)}
                                    required={field.required}
                                />
                            </TooltipTrigger>
                            {field.description && (
                                <TooltipContent><p className="max-w-xs">{field.description}</p></TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </div>
            );

        case "number":
            return (
                <div className="space-y-2">
                    <Label htmlFor={field.key} className="flex items-center gap-2">
                        {FieldIcon && <FieldIcon className="w-4 h-4" />}
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id={field.key}
                            type="number"
                            placeholder={field.placeholder}
                            value={value || ""}
                            onChange={(e) => onFormChange(field.key, e.target.value)}
                            min={field.min}
                            max={field.max}
                            required={field.required}
                            className="flex-1"
                        />
                        {field.suffix && <span className="flex items-center px-3 bg-muted rounded-md text-sm">{field.suffix}</span>}
                    </div>
                    {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                </div>
            );

        case "textarea":
            return (
                <div className="space-y-2">
                    <Label htmlFor={field.key} className="flex items-center gap-2">
                        {FieldIcon && <FieldIcon className="w-4 h-4" />}
                        {field.label}
                    </Label>
                    <Textarea
                        id={field.key}
                        placeholder={field.placeholder}
                        value={value || ""}
                        onChange={(e) => onFormChange(field.key, e.target.value)}
                        rows={3}
                    />
                    {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                </div>
            );

        case "select":
            return (
                <div className="space-y-2">
                    <Label htmlFor={field.key} className="flex items-center gap-2">
                        {FieldIcon && <FieldIcon className="w-4 h-4" />}
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Select value={value || ""} onValueChange={(val) => onFormChange(field.key, val)}>
                        <SelectTrigger><SelectValue placeholder={`Select ${field.label.toLowerCase()}`} /></SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                </div>
            );

        case "switch":
            return (
                <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                            {FieldIcon && <FieldIcon className="w-4 h-4" />}
                            {field.label}
                        </Label>
                        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                    </div>
                    <Switch checked={value || false} onCheckedChange={(checked) => onFormChange(field.key, checked)} />
                </div>
            );

        case "multi-input":
            const handleMultiInputChange = (val: string) => {
                const values = val.split(',').map(v => v.trim()).filter(v => v);
                onFormChange(field.key, values);
            };
            const multiValueStr = Array.isArray(value) ? value.join(', ') : (value || "");

            return (
                <div className="space-y-2">
                    <Label htmlFor={field.key} className="flex items-center gap-2">
                        {FieldIcon && <FieldIcon className="w-4 h-4" />}
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                        id={field.key}
                        type="text"
                        placeholder={field.placeholder}
                        value={multiValueStr}
                        onChange={(e) => handleMultiInputChange(e.target.value)}
                        required={field.required}
                    />
                    {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                    {Array.isArray(value) && value.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {value.map((item: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="px-2 py-1">{item}</Badge>
                            ))}
                        </div>
                    )}
                </div>
            );

        case "dynamic-key-value":
            return (
                <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                        {FieldIcon && <FieldIcon className="w-4 h-4" />}
                        {field.label}
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                        <Input placeholder="Attribute name" value={newCustomKey} onChange={(e) => setNewCustomKey(e.target.value)} />
                        <Input placeholder="Attribute value" value={newCustomValue} onChange={(e) => setNewCustomValue(e.target.value)} />
                        <Button type="button" onClick={addCustomAttribute} size="sm"><Plus className="w-4 h-4" /></Button>
                    </div>
                    {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                    {customAttributes.length > 0 && (
                        <div className="space-y-2 mt-4">
                            <Label className="text-sm">Added Attributes:</Label>
                            <div className="space-y-2">
                                {customAttributes.map((attr, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                        <div className="flex items-center gap-4"><Badge variant="outline">{attr.key}</Badge><span className="text-sm">{attr.value}</span></div>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeCustomAttribute(idx)}><X className="w-4 h-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );

        default: return null;
    }
}
