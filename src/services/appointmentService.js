/**
 * Appointment Service - Business logic for appointment booking and management
 * Handles slot validation, booking creation, and appointment retrieval
 */

const { Appointment, Lead, Contact, Conversation, createBooking } = require('../db');
const { getSlotsForRequestedDate, isSlotAvailable } = require('../slots');
const { formatDateTime } = require('../nlpExtractor');

/**
 * Get available slots based on requested date
 */
function getAvailableSlots(requestedDate = null, count = 3) {
  const slots = getSlotsForRequestedDate(requestedDate, count);
  
  // Filter out slots that are in the past
  return slots.filter(slot => isSlotAvailable(slot.date));
}

/**
 * Validate a slot before booking
 */
function validateSlot(slotData) {
  if (!slotData || !slotData.date) {
    throw new Error('Invalid slot data');
  }
  
  const slotDate = new Date(slotData.date);
  
  if (!isSlotAvailable(slotDate)) {
    throw new Error('Slot is not available (in the past)');
  }
  
  return true;
}

/**
 * Book an appointment with full transaction
 * Creates Contact, Lead, Conversation, and Appointment
 */
function bookAppointment(bookingData) {
  const {
    name,
    email,
    phone,
    requirement,
    leadStatus,
    priority,
    message,
    slotDate
  } = bookingData;
  
  // Validate required fields
  if (!name) {
    throw new Error('Name is required');
  }
  
  if (!requirement) {
    throw new Error('Requirement is required');
  }
  
  if (!slotDate) {
    throw new Error('Slot date is required');
  }
  
  // Validate slot
  validateSlot({ date: slotDate });
  
  // Create booking with transaction
  const result = createBooking(
    {
      name,
      email: email || null,
      phone: phone || null
    },
    {
      requirement,
      status: leadStatus || 'NEW',
      priority: priority || 'MEDIUM'
    },
    {
      message: message || '',
      direction: 'INBOUND'
    },
    {
      scheduledAt: slotDate,
      status: 'SCHEDULED'
    }
  );
  
  if (!result.success) {
    throw new Error('Failed to create booking: ' + result.error);
  }
  
  return result;
}

/**
 * Get all appointments with contact and lead information
 */
function getAllAppointments() {
  const appointments = Appointment.getAll();
  const contacts = Contact.getAll();
  const leads = Lead.getAll();
  
  return appointments.map(appointment => {
    const contact = contacts.find(c => c.id === appointment.contactId);
    const lead = leads.find(l => l.id === appointment.leadId);
    
    return {
      ...appointment,
      contact,
      lead
    };
  });
}

/**
 * Get appointment by ID with full details
 */
function getAppointmentById(id) {
  const appointment = Appointment.getById(id);
  
  if (!appointment) {
    return null;
  }
  
  const contact = Contact.getById(appointment.contactId);
  const lead = Lead.getById(appointment.leadId);
  
  return {
    ...appointment,
    contact,
    lead
  };
}

/**
 * Update appointment status
 */
function updateAppointmentStatus(id, status) {
  const validStatuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  return Appointment.update(id, { status });
}

/**
 * Get appointments by status
 */
function getAppointmentsByStatus(status) {
  const appointments = Appointment.getAll().filter(a => a.status === status);
  const contacts = Contact.getAll();
  const leads = Lead.getAll();
  
  return appointments.map(appointment => {
    const contact = contacts.find(c => c.id === appointment.contactId);
    const lead = leads.find(l => l.id === appointment.leadId);
    
    return {
      ...appointment,
      contact,
      lead
    };
  });
}

/**
 * Get appointment statistics
 */
function getAppointmentStats() {
  return Appointment.getStats();
}

/**
 * Format appointment for display
 */
function formatAppointmentForDisplay(appointment) {
  return {
    id: appointment.id,
    contactName: appointment.contact?.name || 'Unknown',
    requirement: appointment.lead?.requirement || 'N/A',
    scheduledAt: formatDateTime(appointment.scheduledAt),
    status: appointment.status,
    createdAt: formatDateTime(appointment.createdAt)
  };
}

module.exports = {
  getAvailableSlots,
  validateSlot,
  bookAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAppointmentsByStatus,
  getAppointmentStats,
  formatAppointmentForDisplay
};
