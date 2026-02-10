import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, MapPin, CreditCard, Clock, AlertCircle } from 'lucide-react';

export default function Registration({ user, employee, onComplete }) {
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

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === 'iban') {
      value = formatIBAN(value);
    }
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.home_address.trim()) {
      newErrors.home_address = 'Home address is required';
    }
    if (!formData.iban.trim()) {
      newErrors.iban = 'IBAN is required';
    } else if (!validateIBAN(formData.iban)) {
      newErrors.iban = 'Please enter a valid IBAN';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      // Update User: set name, mark profile complete, activate, clear token
      await base44.entities.User.update(user.id, {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        full_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        profile_completed: true,
        status: 'active',
        activated_at: new Date().toISOString(),
        invitation_token: null, // Mark token as used
      });

      // Create or update Employee record
      const cleanIban = formData.iban.replace(/\s/g, '');

      if (employee) {
        // Update existing employee (created during invitation)
        await base44.entities.Employee.update(employee.id, {
          home_address: formData.home_address.trim(),
          iban: cleanIban,
          status: 'active',
          profile_completed: true,
        });
      } else {
        // Create new employee record (self-registered user)
        await base44.entities.Employee.create({
          user_id: user.id,
          home_address: formData.home_address.trim(),
          iban: cleanIban,
          status: 'active',
          profile_completed: true,
        });
      }

      // Log the activation
      await base44.entities.AuditLog.create({
        actor_id: user.id,
        actor_email: user.email,
        actor_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        action: 'activate',
        entity_type: 'User',
        entity_id: user.id,
        entity_description: `User ${user.email} completed registration and was activated`,
        after_data: JSON.stringify({
          status: 'active',
          activated_at: new Date().toISOString(),
        }),
      });
    },
    onSuccess: () => {
      toast.success('Registration complete! Welcome to PharmaShyft.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error) => {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      registerMutation.mutate();
    }
  };

  const isFormValid =
    formData.first_name.trim() &&
    formData.last_name.trim() &&
    formData.home_address.trim() &&
    formData.iban.trim() &&
    validateIBAN(formData.iban);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Your Account</h1>
          <p className="text-slate-500">
            Complete your registration to access PharmaShyft.
            <br />All fields are required.
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Registration</CardTitle>
            <CardDescription>
              Enter your personal details and banking information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email (read-only from invitation) */}
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-50 text-slate-600"
                />
                <p className="text-xs text-slate-500">This is the email address from your invitation</p>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 border-b pb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Personal Information
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={handleChange('first_name')}
                      placeholder="John"
                      autoFocus
                      className={errors.first_name ? 'border-red-400 focus:ring-red-400' : ''}
                    />
                    {errors.first_name && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.first_name}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={handleChange('last_name')}
                      placeholder="Doe"
                      className={errors.last_name ? 'border-red-400 focus:ring-red-400' : ''}
                    />
                    {errors.last_name && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.last_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 border-b pb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Home Address
                </div>

                <div>
                  <Label htmlFor="home_address">Full Address</Label>
                  <Input
                    id="home_address"
                    value={formData.home_address}
                    onChange={handleChange('home_address')}
                    placeholder="Street, Number, Postal Code, City"
                    className={errors.home_address ? 'border-red-400 focus:ring-red-400' : ''}
                  />
                  {errors.home_address && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.home_address}
                    </p>
                  )}
                </div>
              </div>

              {/* Banking Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 border-b pb-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Banking Information
                </div>

                <div>
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={handleChange('iban')}
                    placeholder="BE68 5390 0754 7034"
                    maxLength={42}
                    className={errors.iban ? 'border-red-400 focus:ring-red-400' : ''}
                  />
                  {errors.iban && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.iban}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Spaces are added automatically
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Privacy:</strong> Your banking information is encrypted and only used for salary payments.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isFormValid || registerMutation.isPending}
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating account...
                  </span>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-4">
          By registering, you agree to use this system responsibly.
        </p>
      </div>
    </div>
  );
}
