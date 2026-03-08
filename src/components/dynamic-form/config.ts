import { Plus, Palette, Ruler, Clock, ChefHat, BookOpen, Users, Tag, Package, AlertCircle } from "lucide-react";
import { DynamicField } from "./types";

export const CATEGORY_FIELD_CONFIGS: Record<string, { name: string; icon: any; fields: DynamicField[] }> = {
    ecommerce: {
        name: "Retail / Shop",
        icon: Package,
        fields: [
            {
                key: "color",
                label: "Color Variants",
                type: "multi-input",
                description: "Available colors (comma separated)",
                placeholder: "e.g., Black, White, Red, Blue",
                icon: Palette,
                required: true,
                validation: (value: string) => value.split(',').filter(c => c.trim()).length > 0
            },
            {
                key: "size",
                label: "Size Options",
                type: "multi-input",
                description: "Available sizes (comma separated)",
                placeholder: "e.g., S, M, L, XL or 42, 43, 44",
                icon: Ruler,
                required: true,
                validation: (value: string) => value.split(',').filter(s => s.trim()).length > 0
            },
            { key: "brand", label: "Brand", type: "text", description: "Product brand or manufacturer", placeholder: "e.g., Nike, Apple, Samsung", icon: Tag, required: false },
            { key: "material", label: "Material", type: "text", description: "Product material composition", placeholder: "e.g., Leather, Cotton, Silk", icon: Package, required: false },
            { key: "stock_quantity", label: "Stock Quantity", type: "number", description: "Available units in stock", placeholder: "e.g., 100", icon: Package, required: true, min: 0 }
        ]
    },
    restaurant: {
        name: "Restaurant / Cafe",
        icon: ChefHat,
        fields: [
            {
                key: "ingredients",
                label: "Key Ingredients",
                type: "multi-input",
                description: "Main ingredients (comma separated)",
                placeholder: "e.g., Chicken, Rice, Spices, Vegetables",
                icon: Package,
                required: true,
                validation: (value: string) => value.split(',').filter(i => i.trim()).length > 0
            },
            { key: "spice_level", label: "Spice Level", type: "select", description: "Spiciness intensity", options: ["Mild", "Medium", "Hot", "Extra Hot"], icon: AlertCircle, required: true },
            { key: "portion_size", label: "Portion Size", type: "select", description: "Serving size", options: ["Small", "Regular", "Large", "Family"], icon: Package, required: true },
            { key: "preparation_time", label: "Preparation Time", type: "number", description: "Estimated time in minutes", placeholder: "e.g., 15", icon: Clock, required: true, suffix: "minutes", min: 1 },
            { key: "allergens", label: "Allergens", type: "multi-input", description: "Common allergens present", placeholder: "e.g., Nuts, Dairy, Gluten", icon: AlertCircle, required: false }
        ]
    },
    service: {
        name: "Services / Salon",
        icon: Users,
        fields: [
            { key: "duration", label: "Service Duration", type: "select", description: "How long the service takes", options: ["30 minutes", "1 hour", "1.5 hours", "2 hours", "Custom"], icon: Clock, required: true },
            { key: "therapist_specialist", label: "Specialist/Staff", type: "text", description: "Name of specialist or type of staff", placeholder: "e.g., John (Senior Stylist)", icon: Users, required: false },
            { key: "equipment_used", label: "Equipment Used", type: "multi-input", description: "Tools or equipment required", placeholder: "e.g., Scissors, Blow Dryer, Massage Table", icon: Package, required: false },
            { key: "skill_level", label: "Skill Level", type: "select", description: "Required expertise level", options: ["Beginner", "Intermediate", "Advanced", "Expert"], icon: BookOpen, required: false },
            { key: "appointment_required", label: "Appointment Required", type: "switch", description: "Does this service require booking in advance?", icon: Clock, required: false }
        ]
    },
    institute: {
        name: "Office / School",
        icon: BookOpen,
        fields: [
            { key: "course_duration", label: "Course Duration", type: "text", description: "Total length of course/program", placeholder: "e.g., 3 months, 1 year", icon: Clock, required: true },
            { key: "level", label: "Difficulty Level", type: "select", description: "Target student level", options: ["Beginner", "Intermediate", "Advanced", "Professional"], icon: BookOpen, required: true },
            { key: "instructor", label: "Instructor/Facilitator", type: "text", description: "Name of teacher or facilitator", placeholder: "e.g., Dr. Sarah Khan", icon: Users, required: false },
            { key: "materials_included", label: "Materials Included", type: "multi-input", description: "What's included in the course", placeholder: "e.g., Books, Certificate, Software License", icon: Package, required: false },
            { key: "prerequisites", label: "Prerequisites", type: "textarea", description: "Required knowledge or skills before joining", placeholder: "e.g., Basic programming knowledge", icon: AlertCircle, required: false }
        ]
    },
    other: {
        name: "Other Business",
        icon: Package,
        fields: [
            { key: "custom_attributes", label: "Custom Attributes", type: "dynamic-key-value", description: "Add your own attributes as key-value pairs", icon: Plus, required: false }
        ]
    }
};
