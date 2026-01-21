import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, User as UserIcon, Clock } from 'lucide-react';

// IBAN validation function
const validateIBAN = (iban) => {
  if (!iban) return { valid: true, message: '' };
  
  // Remove spaces and convert to uppercase
  const normalized = iban.replace(/\s/g, '').toUpperCase();
  
  // Basic format check (2 letters + 2 digits + alphanumeric)
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(normalized)) {
    return { valid: false, message: 'Invalid IBAN format (must start with 2 letters and 2 digits)' };
  }
  
  // Length validation by country
  const ibanLengths = {
    AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22,
    BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28,
    EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27, GB: 22, GE: 22, GI: 23,
    GL: 18, GR: 27, GT: 28, HR: 21, HU: 28, IE: 22, IL: 23, IS: 26, IT: 27,
    JO: 30, KW: 30, KZ: 20, LB: 28, LC: 32, LI: 21, LT: 20, LU: 20, LV: 21,
    MC: 27, MD: 24, ME: 22, MK: 19, MR: 27, MT: 31, MU: 30, NL: 18, NO: 15,
    PK: 24, PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SE: 24,
    SI: 19, SK: 24, SM: 27, TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20
  };
  
  const country = normalized.substring(0, 2);
  const expectedLength = ibanLengths[country];
  
  if (expectedLength && normalized.length !== expectedLength) {
    return { valid: false, message: `Invalid IBAN length for ${country} (expected ${expectedLength} characters)` };
  }
  
  if (normalized.length < 15 || normalized.length > 34) {
    return { valid: false, message: 'IBAN length must be between 15 and 34 characters' };
  }
  
  return { valid: true, message: '', normalized };
};

// Format IBAN for display (add spaces every 4 characters)
const formatIBANDisplay = (iban) => {
  if (!iban) return '';
  return iban.match(/.{1,4}/g)?.join(' ') || iban;
};

export default function MyProfileTab({ user, onUpdate }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: '',
    gender: '',
    home_address: '',
    bank_account_iban: '',
  });
  const [ibanDisplay, setIbanDisplay] = useState('');
  const [ibanError, setIbanError] = useState('');

  useEffect(() => {
    if (user) {
      // Split full_name into first and last for display
      setFormData({
        full_name: user.full_name || '',
        gender: user.gender || '',
        home_address: user.home_address || '',
        bank_account_iban: user.bank_account_iban || '',
      });
      setIbanDisplay(formatIBANDisplay(user.bank_account_iban || ''));
    }
  }, [user]);

  const handleIBANChange = (value) => {
    setIbanDisplay(value);
    
    // Remove spaces for validation
    const normalized = value.replace(/\s/g, '').toUpperCase();
    const validation = validateIBAN(normalized);
    
    if (!validation.valid) {
      setIbanError(validation.message);
    } else {
      setIbanError('');
      setFormData({ ...formData, bank_account_iban: validation.normalized || normalized });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validation
      if (!formData.full_name || formData.full_name.trim().length < 1) {
        throw new Error('Full name is required');
      }

      // Validate IBAN if provided
      if (formData.bank_account_iban) {
        const validation = validateIBAN(formData.bank_account_iban);
        if (!validation.valid) {
          throw new Error(validation.message);
        }
      }

      // Prepare update data
      const updateData = {
        full_name: formData.full_name.trim(),
        gender: formData.gender || null,
        home_address: formData.home_address || null,
        bank_account_iban: formData.bank_account_iban || null,
      };

      // Update using base44.auth.updateMe (only current user can update themselves)
      await base44.auth.updateMe(updateData);

      // Create audit log
      await base44.entities.AuditLog.create({
        actor_id: user.id,
        actor_email: user.email,
        actor_name: user.full_name,
        action: 'update',
        entity_type: 'User',
        entity_id: user.id,
        entity_description: 'Updated personal profile',
        after_data: JSON.stringify(updateData),
      });
    },
    onSuccess: async () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Refresh user data
      const updatedUser = await base44.auth.me();
      if (onUpdate) {
        onUpdate(updatedUser);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
      console.error('Save error:', error);
    },
  });

  const handleSave = () => {
    if (ibanError) {
      toast.error('Please fix IBAN errors before saving');
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              My Personal Information
            </CardTitle>
            {user?.updated_date && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                Last updated: {new Date(user.updated_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Read-only fields */}
          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm">Account Information (Read-only)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-600">Email</Label>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <div>
                <Label className="text-slate-600">Role</Label>
                <p className="text-sm font-medium capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="First Last"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Enter your first and last name</p>
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(v) => setFormData({ ...formData, gender: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="home_address">Home Address</Label>
              <Textarea
                id="home_address"
                placeholder="Street, Number, Postal Code, City, Country"
                value={formData.home_address}
                onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="bank_iban">Bank Account (IBAN)</Label>
              <Input
                id="bank_iban"
                placeholder="GB82 WEST 1234 5698 7654 32"
                value={ibanDisplay}
                onChange={(e) => handleIBANChange(e.target.value)}
                className={ibanError ? 'border-red-500' : ''}
              />
              {ibanError && (
                <p className="text-xs text-red-600 mt-1">{ibanError}</p>
              )}
              {!ibanError && formData.bank_account_iban && (
                <p className="text-xs text-green-600 mt-1">✓ Valid IBAN format</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Enter IBAN with or without spaces. Will be stored in normalized format.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={saveMutation.isPending || !!ibanError}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-blue-600">ℹ️</div>
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Privacy & Security</p>
              <ul className="space-y-1 text-blue-800">
                <li>• You can only edit your own profile information</li>
                <li>• Changes are logged for security purposes</li>
                <li>• Your manager/HR may view this information</li>
                <li>• Work-related settings (team, schedule, etc.) are managed by your manager</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}