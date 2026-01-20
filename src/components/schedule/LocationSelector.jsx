import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from 'lucide-react';

export default function LocationSelector({ locations, selectedLocation, onLocationChange }) {
  const activeLocations = locations.filter(l => l.status === 'active');

  return (
    <div className="flex items-center gap-2">
      <MapPin className="w-5 h-5 text-slate-600" />
      <Select value={selectedLocation} onValueChange={onLocationChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select location..." />
        </SelectTrigger>
        <SelectContent>
          {activeLocations.map(loc => (
            <SelectItem key={loc.id} value={loc.id}>
              {loc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}