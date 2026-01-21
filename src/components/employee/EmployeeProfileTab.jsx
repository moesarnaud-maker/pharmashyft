import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Save, MapPin, CreditCard } from 'lucide-react';

export default function EmployeeProfileTab({ employee, user, currentUser }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    // User fields (name)
    first_name: '',
    last_name: '',
    // Employee fields
    gender: '',
    home_address: '',
    iban: '',
  });

  useEffect(() => {
    if (user && employee) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        gender: employee.gender || '',
        home_address: employee.home_address || '',
        iban: employee.iban || '',
      });
    }
  }, [user, employee]);

  // Validate IBAN format (basic validation)
  const validateIBAN = (iban) => {
    // Remove spaces and convert to uppercase
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
    
    // Basic IBAN format check (2 letters + 2 digits + up to 30 alphanumeric)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    
    return ibanRegex.test(cleanIBAN);
  };

  const formatIBAN = (value) => {
    // Remove all spaces and convert to uppercase
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    
    // Add space every 4 characters for readability
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  };

  const handleIBANChange = (e) => {
    const formatted = formatIBAN(e.target.value);
    setFormData({ ...formData, iban: formatted });
  };

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      // Validate IBAN if provided
      if (formData.iban && !validateIBAN(formData.iban)) {
        throw new Error('Invalid IBAN format');
      }

      // Update User (name fields)
      await base44.entities.User.update(user.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`.trim(), // Update full_name too
      });

      // Update Employee (other fields)
      await base44.entities.Employee.update(employee.id, {
        gender: formData.gender,
        home_address: formData.home_address,
        iban: formData.iban.replace(/\s/g, ''), // Store without spaces
      });

      // Audit log
      await base44.entities.AuditLog.create({
        actor_id: currentUser.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        action: 'update',
        entity_type: 'Employee',
        entity_id: employee.id,
        entity_description: 'Updated profile information',
        after_data: JSON.stringify(formData),
      });
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const hasChanges = () => {
    if (!user || !employee) return false;
    
    return (
      formData.first_name !== (user.first_name || '') ||
      formData.last_name !== (user.last_name || '') ||
      formData.gender !== (employee.gender || '') ||
      formData.home_address !== (employee.home_address || '') ||
      formData.iban.replace(/\s/g, '') !== (employee.iban || '')
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
        <p className="text-slate-500">Manage your personal information</p>
      </div>

      {/* Personal Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <Label>Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(v) => setFormData({ ...formData, gender: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Home Address</Label>
            <Input
              value={formData.home_address}
              onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
              placeholder="Street, Number, Postal Code, City, Country"
            />
            <p className="text-xs text-slate-500 mt-1">
              Your full home address
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Banking Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Banking Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>IBAN (International Bank Account Number)</Label>
            <Input
              value={formData.iban}
              onChange={handleIBANChange}
              placeholder="BE68 5390 0754 7034"
              maxLength={34}
            />
            <p className="text-xs text-slate-500 mt-1">
              Your IBAN for salary payments (spaces will be added automatically)
            </p>
            {formData.iban && !validateIBAN(formData.iban) && (
              <p className="text-xs text-red-600 mt-1">
                Invalid IBAN format
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={() => saveProfileMutation.mutate()}
          disabled={!hasChanges() || saveProfileMutation.isPending || (formData.iban && !validateIBAN(formData.iban))}
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Info Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <p className="text-sm text-amber-900">
            <strong>Privacy Notice:</strong> Your personal information is securely stored and only accessible to authorized HR personnel. 
            Banking information is encrypted and used solely for salary payments.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}