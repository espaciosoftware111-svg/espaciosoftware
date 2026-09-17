import { describe, it, expect } from 'vitest';
import { leadService } from '../src/modules/leads/lead.service';
import { websiteEnquirySchema } from '../src/validators/lead.schema';

describe('Website-to-Lead Full Dynamic Integration Suite', () => {
  it('1. Successfully validates complete 4-step website enquiry data schema', () => {
    const validData = {
      requirementType: 'Turnkey Interiors',
      propertyType: 'Apartment',
      spaces: ['Kitchen', 'Living Room', 'Bedroom'],
      projectLocation: 'Jubilee Hills, Hyderabad',
      propertySize: '3200 sq ft',
      customerStage: 'Ready To Start',
      specificRequirements: 'Modern Italian minimalist theme with warm recessed lighting',
      fullName: 'Rohan Verma',
      phoneNumber: '+91 9778898310',
      emailAddress: 'rohan.verma@example.com'
    };

    const parsed = websiteEnquirySchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.requirementType).toBe('Turnkey Interiors');
      expect(parsed.data.spaces).toEqual(['Kitchen', 'Living Room', 'Bedroom']);
      expect(parsed.data.projectLocation).toBe('Jubilee Hills, Hyderabad');
    }
  });

  it('2. Supports Global "Others" custom inputs across requirement, property, and spaces', () => {
    const customData = {
      requirementType: 'Something Else',
      customRequirement: 'Custom Rooftop Glass Pergola & Lounge',
      propertyType: 'Others',
      customPropertyType: 'Penthouse Duplex',
      spaces: ['Multiple Spaces', 'Others'],
      customSpace: 'Private Terrace & Home Theater',
      projectLocation: 'Banjara Hills, Hyderabad',
      propertySize: '4500 sq ft',
      customerStage: 'Have A Timeline In Mind',
      specificRequirements: 'Must complete before Diwali 2026',
      fullName: 'Ananya Sharma',
      phoneNumber: '+91 9887766554',
      emailAddress: 'ananya.sharma@example.com'
    };

    const parsed = websiteEnquirySchema.safeParse(customData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.customRequirement).toBe('Custom Rooftop Glass Pergola & Lounge');
      expect(parsed.data.customPropertyType).toBe('Penthouse Duplex');
      expect(parsed.data.customSpace).toBe('Private Terrace & Home Theater');
    }
  });

  it('3. Ingests website enquiry and creates Lead with LEAD-2026-XXXX ID, Source WEBSITE, and NEW LEAD stage', async () => {
    const testEnquiry = {
      requirementType: 'Renovation',
      propertyType: 'Villa',
      spaces: ['Full Home'],
      projectLocation: 'Gachibowli, Hyderabad',
      propertySize: '4000 sq ft',
      customerStage: 'Ready To Start',
      specificRequirements: 'Complete ground floor wooden flooring renovation and modular kitchen',
      fullName: `Test Lead ${Date.now()}`,
      phoneNumber: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      emailAddress: `web-lead-${Date.now()}@example.com`
    };

    const result = await leadService.ingestWebsiteEnquiry(testEnquiry);

    expect(result).toBeDefined();
    expect(result.lead).toBeDefined();
    expect(result.lead.leadId).toMatch(/^LEAD-\d{4}-\d{4}$/);
    expect(result.lead.source).toBe('WEBSITE');
    expect(result.lead.stage).toBe('NEW_LEAD');
    expect(result.lead.clientName).toBe(testEnquiry.fullName);
    expect(result.lead.phone).toBe(testEnquiry.phoneNumber);
    expect(result.lead.email).toBe(testEnquiry.emailAddress);
    expect(result.lead.requirement).toBe('Renovation');
    expect(result.lead.location).toBe('Gachibowli, Hyderabad');

    // Verify retrieval includes parsed website enquiry metadata
    const fetched = await leadService.getLeadById(result.lead.id);
    expect(fetched).toBeDefined();
    expect(fetched?.leadId).toBe(result.lead.leadId);
    expect(fetched?.metadata).toBeDefined();
    expect((fetched?.metadata as any)?.websiteEnquiry?.propertySize).toBe('4000 sq ft');
    expect((fetched?.metadata as any)?.websiteEnquiry?.customerStage).toBe('Ready To Start');
    expect((fetched?.metadata as any)?.websiteEnquiry?.specificRequirements).toBe('Complete ground floor wooden flooring renovation and modular kitchen');
  });

  it('4. Rejects duplicate submissions with identical active contact details safely', async () => {
    const uniquePhone = `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const uniqueEmail = `dup-${Date.now()}@example.com`;

    const enquiry1 = {
      requirementType: 'Turnkey Interiors',
      propertyType: 'Apartment',
      spaces: ['Kitchen'],
      projectLocation: 'Madhapur, Hyderabad',
      fullName: 'Vikram Mehta',
      phoneNumber: uniquePhone,
      emailAddress: uniqueEmail
    };

    const firstResult = await leadService.ingestWebsiteEnquiry(enquiry1);
    expect(firstResult.lead).toBeDefined();

    // Second attempt with duplicate phone number
    await expect(leadService.ingestWebsiteEnquiry(enquiry1)).rejects.toThrow();
  });
});
