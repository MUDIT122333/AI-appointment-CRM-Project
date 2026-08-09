/**
 * Supabase PostgreSQL Database Layer
 * Replaces the previous JSON-file database implementation.
 */

require('dotenv').config();

const postgres = require('postgres');
const crypto = require('crypto');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in .env');
}

// Create PostgreSQL connection
const sql = postgres(process.env.DATABASE_URL);

// Generate UUID
function generateId() {
  return crypto.randomUUID();
}

/**
 * Convert PostgreSQL snake_case records
 * into the camelCase format used by the application.
 */

function mapContact(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapLead(row) {
  if (!row) return null;

  return {
    id: row.id,
    contactId: row.contact_id,
    requirement: row.requirement,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapConversation(row) {
  if (!row) return null;

  return {
    id: row.id,
    contactId: row.contact_id,
    leadId: row.lead_id,
    message: row.message,
    direction: row.direction,
    createdAt: row.created_at
  };
}

function mapAppointment(row) {
  if (!row) return null;

  return {
    id: row.id,
    contactId: row.contact_id,
    leadId: row.lead_id,
    scheduledAt: row.scheduled_at,
    status: row.status,
    createdAt: row.created_at
  };
}

/* =========================================================
   CONTACT
========================================================= */

const Contact = {

  async getAll() {
    const rows = await sql`
      SELECT *
      FROM contacts
      ORDER BY created_at DESC
    `;

    return rows.map(mapContact);
  },

  async getById(id) {
    const rows = await sql`
      SELECT *
      FROM contacts
      WHERE id = ${id}
      LIMIT 1
    `;

    return rows.length ? mapContact(rows[0]) : null;
  },

  async findByName(name) {
    const rows = await sql`
      SELECT *
      FROM contacts
      WHERE LOWER(name) = LOWER(${name})
      LIMIT 1
    `;

    return rows.length ? mapContact(rows[0]) : null;
  },

  async create(data) {
    const id = generateId();

    const rows = await sql`
      INSERT INTO contacts (
        id,
        name,
        email,
        phone
      )
      VALUES (
        ${id},
        ${data.name},
        ${data.email || null},
        ${data.phone || null}
      )
      RETURNING *
    `;

    return mapContact(rows[0]);
  },

  async update(id, data) {
    const rows = await sql`
      UPDATE contacts
      SET
        name = COALESCE(${data.name ?? null}, name),
        email = COALESCE(${data.email ?? null}, email),
        phone = COALESCE(${data.phone ?? null}, phone),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return rows.length ? mapContact(rows[0]) : null;
  }
};


/* =========================================================
   LEAD
========================================================= */

const Lead = {

  async getAll() {
    const rows = await sql`
      SELECT *
      FROM leads
      ORDER BY created_at DESC
    `;

    return rows.map(mapLead);
  },

  async getById(id) {
    const rows = await sql`
      SELECT *
      FROM leads
      WHERE id = ${id}
      LIMIT 1
    `;

    return rows.length ? mapLead(rows[0]) : null;
  },

  async getByContactId(contactId) {
    const rows = await sql`
      SELECT *
      FROM leads
      WHERE contact_id = ${contactId}
      ORDER BY created_at DESC
    `;

    return rows.map(mapLead);
  },

  async create(data) {
    const id = generateId();

    const rows = await sql`
      INSERT INTO leads (
        id,
        contact_id,
        requirement,
        status,
        priority
      )
      VALUES (
        ${id},
        ${data.contactId},
        ${data.requirement},
        ${data.status || 'NEW'},
        ${data.priority || 'MEDIUM'}
      )
      RETURNING *
    `;

    return mapLead(rows[0]);
  },

  async update(id, data) {
    const rows = await sql`
      UPDATE leads
      SET
        requirement = COALESCE(${data.requirement ?? null}, requirement),
        status = COALESCE(${data.status ?? null}, status),
        priority = COALESCE(${data.priority ?? null}, priority),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return rows.length ? mapLead(rows[0]) : null;
  },

  async getStats() {
    const rows = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'NEW')::int AS new,
        COUNT(*) FILTER (WHERE status = 'QUALIFIED')::int AS qualified,
        COUNT(*) FILTER (WHERE status = 'MEETING_REQUESTED')::int AS "meetingRequested",
        COUNT(*) FILTER (WHERE status = 'CONVERTED')::int AS converted,
        COUNT(*) FILTER (WHERE status = 'LOST')::int AS lost
      FROM leads
    `;

    return rows[0];
  }
};


/* =========================================================
   CONVERSATION
========================================================= */

const Conversation = {

  async getAll() {
    const rows = await sql`
      SELECT *
      FROM conversations
      ORDER BY created_at ASC
    `;

    return rows.map(mapConversation);
  },

  async getById(id) {
    const rows = await sql`
      SELECT *
      FROM conversations
      WHERE id = ${id}
      LIMIT 1
    `;

    return rows.length ? mapConversation(rows[0]) : null;
  },

  async getByContactId(contactId) {
    const rows = await sql`
      SELECT *
      FROM conversations
      WHERE contact_id = ${contactId}
      ORDER BY created_at ASC
    `;

    return rows.map(mapConversation);
  },

  async getByLeadId(leadId) {
    const rows = await sql`
      SELECT *
      FROM conversations
      WHERE lead_id = ${leadId}
      ORDER BY created_at ASC
    `;

    return rows.map(mapConversation);
  },

  async create(data) {
    const id = generateId();

    const rows = await sql`
      INSERT INTO conversations (
        id,
        contact_id,
        lead_id,
        message,
        direction
      )
      VALUES (
        ${id},
        ${data.contactId},
        ${data.leadId},
        ${data.message || ''},
        ${data.direction || 'INBOUND'}
      )
      RETURNING *
    `;

    return mapConversation(rows[0]);
  }
};


/* =========================================================
   APPOINTMENT
========================================================= */

const Appointment = {

  async getAll() {
    const rows = await sql`
      SELECT *
      FROM appointments
      ORDER BY scheduled_at ASC
    `;

    return rows.map(mapAppointment);
  },

  async getById(id) {
    const rows = await sql`
      SELECT *
      FROM appointments
      WHERE id = ${id}
      LIMIT 1
    `;

    return rows.length ? mapAppointment(rows[0]) : null;
  },

  async getByContactId(contactId) {
    const rows = await sql`
      SELECT *
      FROM appointments
      WHERE contact_id = ${contactId}
      ORDER BY scheduled_at ASC
    `;

    return rows.map(mapAppointment);
  },

  async getByLeadId(leadId) {
    const rows = await sql`
      SELECT *
      FROM appointments
      WHERE lead_id = ${leadId}
      ORDER BY scheduled_at ASC
    `;

    return rows.map(mapAppointment);
  },

  async create(data) {
    const id = generateId();

    const rows = await sql`
      INSERT INTO appointments (
        id,
        contact_id,
        lead_id,
        scheduled_at,
        status
      )
      VALUES (
        ${id},
        ${data.contactId},
        ${data.leadId},
        ${data.scheduledAt},
        ${data.status || 'SCHEDULED'}
      )
      RETURNING *
    `;

    return mapAppointment(rows[0]);
  },

  async update(id, data) {
    const rows = await sql`
      UPDATE appointments
      SET
        scheduled_at = COALESCE(${data.scheduledAt ?? null}, scheduled_at),
        status = COALESCE(${data.status ?? null}, status)
      WHERE id = ${id}
      RETURNING *
    `;

    return rows.length ? mapAppointment(rows[0]) : null;
  },

  async getStats() {
    const rows = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE status = 'SCHEDULED'
        )::int AS scheduled,
        COUNT(*) FILTER (
          WHERE status = 'COMPLETED'
        )::int AS completed,
        COUNT(*) FILTER (
          WHERE status = 'CANCELLED'
        )::int AS cancelled
      FROM appointments
    `;

    return rows[0];
  }
};


/* =========================================================
   CREATE COMPLETE BOOKING
========================================================= */

async function createBooking(
  contactData,
  leadData,
  conversationData,
  appointmentData
) {

  try {

    const result = await sql.begin(async transaction => {

      /*
       * 1. Find or create contact
       */

      let contactRows = [];

      if (contactData.name) {

        contactRows = await transaction`
          SELECT *
          FROM contacts
          WHERE LOWER(name) = LOWER(${contactData.name})
          LIMIT 1
        `;
      }

      let contact;

      if (contactRows.length) {

        contact = contactRows[0];

        // Update email / phone if new information exists
        if (contactData.email || contactData.phone) {

          const updatedRows = await transaction`
            UPDATE contacts
            SET
              email = COALESCE(${contactData.email ?? null}, email),
              phone = COALESCE(${contactData.phone ?? null}, phone),
              updated_at = NOW()
            WHERE id = ${contact.id}
            RETURNING *
          `;

          contact = updatedRows[0];
        }

      } else {

        const contactId = generateId();

        const newContactRows = await transaction`
          INSERT INTO contacts (
            id,
            name,
            email,
            phone
          )
          VALUES (
            ${contactId},
            ${contactData.name},
            ${contactData.email || null},
            ${contactData.phone || null}
          )
          RETURNING *
        `;

        contact = newContactRows[0];
      }


      /*
       * 2. Create lead
       */

      const leadId = generateId();

      const leadRows = await transaction`
        INSERT INTO leads (
          id,
          contact_id,
          requirement,
          status,
          priority
        )
        VALUES (
          ${leadId},
          ${contact.id},
          ${leadData.requirement},
          ${leadData.status || 'NEW'},
          ${leadData.priority || 'MEDIUM'}
        )
        RETURNING *
      `;

      const lead = leadRows[0];


      /*
       * 3. Create conversation
       */

      const conversationId = generateId();

      const conversationRows = await transaction`
        INSERT INTO conversations (
          id,
          contact_id,
          lead_id,
          message,
          direction
        )
        VALUES (
          ${conversationId},
          ${contact.id},
          ${lead.id},
          ${conversationData.message || ''},
          ${conversationData.direction || 'INBOUND'}
        )
        RETURNING *
      `;

      const conversation = conversationRows[0];


      /*
       * 4. Create appointment
       */

      let appointment = null;

      if (appointmentData) {

        const appointmentId = generateId();

        const appointmentRows = await transaction`
          INSERT INTO appointments (
            id,
            contact_id,
            lead_id,
            scheduled_at,
            status
          )
          VALUES (
            ${appointmentId},
            ${contact.id},
            ${lead.id},
            ${appointmentData.scheduledAt},
            ${appointmentData.status || 'SCHEDULED'}
          )
          RETURNING *
        `;

        appointment = appointmentRows[0];
      }


      /*
       * Return all created records
       */

      return {
        contact: mapContact(contact),
        lead: mapLead(lead),
        conversation: mapConversation(conversation),
        appointment: mapAppointment(appointment)
      };
    });


    return {
      success: true,
      ...result
    };

  } catch (error) {

    console.error('Transaction error:', error);

    return {
      success: false,
      error: error.message
    };
  }
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  Contact,
  Lead,
  Conversation,
  Appointment,
  createBooking
};