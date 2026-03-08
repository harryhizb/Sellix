"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Wifi, Mail, ToggleLeft, Shield, Bell, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data.settings);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(section: string, value: any) {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [section]: value })
      });
      
      if (!res.ok) throw new Error("Failed to save settings");
      
      const data = await res.json();
      setSettings(data.settings);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25D366]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
          <p className="text-white/60">Platform-wide configuration and feature toggles</p>
        </div>
        <Button onClick={() => saveSettings("systemConfig", settings.systemConfig)} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* System Configuration */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#25D366]" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-white/70">Maintenance Mode</Label>
              <Switch
                checked={settings.systemConfig?.maintenanceMode}
                onCheckedChange={(v) => saveSettings("systemConfig", { ...settings.systemConfig, maintenanceMode: v })}
              />
            </div>
            <div>
              <Label className="text-white/70">Global Message Limit</Label>
              <Input
                value={settings.systemConfig?.globalMessageLimit || 10000}
                onChange={(e) => saveSettings("systemConfig", { ...settings.systemConfig, globalMessageLimit: parseInt(e.target.value) })}
                className="bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            <div>
              <Label className="text-white/70">Max Products per Business</Label>
              <Input
                value={settings.systemConfig?.maxProductsPerBusiness || 100}
                onChange={(e) => saveSettings("systemConfig", { ...settings.systemConfig, maxProductsPerBusiness: parseInt(e.target.value) })}
                className="bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            <div>
              <Label className="text-white/70">Enable New Registrations</Label>
              <Switch
                checked={settings.systemConfig?.enableNewBusinessRegistration}
                onCheckedChange={(v) => saveSettings("systemConfig", { ...settings.systemConfig, enableNewBusinessRegistration: v })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp API */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-[#25D366]" />
            WhatsApp API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label className="text-white/70">API URL</Label>
              <Input
                value={settings.whatsappApi?.apiUrl || ""}
                onChange={(e) => saveSettings("whatsappApi", { ...settings.whatsappApi, apiUrl: e.target.value })}
                placeholder="http://localhost:3001"
                className="bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            <div>
              <Label className="text-white/70">Retry Attempts</Label>
              <Input
                type="number"
                value={settings.whatsappApi?.retryAttempts || 3}
                onChange={(e) => saveSettings("whatsappApi", { ...settings.whatsappApi, retryAttempts: parseInt(e.target.value) })}
                className="bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            <div>
              <Label className="text-white/70">Timeout (ms)</Label>
              <Input
                type="number"
                value={settings.whatsappApi?.timeoutMs || 30000}
                onChange={(e) => saveSettings("whatsappApi", { ...settings.whatsappApi, timeoutMs: parseInt(e.target.value) })}
                className="bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ToggleLeft className="w-5 h-5 text-[#25D366]" />
            Feature Toggles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(settings.featureToggles || {}).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <Label className="text-white/70 capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</Label>
                <Switch
                  checked={enabled as boolean}
                  onCheckedChange={(v) => saveSettings("featureToggles", { ...settings.featureToggles, [feature]: v })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
