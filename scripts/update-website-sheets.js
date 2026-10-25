const fs = require('fs');
const filePath = "C:/Users/aksha/OneDrive/Desktop/ESPACIO WEB'/server/services/googleSheetsService.js";

let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF temporarily for matching
const isCrlf = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Webhook update
const webhookTarget = `    if (uniqueWebhooks.length > 0) {
      let leadId = 'ESP-000001';`;

const webhookReplacement = `    const isMaterial = Boolean(
      data.isMaterial ||
      (data.source && /material|catalogue|catalog/i.test(data.source)) ||
      (data.catalogueMaterial && data.catalogueMaterial !== '-') ||
      (data.materialDetails && data.materialDetails !== '-')
    );
    const targetPrefix = isMaterial ? 'ESP-MAT-' : 'ESP-LEAD-';

    if (uniqueWebhooks.length > 0) {
      let leadId = \`\${targetPrefix}0001\`;`;

if (content.includes(webhookTarget)) {
  content = content.replace(webhookTarget, webhookReplacement);
  console.log("Replaced Webhook target successfully!");
}

// Update body in webhook fetch
content = content.replace(
  'body: JSON.stringify(comprehensivePayload),',
  `body: JSON.stringify({\n              ...comprehensivePayload,\n              isMaterial,\n              targetPrefix,\n            }),`
);

// 2. Method B update
const methodBTarget = `    // Fetch Lead IDs to determine next ID
    let nextId = 'ESP-000001';
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: \`\${sheetName}!B2:B\`,
      });
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        const lastIdStr = rows[rows.length - 1][0];
        if (lastIdStr && lastIdStr.startsWith('ESP-')) {
          const match = lastIdStr.match(/ESP-(\\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            nextId = \`ESP-\${String(num + 1).padStart(6, '0')}\`;
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets API: Read error, defaulting to ESP-000001. Error:', err.message);
    }`;

const methodBReplacement = `    // Fetch Lead IDs to determine next ID
    const targetPrefix = isMaterial ? 'ESP-MAT-' : 'ESP-LEAD-';
    let nextId = \`\${targetPrefix}0001\`;
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: \`\${sheetName}!B2:B\`,
      });
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        let maxNum = 0;
        for (const row of rows) {
          const idStr = row[0] || '';
          const match = idStr.match(/(?:ESP-LEAD-|ESP-MAT-|ESP-|MAT-)(\\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
        nextId = \`\${targetPrefix}\${String(maxNum + 1).padStart(4, '0')}\`;
      }
    } catch (err) {
      console.warn(\`Google Sheets API: Read error, defaulting to \${nextId}. Error:\`, err.message);
    }`;

if (content.includes(methodBTarget)) {
  content = content.replace(methodBTarget, methodBReplacement);
  console.log("Replaced Method B target successfully!");
}

if (isCrlf) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Finished updating googleSheetsService.js!");
