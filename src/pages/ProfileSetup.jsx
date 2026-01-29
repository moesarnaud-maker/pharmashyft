import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, MapPin, CreditCard, Clock } from 'lucide-react';

export default function ProfileSetup({ user, employee, onComplete }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    home_address: employee?.home_address || '',
    iban: employee?.iban || '',
  });
  const [errors, setErrors] = useState({});

  const validateIBAN = (iban) => {
    if (!iban) return false;
    const clean = iban.replace(/\s/g, '').toUpperCase();
    return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(clean);
  };

  const formatIBAN = (value) => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  };

  const handleIBANChange = (e) => {
    const formatted = formatIBAN(e.target.value);
    setFormData({ ...formData, iban: formatted });
    if (errors.iban) {
      setErrors({ ...errors, iban: null });
    }
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.home_address.trim()) newErrors.home_address = 'Home address is required';
    if (!formData.iban.trim()) {
      newErrors.iban = 'IBAN is required';
    } else if (!validateIBAN(formData.iban)) {
      newErrors.iban = 'Invalid IBAN format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!validate()) {
        throw new Error('Please fill in all required fields');
      }

      // Update User entity
      await base44.entities.User.update(user.id, {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        full_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        profile_completed: true,
        status: 'active',
      });

      // Update or create Employee entity
      let employeeId = employee?.id;
      if (employee) {
        await base44.entities.Employee.update(employee.id, {
          home_address: formData.home_address.trim(),
          iban: formData.iban.replace(/\s/g, ''),
          profile_completed: true,
        });
      } else {
        // No Employee record yet — create one linked to this user
        const newEmployee = await base44.entities.Employee.create({
          user_id: user.id,
          home_address: formData.home_address.trim(),
          iban: formData.iban.replace(/\s/g, ''),
          status: 'active',
          profile_completed: true,
        });
        employeeId = newEmployee.id;
      }

      // Audit log
      await base44.entities.AuditLog.create({
        actor_id: user.id,
        actor_email: user.email,
        actor_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        action: 'create',
        entity_type: 'ProfileSetup',
        entity_id: employeeId || user.id,
        entity_description: 'Completed initial profile setup',
        after_data: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          home_address: '[REDACTED]',
          iban: '[REDACTED]',
        }),
      });
    },
    onSuccess: () => {
      toast.success('Profile setup completed! Welcome aboard!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      if (onComplete) onComplete();
    },
    onError: (error) => {
      if (error.message !== 'Please fill in all required fields') {
        toast.error(error.message || 'Failed to save profile');
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveProfileMutation.mutate();
  };

  const isFormValid = formData.first_name.trim() &&
    formData.last_name.trim() &&
    formData.home_address.trim() &&
    formData.iban.trim() &&
    validateIBAN(formData.iban);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to PharmaShyft!</h1>
          <p className="text-slate-500">Complete your profile to get started. All fields are required.</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Account Setup</CardTitle>
            <CardDescription>
              Please provide your personal details, home address and banking information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <User className="w-4 h-4 text-blue-600" />
                  Personal Information
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={handleChange('first_name')}
                      placeholder="John"
                      autoFocus
                      className={errors.first_name ? 'border-red-400' : ''}
                    />
                    {errors.first_name && <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={handleChange('last_name')}
                      placeholder="Doe"
                      className={errors.last_name ? 'border-red-400' : ''}
                    />
                    {errors.last_name && <p className="text-xs text-red-600 mt-1">{errors.last_name}</p>}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Home Address
                </div>
                <div>
                  <Label htmlFor="home_address">Full Address *</Label>
                  <Input
                    id="home_address"
                    value={formData.home_address}
                    onChange={handleChange('home_address')}
                    placeholder="Street, Number, Postal Code, City, Country"
                    className={errors.home_address ? 'border-red-400' : ''}
                  />
                  {errors.home_address && <p className="text-xs text-red-600 mt-1">{errors.home_address}</p>}
                </div>
              </div>

              {/* Banking */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Banking Information
                </div>
                <div>
                  <Label htmlFor="iban">IBAN *</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={handleIBANChange}
                    placeholder="BE68 5390 0754 7034"
                    maxLength={42}
                    className={errors.iban ? 'border-red-400' : ''}
                  />
                  {errors.iban && <p className="text-xs text-red-600 mt-1">{errors.iban}</p>}
                  <p className="text-xs text-slate-500 mt-1">Spaces are added automatically for readability</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                  <strong>Privacy Notice:</strong> Your banking information is encrypted and only used for salary payments.
                </div>
              </div>

              <Button
                type="submit"
                disabled={!isFormValid || saveProfileMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {saveProfileMutation.isPending ? 'Saving...' : 'Complete Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
