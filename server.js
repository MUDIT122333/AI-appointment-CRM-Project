/**
 * DISPATCH - AI Calling & CRM Demo
 * Express server with REST API endpoints
 * Supabase / PostgreSQL compatible
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Services
const leadService = require('./src/services/leadService');
const appointmentService = require('./src/services/appointmentService');

// Database operations
const {
  Contact,
  Conversation
} = require('./src/db');

const app = express();

const PORT = process.env.PORT || 3000;


// ============================================================
// Middleware
// ============================================================

app.use(cors());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static(
  path.join(__dirname, 'public')
));


// ============================================================
// Request Logging
// ============================================================

app.use((req, res, next) => {

  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path}`
  );

  next();

});


// ============================================================
// Health Check
// ============================================================

app.get('/api/health', (req, res) => {

  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString()
  });

});


// ============================================================
// ANALYZE MESSAGE
// ============================================================

app.post('/api/analyze', (req, res) => {

  try {

    const {
      message
    } = req.body;


    if (!message) {

      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });

    }


    const result =
      leadService.analyzeMessage(message);


    if (!result.success) {

      return res.status(400).json(result);

    }


    res.json(result);


  } catch (error) {

    console.error(
      'Error in /api/analyze:',
      error
    );


    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});


// ============================================================
// AVAILABLE SLOTS
// ============================================================

app.get('/api/slots', (req, res) => {

  try {

    const {
      requestedDate,
      count
    } = req.query;


    const parsedCount =
      count ? parseInt(count, 10) : 3;


    const slots =
      appointmentService.getAvailableSlots(
        requestedDate || null,
        parsedCount
      );


    res.json({
      success: true,
      slots
    });


  } catch (error) {

    console.error(
      'Error in /api/slots:',
      error
    );


    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});


// ============================================================
// BOOK APPOINTMENT
// ============================================================

app.post('/api/book', async (req, res) => {

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

    if (
      !name ||
      !requirement ||
      !slotDate
    ) {

      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: name, requirement, slotDate'
      });

    }


    // IMPORTANT:
    // appointmentService.bookAppointment()
    // is async because it writes to Supabase.

    const result =
      await appointmentService.bookAppointment({

        name,
        email,
        phone,
        requirement,
        leadStatus,
        priority,
        message,
        slotDate

      });


    res.status(201).json({

      success: true,

      booking: {

        contact: result.contact,

        lead: result.lead,

        conversation: result.conversation,

        appointment: result.appointment

      }

    });


  } catch (error) {

    console.error(
      'Error in /api/book:',
      error
    );


    res.status(400).json({

      success: false,

      error: error.message

    });

  }

});


// ============================================================
// LEADS
// ============================================================


// GET ALL LEADS

app.get('/api/leads', async (req, res) => {

  try {

    const leads =
      await leadService.getAllLeads();


    res.json({

      success: true,

      leads

    });


  } catch (error) {

    console.error(
      'Error in GET /api/leads:',
      error
    );


    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// GET LEAD BY ID

app.get('/api/leads/:id', async (req, res) => {

  try {

    const {
      id
    } = req.params;


    const lead =
      await leadService.getLeadById(id);


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

    console.error(
      'Error in GET /api/leads/:id:',
      error
    );


    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// UPDATE LEAD STATUS

app.patch(
  '/api/leads/:id/status',
  async (req, res) => {

    try {

      const {
        id
      } = req.params;

      const {
        status
      } = req.body;


      if (!status) {

        return res.status(400).json({

          success: false,

          error: 'Status is required'

        });

      }


      const lead =
        await leadService.updateLeadStatus(
          id,
          status
        );


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

      console.error(
        'Error in PATCH /api/leads/:id/status:',
        error
      );


      res.status(400).json({

        success: false,

        error: error.message

      });

    }

  }
);


// LEAD STATISTICS

app.get('/api/leads/stats', async (req, res) => {

  try {

    const stats =
      await leadService.getLeadStats();


    res.json({

      success: true,

      stats

    });


  } catch (error) {

    console.error(
      'Error in GET /api/leads/stats:',
      error
    );


    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ============================================================
// CONTACTS
// ============================================================


// GET ALL CONTACTS

app.get('/api/contacts', async (req, res) => {

  try {

    const contacts =
      await Contact.getAll();


    res.json({

      success: true,

      contacts

    });


  } catch (error) {

    console.error(
      'Error in GET /api/contacts:',
      error
    );


    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// GET CONTACT BY ID

app.get('/api/contacts/:id', async (req, res) => {

  try {

    const {
      id
    } = req.params;


    const contact =
      await Contact.getById(id);


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

    console.error(
      'Error in GET /api/contacts/:id:',
      error
    );


    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ============================================================
// CONVERSATIONS
// ============================================================


// GET ALL CONVERSATIONS

app.get(
  '/api/conversations',
  async (req, res) => {

    try {

      const conversations =
        await Conversation.getAll();


      res.json({

        success: true,

        conversations

      });


    } catch (error) {

      console.error(
        'Error in GET /api/conversations:',
        error
      );


      res.status(500).json({

        success: false,

        error: error.message

      });

    }

  }
);


// GET CONVERSATIONS BY CONTACT

app.get(
  '/api/conversations/contact/:contactId',
  async (req, res) => {

    try {

      const {
        contactId
      } = req.params;


      const conversations =
        await Conversation.getByContactId(
          contactId
        );


      res.json({

        success: true,

        conversations

      });


    } catch (error) {

      console.error(
        'Error in GET conversations by contact:',
        error
      );


      res.status(500).json({

        success: false,

        error: error.message

      });

    }

  }
);


// GET CONVERSATIONS BY LEAD

app.get(
  '/api/conversations/lead/:leadId',
  async (req, res) => {

    try {

      const {
        leadId
      } = req.params;


      const conversations =
        await Conversation.getByLeadId(
          leadId
        );


      res.json({

        success: true,

        conversations

      });


    } catch (error) {

      console.error(
        'Error in GET conversations by lead:',
        error
      );


      res.status(500).json({

        success: false,

        error: error.message

      });

    }

  }
);


// ============================================================
// APPOINTMENTS
// ============================================================


// GET ALL APPOINTMENTS

app.get(
  '/api/appointments',
  async (req, res) => {

    try {

      const appointments =
        await appointmentService.getAllAppointments();


      res.json({

        success: true,

        appointments

      });


    } catch (error) {

      console.error(
        'Error in GET /api/appointments:',
        error
      );


      res.status(500).json({

        success: false,

        error: error.message

      });

    }

  }
);


// GET APPOINTMENT BY ID

app.get(
  '/api/appointments/:id',
  async (req, res) => {

    try {

      const {
        id
      } = req.params;


      const appointment =
        await appointmentService.getAppointmentById(
          id
        );


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

      console.error(
        'Error in GET /api/appointments/:id:',
        error
      );


      res.status(500).json({

        success: false,

        error: error.message

      });

    }

  }
);


// UPDATE APPOINTMENT STATUS

app.patch(
  '/api/appointments/:id/status',
  async (req, res) => {

    try {

      const {
        id
      } = req.params;

      const {
        status
      } = req.body;


      if (!status) {

        return res.status(400).json({

          success: false,

          error: 'Status is required'

        });

      }


      const appointment =
        await appointmentService.updateAppointmentStatus(
          id,
          status
        );


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

      console.error(
        'Error in PATCH appointment status:',
        error
      );


      res.status(400).json({

        success: false,

        error: error.message

      });

    }

  }
);


// APPOINTMENT STATISTICS

app.get(
  '/api/appointments/stats',
  async (req, res) => {

    try {

      const stats =
        await appointmentService.getAppointmentStats();


      res.json({

        success: true,

        stats

      });


    } catch (error) {

      console.error(
        'Error in GET /api/appointments/stats:',
        error
      );


      res.status(500).json({

        success: false,

        error: error.message

      });

    }

  }
);


// ============================================================
// DASHBOARD STATISTICS
// ============================================================

app.get(
  '/api/dashboard/stats',
  async (req, res) => {

    try {

      const [
        leadStats,
        appointmentStats
      ] = await Promise.all([

        leadService.getLeadStats(),

        appointmentService.getAppointmentStats()

      ]);


      res.json({

        success: true,

        stats: {

          leads: leadStats,

          appointments: appointmentStats

        }

      });


    } catch (error) {

      console.error(
        'Error in GET /api/dashboard/stats:',
        error
      );


      res.status(500).json({

        success: false,

        error: error.message

      });

    }

  }
);


// ============================================================
// SERVE FRONTEND
// ============================================================

app.get('/', (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'public',
      'index.html'
    )
  );

});


// ============================================================
// 404 API HANDLER
// ============================================================

app.use('/api', (req, res) => {

  res.status(404).json({

    success: false,

    error: 'API endpoint not found'

  });

});


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {

  console.error(
    'Unhandled error:',
    err
  );


  res.status(500).json({

    success: false,

    error: err.message || 'Internal server error'

  });

});


// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log('');
    console.log('==========================================');
    console.log('DISPATCH AI Calling & CRM Demo');
    console.log('==========================================');
    console.log(`Server running on port ${PORT}`);
    console.log(
      `Environment: ${process.env.NODE_ENV || 'development'}`
    );
    console.log('Database: Supabase PostgreSQL');
    console.log('==========================================');
    console.log('');

  }
);


module.exports = app;