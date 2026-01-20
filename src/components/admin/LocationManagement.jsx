import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';

export default function LocationManagement({ locations = [] }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    status: 'active',
    notes: '',
  });

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
    setFormData({ name: '', address: '', status: 'active', notes: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Locations</h2>
          <p className="text-slate-500">Manage work locations</p>
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
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map(location => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell className="text-slate-600">{location.address || '-'}</TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit' : 'Add'} Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Main Office"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, Brussels"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!formData.name}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}