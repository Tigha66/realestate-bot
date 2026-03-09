// Real Estate AI Virtual Agent API
// Deployable to Vercel

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

// In-memory storage (use database in production)
const leads = new Map();
const properties = new Map();
const tours = new Map();
const communications = new Map();

// Lead qualification stages
const QUALIFICATION_STAGES = {
  INITIAL: 'initial',
  QUALIFYING: 'qualifying',
  QUALIFIED: 'qualified',
  UNQUALIFIED: 'unqualified'
};

// Service pricing
const PRICING = {
  perLead: 25.00,
  premiumCRM: 49.99, // monthly
  agentCRM: 79.99   // monthly
};

// Initialize mock properties
const mockProperties = [
  {
    id: 'prop-001',
    address: '123 Ocean Drive',
    city: 'Miami Beach',
    state: 'FL',
    zip: '33139',
    price: 850000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    type: 'Single Family',
    yearBuilt: 2018,
    amenities: ['Pool', 'Garage', 'Ocean View'],
    images: ['https://example.com/img1.jpg'],
    description: 'Beautiful oceanfront property with stunning views',
    status: 'available'
  },
  {
    id: 'prop-002',
    address: '456 Palm Avenue',
    city: 'Beverly Hills',
    zip: '90210',
    price: 2500000,
    bedrooms: 5,
    bathrooms: 4,
    sqft: 4200,
    type: 'Single Family',
    yearBuilt: 2020,
    amenities: ['Pool', 'Wine Cellar', 'Smart Home', 'Gym'],
    images: ['https://example.com/img2.jpg'],
    description: 'Luxurious modern estate with premium finishes',
    status: 'available'
  },
  {
    id: 'prop-003',
    address: '789 Urban Loft',
    city: 'New York',
    zip: '10001',
    price: 450000,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 850,
    type: 'Condo',
    yearBuilt: 2015,
    amenities: ['Doorman', 'Rooftop', 'Gym'],
    images: ['https://example.com/img3.jpg'],
    description: 'Modern loft in the heart of Manhattan',
    status: 'available'
  }
];

// Initialize properties
mockProperties.forEach(p => properties.set(p.id, p));

// Generate IDs
function generateId(prefix) {
  return prefix + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'Real Estate AI Virtual Agent',
    version: '1.0.0',
    endpoints: {
      properties: '/api/properties',
      leads: '/api/leads',
      tours: '/api/tours',
      qualify: '/api/leads/:id/qualify'
    }
  });
});

// Get all properties with filters
app.get('/api/properties', (req, res) => {
  const { minPrice, maxPrice, bedrooms, city, type } = req.query;
  
  let results = Array.from(properties.values());
  
  if (minPrice) results = results.filter(p => p.price >= parseInt(minPrice));
  if (maxPrice) results = results.filter(p => p.price <= parseInt(maxPrice));
  if (bedrooms) results = results.filter(p => p.bedrooms >= parseInt(bedrooms));
  if (city) results = results.filter(p => p.city.toLowerCase().includes(city.toLowerCase()));
  if (type) results = results.filter(p => p.type.toLowerCase() === type.toLowerCase()));

  res.json({ 
    count: results.length, 
    properties: results 
  });
});

// Get single property
app.get('/api/properties/:id', (req, res) => {
  const property = properties.get(req.params.id);
  
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  res.json({ property });
});

// Create/save a lead
app.post('/api/leads', (req, res) => {
  const { name, phone, email, source, preferences } = req.body;
  
  const leadId = generateId('LEAD');
  
  const lead = {
    id: leadId,
    name,
    phone,
    email,
    source: source || 'website',
    preferences: preferences || {},
    stage: QUALIFICATION_STAGES.INITIAL,
    score: 0,
    assignedAgent: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  leads.set(leadId, lead);

  // Log communication
  const commId = generateId('COMM');
  communications.set(commId, {
    id: commId,
    leadId,
    type: 'initial_contact',
    direction: 'outbound',
    message: 'Thank you for your interest! Let me help you find your dream home.',
    timestamp: new Date().toISOString()
  });

  res.json({ 
    success: true, 
    lead,
    message: 'Lead created. Start qualification process.'
  });
});

// Get lead by ID
app.get('/api/leads/:id', (req, res) => {
  const lead = leads.get(req.params.id);
  
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  // Get lead communications
  const leadComms = Array.from(communications.values())
    .filter(c => c.leadId === lead.id);

  res.json({ lead, communications: leadComms });
});

// Lead qualification workflow
app.post('/api/leads/:id/qualify', (req, res) => {
  const lead = leads.get(req.params.id);
  
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const { budget, location, timeline, readyToBuy } = req.body;
  
  // Update lead with qualification data
  lead.preferences.budget = budget;
  lead.preferences.location = location;
  lead.preferences.timeline = timeline;
  lead.preferences.readyToBuy = readyToBuy;
  
  // Calculate qualification score
  let score = 0;
  if (budget && budget.min >= 200000) score += 25;
  if (timeline === 'immediate' || timeline === '1-3months') score += 25;
  if (readyToBuy === true) score += 30;
  if (location) score += 20;
  
  lead.score = score;
  lead.stage = score >= 50 ? QUALIFICATION_STAGES.QUALIFIED : QUALIFICATION_STAGES.QUALIFYING;
  lead.updatedAt = new Date().toISOString();

  leads.set(lead.id, lead);

  res.json({ 
    success: true, 
    lead,
    message: score >= 50 
      ? 'Lead qualified! Assigning to agent.'
      : 'Lead needs more nurturing. Continue follow-up.'
  });
});

// Schedule a tour
app.post('/api/tours', (req, res) => {
  const { leadId, propertyId, date, time, notes } = req.body;
  
  const lead = leads.get(leadId);
  const property = properties.get(propertyId);
  
  if (!lead || !property) {
    return res.status(404).json({ error: 'Lead or property not found' });
  }

  const tourId = generateId('TOUR');
  
  const tour = {
    id: tourId,
    leadId,
    propertyId,
    property: {
      address: property.address,
      city: property.city,
      price: property.price
    },
    lead: {
      name: lead.name,
      phone: lead.phone,
      email: lead.email
    },
    date,
    time,
    status: 'scheduled',
    notes: notes || '',
    remindersSent: 0,
    createdAt: new Date().toISOString()
  };

  tours.set(tourId, tour);

  // Log communication
  const commId = generateId('COMM');
  communications.set(commId, {
    id: commId,
    leadId,
    type: 'tour_scheduled',
    direction: 'outbound',
    message: `Tour scheduled for ${property.address} on ${date} at ${time}`,
    timestamp: new Date().toISOString()
  });

  res.json({ 
    success: true, 
    tour,
    message: 'Tour scheduled. Reminder will be sent before the appointment.'
  });
});

// Get tours for a lead
app.get('/api/leads/:id/tours', (req, res) => {
  const leadTours = Array.from(tours.values())
    .filter(t => t.leadId === req.params.id);

  res.json({ tours: leadTours });
});

// Update tour (reschedule/cancel)
app.patch('/api/tours/:id', (req, res) => {
  const tour = tours.get(req.params.id);
  
  if (!tour) {
    return res.status(404).json({ error: 'Tour not found' });
  }

  const { date, time, status, notes } = req.body;
  
  if (date) tour.date = date;
  if (time) tour.time = time;
  if (status) tour.status = status;
  if (notes) tour.notes = notes;
  tour.updatedAt = new Date().toISOString();

  tours.set(tour.id, tour);

  res.json({ 
    success: true, 
    tour 
  });
});

// Send property details to lead
app.post('/api/leads/:id/send-listing', (req, res) => {
  const lead = leads.get(req.params.id);
  const { propertyId } = req.body;
  
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  
  const property = properties.get(propertyId);
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  // Log communication
  const commId = generateId('COMM');
  communications.set(commId, {
    id: commId,
    leadId: lead.id,
    type: 'property_details',
    direction: 'outbound',
    message: `Property details sent: ${property.address} - $${property.price}`,
    timestamp: new Date().toISOString()
  });

  res.json({ 
    success: true, 
    message: 'Property details sent to lead',
    property: {
      address: property.address,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      description: property.description
    }
  });
});

// Get all leads (for agents)
app.get('/api/leads', (req, res) => {
  const { stage, minScore } = req.query;
  
  let results = Array.from(leads.values());
  
  if (stage) results = results.filter(l => l.stage === stage);
  if (minScore) results = results.filter(l => l.score >= parseInt(minScore));

  res.json({ 
    count: results.length, 
    leads: results 
  });
});

// Pricing info
app.get('/api/pricing', (req, res) => {
  res.json({
    perLead: PRICING.perLead,
    premiumCRM: PRICING.premiumCRM,
    agentCRM: PRICING.agentCRM,
    currency: 'USD'
  });
});

// Assign agent to lead
app.post('/api/leads/:id/assign', (req, res) => {
  const lead = leads.get(req.params.id);
  const { agentId, agentName } = req.body;
  
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  lead.assignedAgent = { id: agentId, name: agentName };
  lead.updatedAt = new Date().toISOString();
  
  leads.set(lead.id, lead);

  res.json({ 
    success: true, 
    lead,
    message: `Lead assigned to ${agentName}`
  });
});

// Webhook for WhatsApp/SMS integration
app.post('/api/webhook', (req, res) => {
  const { from, message, channel } = req.body;
  
  // Find or create lead
  let lead = Array.from(leads.values()).find(l => l.phone === from);
  
  if (!lead) {
    const leadId = generateId('LEAD');
    lead = {
      id: leadId,
      name: 'Unknown',
      phone: from,
      email: null,
      source: channel || 'sms',
      preferences: {},
      stage: QUALIFICATION_STAGES.INITIAL,
      score: 0,
      assignedAgent: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    leads.set(leadId, lead);
  }

  // Simple NLP response (implement proper NLP in production)
  const response = generateAutoResponse(message, lead);

  // Log communication
  const commId = generateId('COMM');
  communications.set(commId, {
    id: commId,
    leadId: lead.id,
    type: 'incoming',
    direction: 'inbound',
    message,
    timestamp: new Date().toISOString()
  });

  res.json({ 
    response,
    leadId: lead.id
  });
});

// Auto-response generator
function generateAutoResponse(message, lead) {
  const msg = message.toLowerCase();
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hello! I'm your Real Estate Assistant. What type of property are you looking for?";
  }
  
  if (msg.includes('buy') || msg.includes('purchase') || msg.includes('looking')) {
    lead.stage = QUALIFICATION_STAGES.QUALIFYING;
    return "Great! To help you better, can you tell me: 1) What's your budget? 2) Preferred location? 3) When are you looking to buy?";
  }
  
  if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
    const props = Array.from(properties.values()).slice(0, 3);
    return `Our properties range from $${Math.min(...props.map(p => p.price)).toLocaleString()} to $${Math.max(...props.map(p => p.price)).toLocaleString()}. Would you like me to show you some options?`;
  }
  
  if (msg.includes('bedroom') || msg.includes('bed')) {
    return "We have properties with 1-5 bedrooms available. How many bedrooms do you need?";
  }
  
  if (msg.includes('schedule') || msg.includes('tour') || msg.includes('view')) {
    return "I'd be happy to schedule a tour! Which property are you interested in and what dates work for you?";
  }
  
  return "Thank you for your message! I'm here to help you find your dream home. Would you like to see our available properties?";
}

module.exports = app;
