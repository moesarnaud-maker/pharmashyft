import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    homeAddress: '',
    bankInfo: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    validateToken();
  }, [token]);

  async function validateToken() {
    if (!token) {
      setTokenError('No invitation token provided');
      setIsLoading(false);
      return;
    }

    try {
      // Find user by invitation token
      const users = await base44.entities.User.list();
      const invitedUser = users.find(u => u.invitation_token === token);

      if (!invitedUser) {
        setTokenError('Invalid or expired invitation token');
        setIsLoading(false);
        return;
      }

      if (invitedUser.status === 'active') {
        setTokenError('This invitation has already been used');
        setIsLoading(false);
        return;
      }

      setUser(invitedUser);
    } catch (error) {
      console.error('Token validation error:', error);
      setTokenError('Failed to validate invitation');
    } finally {
      setIsLoading(false);
    }
  }

  function validate() {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.homeAddress.trim()) {
      newErrors.homeAddress = 'Home address is required';
    }

    if (!formData.bankInfo.trim()) {
      newErrors.bankInfo = 'Bank information is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Update user with profile info
      await base44.entities.User.update(user.id, {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        home_address: formData.homeAddress.trim(),
        bank_information: formData.bankInfo.trim(),
        status: 'active',
        profile_completed: true,
        activated_at: new Date().toISOString(),
        invitation_token: null, // Invalidate token
      });

      toast.success('Account activated successfully! Please log in.');
      navigate('/login');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(field) {
    return (e) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    };
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{tokenError}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              If you believe this is an error, please contact your administrator to request a new invitation.
            </p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
          <CardDescription>
            Set up your account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={user?.email || ''} disabled className="bg-gray-50" />
              <p className="text-xs text-muted-foreground">
                This is the email address from your invitation
              </p>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  placeholder="Min. 8 characters"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  placeholder="Confirm password"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  placeholder="John"
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  placeholder="Doe"
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="homeAddress">Home Address</Label>
              <Input
                id="homeAddress"
                value={formData.homeAddress}
                onChange={handleChange('homeAddress')}
                placeholder="123 Main St, City, Country"
                className={errors.homeAddress ? 'border-red-500' : ''}
              />
              {errors.homeAddress && (
                <p className="text-xs text-red-500">{errors.homeAddress}</p>
              )}
            </div>

            {/* Bank Info */}
            <div className="space-y-2">
              <Label htmlFor="bankInfo">Bank Information (IBAN)</Label>
              <Input
                id="bankInfo"
                value={formData.bankInfo}
                onChange={handleChange('bankInfo')}
                placeholder="BE68 5390 0754 7034"
                className={errors.bankInfo ? 'border-red-500' : ''}
              />
              {errors.bankInfo && (
                <p className="text-xs text-red-500">{errors.bankInfo}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your bank information is securely stored and only used for payroll
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Activating Account...' : 'Complete Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
