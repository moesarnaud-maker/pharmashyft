import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { Check, X, Clock, Calendar, User, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const typeConfig = {
  timesheet: { icon: Clock, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  absence: { icon: Calendar, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  correction: { icon: FileText, color: 'bg-amber-50 text-amber-600 border-amber-200' },
};

export default function ApprovalCard({ 
  type, 
  title, 
  subtitle, 
  employeeName, 
  submittedAt, 
  details, 
  onApprove, 
  onReject,
  isLoading 
}) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const config = typeConfig[type] || typeConfig.timesheet;
  const TypeIcon = config.icon;

  const handleReject = () => {
    if (showRejectReason) {
      onReject(rejectReason);
      setShowRejectReason(false);
      setRejectReason('');
    } else {
      setShowRejectReason(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${config.color}`}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {employeeName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(submittedAt), 'MMM d, HH:mm')}
                  </span>
                </div>
                {details && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                    {details}
                  </div>
                )}
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
          </div>

          {showRejectReason && (
            <div className="mt-4 pt-4 border-t">
              <Textarea
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mb-3"
                rows={2}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={isLoading}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              {showRejectReason ? 'Confirm Reject' : 'Reject'}
            </Button>
            {showRejectReason && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRejectReason(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}