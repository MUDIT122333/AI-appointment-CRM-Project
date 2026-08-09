/**
 * Slots Service - Generate and manage meeting time slots
 * Handles dynamic date generation based on customer requests
 */

/**
 * Generate time slots for a specific date
 * @param {Date|string} date - The date to generate slots for
 * @param {number} count - Number of slots to generate (default: 3)
 * @returns {Array} Array of slot objects
 */
function generateSlots(date, count = 3) {
  const targetDate = typeof date === 'string' ? new Date(date) : new Date(date);
  
  // Default slot times (in hours from midnight)
  const defaultSlots = [10, 13.5, 16]; // 10:00 AM, 1:30 PM, 4:00 PM
  
  const slots = [];
  
  for (let i = 0; i < count && i < defaultSlots.length; i++) {
    const slotDate = new Date(targetDate);
    const hours = Math.floor(defaultSlots[i]);
    const minutes = (defaultSlots[i] - hours) * 60;
    
    slotDate.setHours(hours, minutes, 0, 0);
    
    slots.push({
      id: `slot-${Date.now()}-${i}`,
      date: slotDate.toISOString(),
      time: formatTime(slotDate),
      displayDate: formatDate(slotDate),
      displayDateTime: formatDateTime(slotDate)
    });
  }
  
  return slots;
}

/**
 * Generate slots for tomorrow
 */
function generateTomorrowSlots(count = 3) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return generateSlots(tomorrow, count);
}

/**
 * Generate slots for today
 */
function generateTodaySlots(count = 3) {
  const today = new Date();
  return generateSlots(today, count);
}

/**
 * Generate slots for next week
 */
function generateNextWeekSlots(count = 3) {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  return generateSlots(nextWeek, count);
}

/**
 * Generate default slots (tomorrow)
 */
function generateDefaultSlots(count = 3) {
  return generateTomorrowSlots(count);
}

/**
 * Format time for display
 */
function formatTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Format date for display
 */
function formatDate(date) {
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
function formatDateTime(date) {
  return `${formatDate(date)}\n${formatTime(date)}`;
}

/**
 * Validate if a slot is still available (in the future)
 */
function isSlotAvailable(slotDate) {
  const now = new Date();
  const slot = new Date(slotDate);
  return slot > now;
}

/**
 * Get slots based on requested date from NLP extraction
 * @param {string|null} requestedDate - ISO date string from NLP extractor
 * @param {number} count - Number of slots to generate
 */
function getSlotsForRequestedDate(requestedDate, count = 3) {
  if (!requestedDate) {
    return generateDefaultSlots(count);
  }
  
  try {
    const date = new Date(requestedDate);
    
    // If the requested date is in the past, use tomorrow instead
    if (date < new Date()) {
      return generateTomorrowSlots(count);
    }
    
    return generateSlots(date, count);
  } catch (error) {
    console.error('Error parsing requested date:', error);
    return generateDefaultSlots(count);
  }
}

module.exports = {
  generateSlots,
  generateTomorrowSlots,
  generateTodaySlots,
  generateNextWeekSlots,
  generateDefaultSlots,
  getSlotsForRequestedDate,
  isSlotAvailable,
  formatTime,
  formatDate,
  formatDateTime
};
