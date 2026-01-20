import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Coffee, Square, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function ClockWidget({ 
  currentEntry, 
  isOnBreak, 
  onClockIn, 
  onClockOut, 
  onStartBreak, 
  onEndBreak,
  isLoading 
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (currentEntry?.start_time) {
        const start = new Date(currentEntry.start_time);
        const diff = new Date() - start;
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentEntry]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation(null)
      );
    }
  }, []);

  const isClockedIn = !!currentEntry && !currentEntry.end_time;

  const handleClockIn = () => {
    onClockIn(location);
  };

  const handleClockOut = () => {
    onClockOut(location);
  };

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800">
      <CardContent className="p-8">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <div className="text-5xl font-light text-white tracking-tight">
              {format(currentTime, 'HH:mm')}
            </div>
            <div className="text-slate-400 text-sm mt-1">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {isClockedIn ? (
              <motion.div
                key="clocked-in"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-center gap-2">
                  <Badge className={isOnBreak ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}>
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnBreak ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnBreak ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    </span>
                    {isOnBreak ? 'On Break' : 'Working'}
                  </Badge>
                </div>

                <div className="text-4xl font-mono text-white font-medium tracking-wider">
                  {elapsedTime}
                </div>

                <div className="flex items-center justify-center gap-3">
                  {!isOnBreak ? (
                    <>
                      <Button
                        onClick={onStartBreak}
                        disabled={isLoading}
                        variant="outline"
                        size="lg"
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                      >
                        <Coffee className="w-5 h-5 mr-2" />
                        Start Break
                      </Button>
                      <Button
                        onClick={handleClockOut}
                        disabled={isLoading}
                        size="lg"
                        className="bg-red-500 hover:bg-red-600 text-white min-w-[140px]"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                          <>
                            <Square className="w-5 h-5 mr-2" />
                            Clock Out
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={onEndBreak}
                      disabled={isLoading}
                      size="lg"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[160px]"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          End Break
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="clocked-out"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Badge className="bg-slate-700/50 text-slate-400 border-slate-600">
                  Not Clocked In
                </Badge>

                <Button
                  onClick={handleClockIn}
                  disabled={isLoading}
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-10 py-6 h-auto min-w-[180px]"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <Play className="w-6 h-6 mr-2" />
                      Clock In
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {location && (
            <div className="mt-6 flex items-center justify-center text-slate-500 text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              Location captured
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}