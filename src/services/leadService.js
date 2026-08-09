/**
 * Lead Service - Business logic for lead management
 * Handles lead creation, updates, and retrieval with proper validation
 */

const { Lead, Contact } = require('../db');
const { extractLead, formatDate, formatDateTime } = require('../nlpExtractor');

/**
 * Analyze a customer message and extract lead information
 */
function analyzeMessage(message) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Message is required and cannot be empty');
  }
  
  try {
    const extracted = extractLead(message);
    
    return {
      success: true,
      data: extracted
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all leads with contact information
 */
function getAllLeads() {
  const leads = Lead.getAll();
  const contacts = Contact.getAll();
  
  return leads.map(lead => {
    const contact = contacts.find(c => c.id === lead.contactId);
    return {
      ...lead,
      contact
    };
  });
}

/**
 * Get lead by ID with full details
 */
function getLeadById(id) {
  const lead = Lead.getById(id);
  
  if (!lead) {
    return null;
  }
  
  const contact = Contact.getById(lead.contactId);
  
  return {
    ...lead,
    contact
  };
}

/**
 * Get leads by status
 */
function getLeadsByStatus(status) {
  const leads = Lead.getAll().filter(l => l.status === status);
  const contacts = Contact.getAll();
  
  return leads.map(lead => {
    const contact = contacts.find(c => c.id === lead.contactId);
    return {
      ...lead,
      contact
    };
  });
}

/**
 * Update lead status
 */
function updateLeadStatus(id, status) {
  const validStatuses = ['NEW', 'INTERESTED', 'QUALIFIED', 'MEETING_REQUESTED', 'CONVERTED', 'LOST'];
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  return Lead.update(id, { status });
}

/**
 * Update lead priority
 */
function updateLeadPriority(id, priority) {
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'HOT'];
  
  if (!validPriorities.includes(priority)) {
    throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
  }
  
  return Lead.update(id, { priority });
}

/**
 * Get lead statistics
 */
function getLeadStats() {
  return Lead.getStats();
}

/**
 * Format lead for display
 */
function formatLeadForDisplay(lead) {
  return {
    id: lead.id,
    name: lead.contact?.name || 'Unknown',
    requirement: lead.requirement,
    status: lead.status,
    priority: lead.priority,
    createdAt: formatDate(lead.createdAt),
    contact: lead.contact
  };
}

module.exports = {
  analyzeMessage,
  getAllLeads,
  getLeadById,
  getLeadsByStatus,
  updateLeadStatus,
  updateLeadPriority,
  getLeadStats,
  formatLeadForDisplay
};
