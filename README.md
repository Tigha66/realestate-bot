# Real Estate AI Virtual Agent 🤖🏠

AI-powered real estate assistant that automates buyer inquiries, schedules property tours, sends listings, and qualifies leads.

## Features

### 🔍 Property Search
- Search by price, bedrooms, location, property type
- Real-time property details with images
- Property comparisons

### 📅 Tour Scheduling
- Book property tours via WhatsApp/SMS
- Sync with calendar (Google Calendar API ready)
- Automated reminders

### 🎯 Lead Qualification
- Automated qualification questions
- Lead scoring based on budget, timeline, readiness
- Stage tracking (initial → qualifying → qualified)

### 💳 CRM Integration
- Lead storage and management
- Agent assignment
- Communication history
- Premium CRM tiers available

### 📱 Multi-Channel
- WhatsApp integration ready
- SMS integration ready
- Natural language responses

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/properties` | Search properties |
| GET | `/api/properties/:id` | Get property details |
| POST | `/api/leads` | Create new lead |
| GET | `/api/leads` | List all leads |
| GET | `/api/leads/:id` | Get lead details |
| POST | `/api/leads/:id/qualify` | Qualify lead |
| POST | `/api/leads/:id/assign` | Assign agent |
| POST | `/api/leads/:id/send-listing` | Send property details |
| POST | `/api/tours` | Schedule tour |
| PATCH | `/api/tours/:id` | Update tour |
| GET | `/api/pricing` | Monetization pricing |

## Example Usage

### Search Properties
```bash
curl "https://your-app.here.now/api/properties?minPrice=300000&bedrooms=2"
```

### Create Lead
```bash
curl -X POST https://your-app.here.now/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"John","phone":"+1234567890","email":"john@example.com"}'
```

### Qualify Lead
```bash
curl -X POST https://your-app.here.now/api/leads/LEAD-XXXX/qualify \
  -H "Content-Type: application/json" \
  -d '{"budget":{"min":500000,"max":800000},"location":"Miami","timeline":"1-3months","readyToBuy":true}'
```

### Schedule Tour
```bash
curl -X POST https://your-app.here.now/api/tours \
  -H "Content-Type: application/json" \
  -d '{"leadId":"LEAD-XXXX","propertyId":"prop-001","date":"2026-04-15","time":"14:00"}'
```

## Monetization

- **$25/lead** - Per qualified lead
- **$49.99/mo** - Premium CRM integration
- **$79.99/mo** - Agent CRM add-on

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or use here.now for instant deployment.

## License

MIT
