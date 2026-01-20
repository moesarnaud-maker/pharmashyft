import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'blue',
  delay = 0 
}) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    slate: 'from-slate-500 to-slate-600',
  };

  const lightColorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-50 text-slate-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
    >
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
              {subtitle && (
                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
              )}
              {trend && (
                <div className={`inline-flex items-center mt-3 text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${lightColorMap[color]}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}