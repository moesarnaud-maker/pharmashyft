// Timing constants
export const REFETCH_INTERVALS = {
  TIME_ENTRIES: 30000,    // 30 seconds
  SCHEDULE: 60000,        // 1 minute  
  DASHBOARD: 120000,      // 2 minutes
  NOTIFICATIONS: 180000,  // 3 minutes
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_RECENT_ITEMS: 10,
  ITEMS_PER_PAGE: 20,
};

// Status variants
export const STATUS_VARIANTS = {
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
  submitted: 'bg-blue-100 text-blue-700',
  draft: 'bg-slate-100 text-slate-700',
  locked: 'bg-purple-100 text-purple-700',
};

// Timesheet status
export const TIMESHEET_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  LOCKED: 'locked',
};

// Work entry types
export const ENTRY_TYPES = {
  WORK: 'work',
  BREAK: 'break',
};

// Absence types
export const ABSENCE_TYPES = {
  VACATION: 'vacation',
  SICK: 'sick',
  UNPAID: 'unpaid',
  TRAINING: 'training',
};