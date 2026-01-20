import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Clock, Coffee, TrendingUp, Settings2, Loader2 } from 'lucide-react';
import { toast } from "sonner";

const defaultSettings = {
  standard_hours_week: 38,
  standard_hours_day: 7.6,
  break_required_after_hours: 6,
  minimum_break_minutes: 30,
  rounding_minutes: 5,
  overtime_daily_threshold: 8,
  overtime_weekly_threshold: 38,
  auto_approve_sick_leave: true,
  require_location_clockin: false,
  allow_future_timesheets: false,
  lock_timesheets_after_days: 14
};

export default function SettingsPanel({ settings = [], onSaveSettings, isLoading }) {
  const [formData, setFormData] = useState(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const settingsMap = {};
    settings.forEach(s => {
      let value = s.setting_value;
      if (s.setting_type === 'number') value = parseFloat(value);
      else if (s.setting_type === 'boolean') value = value === 'true';
      settingsMap[s.setting_key] = value;
    });
    setFormData({ ...defaultSettings, ...settingsMap });
  }, [settings]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const settingsToSave = Object.entries(formData).map(([key, value]) => ({
      setting_key: key,
      setting_value: String(value),
      setting_type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
      category: key.includes('break') ? 'breaks' : key.includes('overtime') ? 'overtime' : key.includes('rounding') ? 'rounding' : 'workweek'
    }));
    onSaveSettings(settingsToSave);
    setHasChanges(false);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-slate-500">Configure business rules and policies</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="workweek" className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="workweek">
            <Clock className="w-4 h-4 mr-2" />
            Work Week
          </TabsTrigger>
          <TabsTrigger value="breaks">
            <Coffee className="w-4 h-4 mr-2" />
            Breaks
          </TabsTrigger>
          <TabsTrigger value="overtime">
            <TrendingUp className="w-4 h-4 mr-2" />
            Overtime
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings2 className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workweek">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Work Week Configuration</CardTitle>
              <CardDescription>Define standard working hours for your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Standard Hours per Week</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.standard_hours_week}
                    onChange={(e) => handleChange('standard_hours_week', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-slate-500">Belgian standard: 38 hours</p>
                </div>
                <div className="space-y-2">
                  <Label>Standard Hours per Day</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.standard_hours_day}
                    onChange={(e) => handleChange('standard_hours_day', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-slate-500">Usually 7.6 hours for 38h/week</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rounding (minutes)</Label>
                <Input
                  type="number"
                  value={formData.rounding_minutes}
                  onChange={(e) => handleChange('rounding_minutes', parseInt(e.target.value))}
                />
                <p className="text-sm text-slate-500">Round clock times to nearest X minutes (0 = no rounding)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breaks">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Break Rules</CardTitle>
              <CardDescription>Configure mandatory break policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Break Required After (hours)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.break_required_after_hours}
                    onChange={(e) => handleChange('break_required_after_hours', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-slate-500">EU regulation: after 6 hours</p>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Break Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.minimum_break_minutes}
                    onChange={(e) => handleChange('minimum_break_minutes', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-slate-500">Minimum: 30 minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overtime">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Overtime Rules</CardTitle>
              <CardDescription>Define when overtime kicks in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Daily Overtime Threshold (hours)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.overtime_daily_threshold}
                    onChange={(e) => handleChange('overtime_daily_threshold', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-slate-500">Hours worked above this count as overtime</p>
                </div>
                <div className="space-y-2">
                  <Label>Weekly Overtime Threshold (hours)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.overtime_weekly_threshold}
                    onChange={(e) => handleChange('overtime_weekly_threshold', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-slate-500">Weekly hours above this count as overtime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Other configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label>Auto-approve Sick Leave</Label>
                  <p className="text-sm text-slate-500">Sick leave notifications are auto-approved</p>
                </div>
                <Switch
                  checked={formData.auto_approve_sick_leave}
                  onCheckedChange={(v) => handleChange('auto_approve_sick_leave', v)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label>Require Location for Clock-in</Label>
                  <p className="text-sm text-slate-500">Capture GPS location when clocking in</p>
                </div>
                <Switch
                  checked={formData.require_location_clockin}
                  onCheckedChange={(v) => handleChange('require_location_clockin', v)}
                />
              </div>
              <div className="space-y-2">
                <Label>Lock Timesheets After (days)</Label>
                <Input
                  type="number"
                  value={formData.lock_timesheets_after_days}
                  onChange={(e) => handleChange('lock_timesheets_after_days', parseInt(e.target.value))}
                />
                <p className="text-sm text-slate-500">Auto-lock approved timesheets after X days</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}