/**
 * NLP Extractor - Rule-based natural language processing for lead extraction
 * This module uses local pattern matching to extract structured data from customer messages
 * No external APIs or paid services are used
 */

// Lead status constants
const LEAD_STATUSES = {
  NEW: 'NEW',
  INTERESTED: 'INTERESTED',
  QUALIFIED: 'QUALIFIED',
  MEETING_REQUESTED: 'MEETING_REQUESTED',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST'
};

// Priority constants
const PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  HOT: 'HOT'
};

// Patterns for name extraction
const NAME_PATTERNS = [
  /(?:I'm|I am|my name is|this is|calling from|hi|hello|hey)[\s,]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  /(?:I'm|I am|my name is|this is)[\s,]+([A-Z][a-z]+)/i,
  /(?:this is|calling from)[\s,]+([A-Z][a-z]+)/i,
  /(?:hi|hello|hey)[\s,]+([A-Z][a-z]+)/i
];

// Patterns for requirement extraction
const REQUIREMENT_PATTERNS = [
  /(?:need|want|looking for|interested in|require|interested)\s+(?:an?\s+)?(.+?)(?:\s+(?:and|to|for|would|like|schedule|meeting))/i,
  /(?:need|want|looking for|interested in|require)\s+(.+)/i,
  /(?:about|regarding)\s+(.+)/i
];

// Patterns for meeting request detection
const MEETING_PATTERNS = [
  /schedule\s+(?:a\s+)?meeting/i,
  /book\s+(?:a\s+)?meeting/i,
  /set\s+(?:up\s+)?(?:a\s+)?meeting/i,
  /arrange\s+(?:a\s+)?meeting/i,
  /would\s+like\s+to\s+meet/i,
  /want\s+to\s+meet/i,
  /meeting\s+(?:tomorrow|today|next\s+week|on\s+\w+)/i
];

// Patterns for interest detection
const INTEREST_PATTERNS = [
  /interested\s+in/i,
  /want\s+to\s+know\s+more/i,
  /tell\s+me\s+more/i,
  /learn\s+about/i,
  /considering/i
];

// Urgency indicators for priority
const URGENCY_PATTERNS = {
  HOT: [
    /urgent/i,
    /asap/i,
    /immediately/i,
    /right\s+now/i,
    /emergency/i,
    /critical/i
  ],
  HIGH: [
    /soon/i,
    /quickly/i,
    /this\s+week/i,
    /today/i,
    /tomorrow/i
  ],
  MEDIUM: [
    /next\s+week/i,
    /upcoming/i
  ]
};

// Month names for date parsing
const MONTHS = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

/**
 * Extract name from message
 */
function extractName(message) {
  for (const pattern of NAME_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      // Clean up the name - remove trailing punctuation and extra words
      let name = match[1].trim();
      name = name.replace(/[.,!?:;]$/, '');
      // Take only the first two words as name (first and last)
      const words = name.split(/\s+/);
      if (words.length > 2) {
        name = words.slice(0, 2).join(' ');
      }
      // Capitalize properly
      return name.split(/\s+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
  }
  return null;
}

/**
 * Extract requirement from message
 */
function extractRequirement(message) {
  for (const pattern of REQUIREMENT_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let requirement = match[1].trim();
      // Clean up
      requirement = requirement.replace(/[.,!?:;]$/, '');
      // Capitalize first letter
      return requirement.charAt(0).toUpperCase() + requirement.slice(1).toLowerCase();
    }
  }
  
  // Fallback: look for common product/service keywords
  const keywords = [
    'AI calling', 'voice automation', 'speech recognition', 'CRM',
    'customer service', 'call center', 'phone system', 'automation'
  ];
  
  for (const keyword of keywords) {
    if (message.toLowerCase().includes(keyword.toLowerCase())) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }
  
  return 'General inquiry';
}

/**
 * Detect if meeting is requested
 */
function detectMeetingRequest(message) {
  for (const pattern of MEETING_PATTERNS) {
    if (pattern.test(message)) {
      return true;
    }
  }
  return false;
}

/**
 * Detect interest level
 */
function detectInterest(message) {
  for (const pattern of INTEREST_PATTERNS) {
    if (pattern.test(message)) {
      return true;
    }
  }
  return false;
}

/**
 * Determine priority based on urgency
 */
function determinePriority(message) {
  const lowerMessage = message.toLowerCase();
  
  // Check HOT patterns first
  for (const pattern of URGENCY_PATTERNS.HOT) {
    if (pattern.test(lowerMessage)) {
      return PRIORITIES.HOT;
    }
  }
  
  // Check HIGH patterns
  for (const pattern of URGENCY_PATTERNS.HIGH) {
    if (pattern.test(lowerMessage)) {
      return PRIORITIES.HIGH;
    }
  }
  
  // Check MEDIUM patterns
  for (const pattern of URGENCY_PATTERNS.MEDIUM) {
    if (pattern.test(lowerMessage)) {
      return PRIORITIES.MEDIUM;
    }
  }
  
  // Default to MEDIUM
  return PRIORITIES.MEDIUM;
}

/**
 * Parse date from message
 * Handles: "tomorrow", "today", specific dates like "12 August", "August 12", etc.
 */
function parseDate(message) {
  const lowerMessage = message.toLowerCase();
  
  // Tomorrow
  if (lowerMessage.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  // Today
  if (lowerMessage.includes('today')) {
    return new Date();
  }
  
  // Next week
  if (lowerMessage.includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }
  
  // Specific date patterns: "12 August", "August 12", "12th August", etc.
  const datePattern = /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
  const datePattern2 = /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?/i;
  
  let match = message.match(datePattern);
  if (!match) {
    match = message.match(datePattern2);
  }
  
  if (match) {
    let day, month;
    
    if (match[2] && isNaN(match[2])) {
      // Pattern 1: day month
      day = parseInt(match[1]);
      month = MONTHS[match[2].toLowerCase()];
    } else {
      // Pattern 2: month day
      month = MONTHS[match[1].toLowerCase()];
      day = parseInt(match[2]);
    }
    
    if (month !== undefined && !isNaN(day)) {
      const year = new Date().getFullYear();
      const date = new Date(year, month, day);
      
      // If the date has already passed this year, assume next year
      if (date < new Date()) {
        date.setFullYear(year + 1);
      }
      
      return date;
    }
  }
  
  // Day of week: "Monday", "Tuesday", etc.
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (lowerMessage.includes(days[i])) {
      const today = new Date();
      const currentDay = today.getDay();
      const targetDay = i;
      
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) {
        daysUntil += 7; // Next week
      }
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntil);
      return targetDate;
    }
  }
  
  return null;
}

/**
 * Determine lead status based on message content
 */
function determineLeadStatus(message, meetingRequested) {
  if (meetingRequested) {
    return LEAD_STATUSES.MEETING_REQUESTED;
  }
  
  if (detectInterest(message)) {
    return LEAD_STATUSES.INTERESTED;
  }
  
  // Default to NEW for first contact
  return LEAD_STATUSES.NEW;
}

/**
 * Main extraction function
 * Analyzes customer message and extracts structured lead information
 */
function extractLead(message) {
  if (!message || typeof message !== 'string') {
    throw new Error('Invalid message provided');
  }
  
  const name = extractName(message);
  const requirement = extractRequirement(message);
  const meetingRequested = detectMeetingRequest(message);
  const requestedDate = parseDate(message);
  const priority = determinePriority(message);
  const leadStatus = determineLeadStatus(message, meetingRequested);
  
  return {
    name,
    requirement,
    leadStatus,
    priority,
    meetingRequested,
    requestedDate: requestedDate ? requestedDate.toISOString() : null
  };
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format date and time for display
 */
function formatDateTime(dateString) {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  const dateOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const timeOptions = { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  };
  
  return `${date.toLocaleDateString('en-US', dateOptions)} — ${date.toLocaleTimeString('en-US', timeOptions)}`;
}

module.exports = {
  extractLead,
  formatDate,
  formatDateTime,
  LEAD_STATUSES,
  PRIORITIES
};
