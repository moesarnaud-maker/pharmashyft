import { base44 } from '@/api/base44Client';
import { differenceInWeeks, startOfWeek, addDays, addWeeks, format } from 'date-fns';

export async function generateShiftsForAssignment(assignment, template, weeks, days, weeksAhead = 12) {
  const shifts = [];
  const startDate = new Date(assignment.effective_start_date);
  const endDate = assignment.effective_end_date ? new Date(assignment.effective_end_date) : addWeeks(startDate, weeksAhead);
  
  const assignmentStart = startOfWeek(startDate, { weekStartsOn: 1 });
  
  for (let weekDate = startOfWeek(startDate, { weekStartsOn: 1 }); weekDate <= endDate; weekDate = addWeeks(weekDate, 1)) {
    const weeksSinceStart = differenceInWeeks(weekDate, assignmentStart);
    const rotationWeekIndex = (weeksSinceStart % template.rotation_length_weeks) + 1;
    
    const scheduleWeek = weeks.find(w => w.template_id === template.id && w.week_index === rotationWeekIndex);
    if (!scheduleWeek) continue;
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = addDays(weekDate, dayOffset);
      if (currentDate < startDate || currentDate > endDate) continue;
      
      const weekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayOffset];
      const scheduleDay = days.find(d => d.schedule_week_id === scheduleWeek.id && d.weekday === weekday);
      
      if (scheduleDay && scheduleDay.is_working_day) {
        shifts.push({
          employee_id: assignment.employee_id,
          date: format(currentDate, 'yyyy-MM-dd'),
          start_time: scheduleDay.start_time,
          end_time: scheduleDay.end_time,
          break_minutes: scheduleDay.break_minutes || 30,
          expected_hours: scheduleDay.expected_hours,
          location_id: scheduleDay.location_id,
          source: 'template',
          template_assignment_id: assignment.id,
          status: 'draft',
        });
      }
    }
  }
  
  return shifts;
}

export async function regenerateShiftsForEmployee(employeeId) {
  // Get active assignment
  const assignments = await base44.entities.EmployeeScheduleAssignment.filter({ employee_id: employeeId });
  const activeAssignment = assignments.find(a => !a.effective_end_date);
  
  if (!activeAssignment) return { created: 0 };
  
  const template = await base44.entities.ScheduleTemplate.filter({ id: activeAssignment.template_id });
  const weeks = await base44.entities.ScheduleWeek.filter({ template_id: activeAssignment.template_id });
  const days = await base44.entities.ScheduleDay.list();
  
  // Delete existing draft template shifts
  const existingShifts = await base44.entities.ScheduledShift.filter({ 
    employee_id: employeeId, 
    status: 'draft',
    source: 'template'
  });
  
  for (const shift of existingShifts) {
    await base44.entities.ScheduledShift.delete(shift.id);
  }
  
  // Generate new shifts
  const shifts = await generateShiftsForAssignment(activeAssignment, template[0], weeks, days);
  
  if (shifts.length > 0) {
    await base44.entities.ScheduledShift.bulkCreate(shifts);
  }
  
  return { created: shifts.length };
}