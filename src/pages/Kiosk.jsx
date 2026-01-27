import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Clock, Play, Square, Coffee, Loader2, Delete, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatUserName } from '@/components/utils/helpers';

export default function Kiosk() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pin, setPin] = useState('');
  const [employee, setEmployee] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: todayEntries = [] } = useQuery({
    queryKey: ['todayEntries', employee?.id, format(new Date(), 'yyyy-MM-dd')],
    queryFn: () => base44.entities.TimeEntry.filter({ 
      employee_id: employee?.id, 
      date: format(new Date(), 'yyyy-MM-dd') 
    }),
    enabled: !!employee?.id,
  });

  const currentWorkEntry = todayEntries.find(e => e.entry_type === 'work' && !e.end_time);
  const currentBreak = todayEntries.find(e => e.entry_type === 'break' && !e.end_time);
  const isClockedIn = !!currentWorkEntry;
  const isOnBreak = !!currentBreak;

  const handlePinEntry = (digit) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handleClear = () => {
    setPin('');
    setEmployee(null);
    setShowConfirmation(null);
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === 4) {
      const found = employees.find(e => e.pin_code === pin);
      if (found) {
        setEmployee(found);
      } else {
        toast.error('Invalid PIN');
        setPin('');
      }
    }
  }, [pin, employees]);

  const clockMutation = useMutation({
    mutationFn: async (action) => {
      const now = new Date().toISOString();
      
      if (action === 'clock_in') {
        await base44.entities.TimeEntry.create({
          employee_id: employee.id,
          user_id: employee.user_id,
          start_time: now,
          entry_type: 'work',
          source: 'kiosk',
          date: format(new Date(), 'yyyy-MM-dd'),
        });
      } else if (action === 'clock_out') {
        const durationMins = Math.round((new Date() - new Date(currentWorkEntry.start_time)) / 60000);
        await base44.entities.TimeEntry.update(currentWorkEntry.id, {
          end_time: now,
          duration_minutes: durationMins,
        });
      } else if (action === 'start_break') {
        await base44.entities.TimeEntry.create({
          employee_id: employee.id,
          user_id: employee.user_id,
          start_time: now,
          entry_type: 'break',
          source: 'kiosk',
          date: format(new Date(), 'yyyy-MM-dd'),
        });
      } else if (action === 'end_break') {
        const durationMins = Math.round((new Date() - new Date(currentBreak.start_time)) / 60000);
        await base44.entities.TimeEntry.update(currentBreak.id, {
          end_time: now,
          duration_minutes: durationMins,
        });
      }
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['todayEntries'] });
      setShowConfirmation(action);
      setTimeout(() => {
        setShowConfirmation(null);
        if (action === 'clock_out') {
          handleClear();
        }
      }, 2000);
    },
  });

  const getEmployeeName = () => {
    const u = users.find(u => u.id === employee?.user_id);
    return formatUserName(u) || 'Employee';
  };

  const confirmationMessages = {
    clock_in: 'Clocked In Successfully!',
    clock_out: 'Clocked Out - Goodbye!',
    start_break: 'Break Started',
    end_break: 'Welcome Back!',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Header with time */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center text-white">
            <div className="text-6xl font-light tracking-tight">
              {format(currentTime, 'HH:mm')}
            </div>
            <div className="text-blue-100 mt-2">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {showConfirmation ? (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-12 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{confirmationMessages[showConfirmation]}</h2>
                <p className="text-slate-500 mt-2">{getEmployeeName()}</p>
              </motion.div>
            ) : !employee ? (
              <motion.div
                key="pin-entry"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8"
              >
                <h2 className="text-xl font-semibold text-center text-slate-800 mb-6">
                  Enter your PIN
                </h2>
                
                {/* PIN display */}
                <div className="flex justify-center gap-3 mb-8">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                        pin.length > i 
                          ? 'border-blue-500 bg-blue-50 text-blue-600' 
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      {pin.length > i ? '•' : ''}
                    </div>
                  ))}
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <Button
                      key={num}
                      variant="outline"
                      size="lg"
                      className="h-16 text-2xl font-medium"
                      onClick={() => handlePinEntry(String(num))}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16"
                    onClick={handleClear}
                  >
                    <XCircle className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 text-2xl font-medium"
                    onClick={() => handlePinEntry('0')}
                  >
                    0
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16"
                    onClick={handleDelete}
                  >
                    <Delete className="w-6 h-6" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                    {getEmployeeName().charAt(0)}
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">{getEmployeeName()}</h2>
                  <p className="text-slate-500">{employee.employee_number}</p>
                </div>

                <div className="space-y-3">
                  {!isClockedIn ? (
                    <Button
                      size="lg"
                      className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => clockMutation.mutate('clock_in')}
                      disabled={clockMutation.isPending}
                    >
                      {clockMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Clock In
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      {!isOnBreak ? (
                        <>
                          <Button
                            size="lg"
                            variant="outline"
                            className="w-full h-14 text-lg border-amber-300 text-amber-700 hover:bg-amber-50"
                            onClick={() => clockMutation.mutate('start_break')}
                            disabled={clockMutation.isPending}
                          >
                            <Coffee className="w-5 h-5 mr-2" />
                            Start Break
                          </Button>
                          <Button
                            size="lg"
                            className="w-full h-14 text-lg bg-red-600 hover:bg-red-700"
                            onClick={() => clockMutation.mutate('clock_out')}
                            disabled={clockMutation.isPending}
                          >
                            <Square className="w-5 h-5 mr-2" />
                            Clock Out
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="lg"
                          className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => clockMutation.mutate('end_break')}
                          disabled={clockMutation.isPending}
                        >
                          <Play className="w-5 h-5 mr-2" />
                          End Break
                        </Button>
                      )}
                    </>
                  )}
                </div>

                <Button
                  variant="ghost"
                  className="w-full mt-4 text-slate-500"
                  onClick={handleClear}
                >
                  Cancel
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}