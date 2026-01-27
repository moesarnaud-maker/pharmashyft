import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send } from 'lucide-react';
import { formatUserName } from '@/components/utils/helpers';

export default function PublishScheduleDialog({ 
  open, 
  onClose, 
  draftShifts = [],
  currentUser 
}) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  const publishMutation = useMutation({
    mutationFn: async () => {
      // Create publish batch
      const affectedEmployees = [...new Set(draftShifts.map(s => s.employee_id))];
      
      const batch = await base44.entities.SchedulePublishBatch.create({
        published_by: currentUser.id,
        published_at: new Date().toISOString(),
        shifts_count: draftShifts.length,
        notes,
        affected_employees: JSON.stringify(affectedEmployees),
      });

      // Update all draft shifts to published
      for (const shift of draftShifts) {
        await base44.entities.ScheduledShift.update(shift.id, {
          status: 'published',
          publish_batch_id: batch.id,
        });
      }

      // Audit log
      await base44.entities.AuditLog.create({
        actor_id: currentUser.id,
        actor_email: currentUser.email,
        actor_name: formatUserName(currentUser),
        action: 'approve',
        entity_type: 'SchedulePublishBatch',
        entity_id: batch.id,
        entity_description: `Published ${draftShifts.length} shifts affecting ${affectedEmployees.length} employees`,
        after_data: JSON.stringify({ batch_id: batch.id, shifts_count: draftShifts.length }),
      });

      return { affectedEmployees };
    },
    onSuccess: ({ affectedEmployees }) => {
      toast.success(`Published ${draftShifts.length} shifts to ${affectedEmployees.length} employees`);
      queryClient.invalidateQueries({ queryKey: ['scheduledShifts'] });
      queryClient.invalidateQueries({ queryKey: ['schedulePublishBatches'] });
      onClose();
      setNotes('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Schedule Changes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              You are about to publish <strong>{draftShifts.length} draft shifts</strong>.
            </p>
            <p className="text-sm text-blue-700 mt-2">
              Affected employees: {[...new Set(draftShifts.map(s => s.employee_id))].length}
            </p>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the changes being published..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
            <Send className="w-4 h-4 mr-2" />
            {publishMutation.isPending ? 'Publishing...' : 'Publish & Notify'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}