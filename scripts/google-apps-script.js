/**
 * PIRTEK Fleet Inspection System - Google Apps Script
 * 
 * This script handles inspection data from the PIRTEK Fleet Inspection App
 * and stores it in the connected Google Sheet.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1lBxaD-nR4wNSYLX3X1RQ9W3QWDndGfQRpglkbX3yAI4/edit
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Click the floppy disk icon to save
 * 5. Click "Deploy" > "New deployment"
 * 6. Select type: "Web app"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone" (important for the app to work)
 * 9. Click "Deploy" and authorize when prompted
 * 10. Copy the Web app URL (it looks like: https://script.google.com/macros/s/XXXXX/exec)
 * 11. Add this URL as GOOGLE_SCRIPT_URL environment variable in your Vercel project
 * 
 * SHEET STRUCTURE:
 * The script will create/use columns in this order:
 * A: ID, B: Date, C: Time, D: Driver Name, E: Driver ID, F: Vehicle Plate, 
 * G: Vehicle ID, H: Warehouse Code, I: Warehouse Name, J: Mileage, 
 * K: Overall Status, L: Score, M: Total Items, N: Passed Items, O: Failed Items,
 * P: Lights Status, Q: Notes, R: Submitted At, S: Sections JSON
 */

// Configuration - Update this to match your sheet
const SHEET_NAME = 'Inspection Logs'; // Name of the sheet tab to use
const HEADER_ROW = 1; // Which row contains headers

// Column headers in the order they should appear
const HEADERS = [
  'ID',
  'Date',
  'Time',
  'Driver Name',
  'Driver ID',
  'Vehicle Plate',
  'Vehicle ID',
  'Warehouse Code',
  'Warehouse Name',
  'Mileage',
  'Overall Status',
  'Score',
  'Total Items',
  'Passed Items',
  'Failed Items',
  'Lights Status',
  'Notes',
  'Submitted At',
  'Sections (JSON)'
];

/**
 * Handles GET requests - returns all inspection data or handles delete
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'get';
    
    if (action === 'get') {
      const inspections = getAllInspections();
      return ContentService
        .createTextOutput(JSON.stringify(inspections))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'delete') {
      const id = e.parameter.id;
      if (!id) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, error: 'ID is required' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const result = deleteInspection(id);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles POST requests - adds new inspection
 */
function doPost(e) {
  try {
    // Parse the incoming inspection data
    let inspection;
    
    if (e.postData && e.postData.contents) {
      inspection = JSON.parse(e.postData.contents);
    } else {
      throw new Error('No data received');
    }
    
    // Add the inspection to the sheet
    const result = addInspection(inspection);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, row: result.row }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Gets or creates the inspection sheet with proper headers
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Add headers
    sheet.getRange(HEADER_ROW, 1, 1, HEADERS.length).setValues([HEADERS]);
    // Format headers
    sheet.getRange(HEADER_ROW, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1a73e8')
      .setFontColor('#ffffff');
    // Freeze header row
    sheet.setFrozenRows(HEADER_ROW);
    // Set column widths
    sheet.setColumnWidth(1, 220);  // ID
    sheet.setColumnWidth(2, 100);  // Date
    sheet.setColumnWidth(3, 80);   // Time
    sheet.setColumnWidth(4, 150);  // Driver Name
    sheet.setColumnWidth(5, 120);  // Driver ID
    sheet.setColumnWidth(6, 100);  // Vehicle Plate
    sheet.setColumnWidth(7, 120);  // Vehicle ID
    sheet.setColumnWidth(8, 100);  // Warehouse Code
    sheet.setColumnWidth(9, 150);  // Warehouse Name
    sheet.setColumnWidth(10, 80);  // Mileage
    sheet.setColumnWidth(11, 100); // Overall Status
    sheet.setColumnWidth(12, 60);  // Score
    sheet.setColumnWidth(13, 80);  // Total Items
    sheet.setColumnWidth(14, 90);  // Passed Items
    sheet.setColumnWidth(15, 90);  // Failed Items
    sheet.setColumnWidth(16, 100); // Lights Status
    sheet.setColumnWidth(17, 200); // Notes
    sheet.setColumnWidth(18, 180); // Submitted At
    sheet.setColumnWidth(19, 300); // Sections JSON
  }
  
  return sheet;
}

/**
 * Adds a new inspection to the sheet
 */
function addInspection(inspection) {
  const sheet = getOrCreateSheet();
  
  // Prepare row data in correct column order
  const rowData = [
    inspection.id || '',
    inspection.date || '',
    inspection.time || '',
    inspection.driverName || '',
    inspection.driverId || '',
    inspection.vehicleName || '',  // This is actually the plate
    inspection.vehicleId || '',
    inspection.warehouseCode || '',
    inspection.warehouseName || '',
    inspection.mileage || 0,
    inspection.overallStatus || '',
    inspection.score || 0,
    inspection.totalItems || 0,
    inspection.passedItems || 0,
    inspection.failedItems || 0,
    inspection.lightsStatus || '',
    inspection.notes || '',
    inspection.submittedAt || new Date().toISOString(),
    JSON.stringify(inspection.sections || [])
  ];
  
  // Append to sheet
  sheet.appendRow(rowData);
  
  // Get the row number of the new entry
  const lastRow = sheet.getLastRow();
  
  // Apply conditional formatting for status
  const statusCell = sheet.getRange(lastRow, 11); // Overall Status column
  if (inspection.overallStatus === 'fail') {
    statusCell.setBackground('#ffcdd2').setFontColor('#c62828');
  } else {
    statusCell.setBackground('#c8e6c9').setFontColor('#2e7d32');
  }
  
  // Apply conditional formatting for lights status
  const lightsCell = sheet.getRange(lastRow, 16); // Lights Status column
  if (inspection.lightsStatus === 'fail') {
    lightsCell.setBackground('#ffcdd2').setFontColor('#c62828');
  } else if (inspection.lightsStatus === 'pass') {
    lightsCell.setBackground('#c8e6c9').setFontColor('#2e7d32');
  }
  
  return { success: true, row: lastRow };
}

/**
 * Gets all inspections from the sheet
 */
function getAllInspections() {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  
  // If only headers exist, return empty array
  if (lastRow <= HEADER_ROW) {
    return [];
  }
  
  // Get all data rows
  const dataRange = sheet.getRange(HEADER_ROW + 1, 1, lastRow - HEADER_ROW, HEADERS.length);
  const data = dataRange.getValues();
  
  // Convert to array of objects
  const inspections = data.map((row, index) => {
    let sections = [];
    try {
      if (row[18]) {
        sections = JSON.parse(row[18]);
      }
    } catch (e) {
      console.log('Error parsing sections for row ' + (index + HEADER_ROW + 1));
    }
    
    return {
      id: row[0],
      date: row[1],
      time: row[2],
      driverName: row[3],
      driverId: row[4],
      vehicleName: row[5],
      vehicleId: row[6],
      warehouseCode: row[7],
      warehouseName: row[8],
      mileage: row[9],
      overallStatus: row[10],
      score: row[11],
      totalItems: row[12],
      passedItems: row[13],
      failedItems: row[14],
      lightsStatus: row[15],
      notes: row[16],
      submittedAt: row[17],
      sections: sections,
      rowNumber: index + HEADER_ROW + 1
    };
  }).filter(insp => insp.id); // Filter out empty rows
  
  return inspections;
}

/**
 * Deletes an inspection by ID
 * Used by the delete API endpoint
 */
function deleteInspection(inspectionId) {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= HEADER_ROW) {
    return { success: false, error: 'No inspections found' };
  }
  
  // Find the row with this ID
  const idColumn = sheet.getRange(HEADER_ROW + 1, 1, lastRow - HEADER_ROW, 1).getValues();
  
  for (let i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] === inspectionId) {
      const rowToDelete = i + HEADER_ROW + 1;
      sheet.deleteRow(rowToDelete);
      return { success: true, deletedRow: rowToDelete };
    }
  }
  
  return { success: false, error: 'Inspection not found' };
}

/**
 * Test function - run this to verify the script is working
 */
function testScript() {
  // Test getting the sheet
  const sheet = getOrCreateSheet();
  console.log('Sheet name: ' + sheet.getName());
  console.log('Last row: ' + sheet.getLastRow());
  
  // Test getting inspections
  const inspections = getAllInspections();
  console.log('Total inspections: ' + inspections.length);
  
  if (inspections.length > 0) {
    console.log('First inspection ID: ' + inspections[0].id);
    console.log('First inspection driver: ' + inspections[0].driverName);
  }
}
