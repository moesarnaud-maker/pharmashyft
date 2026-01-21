import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { MapPin, Plus, Edit, Trash2, Search, Map } from 'lucide-react';

export default function LocationManagement({ locations = [] }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: null,
    longitude: null,
    status: 'active',
    notes: '',
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const addressInputRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAO_T6vs2kv7kz4Oizp-nxu-EtD4qu5EbM&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize autocomplete when dialog opens
  useEffect(() => {
    if (!showDialog || !mapLoaded || !addressInputRef.current || autocomplete) return;

    const autoCompleteInstance = new window.google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        types: ['address', 'establishment'],
        fields: ['formatted_address', 'geometry', 'name', 'address_components']
      }
    );

    autoCompleteInstance.addListener('place_changed', () => {
      const place = autoCompleteInstance.getPlace();
      
      if (!place.geometry) {
        toast.error('No details available for this location');
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setFormData(prev => ({
        ...prev,
        address: place.formatted_address || '',
        latitude: lat,
        longitude: lng,
        name: prev.name || place.name || ''
      }));

      if (showMap && mapRef.current) {
        const position = { lat, lng };
        mapRef.current.setCenter(position);
        
        if (markerRef.current) {
          markerRef.current.setPosition(position);
        } else {
          markerRef.current = new window.google.maps.Marker({
            position,
            map: mapRef.current,
            draggable: true
          });

          markerRef.current.addListener('dragend', (e) => {
            setFormData(prev => ({
              ...prev,
              latitude: e.latLng.lat(),
              longitude: e.latLng.lng()
            }));
          });
        }
      }
    });

    setAutocomplete(autoCompleteInstance);
  }, [showDialog, mapLoaded, autocomplete, showMap]);

  // Initialize map
  useEffect(() => {
    if (!showMap || !mapLoaded || !document.getElementById('location-map')) return;

    const initialPosition = formData.latitude && formData.longitude
      ? { lat: formData.latitude, lng: formData.longitude }
      : { lat: 50.8503, lng: 4.3517 }; // Brussels default

    const map = new window.google.maps.Map(document.getElementById('location-map'), {
      center: initialPosition,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
    });

    mapRef.current = map;

    if (formData.latitude && formData.longitude) {
      markerRef.current = new window.google.maps.Marker({
        position: initialPosition,
        map,
        draggable: true
      });

      markerRef.current.addListener('dragend', (e) => {
        setFormData(prev => ({
          ...prev,
          latitude: e.latLng.lat(),
          longitude: e.latLng.lng()
        }));
      });
    }
  }, [showMap, mapLoaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingLocation) {
        await base44.entities.Location.update(editingLocation.id, formData);
      } else {
        await base44.entities.Location.create(formData);
      }
    },
    onSuccess: () => {
      toast.success(editingLocation ? 'Location updated' : 'Location created');
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Location.delete(id);
    },
    onSuccess: () => {
      toast.success('Location deleted');
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData(location);
    setShowDialog(true);
  };

  const handleClose = () => {
    setShowDialog(false);
    setEditingLocation(null);
    setShowMap(false);
    setFormData({ name: '', address: '', latitude: null, longitude: null, status: 'active', notes: '' });
    setAutocomplete(null);
    mapRef.current = null;
    markerRef.current = null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Locations</h2>
          <p className="text-slate-500">Manage work locations with Google Maps</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map(location => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell className="text-slate-600">{location.address || '-'}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {location.latitude && location.longitude 
                      ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={location.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                      {location.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(location)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(location.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {locations.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No locations yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {editingLocation ? 'Edit' : 'Add'} Location
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Location Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Main Office"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Address *
              </Label>
              <Input
                ref={addressInputRef}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Start typing to search..."
                className="mb-2"
              />
              <p className="text-xs text-slate-500">
                {mapLoaded 
                  ? 'Type to search with Google Maps autocomplete' 
                  : 'Loading Google Maps...'}
              </p>
            </div>

            {formData.latitude && formData.longitude && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Coordinates Saved</p>
                    <p className="text-xs text-blue-700">
                      {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                  >
                    <Map className="w-4 h-4 mr-2" />
                    {showMap ? 'Hide' : 'Show'} Map
                  </Button>
                </div>
              </div>
            )}

            {showMap && (
              <div className="border rounded-lg overflow-hidden">
                <div id="location-map" className="w-full h-64"></div>
                <div className="bg-slate-50 p-2 text-xs text-slate-600 text-center">
                  Drag the marker to adjust the exact location
                </div>
              </div>
            )}

            <div>
              <Label>Notes (Optional)</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information about this location"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button 
              onClick={() => saveMutation.mutate()} 
              disabled={!formData.name || !formData.address}
            >
              Save Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}