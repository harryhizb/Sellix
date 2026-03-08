export interface DynamicField {
    key: string;
    label: string;
    type: "text" | "number" | "textarea" | "select" | "switch" | "multi-input" | "dynamic-key-value";
    description?: string;
    placeholder?: string;
    options?: string[];
    required?: boolean;
    validation?: (value: any) => boolean;
    icon?: React.ComponentType<any>;
    min?: number;
    max?: number;
    suffix?: string;
}

export interface DynamicFormProps {
    category: string;
    formData: Record<string, any>;
    onFormChange: (field: string, value: any) => void;
    mode?: "create" | "edit";
    className?: string;
}
