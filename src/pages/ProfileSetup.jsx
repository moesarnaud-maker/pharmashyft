import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, MapPin, CreditCard, Check, Clock } from 'lucide-react';

export default function ProfileSetup({ user, employee, onComplete }) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    gender: employee?.gender || '',
    home_address: employee?.home_address || '',
    iban: employee?.iban || '',
  });

  const totalSteps = 3;

  // Validate IBAN format (basic validation)
  const validateIBAN = (iban) => {
    if (!iban) return true; // IBAN is optional
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    return ibanRegex.test(cleanIBAN);
  };

  const formatIBAN = (value) => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  };

  const handleIBANChange = (e) => {
    const formatted = formatIBAN(e.target.value);
    setFormData({ ...formData, iban: formatted });
  };

  const canProceedStep1 = formData.first_name.trim() && formData.last_name.trim();
  const canProceedStep2 = true; // Gender is optional
  const canProceedStep3 = !formData.iban || validateIBAN(formData.iban);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!formData.first_name.trim() || !formData.last_name.trim()) {
        throw new Error('First name and last name are required');
      }

      // Validate IBAN if provided
      if (formData.iban && !validateIBAN(formData.iban)) {
        throw new Error('Invalid IBAN format');
      }

      // Update User (name fields)
      await base44.entities.User.update(user.id, {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        full_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        profile_completed: true,
      });

      // Update Employee (other fields)
      if (employee) {
        await base44.entities.Employee.update(employee.id, {
          gender: formData.gender,
          home_address: formData.home_address,
          iban: formData.iban.replace(/\s/g, ''),
          profile_completed: true,
        });
      }

      // Audit log
      await base44.entities.AuditLog.create({
        actor_id: user.id,
        actor_email: user.email,
        actor_name: `${formData.first_name} ${formData.last_name}`,
        action: 'create',
        entity_type: 'ProfileSetup',
        entity_id: employee?.id || user.id,
        entity_description: 'Completed initial profile setup',
        after_data: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          gender: formData.gender,
          home_address: formData.home_address ? '[REDACTED]' : '',
          iban: formData.iban ? '[REDACTED]' : '',
        }),
      });
    },
    onSuccess: () => {
      toast.success('Profile setup completed! Welcome aboard!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save profile');
    },
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    saveProfileMutation.mutate();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
              step < currentStep
                ? 'bg-green-500 text-white'
                : step === currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            {step < currentStep ? <Check className="w-5 h-5" /> : step}
          </div>
          {step < 3 && (
            <div
              className={`w-16 h-1 mx-2 rounded ${
                step < currentStep ? 'bg-green-500' : 'bg-slate-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to PharmaShyft!</h1>
          <p className="text-slate-500">Let's set up your profile to get started</p>
        </div>

        {renderStepIndicator()}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Tell us your name. This will be displayed throughout the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) => setFormData({ ...formData, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext} disabled={!canProceedStep1}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Address Information */}
        {currentStep === 2 && (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Address Information
              </CardTitle>
              <CardDescription>
                Your home address for HR records.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="home_address">Home Address</Label>
                <Input
                  id="home_address"
                  value={formData.home_address}
                  onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                  placeholder="Street, Number, Postal Code, City, Country"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Your full home address (optional but recommended)
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={!canProceedStep2}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Banking Information */}
        {currentStep === 3 && (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Banking Information
              </CardTitle>
              <CardDescription>
                Your bank account for salary payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="iban">IBAN (International Bank Account Number)</Label>
                <Input
                  id="iban"
                  value={formData.iban}
                  onChange={handleIBANChange}
                  placeholder="BE68 5390 0754 7034"
                  maxLength={34}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Spaces will be added automatically for readability
                </p>
                {formData.iban && !validateIBAN(formData.iban) && (
                  <p className="text-xs text-red-600 mt-1">
                    Invalid IBAN format
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                <strong>Privacy Notice:</strong> Your banking information is encrypted and only used for salary payments.
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!canProceedStep3 || saveProfileMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saveProfileMutation.isPending ? 'Saving...' : 'Complete Setup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Summary */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Step {currentStep} of {totalSteps}
        </div>
      </div>
    </div>
  );
}