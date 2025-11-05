/**
 * Cloudflare Worker: Proposal Form Handler
 * Purpose: Process qualification form submissions, validate Turnstile, store in Airtable, send via SendGrid
 */

// Configuration - Set these as environment variables in Cloudflare dashboard
const CONFIG = {
  AIRTABLE_API_TOKEN: '', // Set in Cloudflare Worker environment
  AIRTABLE_BASE_ID: '', // Set in Cloudflare Worker environment
  AIRTABLE_TABLE_NAME: 'Leads', // Your table name in Airtable
  SENDGRID_API_KEY: '', // Set in Cloudflare Worker environment
  SENDGRID_FROM_EMAIL: 'contact@locked.net',
  SENDGRID_FROM_NAME: 'Ian Gorrie - Locked Advisory',
  TURNSTILE_SECRET_KEY: '', // Set in Cloudflare Worker environment (from Cloudflare dashboard)
  ALLOWED_ORIGIN: 'https://locked.net' // CORS
};

// Pamphlet content templates
const PAMPHLET_CONTENT = {
  'ai-security': {
    subject: 'AI Security & Governance Services',
    content: `
# AI Security & Governance Services

## Your AI Security Challenge

You're building cutting-edge AI systems. Your investors want growth. Your customers want innovation. But security gaps and regulatory risks are piling up.

## Our Recommendation

**AI Security Assessment & Governance Framework**

### What We Deliver:

✓ **LLM Security Analysis**
  - Prompt injection testing
  - Training data leakage assessment
  - Model inversion risk evaluation

✓ **AI Governance Framework**
  - EU AI Act compliance roadmap
  - Responsible AI policies
  - Bias detection procedures

✓ **Enterprise Readiness Package**
  - Customer-facing security documentation
  - AI risk assessment reports
  - Vendor questionnaire responses

### Timeline: 4-8 weeks

### Investment:
- Pre-seed/Seed: $8,000 - $15,000
- Series A: $25,000 - $40,000
- Series B+: $40,000 - $80,000

### Why Locked Advisory

- 30 years software security experience
- Presented at Federal Trade Commission (2016)
- OWASP Seattle Chapter Leader
- Deep understanding of AI/ML architectures
- Know what VCs and enterprise customers look for
`
  },
  'privacy-compliance': {
    subject: 'Privacy & Compliance Services',
    content: `
# Privacy & Compliance Services

## Your Privacy Challenge

You're processing data from EU or California residents. Enterprise customers are asking about GDPR. You need compliance—but don't know where to start.

## Our Recommendation

**Privacy Assessment & Compliance Program**

### What We Deliver:

✓ **Privacy Assessment**
  - Data inventory and mapping
  - GDPR/CCPA gap analysis
  - Cross-border transfer review

✓ **Policy Development**
  - Privacy policies and notices
  - Cookie consent mechanisms
  - Data Processing Agreements (DPAs)

✓ **Ongoing Compliance**
  - Fractional privacy officer services
  - Regulatory inquiry support
  - Breach response procedures

### Timeline: 2-6 weeks

### Investment:
- Small (1-50 employees): $5,000 - $12,000
- Mid-size (51-200): $15,000 - $35,000
- Enterprise (200+): $40,000 - $100,000

### Why Locked Advisory

- Presented at Federal Trade Commission (2016)
- Expert in surveillance law and privacy regulations
- Compliance that enables business, not blocks it
- Risk-based approach, not checkbox compliance
`
  },
  'pre-exit': {
    subject: 'Pre-Exit Security Readiness',
    content: `
# Pre-Exit Security Readiness

## Your M&A Challenge

You have a term sheet. Due diligence is coming. Security gaps will kill your deal or slash your valuation. You need this fixed—fast.

## Our Recommendation

**30-Day Security Sprint**

### What We Deliver:

**Week 1: Assessment**
  - Security review from buyer's perspective
  - Critical vulnerability identification
  - Compliance status check

**Week 2: Critical Fixes**
  - Patch high-severity vulnerabilities
  - Enable MFA, encryption
  - Remove excessive permissions

**Week 3: Documentation**
  - Security policies and procedures
  - Incident response plan
  - Vendor assessment records

**Week 4: Due Diligence Prep**
  - Organize data room
  - Create security FAQ
  - Brief your team

### Timeline: 30 days

### Investment:
- 30-Day Sprint: $35,000 - $50,000
- Assessment Only: $12,000 - $18,000
- Due Diligence Support: $350-$500/hour

### Why Locked Advisory

- Know what buyers look for in due diligence
- Fast, focused, practical approach
- Prioritize fixes that maximize deal value
- 30 years security experience
`
  },
  'build-program': {
    subject: 'Fractional CISO Services',
    content: `
# Fractional CISO Services

## Your Security Program Challenge

You need security expertise, but can't afford a $200K+ CISO. Your investors are asking about SOC 2. Enterprise customers demand security documentation.

## Our Recommendation

**Fractional CISO Services**

### What We Deliver:

✓ **Security Program Development**
  - Policies, procedures, controls
  - Risk assessment framework
  - Vendor security management

✓ **SOC 2 Readiness**
  - Gap assessment
  - Control implementation
  - Audit support

✓ **Customer & Investor Support**
  - Security questionnaire responses
  - Board presentations
  - Customer security calls

✓ **Team Training**
  - Security awareness program
  - Secure development practices
  - Incident response training

### Commitment: 8-40 hours/month (based on stage)

### Investment:
- Pre-seed/Seed (8-12 hrs/mo): $3,000 - $5,000/month
- Series A (20-30 hrs/mo): $7,000 - $12,000/month
- Series B+ (40+ hrs/mo): $15,000 - $25,000/month

### Why Locked Advisory

- CISSP, CISM, CISA certified
- 30 years security leadership experience
- Strategic partner, not just vendor
- Know what VCs and acquirers look for
`
  },
  'threat-detection': {
    subject: 'Surveillance & Threat Detection Services',
    content: `
# Surveillance & Threat Detection Services

## Your Monitoring Challenge

You need to detect insider threats, fraud, or investigate incidents—with proper legal authorization and technical expertise.

## Our Recommendation

**Authorized Threat Detection Program**

### What We Deliver:

✓ **Insider Threat Detection**
  - Employee activity monitoring (authorized)
  - Data exfiltration prevention
  - Anomaly detection systems

✓ **Fraud Detection**
  - Pattern analysis
  - Transaction monitoring
  - Behavioral analytics

✓ **Investigation Support**
  - Digital forensics
  - Evidence collection
  - Expert testimony

✓ **Legal Framework**
  - Compliance with monitoring laws
  - Policy development
  - Authorization documentation

### Timeline: 2-4 weeks (design), ongoing monitoring

### Investment:
- Assessment & Design: $450/hour
- Implementation: $350/hour
- Investigation: Double standard rate
- Monthly Retainer: Custom pricing

### Why Locked Advisory

- Deep technical expertise in monitoring systems
- Understanding of legal/ethical boundaries
- Work within appropriate authorization
- 30 years security and compliance experience
`
  },
  'incident-response': {
    subject: 'Incident Response Services',
    content: `
# Incident Response Services

## Your Security Incident

You've had a breach, incident, or security event. You need immediate help to contain, investigate, and remediate.

## Our Recommendation

**Emergency Incident Response**

### What We Deliver:

✓ **Immediate Response**
  - Incident assessment and scoping
  - Containment and isolation
  - Evidence preservation

✓ **Investigation**
  - Root cause analysis
  - Timeline reconstruction
  - Impact assessment

✓ **Remediation**
  - Vulnerability patching
  - Security control implementation
  - System hardening

✓ **Notification Support**
  - Regulatory reporting
  - Customer communication
  - Legal coordination

### Timeline: Immediate (24-48 hour response)

### Investment:
- Emergency Response: $700-$900/hour (double rate)
- Post-Incident Review: $350-$450/hour
- Retainer for 24/7 Availability: Custom

### Why Locked Advisory

- Rapid response capability
- Digital forensics expertise
- Regulatory notification experience
- 30 years incident handling
`
  }
};

/**
 * Main request handler
 */
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      // Parse form data
      const formData = await request.formData();
      const data = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }

      // Validate Turnstile token
      const turnstileToken = data['cf-turnstile-response'];
      if (!turnstileToken) {
        return jsonResponse({ error: 'Missing Turnstile token' }, 400);
      }

      const turnstileValid = await validateTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY);
      if (!turnstileValid) {
        return jsonResponse({ error: 'Turnstile validation failed' }, 400);
      }

      // Determine pamphlet type
      const pamphletType = determinePamphletType(data.challenge);

      // Store in Airtable
      await storeInAirtable(data, pamphletType, env);

      // Send email via SendGrid
      await sendEmail(data, pamphletType, env);

      // Return success
      return jsonResponse({
        success: true,
        message: 'Thank you! Check your email for your custom proposal.',
        pamphletType: pamphletType
      });

    } catch (error) {
      console.error('Error processing form:', error);
      return jsonResponse({
        error: 'Failed to process form',
        details: error.message
      }, 500);
    }
  }
};

/**
 * Validate Cloudflare Turnstile token
 */
async function validateTurnstile(token, secretKey) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      secret: secretKey,
      response: token
    })
  });

  const data = await response.json();
  return data.success === true;
}

/**
 * Determine which pamphlet to send based on challenge type
 */
function determinePamphletType(challenge) {
  const mapping = {
    'ai-security': 'ai-security',
    'privacy-compliance': 'privacy-compliance',
    'pre-exit': 'pre-exit',
    'build-program': 'build-program',
    'threat-detection': 'threat-detection',
    'incident-response': 'incident-response'
  };
  return mapping[challenge] || 'build-program';
}

/**
 * Store lead in Airtable
 */
async function storeInAirtable(data, pamphletType, env) {
  const url = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_NAME}`;

  const record = {
    fields: {
      'Name': data.name,
      'Email': data.email,
      'Company': data.company || '',
      'Website': data.website || '',
      'Company Stage': data.stage || '',
      'Company Size': data.size || '',
      'Industry': data.industry || '',
      'Primary Challenge': data.challenge || '',
      'Timeline': data.timeline || '',
      'What\'s Driving This': data.driver || '',
      'Pamphlet Sent': pamphletType,
      'Status': 'New',
      'Email Sent Date': new Date().toISOString().split('T')[0]
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.AIRTABLE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ records: [record] })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable error: ${error}`);
  }

  return await response.json();
}

/**
 * Send email via SendGrid
 */
async function sendEmail(data, pamphletType, env) {
  const pamphlet = PAMPHLET_CONTENT[pamphletType];

  const emailContent = `
Hi ${data.name},

Thank you for your interest in Locked Advisory security services.

Based on your ${data.challenge} needs and ${data.stage} stage, I've prepared custom recommendations:

${pamphlet.content}

---

## Next Steps

1. Review the services above
2. Book a 15-minute call to discuss: https://cal.com/gorrie/15min
3. I'll answer your questions and refine the proposal

## Questions?

Reply to this email or call me directly: (347) 871-6167

Best regards,

Ian Gorrie
Principal, Locked Advisory
https://locked.net
contact@locked.net

---

30 Years Security Expertise | CISSP, CISM, CISA
FTC Presenter (2016) | OWASP Seattle Chapter Leader
`;

  const emailData = {
    personalizations: [{
      to: [{ email: data.email, name: data.name }],
      subject: `Your Custom Security Proposal - ${pamphlet.subject}`
    }],
    from: {
      email: env.SENDGRID_FROM_EMAIL,
      name: env.SENDGRID_FROM_NAME
    },
    content: [{
      type: 'text/plain',
      value: emailContent
    }]
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid error: ${error}`);
  }
}

/**
 * Handle CORS
 */
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': CONFIG.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * JSON response helper
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': CONFIG.ALLOWED_ORIGIN
    }
  });
}
