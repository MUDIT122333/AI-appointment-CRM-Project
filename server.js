/**
 * DISPATCH - AI Calling & CRM Demo
 * Express server with REST API endpoints
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Services
const leadService = require('./src/services/leadService');
const appointmentService = require('./src/services/appointmentService');
const { Contact, Conversation } = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== API Routes ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== Analyze Endpoint ====================
app.post('/api/analyze', (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    const result = leadService.analyzeMessage(message);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==================== Slots Endpoint ====================
app.get('/api/slots', (req, res) => {
  try {
    const { requestedDate, count } = req.query;
    
    const slots = appointmentService.getAvailableSlots(
      requestedDate || null,
      count ? parseInt(count) : 3
    );
    
    res.json({
      success: true,
      slots
    });
  } catch (error) {
    console.error('Error in /api/slots:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==================== Book Endpoint ====================
app.post('/api/book', (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      requirement,
      leadStatus,
      priority,
      message,
      slotDate
    } = req.body;
    
    // Validate required fields
    if (!name || !requirement || !slotDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, requirement, slotDate'
      });
    }
    
    const result = appointmentService.bookAppointment({
      name,
      email,
      phone,
      requirement,
      leadStatus,
      priority,
      message,
      slotDate
    });
    
    res.json({
      success: true,
      booking: {
        contact: result.contact,
        lead: result.lead,
        conversation: result.conversation,
        appointment: result.appointment
      }
    });
  } catch (error) {
    console.error('Error in /api/book:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== Leads Endpoints ====================
app.get('/api/leads', (req, res) => {
  try {
    const leads = leadService.getAllLeads();
    res.json({
      success: true,
      leads
    });
  } catch (error) {
    console.error('Error in GET /api/leads:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const lead = leadService.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    res.json({
      success: true,
      lead
    });
  } catch (error) {
    console.error('Error in GET /api/leads/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.patch('/api/leads/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const lead = leadService.updateLeadStatus(id, status);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    res.json({
      success: true,
      lead
    });
  } catch (error) {
    console.error('Error in PATCH /api/leads/:id/status:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/leads/stats', (req, res) => {
  try {
    const stats = leadService.getLeadStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in GET /api/leads/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==================== Contacts Endpoints ====================
app.get('/api/contacts', (req, res) => {
  try {
    const contacts = Contact.getAll();
    res.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Error in GET /api/contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/contacts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const contact = Contact.getById(id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Error in GET /api/contacts/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==================== Conversations Endpoints ====================
app.get('/api/conversations', (req, res) => {
  try {
    const conversations = Conversation.getAll();
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/conversations/contact/:contactId', (req, res) => {
  try {
    const { contactId } = req.params;
    const conversations = Conversation.getByContactId(contactId);
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error in GET /api/conversations/contact/:contactId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/conversations/lead/:leadId', (req, res) => {
  try {
    const { leadId } = req.params;
    const conversations = Conversation.getByLeadId(leadId);
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error in GET /api/conversations/lead/:leadId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==================== Appointments Endpoints ====================
app.get('/api/appointments', (req, res) => {
  try {
    const appointments = appointmentService.getAllAppointments();
    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error in GET /api/appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/appointments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const appointment = appointmentService.getAppointmentById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Error in GET /api/appointments/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.patch('/api/appointments/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const appointment = appointmentService.updateAppointmentStatus(id, status);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Error in PATCH /api/appointments/:id/status:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/appointments/stats', (req, res) => {
  try {
    const stats = appointmentService.getAppointmentStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in GET /api/appointments/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==================== Dashboard Stats Endpoint ====================
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const leadStats = leadService.getLeadStats();
    const appointmentStats = appointmentService.getAppointmentStats();
    
    res.json({
      success: true,
      stats: {
        leads: leadStats,
        appointments: appointmentStats
      }
    });
  } catch (error) {
    console.error('Error in GET /api/dashboard/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==================== Serve Frontend ====================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== Error Handling ====================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ==================== Start Server ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`DISPATCH AI Calling & CRM Demo`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
