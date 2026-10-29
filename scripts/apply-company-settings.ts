import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Applying ESPACIO INTERIORS & MODULAR company and banking defaults to database...");

  const companyProfileData = {
    companyName: "ESPACIO INTERIORS & MODULAR",
    legalName: "ESPACIO INTERIORS & MODULAR",
    displayName: "ESPACIO ERP",
    tagline: "Turnkey Interior Solutions & Architecture",
    phone: "+91 95051 51116",
    whatsApp: "+91 95051 51116",
    email: "contact@theespacio.in",
    website: "https://theespacio.in",
    addressLine: "Mohinabad Road, Beside Gandipet, Aziz Nagar Himayat Nagar",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    postalCode: "500075",
    gstin: "36AKIPS1808E2Z6",
    pan: "AKIPS1808E",
    logoUrl: "/brand/espacio-logo.png",
    openingTime: "09:00",
    closingTime: "19:00",
    workingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
  };

  const quotationSettingsData = {
    prefix: "Q",
    numberFormat: "{PREFIX}-{YEAR}-{SEQ}",
    currency: "INR",
    currencySymbol: "₹",
    enableGst: true,
    defaultGstRate: 18,
    defaultDiscountType: "PERCENTAGE",
    defaultDiscountValue: 0,
    defaultValidityDays: 30,
    defaultTermsAndConditions: `1. Validity: The quotation is valid until the mentioned Valid Till date.\n2. Scope: Only the items mentioned in the quotation are included.\n3. Changes: Additional changes or work will be charged separately.\n4. Warranty: Warranty applies as per the agreed terms and excludes misuse or damage.\n5. Payment: Payments must be made according to the agreed milestone schedule.\n6. Timeline: Estimated timelines may vary due to approvals, payments, or site-related delays.`,
    defaultFooter: "ESPACIO INTERIORS & MODULAR • Mohinabad Road, Beside Gandipet, Aziz Nagar, Hyderabad - 500075",
    templateName: "DETAILED_BOQ",
    enableStamp: true,
    stampImageUrl: "/brand/espacio-stamp.png",
    enableSignature: true,
    signatureImageUrl: "/brand/espacio-signature.png",
    printIncludeSignature: false,
    whatsappIncludeSignature: true,
    enableBankingDetails: true,
    bankName: "AXIS BANK 3108",
    accountHolder: "ESPACIO INTERIORS & MODULAR",
    accountNumber: "925020034783108",
    ifsc: "UTIB000193",
    branch: "AXIS BANK LTD KUKATPALLY ,HYD 72",
    upiId: "sh.firdhos-2@okaxis",
    customQrUrl: "/brand/espacio-upi-qr.jpg",
  };

  const invoiceConfigurationData = {
    prefix: "INV",
    numberFormat: "{PREFIX}-{YEAR}-{SEQ}",
    defaultDueDays: 15,
    enableGst: true,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    enableDiscount: true,
    discountType: "PERCENTAGE",
    defaultDiscountValue: 0,
    defaultNotes: "Thank you for partnering with ESPACIO INTERIORS & MODULAR. All modular woodwork and interior execution follow strict quality assurance standards.",
    termsAndConditions: "1. Validity: The quotation/invoice is valid until the mentioned Valid Till date.\n2. Scope: Only the items mentioned in the quotation are included.\n3. Changes: Additional changes or work will be charged separately.\n4. Warranty: Warranty applies as per the agreed terms and excludes misuse or damage.\n5. Payment: Payments must be made according to the agreed milestone schedule.\n6. Timeline: Estimated timelines may vary due to approvals, payments, or site-related delays.",
    bankName: "AXIS BANK 3108",
    accountHolder: "ESPACIO INTERIORS & MODULAR",
    accountNumber: "925020034783108",
    ifsc: "UTIB000193",
    branch: "AXIS BANK LTD KUKATPALLY ,HYD 72",
    upiId: "sh.firdhos-2@okaxis",
    qrCodeUrl: "/brand/espacio-upi-qr.jpg",
  };

  // 1. Update Settings table
  await prisma.setting.upsert({
    where: { key: "company.profile" },
    update: { value: JSON.stringify(companyProfileData) },
    create: {
      key: "company.profile",
      value: JSON.stringify(companyProfileData),
      category: "COMPANY",
      description: "Unified Company Profile & Legal Details",
    },
  });

  await prisma.setting.upsert({
    where: { key: "quotation.settings" },
    update: { value: JSON.stringify(quotationSettingsData) },
    create: {
      key: "quotation.settings",
      value: JSON.stringify(quotationSettingsData),
      category: "QUOTATION",
      description: "Quotation Numbering, Stamp, Signature & Validity Terms Defaults",
    },
  });

  await prisma.setting.upsert({
    where: { key: "business.invoice_configuration" },
    update: { value: JSON.stringify(invoiceConfigurationData) },
    create: {
      key: "business.invoice_configuration",
      value: JSON.stringify(invoiceConfigurationData),
      category: "FINANCE",
      description: "Invoice Numbering, Payment Types, Modes & GST Settings",
    },
  });

  await prisma.setting.upsert({
    where: { key: "company.name" },
    update: { value: companyProfileData.companyName },
    create: {
      key: "company.name",
      value: companyProfileData.companyName,
      category: "COMPANY",
    },
  });

  await prisma.setting.upsert({
    where: { key: "company.gstin" },
    update: { value: companyProfileData.gstin },
    create: {
      key: "company.gstin",
      value: companyProfileData.gstin,
      category: "COMPANY",
    },
  });

  // 2. Upsert CompanyProfile table if exists
  try {
    const existingProfile = await prisma.companyProfile.findFirst();
    if (existingProfile) {
      await prisma.companyProfile.update({
        where: { id: existingProfile.id },
        data: {
          companyName: companyProfileData.companyName,
          legalName: companyProfileData.legalName,
          tagline: companyProfileData.tagline,
          phone: companyProfileData.phone,
          whatsApp: companyProfileData.whatsApp,
          email: companyProfileData.email,
          website: companyProfileData.website,
          addressLine: companyProfileData.addressLine,
          city: companyProfileData.city,
          state: companyProfileData.state,
          country: companyProfileData.country,
          postalCode: companyProfileData.postalCode,
          gstin: companyProfileData.gstin,
          logoUrl: companyProfileData.logoUrl,
        },
      });
    } else {
      await prisma.companyProfile.create({
        data: {
          companyName: companyProfileData.companyName,
          legalName: companyProfileData.legalName,
          tagline: companyProfileData.tagline,
          phone: companyProfileData.phone,
          whatsApp: companyProfileData.whatsApp,
          email: companyProfileData.email,
          website: companyProfileData.website,
          addressLine: companyProfileData.addressLine,
          city: companyProfileData.city,
          state: companyProfileData.state,
          country: companyProfileData.country,
          postalCode: companyProfileData.postalCode,
          gstin: companyProfileData.gstin,
          logoUrl: companyProfileData.logoUrl,
        },
      });
    }
  } catch (err) {
    console.warn("Could not update CompanyProfile table:", err);
  }

  // 3. Update Financial Accounts
  try {
    await prisma.financialAccount.upsert({
      where: { accountCode: "ACC-0001" },
      update: {
        name: "AXIS Operating Bank Account 3108",
        bankName: "AXIS BANK 3108",
        accountNo: "925020034783108",
        ifscCode: "UTIB000193",
      },
      create: {
        accountCode: "ACC-0001",
        name: "AXIS Operating Bank Account 3108",
        type: "BANK",
        currency: "INR",
        openingBalance: 0,
        currentBalance: 0,
        bankName: "AXIS BANK 3108",
        accountNo: "925020034783108",
        ifscCode: "UTIB000193",
        status: "ACTIVE",
      },
    });

    await prisma.financialAccount.upsert({
      where: { accountCode: "ACC-0003" },
      update: {
        name: "Company Axis UPI Merchant (sh.firdhos-2@okaxis)",
      },
      create: {
        accountCode: "ACC-0003",
        name: "Company Axis UPI Merchant (sh.firdhos-2@okaxis)",
        type: "UPI",
        currency: "INR",
        openingBalance: 0,
        currentBalance: 0,
        status: "ACTIVE",
      },
    });
  } catch (err) {
    console.warn("Could not update financial accounts:", err);
  }

  console.log("✅ Successfully updated all database settings to ESPACIO INTERIORS & MODULAR and AXIS BANK 3108!");
}

main()
  .catch((e) => {
    console.error("❌ Error applying settings:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
