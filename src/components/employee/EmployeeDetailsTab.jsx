import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, MapPin } from 'lucide-react';

export default function EmployeeDetailsTab({ employee, user, teams, schedules, onUpdate }) {
  const queryClient = useQueryClient();
  
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: employeeLocations = [] } = useQuery({
    queryKey: ['employeeLocations'],
    queryFn: () => base44.entities.EmployeeLocation.list(),
  });
  const [formData, setFormData] = useState({
    employee_number: employee?.employee_number || '',
    team_id: employee?.team_id || '',
    main_location_id: employee?.main_location_id || '',
    schedule_id: employee?.schedule_id || '',
    contract_hours_week: employee?.contract_hours_week || 38,
    vacation_days_total: employee?.vacation_days_total || 20,
    pin_code: employee?.pin_code || '',
  });

  const [eligibleLocationIds, setEligibleLocationIds] = useState(
    employeeLocations
      .filter(el => el.employee_id === employee?.id)
      .map(el => el.location_id)
  );

  const toggleLocation = (locationId) => {
    setEligibleLocationIds(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const saveLocationsMutation = useMutation({
    mutationFn: async () => {
      // Fetch fresh data to avoid stale references
      const currentEmployeeLocations = await base44.entities.EmployeeLocation.filter({ 
        employee_id: employee.id 
      });
      
      // Remove existing eligibilities
      for (const el of currentEmployeeLocations) {
        await base44.entities.EmployeeLocation.delete(el.id);
      }

      // Add new eligibilities
      for (const locId of eligibleLocationIds) {
        await base44.entities.EmployeeLocation.create({
          employee_id: employee.id,
          location_id: locId,
          assigned_date: new Date().toISOString().split('T')[0],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeLocations'] });
    },
  });

  const handleSave = async () => {
    // Validate main location is in eligible locations
    if (formData.main_location_id && !eligibleLocationIds.includes(formData.main_location_id)) {
      toast.error('Main location must be included in eligible locations');
      return;
    }

    await saveLocationsMutation.mutateAsync();
    
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
            <Label>Main Location (required)</Label>
            <Select
              value={formData.main_location_id}
              onValueChange={(v) => setFormData({ ...formData, main_location_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select main location..." />
              </SelectTrigger>
              <SelectContent>
                {locations.filter(l => l.status === 'active').map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Eligible Locations (select all locations where employee can work)</Label>
            <Card className="p-4 mt-2">
              <div className="space-y-2">
                {locations.filter(l => l.status === 'active').map(loc => (
                  <div key={loc.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{loc.name}</span>
                    </div>
                    <Button
                      variant={eligibleLocationIds.includes(loc.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleLocation(loc.id)}
                    >
                      {eligibleLocationIds.includes(loc.id) ? 'Eligible' : 'Add'}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
            {formData.main_location_id && !eligibleLocationIds.includes(formData.main_location_id) && (
              <p className="text-sm text-red-600 mt-1">Main location must be included in eligible locations</p>
            )}
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