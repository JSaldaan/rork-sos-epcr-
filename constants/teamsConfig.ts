export const TEAMS_CONFIG = {
  // Using Logic App for Teams integration
  webhookUrl: 'https://prod-206.westeurope.logic.azure.com:443/workflows/6e48443b94544b23a40b1f782fa0a038/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FW3roIUmACnjVglLatR359EmIFGukd7k8Pv4Z4h8-ks',
  
  // Channel information for display purposes
  channelName: 'SOS_Training & Development',
  teamName: 'Operations',
  
  // Message formatting
  messageColor: '0078D4', // Teams blue color
  
  // Enable/disable Teams integration
  enabled: true // Teams integration is now enabled
};

export const formatPCRForTeams = (pcrData: any) => {
  const sections = [];
  
  // Patient Information
  if (pcrData.patientInfo) {
    const facts = [];
    if (pcrData.patientInfo.name) facts.push({ name: 'Name', value: pcrData.patientInfo.name });
    if (pcrData.patientInfo.age) facts.push({ name: 'Age', value: pcrData.patientInfo.age });
    if (pcrData.patientInfo.gender) facts.push({ name: 'Gender', value: pcrData.patientInfo.gender });
    if (pcrData.patientInfo.mrn) facts.push({ name: 'MRN', value: pcrData.patientInfo.mrn });
    
    if (facts.length > 0) {
      sections.push({
        activityTitle: 'Patient Information',
        facts
      });
    }
  }
  
  // Vital Signs
  if (pcrData.vitals && pcrData.vitals.length > 0) {
    const latestVitals = pcrData.vitals[pcrData.vitals.length - 1];
    const facts = [];
    if (latestVitals.bloodPressure) facts.push({ name: 'Blood Pressure', value: latestVitals.bloodPressure });
    if (latestVitals.pulse) facts.push({ name: 'Pulse', value: latestVitals.pulse });
    if (latestVitals.respiratoryRate) facts.push({ name: 'Respiratory Rate', value: latestVitals.respiratoryRate });
    if (latestVitals.oxygenSaturation) facts.push({ name: 'O2 Saturation', value: latestVitals.oxygenSaturation });
    if (latestVitals.temperature) facts.push({ name: 'Temperature', value: latestVitals.temperature });
    if (latestVitals.bloodGlucose) facts.push({ name: 'Blood Glucose', value: latestVitals.bloodGlucose });
    
    if (facts.length > 0) {
      sections.push({
        activityTitle: 'Latest Vital Signs',
        facts
      });
    }
  }
  
  // Transport Information
  if (pcrData.transport) {
    const facts = [];
    if (pcrData.transport.pickupLocation) facts.push({ name: 'Pickup', value: pcrData.transport.pickupLocation });
    if (pcrData.transport.destination) facts.push({ name: 'Destination', value: pcrData.transport.destination });
    if (pcrData.transport.priority) facts.push({ name: 'Priority', value: pcrData.transport.priority });
    if (pcrData.transport.transportMode) facts.push({ name: 'Mode', value: pcrData.transport.transportMode });
    
    if (facts.length > 0) {
      sections.push({
        activityTitle: 'Transport Details',
        facts
      });
    }
  }
  
  // Chief Complaint and Notes
  if (pcrData.chiefComplaint || pcrData.notes) {
    const facts = [];
    if (pcrData.chiefComplaint) facts.push({ name: 'Chief Complaint', value: pcrData.chiefComplaint });
    if (pcrData.notes) facts.push({ name: 'Notes', value: pcrData.notes });
    
    if (facts.length > 0) {
      sections.push({
        activityTitle: 'Clinical Information',
        facts
      });
    }
  }
  
  // Refusal Information
  if (pcrData.refusal) {
    const facts = [];
    if (pcrData.refusal.reason) facts.push({ name: 'Refusal Reason', value: pcrData.refusal.reason });
    if (pcrData.refusal.witnessName) facts.push({ name: 'Witness', value: pcrData.refusal.witnessName });
    if (pcrData.refusal.hasSignature) facts.push({ name: 'Signature', value: '✓ Collected' });
    
    if (facts.length > 0) {
      sections.push({
        activityTitle: 'Patient Refusal',
        facts
      });
    }
  }
  
  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    'summary': `PCR Report - ${pcrData.patientInfo?.name || 'Unknown Patient'}`,
    'themeColor': TEAMS_CONFIG.messageColor,
    'title': '🚑 New PCR Report Submitted',
    'sections': sections,
    'potentialAction': [
      {
        '@type': 'OpenUri',
        'name': 'View Full Report',
        'targets': [
          {
            'os': 'default',
            'uri': 'https://your-pcr-system.com/reports' // Update with your actual system URL
          }
        ]
      }
    ]
  };
};

// Simple test with minimal data
export const testMinimalConnection = async (): Promise<{ success: boolean; error?: string; details?: any }> => {
  console.log('\n=== MINIMAL CONNECTION TEST ===');
  
  try {
    const simplePayload = {
      test: true,
      message: 'Hello from PCR app'
    };
    
    const response = await fetch(TEAMS_CONFIG.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(simplePayload)
    });
    
    const responseText = await response.text();
    
    console.log('Minimal test result:', {
      status: response.status,
      statusText: response.statusText,
      response: responseText
    });
    
    return {
      success: response.status >= 200 && response.status < 300,
      details: {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      }
    };
  } catch (error: any) {
    console.error('Minimal test failed:', error);
    return {
      success: false,
      error: error.message,
      details: { error: error.toString() }
    };
  }
};

// Test function to verify Logic App connection
export const testLogicAppConnection = async (): Promise<{ success: boolean; error?: string; details?: any }> => {
  console.log('\n=== TESTING LOGIC APP CONNECTION ===');
  console.log('Webhook URL:', TEAMS_CONFIG.webhookUrl);
  console.log('Testing with minimal payload...');
  
  try {
    const testMessage = {
      test: true,
      message: 'Test connection from PCR app',
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending test payload:', JSON.stringify(testMessage, null, 2));
    
    const response = await fetch(TEAMS_CONFIG.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });
    
    let responseBody = '';
    try {
      responseBody = await response.text();
    } catch (readError) {
      responseBody = 'Could not read response body';
    }
    
    console.log('\n=== TEST RESPONSE ===');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Body:', responseBody || '(empty)');
    console.log('====================\n');
    
    if (response.status >= 200 && response.status < 300) {
      return { 
        success: true, 
        details: { 
          status: response.status, 
          statusText: response.statusText,
          response: responseBody || 'Success'
        } 
      };
    } else {
      return { 
        success: false, 
        error: `Status ${response.status}: ${response.statusText}`, 
        details: { 
          status: response.status, 
          response: responseBody 
        }
      };
    }
  } catch (error: any) {
    console.error('Test failed:', error);
    return { 
      success: false, 
      error: error.message,
      details: { error: error.toString() }
    };
  }
};

export const sendToTeams = async (pcrData: any): Promise<{ success: boolean; error?: string; details?: any }> => {
  console.log('\n🚀 STARTING TEAMS SUBMISSION');
  console.log('Teams Config Enabled:', TEAMS_CONFIG.enabled);
  console.log('Webhook URL Present:', !!TEAMS_CONFIG.webhookUrl);
  console.log('PCR Data Keys:', Object.keys(pcrData));
  
  if (!TEAMS_CONFIG.enabled || !TEAMS_CONFIG.webhookUrl) {
    console.log('❌ Teams integration is disabled or webhook URL is not configured');
    return { success: false, error: 'Teams integration not configured' };
  }
  
  try {
    // Create a formatted message for Teams
    const currentTime = new Date().toLocaleString();
    
    // Build vitals summary
    let vitalsText = 'No vitals recorded';
    if (pcrData.vitals && pcrData.vitals.length > 0) {
      const latest = pcrData.vitals[pcrData.vitals.length - 1];
      vitalsText = `BP: ${latest.bloodPressure || 'N/A'}, HR: ${latest.pulse || 'N/A'}, RR: ${latest.respiratoryRate || 'N/A'}, O2: ${latest.oxygenSaturation || 'N/A'}%`;
    }
    
    // Create a comprehensive payload for Logic Apps
    const payload = {
      // Simple text message for basic processing
      text: `🚑 NEW PCR REPORT - ${currentTime}\n\nPATIENT: ${pcrData.patientInfo?.name || 'Unknown'}\nAge: ${pcrData.patientInfo?.age || 'N/A'} | Gender: ${pcrData.patientInfo?.gender || 'N/A'} | MRN: ${pcrData.patientInfo?.mrn || 'N/A'}\n\nCHIEF COMPLAINT: ${pcrData.chiefComplaint || 'N/A'}\n\nVITALS: ${vitalsText}\n\nTRANSPORT: ${pcrData.transport?.pickupLocation || 'N/A'} → ${pcrData.transport?.destination || 'N/A'}\nPriority: ${pcrData.transport?.priority || 'N/A'}\n\n${pcrData.refusal ? '⚠️ PATIENT REFUSAL DOCUMENTED\nReason: ' + (pcrData.refusal.reason || 'N/A') : ''}\n\nNOTES: ${pcrData.notes || 'No additional notes'}`,
      
      // Structured data for Logic App processing
      reportType: 'PCR',
      timestamp: currentTime,
      patient: {
        name: pcrData.patientInfo?.name || 'Unknown',
        age: pcrData.patientInfo?.age || 'N/A',
        gender: pcrData.patientInfo?.gender || 'N/A',
        mrn: pcrData.patientInfo?.mrn || 'N/A'
      },
      incident: {
        chiefComplaint: pcrData.chiefComplaint || 'N/A',
        location: pcrData.transport?.pickupLocation || 'N/A',
        priority: pcrData.transport?.priority || 'N/A'
      },
      transport: {
        from: pcrData.transport?.pickupLocation || 'N/A',
        to: pcrData.transport?.destination || 'N/A',
        priority: pcrData.transport?.priority || 'N/A'
      },
      vitals: {
        count: pcrData.vitals?.length || 0,
        latest: vitalsText
      },
      refusal: pcrData.refusal ? {
        hasRefusal: true,
        reason: pcrData.refusal.reason || 'N/A'
      } : {
        hasRefusal: false
      },
      
      // Full report data as backup
      fullData: pcrData
    };
    
    console.log('\n=== SENDING PCR TO LOGIC APP ===');
    console.log('Endpoint:', TEAMS_CONFIG.webhookUrl);
    console.log('Message Preview:', payload.text.substring(0, 200) + '...');
    console.log('Patient:', payload.patient.name);
    console.log('Timestamp:', payload.timestamp);
    console.log('Payload Size:', JSON.stringify(payload).length, 'bytes');
    console.log('================================\n');
    
    const response = await fetch(TEAMS_CONFIG.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'PCR-Mobile-App/1.0'
      },
      body: JSON.stringify(payload)
    });
    
    // Get response details
    let responseBody = '';
    try {
      responseBody = await response.text();
    } catch (readError) {
      responseBody = 'Could not read response body';
    }
    
    console.log('\n=== LOGIC APP RESPONSE ===');
    console.log('Status Code:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response Body:', responseBody || '(empty)');
    console.log('==========================\n');
    
    // Logic Apps typically return 200, 202 (Accepted), or 204 (No Content) on success
    if (response.status >= 200 && response.status < 300) {
      console.log('✅ PCR Report successfully sent to Logic App');
      return { 
        success: true, 
        details: { 
          status: response.status, 
          statusText: response.statusText,
          response: responseBody || 'Request accepted'
        } 
      };
    } else {
      console.error('❌ Logic App returned error status:', response.status);
      return { 
        success: false, 
        error: `Logic App returned status ${response.status}: ${response.statusText}`, 
        details: { 
          status: response.status, 
          statusText: response.statusText,
          response: responseBody 
        }
      };
    }
  } catch (error: any) {
    console.error('\n❌ ERROR sending to Logic App:', error);
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    
    // Check for network errors
    if (error.message.includes('fetch')) {
      return { 
        success: false, 
        error: 'Network error: Could not connect to Logic App. Check your internet connection.',
        details: { error: error.toString() }
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to send to Logic App',
      details: { 
        error: error.toString(),
        errorType: error.name,
        errorMessage: error.message
      }
    };
  }
};