const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'quotations', 'quotation-generator-studio.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add EMPTY_CLIENT and EMPTY_PROJECT definitions
const emptyDefinitions = `const EMPTY_CLIENT: ClientInfo = {
  name: '',
  phone: '',
  email: '',
  address: '',
  gstin: '',
  location: '',
  requirement: ''
};

const EMPTY_PROJECT: ProjectDetails = {
  name: '',
  address: '',
  designer: '',
  salesExecutive: '',
  stage: '',
  expectedCompletion: '',
  type: ''
};
`;

if (!content.includes('const EMPTY_CLIENT: ClientInfo')) {
  content = content.replace(
    'const CLIENT_PRESETS: ClientInfo[] = [',
    emptyDefinitions + '\nconst CLIENT_PRESETS: ClientInfo[] = ['
  );
  console.log('Added EMPTY_CLIENT and EMPTY_PROJECT');
}

// 2. Fix rooms state initialization (use empty array instead of INITIAL_ROOMS fallback)
const oldRoomsInit = `  const [rooms, setRooms] = useState<RoomGroup[]>(
    initialInvoice?.rooms && initialInvoice.rooms.length > 0
      ? initialInvoice.rooms
      : INITIAL_ROOMS
  );`;

const newRoomsInit = `  const [rooms, setRooms] = useState<RoomGroup[]>(
    initialInvoice?.rooms && initialInvoice.rooms.length > 0
      ? initialInvoice.rooms
      : []
  );`;

if (content.includes(oldRoomsInit)) {
  content = content.replace(oldRoomsInit, newRoomsInit);
  console.log('Cleaned rooms state initialization');
} else {
  console.log('rooms state initialization match failed');
}

// 3. Fix invoice state initialization (use clean empty client, project, items, rooms)
const oldInvoiceInit = `    company: DEFAULT_COMPANY,
    client: CLIENT_PRESETS[0],
    project: PROJECT_PRESETS[0],
    items: initialInvoice?.items || (quotationType === 'MATERIAL' ? INITIAL_MATERIAL_ITEMS : INITIAL_ITEMS),
    rooms: quotationType === 'LEAD' ? (initialInvoice?.rooms || INITIAL_ROOMS) : undefined,`;

const newInvoiceInit = `    company: DEFAULT_COMPANY,
    client: initialInvoice?.client || EMPTY_CLIENT,
    project: initialInvoice?.project || EMPTY_PROJECT,
    items: initialInvoice?.items || [],
    rooms: quotationType === 'LEAD' ? (initialInvoice?.rooms || []) : undefined,`;

if (content.includes(oldInvoiceInit)) {
  content = content.replace(oldInvoiceInit, newInvoiceInit);
  console.log('Cleaned invoice state initialization');
} else {
  console.log('invoice state initialization match failed');
}

// 4. Fix print preview line items fallback (do not fall back to INITIAL_MATERIAL_ITEMS when empty)
const oldPreviewFallback = `: (activeItems && activeItems.length > 0)
                                ? activeItems
                                : INITIAL_MATERIAL_ITEMS`;

const newPreviewFallback = `: (activeItems && activeItems.length > 0)
                                ? activeItems
                                : []`;

if (content.includes(oldPreviewFallback)) {
  content = content.replace(oldPreviewFallback, newPreviewFallback);
  console.log('Cleaned print preview line items fallback');
} else {
  console.log('print preview fallback match failed');
}

// 5. Fix type pill switcher fallback
const oldTypePill = `items: (!prev.items || prev.items.length === 0 || prev.items === INITIAL_ITEMS)
                    ? INITIAL_MATERIAL_ITEMS
                    : prev.items`;

const newTypePill = `items: prev.items || []`;

if (content.includes(oldTypePill)) {
  content = content.replace(oldTypePill, newTypePill);
  console.log('Cleaned type pill switcher fallback');
} else {
  console.log('type pill switcher fallback match failed');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated quotation-generator-studio.tsx');
