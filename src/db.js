const fs = require('fs');
const path = require('path');

// Data directory
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database file paths
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');

// Initialize database files if they don't exist
function initializeDatabase() {
  if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(LEADS_FILE)) {
    fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(CONVERSATIONS_FILE)) {
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(APPOINTMENTS_FILE)) {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify([], null, 2));
  }
}

// Generic read function
function readData(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Generic write function
function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Contact operations
const Contact = {
  getAll: () => readData(CONTACTS_FILE),
  
  getById: (id) => {
    const contacts = readData(CONTACTS_FILE);
    return contacts.find(c => c.id === id);
  },
  
  findByName: (name) => {
    const contacts = readData(CONTACTS_FILE);
    return contacts.find(c => c.name.toLowerCase() === name.toLowerCase());
  },
  
  create: (data) => {
    const contacts = readData(CONTACTS_FILE);
    const contact = {
      id: generateId(),
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    contacts.push(contact);
    writeData(CONTACTS_FILE, contacts);
    return contact;
  },
  
  update: (id, data) => {
    const contacts = readData(CONTACTS_FILE);
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      contacts[index] = {
        ...contacts[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      writeData(CONTACTS_FILE, contacts);
      return contacts[index];
    }
    return null;
  }
};

// Lead operations
const Lead = {
  getAll: () => readData(LEADS_FILE),
  
  getById: (id) => {
    const leads = readData(LEADS_FILE);
    return leads.find(l => l.id === id);
  },
  
  getByContactId: (contactId) => {
    const leads = readData(LEADS_FILE);
    return leads.filter(l => l.contactId === contactId);
  },
  
  create: (data) => {
    const leads = readData(LEADS_FILE);
    const lead = {
      id: generateId(),
      contactId: data.contactId,
      requirement: data.requirement,
      status: data.status || 'NEW',
      priority: data.priority || 'MEDIUM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    leads.push(lead);
    writeData(LEADS_FILE, leads);
    return lead;
  },
  
  update: (id, data) => {
    const leads = readData(LEADS_FILE);
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      leads[index] = {
        ...leads[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      writeData(LEADS_FILE, leads);
      return leads[index];
    }
    return null;
  },
  
  getStats: () => {
    const leads = readData(LEADS_FILE);
    return {
      total: leads.length,
      new: leads.filter(l => l.status === 'NEW').length,
      qualified: leads.filter(l => l.status === 'QUALIFIED').length,
      meetingRequested: leads.filter(l => l.status === 'MEETING_REQUESTED').length,
      converted: leads.filter(l => l.status === 'CONVERTED').length,
      lost: leads.filter(l => l.status === 'LOST').length
    };
  }
};

// Conversation operations
const Conversation = {
  getAll: () => readData(CONVERSATIONS_FILE),
  
  getById: (id) => {
    const conversations = readData(CONVERSATIONS_FILE);
    return conversations.find(c => c.id === id);
  },
  
  getByContactId: (contactId) => {
    const conversations = readData(CONVERSATIONS_FILE);
    return conversations.filter(c => c.contactId === contactId).sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
  },
  
  getByLeadId: (leadId) => {
    const conversations = readData(CONVERSATIONS_FILE);
    return conversations.filter(c => c.leadId === leadId).sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
  },
  
  create: (data) => {
    const conversations = readData(CONVERSATIONS_FILE);
    const conversation = {
      id: generateId(),
      contactId: data.contactId,
      leadId: data.leadId,
      message: data.message,
      direction: data.direction || 'INBOUND',
      createdAt: new Date().toISOString()
    };
    conversations.push(conversation);
    writeData(CONVERSATIONS_FILE, conversations);
    return conversation;
  }
};

// Appointment operations
const Appointment = {
  getAll: () => readData(APPOINTMENTS_FILE),
  
  getById: (id) => {
    const appointments = readData(APPOINTMENTS_FILE);
    return appointments.find(a => a.id === id);
  },
  
  getByContactId: (contactId) => {
    const appointments = readData(APPOINTMENTS_FILE);
    return appointments.filter(a => a.contactId === contactId);
  },
  
  getByLeadId: (leadId) => {
    const appointments = readData(APPOINTMENTS_FILE);
    return appointments.filter(a => a.leadId === leadId);
  },
  
  create: (data) => {
    const appointments = readData(APPOINTMENTS_FILE);
    const appointment = {
      id: generateId(),
      contactId: data.contactId,
      leadId: data.leadId,
      scheduledAt: data.scheduledAt,
      status: data.status || 'SCHEDULED',
      createdAt: new Date().toISOString()
    };
    appointments.push(appointment);
    writeData(APPOINTMENTS_FILE, appointments);
    return appointment;
  },
  
  update: (id, data) => {
    const appointments = readData(APPOINTMENTS_FILE);
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index] = {
        ...appointments[index],
        ...data
      };
      writeData(APPOINTMENTS_FILE, appointments);
      return appointments[index];
    }
    return null;
  },
  
  getStats: () => {
    const appointments = readData(APPOINTMENTS_FILE);
    return {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
      completed: appointments.filter(a => a.status === 'COMPLETED').length,
      cancelled: appointments.filter(a => a.status === 'CANCELLED').length
    };
  }
};

// Transaction-like operation for creating a complete booking
function createBooking(contactData, leadData, conversationData, appointmentData) {
  try {
    // Find or create contact
    let contact;
    if (contactData.name) {
      contact = Contact.findByName(contactData.name);
      if (!contact) {
        contact = Contact.create(contactData);
      } else {
        // Update contact with new info if provided
        if (contactData.email || contactData.phone) {
          contact = Contact.update(contact.id, {
            email: contactData.email || contact.email,
            phone: contactData.phone || contact.phone
          });
        }
      }
    } else {
      contact = Contact.create(contactData);
    }
    
    // Create lead
    const lead = Lead.create({
      ...leadData,
      contactId: contact.id
    });
    
    // Create conversation
    const conversation = Conversation.create({
      ...conversationData,
      contactId: contact.id,
      leadId: lead.id
    });
    
    // Create appointment if provided
    let appointment = null;
    if (appointmentData) {
      appointment = Appointment.create({
        ...appointmentData,
        contactId: contact.id,
        leadId: lead.id
      });
    }
    
    return {
      success: true,
      contact,
      lead,
      conversation,
      appointment
    };
  } catch (error) {
    console.error('Transaction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Initialize database on module load
initializeDatabase();

module.exports = {
  Contact,
  Lead,
  Conversation,
  Appointment,
  createBooking,
  initializeDatabase
};
