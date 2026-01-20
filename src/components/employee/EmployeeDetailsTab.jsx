import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from 'lucide-react';

export default function EmployeeDetailsTab({ employee, user, teams, schedules, onUpdate }) {
  const [formData, setFormData] = useState({
    employee_number: employee?.employee_number || '',
    team_id: employee?.team_id || '',
    schedule_id: employee?.schedule_id || '',
    contract_hours_week: employee?.contract_hours_week || 38,
    vacation_days_total: employee?.vacation_days_total || 20,
    pin_code: employee?.pin_code || '',
  });

  const handleSave = () => {
    onUpdate({
      user_id: user.id,
      employee_id: employee?.id,
      ...formData,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employee Number</Label>
              <Input
                placeholder="EMP001"
                value={formData.employee_number}
                onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
              />
            </div>
            <div>
              <Label>PIN Code (Kiosk)</Label>
              <Input
                placeholder="1234"
                maxLength={4}
                value={formData.pin_code}
                onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Team</Label>
            <Select
              value={formData.team_id}
              onValueChange={(v) => setFormData({ ...formData, team_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team..." />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Legacy Schedule (deprecated - use Schedule tab instead)</Label>
            <Select
              value={formData.schedule_id}
              onValueChange={(v) => setFormData({ ...formData, schedule_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select schedule..." />
              </SelectTrigger>
              <SelectContent>
                {schedules.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contract Hours/Week</Label>
              <Input
                type="number"
                value={formData.contract_hours_week}
                onChange={(e) => setFormData({ ...formData, contract_hours_week: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Vacation Days/Year</Label>
              <Input
                type="number"
                value={formData.vacation_days_total}
                onChange={(e) => setFormData({ ...formData, vacation_days_total: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}