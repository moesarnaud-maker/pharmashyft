import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, Shield, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        
        if (u) {
          const employees = await base44.entities.Employee.filter({ user_id: u.id });
          if (employees.length > 0) {
            setEmployee(employees[0]);
          }
        }
      } catch (err) {
        console.log('Not authenticated');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // If not logged in, show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full mb-8">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-medium">TimeTrack Pro</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Employee Time<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Management
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
              Streamline your workforce time tracking with our comprehensive solution. 
              Clock in/out, manage timesheets, request absences, and more.
            </p>
            <Button 
              onClick={() => base44.auth.redirectToLogin()}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 h-auto"
            >
              Sign In
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mt-24"
          >
            {[
              {
                icon: Clock,
                title: 'Time Tracking',
                description: 'Easy clock in/out with break tracking and location capture'
              },
              {
                icon: Users,
                title: 'Team Management',
                description: 'Manage teams, approve timesheets, and track attendance'
              },
              {
                icon: Shield,
                title: 'Compliance Ready',
                description: 'GDPR compliant with full audit trail and export capabilities'
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // Determine user's role and redirect accordingly
  const isAdmin = user.role === 'admin';
  const isManager = employee?.manager_id === null && isAdmin; // Simplified manager check

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Welcome back, {user.first_name || 'there'}!
          </h1>
          <p className="text-slate-500">Choose where you'd like to go</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link to={createPageUrl('EmployeeDashboard')}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="mb-2">Time Clock</CardTitle>
                <CardDescription>
                  Clock in/out, view your timesheet, and manage absence requests
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          {isAdmin && (
            <Link to={createPageUrl('ManagerDashboard')}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="mb-2">Manager Portal</CardTitle>
                  <CardDescription>
                    Approve timesheets, manage your team, and review requests
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}

          {isAdmin && (
            <Link to={createPageUrl('AdminDashboard')}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="mb-2">Admin Panel</CardTitle>
                  <CardDescription>
                    User management, settings, exports, and audit logs
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {employee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-4 bg-white rounded-xl shadow-sm text-center text-sm text-slate-500"
          >
            Employee #{employee.employee_number} • {employee.contract_hours_week}h/week contract
          </motion.div>
        )}
      </div>
    </div>
  );
}