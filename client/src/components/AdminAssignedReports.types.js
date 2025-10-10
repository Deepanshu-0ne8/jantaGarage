import React from 'react';

const SEVERITY_ORDER = {
  'High': 1,
  'Medium': 2,
  'Low': 3,
};

const SEVERITY_OPTIONS = ['Low', 'Medium', 'High'];
const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'Resolved'];

const DEPARTMENT_OPTIONS = [
  "Water Supply & Sewage Department",
  "Public Health & Sanitation Department",
  "Roads & Infrastructure Department",
  "Street Lighting Department",
  "Parks & Horticulture Department",
  "Building & Construction Department",
  "Drainage Department",
  "Electricity Department",
  "Public Works Department",
  "Traffic & Transportation Department",
  "Solid Waste Management Department",
  "Animal Control Department",
  "Health & Hospital Services",
  "Fire & Emergency Services",
  "Environmental Department",
  "Revenue Department",
  "Urban Planning & Development Authority",
  "Public Grievance & Complaint Cell",
];

const labelize = (raw) => {
  if (!raw) return "";
  return String(raw)
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

// Helper to determine deadline chip class based on remaining days/time (Full Timestamp Check)
const getDeadlineClass = (deadlineDate, status) => {
    // FIX: If the report is resolved or closed, return no deadline class immediately.
    if (status === 'Resolved') {
        return '';
    }

    if (!deadlineDate) return 'deadline-none';

    const nowTime = new Date().getTime();
    const deadlineTime = new Date(deadlineDate).getTime();
    
    // 1. Check for Overdue status using full timestamp
    if (nowTime > deadlineTime) return 'deadline-overdue';

    const msInDay = 1000 * 60 * 60 * 24;
    const diffDays = (deadlineTime - nowTime) / msInDay;

    // 2. Check for critical/urgent status
    if (diffDays <= 1) return 'deadline-critical'; // Less than or equal to 1 day remaining
    if (diffDays <= 3) return 'deadline-urgent';   // Less than or equal to 3 days remaining
    return 'deadline-normal';
};

export { 
    SEVERITY_ORDER, 
    SEVERITY_OPTIONS, 
    STATUS_OPTIONS, 
    DEPARTMENT_OPTIONS, 
    labelize, 
    getDeadlineClass 
};
