/**
 * DISPATCH - AI Calling & CRM Demo
 * Frontend JavaScript
 */

// ==================== State Management ====================
const state = {
    currentView: 'intake',
    currentStep: 1,
    extractedLead: null,
    availableSlots: null,
    selectedSlot: null,
    bookingResult: null,
    leads: [],
    voiceRecognition: null,
    isRecording: false
};

// ==================== API Functions ====================
const API = {
    async analyze(message) {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        return response.json();
    },

    async getSlots(requestedDate = null, count = 3) {
        const params = new URLSearchParams();
        if (requestedDate) params.append('requestedDate', requestedDate);
        if (count) params.append('count', count);
        
        const response = await fetch(`/api/slots?${params}`);
        return response.json();
    },

    async book(bookingData) {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        return response.json();
    },

    async getLeads() {
        const response = await fetch('/api/leads');
        return response.json();
    },

    async getLeadById(id) {
        const response = await fetch(`/api/leads/${id}`);
        return response.json();
    },

    async getDashboardStats() {
        const response = await fetch('/api/dashboard/stats');
        return response.json();
    }
};

// ==================== Utility Functions ====================
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function showLoader(btn) {
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    if (btnText && btnLoader) {
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
    }
    btn.disabled = true;
}

function hideLoader(btn) {
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    if (btnText && btnLoader) {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
    btn.disabled = false;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ==================== Navigation ====================
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
}

function switchView(view) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('active', v.id === `${view}-view`);
    });
    
    state.currentView = view;
    
    // Load view-specific data
    if (view === 'dashboard') {
        loadDashboard();
    } else if (view === 'voice') {
        initVoiceDemo();
    }
}

// ==================== Intake Flow ====================
function initIntakeFlow() {
    const analyzeBtn = document.getElementById('analyze-btn');
    const backToMessageBtn = document.getElementById('back-to-message-btn');
    const getSlotsBtn = document.getElementById('get-slots-btn');
    const backToLeadBtn = document.getElementById('back-to-lead-btn');
    const newIntakeBtn = document.getElementById('new-intake-btn');
    
    analyzeBtn.addEventListener('click', handleAnalyze);
    backToMessageBtn.addEventListener('click', () => goToStep(1));
    getSlotsBtn.addEventListener('click', handleGetSlots);
    backToLeadBtn.addEventListener('click', () => goToStep(2));
    newIntakeBtn.addEventListener('click', resetIntake);
}

function goToStep(step) {
    state.currentStep = step;
    
    // Update workflow steps
    document.querySelectorAll('.step').forEach(s => {
        const stepNum = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        if (stepNum < step) {
            s.classList.add('completed');
        } else if (stepNum === step) {
            s.classList.add('active');
        }
    });
    
    // Update intake steps
    document.querySelectorAll('.intake-step').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.step) === step);
    });
}

async function handleAnalyze() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message) {
        showToast('Please enter a message', 'error');
        return;
    }
    
    const analyzeBtn = document.getElementById('analyze-btn');
    showLoader(analyzeBtn);
    
    try {
        const result = await API.analyze(message);
        
        if (result.success) {
            state.extractedLead = result.data;
            displayExtractedLead(result.data);
            goToStep(2);
            showToast('Lead extracted successfully', 'success');
        } else {
            showToast('Failed to analyze message', 'error');
        }
    } catch (error) {
        console.error('Error analyzing message:', error);
        showToast('Error analyzing message', 'error');
    } finally {
        hideLoader(analyzeBtn);
    }
}

function displayExtractedLead(lead) {
    const container = document.getElementById('extracted-lead');
    
    const html = `
        <div class="lead-info-item">
            <span class="lead-info-label">Name</span>
            <span class="lead-info-value">${lead.name || 'Not detected'}</span>
        </div>
        <div class="lead-info-item">
            <span class="lead-info-label">Requirement</span>
            <span class="lead-info-value">${lead.requirement}</span>
        </div>
        <div class="lead-info-item">
            <span class="lead-info-label">Status</span>
            <span class="lead-info-value">${lead.leadStatus}</span>
        </div>
        <div class="lead-info-item">
            <span class="lead-info-label">Priority</span>
            <span class="lead-info-value">${lead.priority}</span>
        </div>
        <div class="lead-info-item">
            <span class="lead-info-label">Meeting Requested</span>
            <span class="lead-info-value">${lead.meetingRequested ? 'Yes' : 'No'}</span>
        </div>
        ${lead.requestedDate ? `
        <div class="lead-info-item">
            <span class="lead-info-label">Requested Date</span>
            <span class="lead-info-value">${formatDate(lead.requestedDate)}</span>
        </div>
        ` : ''}
    `;
    
    container.innerHTML = html;
}

async function handleGetSlots() {
    const getSlotsBtn = document.getElementById('get-slots-btn');
    showLoader(getSlotsBtn);
    
    try {
        const requestedDate = state.extractedLead?.requestedDate || null;
        const result = await API.getSlots(requestedDate, 3);
        
        if (result.success) {
            state.availableSlots = result.slots;
            displaySlots(result.slots);
            goToStep(3);
            showToast('Slots loaded successfully', 'success');
        } else {
            showToast('Failed to load slots', 'error');
        }
    } catch (error) {
        console.error('Error getting slots:', error);
        showToast('Error loading slots', 'error');
    } finally {
        hideLoader(getSlotsBtn);
    }
}

function displaySlots(slots) {
    const container = document.getElementById('slots-container');
    
    const html = slots.map(slot => `
        <div class="slot-card" data-slot-id="${slot.id}" data-slot-date="${slot.date}">
            <div class="slot-date">${slot.displayDate.replace('\n', ' ')}</div>
            <div class="slot-time">${slot.time}</div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    
    // Add click handlers
    container.querySelectorAll('.slot-card').forEach(card => {
        card.addEventListener('click', () => handleSlotSelection(card));
    });
}

function handleSlotSelection(card) {
    // Remove previous selection
    document.querySelectorAll('.slot-card').forEach(c => c.classList.remove('selected'));
    
    // Add selection to clicked card
    card.classList.add('selected');
    
    const slotId = card.dataset.slotId;
    const slotDate = card.dataset.slotDate;
    
    state.selectedSlot = {
        id: slotId,
        date: slotDate
    };
    
    // Automatically book the slot
    handleBooking();
}

async function handleBooking() {
    if (!state.extractedLead || !state.selectedSlot) {
        showToast('Missing lead or slot information', 'error');
        return;
    }
    
    const messageInput = document.getElementById('message-input');
    const originalMessage = messageInput.value.trim();
    
    const bookingData = {
        name: state.extractedLead.name,
        email: null,
        phone: null,
        requirement: state.extractedLead.requirement,
        leadStatus: state.extractedLead.leadStatus,
        priority: state.extractedLead.priority,
        message: originalMessage,
        slotDate: state.selectedSlot.date
    };
    
    try {
        const result = await API.book(bookingData);
        
        if (result.success) {
            state.bookingResult = result.booking;
            displayBookingConfirmation(result.booking);
            goToStep(4);
            showToast('Booking confirmed!', 'success');
        } else {
            showToast('Failed to book appointment', 'error');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showToast('Error booking appointment', 'error');
    }
}

function displayBookingConfirmation(booking) {
    const container = document.getElementById('booking-confirmation');
    
    const appointmentDate = formatDateTime(booking.appointment.scheduledAt);
    
    const html = `
        <div class="success-icon">✓</div>
        <h3>Booking Confirmed!</h3>
        <p><strong>Customer:</strong> ${booking.contact.name}</p>
        <p><strong>Requirement:</strong> ${booking.lead.requirement}</p>
        <p><strong>Appointment:</strong> ${appointmentDate}</p>
        <p><strong>Status:</strong> ${booking.lead.status}</p>
    `;
    
    container.innerHTML = html;
}

function resetIntake() {
    state.currentStep = 1;
    state.extractedLead = null;
    state.availableSlots = null;
    state.selectedSlot = null;
    state.bookingResult = null;
    
    document.getElementById('message-input').value = '';
    document.getElementById('extracted-lead').innerHTML = '';
    document.getElementById('slots-container').innerHTML = '';
    document.getElementById('booking-confirmation').innerHTML = '';
    
    goToStep(1);
}

// ==================== Dashboard ====================
async function loadDashboard() {
    await loadDashboardStats();
    await loadLeadsTable();
}

async function loadDashboardStats() {
    try {
        const result = await API.getDashboardStats();
        
        if (result.success) {
            const stats = result.stats;
            document.getElementById('stat-total-leads').textContent = stats.leads.total;
            document.getElementById('stat-new-leads').textContent = stats.leads.new;
            document.getElementById('stat-qualified-leads').textContent = stats.leads.qualified;
            document.getElementById('stat-meetings').textContent = stats.appointments.scheduled;
            document.getElementById('stat-converted').textContent = stats.leads.converted;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadLeadsTable() {
    try {
        const result = await API.getLeads();
        
        if (result.success) {
            state.leads = result.leads;
            displayLeadsTable(result.leads);
        }
    } catch (error) {
        console.error('Error loading leads:', error);
    }
}

function displayLeadsTable(leads) {
    const tbody = document.getElementById('leads-table-body');
    const emptyState = document.getElementById('empty-state');
    
    if (leads.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    const html = leads.map(lead => {
        const appointment = findAppointmentForLead(lead.id);
        const appointmentText = appointment ? formatDateTime(appointment.scheduledAt) : 'None';
        
        return `
            <tr>
                <td>${lead.contact?.name || 'Unknown'}</td>
                <td>${lead.requirement}</td>
                <td><span class="status-badge status-${lead.status.toLowerCase().replace('_', '_')}">${lead.status.replace('_', ' ')}</span></td>
                <td><span class="priority-badge priority-${lead.priority.toLowerCase()}">${lead.priority}</span></td>
                <td>${appointmentText}</td>
                <td>${formatDate(lead.createdAt)}</td>
                <td><button class="action-btn" data-lead-id="${lead.id}">View</button></td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = html;
    
    // Add click handlers to view buttons
    tbody.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => handleViewLead(btn.dataset.leadId));
    });
}

function findAppointmentForLead(leadId) {
    // This is a simplified version - in production you'd want to fetch appointments
    // For now, we'll check if there's an appointment in the booking result
    if (state.bookingResult && state.bookingResult.lead?.id === leadId) {
        return state.bookingResult.appointment;
    }
    return null;
}

async function handleViewLead(leadId) {
    try {
        const result = await API.getLeadById(leadId);
        
        if (result.success) {
            displayLeadModal(result.lead);
        } else {
            showToast('Failed to load lead details', 'error');
        }
    } catch (error) {
        console.error('Error loading lead details:', error);
        showToast('Error loading lead details', 'error');
    }
}

function displayLeadModal(lead) {
    const modal = document.getElementById('lead-modal');
    const modalBody = document.getElementById('lead-modal-body');
    
    const appointment = findAppointmentForLead(lead.id);
    const appointmentText = appointment ? formatDateTime(appointment.scheduledAt) : 'None';
    
    const html = `
        <div class="modal-section">
            <h3>Customer</h3>
            <p><strong>Name:</strong> ${lead.contact?.name || 'Unknown'}</p>
            <p><strong>Email:</strong> ${lead.contact?.email || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${lead.contact?.phone || 'Not provided'}</p>
        </div>
        
        <div class="modal-section">
            <h3>Requirement</h3>
            <p>${lead.requirement}</p>
        </div>
        
        <div class="modal-section">
            <h3>Status</h3>
            <p><span class="status-badge status-${lead.status.toLowerCase().replace('_', '_')}">${lead.status.replace('_', ' ')}</span></p>
        </div>
        
        <div class="modal-section">
            <h3>Priority</h3>
            <p><span class="priority-badge priority-${lead.priority.toLowerCase()}">${lead.priority}</span></p>
        </div>
        
        <div class="modal-section">
            <h3>Appointment</h3>
            <p>${appointmentText}</p>
        </div>
        
        <div class="modal-section">
            <h3>Created</h3>
            <p>${formatDateTime(lead.createdAt)}</p>
        </div>
    `;
    
    modalBody.innerHTML = html;
    modal.classList.remove('hidden');
}

function initModal() {
    const modal = document.getElementById('lead-modal');
    const closeBtn = document.getElementById('close-modal');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

document.getElementById('refresh-dashboard-btn').addEventListener('click', loadDashboard);

// ==================== Voice Demo ====================
function initVoiceDemo() {
    const startBtn = document.getElementById('start-voice-btn');
    const stopBtn = document.getElementById('stop-voice-btn');
    
    startBtn.addEventListener('click', startVoiceRecognition);
    stopBtn.addEventListener('click', stopVoiceRecognition);
    
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        document.getElementById('voice-error').textContent = 'Speech recognition is not supported in this browser. Please use Chrome or Edge.';
        document.getElementById('voice-error').classList.remove('hidden');
        startBtn.disabled = true;
    }
}

function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showToast('Speech recognition not supported', 'error');
        return;
    }
    
    state.voiceRecognition = new SpeechRecognition();
    state.voiceRecognition.continuous = false;
    state.voiceRecognition.interimResults = false;
    state.voiceRecognition.lang = 'en-US';
    
    state.voiceRecognition.onstart = () => {
        state.isRecording = true;
        updateVoiceUI('recording');
    };
    
    state.voiceRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceTranscript(transcript);
    };
    
    state.voiceRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        showToast('Speech recognition error: ' + event.error, 'error');
        updateVoiceUI('error');
    };
    
    state.voiceRecognition.onend = () => {
        state.isRecording = false;
        if (document.getElementById('transcript-text').textContent === '') {
            updateVoiceUI('idle');
        }
    };
    
    try {
        state.voiceRecognition.start();
    } catch (error) {
        console.error('Error starting speech recognition:', error);
        showToast('Error starting speech recognition', 'error');
    }
}

function stopVoiceRecognition() {
    if (state.voiceRecognition && state.isRecording) {
        state.voiceRecognition.stop();
        state.isRecording = false;
        updateVoiceUI('idle');
    }
}

function updateVoiceUI(status) {
    const voiceStatus = document.getElementById('voice-status');
    const startBtn = document.getElementById('start-voice-btn');
    const stopBtn = document.getElementById('stop-voice-btn');
    
    voiceStatus.classList.remove('recording');
    
    if (status === 'recording') {
        voiceStatus.classList.add('recording');
        voiceStatus.innerHTML = `
            <div class="voice-icon">🎤</div>
            <p>Listening... Speak now</p>
        `;
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
    } else if (status === 'error') {
        voiceStatus.innerHTML = `
            <div class="voice-icon">⚠️</div>
            <p>Error occurred. Try again.</p>
        `;
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
    } else {
        voiceStatus.innerHTML = `
            <div class="voice-icon">🎤</div>
            <p>Click "Start Recording" to begin</p>
        `;
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
    }
}

async function handleVoiceTranscript(transcript) {
    // Display transcript
    const transcriptContainer = document.getElementById('voice-transcript');
    const transcriptText = document.getElementById('transcript-text');
    
    transcriptText.textContent = transcript;
    transcriptContainer.classList.remove('hidden');
    
    // Analyze the transcript
    try {
        const result = await API.analyze(transcript);
        
        if (result.success) {
            const lead = result.data;
            
            // Generate voice response
            let responseText = '';
            
            if (lead.name) {
                responseText += `Thanks ${lead.name}. `;
            }
            
            if (lead.meetingRequested) {
                responseText += 'I found three available meeting slots for you. Please select one from the options.';
            } else {
                responseText += `I've noted your interest in ${lead.requirement}. Would you like to schedule a meeting?`;
            }
            
            // Display response
            const responseContainer = document.getElementById('voice-response');
            const responseTextEl = document.getElementById('response-text');
            
            responseTextEl.textContent = responseText;
            responseContainer.classList.remove('hidden');
            
            // Speak the response
            speakResponse(responseText);
            
            // If meeting was requested, load slots
            if (lead.meetingRequested) {
                state.extractedLead = lead;
                const slotsResult = await API.getSlots(lead.requestedDate, 3);
                if (slotsResult.success) {
                    state.availableSlots = slotsResult.slots;
                    // Switch to intake view to show slots
                    switchView('intake');
                    displayExtractedLead(lead);
                    goToStep(2);
                    setTimeout(() => {
                        displaySlots(slotsResult.slots);
                        goToStep(3);
                    }, 500);
                }
            }
        }
    } catch (error) {
        console.error('Error analyzing voice transcript:', error);
        showToast('Error processing voice input', 'error');
    }
    
    updateVoiceUI('idle');
}

function speakResponse(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Try to get a good voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.lang.includes('en') && voice.name.includes('Google')
        ) || voices.find(voice => voice.lang.includes('en'));
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        speechSynthesis.speak(utterance);
    }
}

// ==================== Initialization ====================
function init() {
    initNavigation();
    initIntakeFlow();
    initModal();
    
    // Load voices for speech synthesis
    if ('speechSynthesis' in window) {
        speechSynthesis.getVoices();
        speechSynthesis.onvoiceschanged = () => {
            speechSynthesis.getVoices();
        };
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
