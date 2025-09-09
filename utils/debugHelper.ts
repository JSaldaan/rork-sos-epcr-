/**
 * Debug Helper for PCR App
 * This utility helps debug and verify data integrity
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export class DebugHelper {
  static async verifySignatures(pcrId: string): Promise<void> {
    try {
      console.log('=== SIGNATURE VERIFICATION ===');
      
      // Load completed PCRs
      const pcrsData = await AsyncStorage.getItem('completedPCRs');
      if (!pcrsData) {
        console.log('No PCRs found');
        return;
      }
      
      const pcrs = JSON.parse(pcrsData);
      const pcr = pcrs.find((p: any) => p.id === pcrId);
      
      if (!pcr) {
        console.log(`PCR ${pcrId} not found`);
        return;
      }
      
      // Check healthcare provider signatures
      console.log('Healthcare Provider Signatures:');
      if (pcr.signatureInfo.nurseSignaturePaths) {
        console.log('✓ Nurse signature present:', 
          pcr.signatureInfo.nurseSignaturePaths.substring(0, 50) + '...');
      } else {
        console.log('✗ Nurse signature missing');
      }
      
      if (pcr.signatureInfo.doctorSignaturePaths) {
        console.log('✓ Doctor signature present:', 
          pcr.signatureInfo.doctorSignaturePaths.substring(0, 50) + '...');
      } else {
        console.log('✗ Doctor signature missing');
      }
      
      if (pcr.signatureInfo.othersSignaturePaths) {
        console.log('✓ Other signature present:', 
          pcr.signatureInfo.othersSignaturePaths.substring(0, 50) + '...');
      } else {
        console.log('✗ Other signature missing');
      }
      
      // Check refusal signatures
      console.log('\nRefusal Signatures:');
      if (pcr.refusalInfo.patientSignaturePaths) {
        console.log('✓ Patient refusal signature present:', 
          pcr.refusalInfo.patientSignaturePaths.substring(0, 50) + '...');
      } else {
        console.log('✗ Patient refusal signature missing');
      }
      
      if (pcr.refusalInfo.witnessSignaturePaths) {
        console.log('✓ Witness signature present:', 
          pcr.refusalInfo.witnessSignaturePaths.substring(0, 50) + '...');
      } else {
        console.log('✗ Witness signature missing');
      }
      
      if (pcr.refusalInfo.paramedicSignaturePaths) {
        console.log('✓ Paramedic signature present:', 
          pcr.refusalInfo.paramedicSignaturePaths.substring(0, 50) + '...');
      } else {
        console.log('✗ Paramedic signature missing');
      }
      
      // Check admin signatures collection
      const signaturesData = await AsyncStorage.getItem('admin_signatures');
      if (signaturesData) {
        const signatures = JSON.parse(signaturesData);
        const pcrSignatures = signatures.filter((s: any) => 
          s.signature_id.includes(pcrId)
        );
        console.log(`\nAdmin Signatures Collection: ${pcrSignatures.length} signatures found`);
        pcrSignatures.forEach((sig: any) => {
          console.log(`- ${sig.signer_role}: ${sig.signer_name} (${sig.signature_id})`);
          console.log(`  Image data: ${sig.signature_image ? 'Present' : 'Missing'}`);
        });
      }
      
      console.log('=== END SIGNATURE VERIFICATION ===');
    } catch (error) {
      console.error('Error verifying signatures:', error);
    }
  }
  
  static async verifyECGCaptures(pcrId: string): Promise<void> {
    try {
      console.log('=== ECG CAPTURE VERIFICATION ===');
      
      // Load completed PCRs
      const pcrsData = await AsyncStorage.getItem('completedPCRs');
      if (!pcrsData) {
        console.log('No PCRs found');
        return;
      }
      
      const pcrs = JSON.parse(pcrsData);
      const pcr = pcrs.find((p: any) => p.id === pcrId);
      
      if (!pcr) {
        console.log(`PCR ${pcrId} not found`);
        return;
      }
      
      // Check ECG captures in vitals
      const ecgVitals = pcr.vitals.filter((v: any) => v.ecgCapture);
      console.log(`ECG Captures in Vitals: ${ecgVitals.length}`);
      
      ecgVitals.forEach((vital: any, index: number) => {
        console.log(`\nECG ${index + 1}:`);
        console.log(`- Timestamp: ${vital.ecgCaptureTimestamp || vital.timestamp}`);
        console.log(`- Image data type: ${vital.ecgCapture.substring(0, 30)}`);
        console.log(`- Image size: ${Math.round(vital.ecgCapture.length / 1024)}KB`);
        console.log(`- Is base64 image: ${vital.ecgCapture.startsWith('data:image')}`);
      });
      
      // Check admin ECG collection
      const ecgsData = await AsyncStorage.getItem('admin_ecgs');
      if (ecgsData) {
        const ecgs = JSON.parse(ecgsData);
        const pcrECGs = ecgs.filter((e: any) => e.ecg_id.includes(pcrId));
        console.log(`\nAdmin ECG Collection: ${pcrECGs.length} ECGs found`);
        
        const consolidatedECG = pcrECGs.find((e: any) => 
          e.ecg_id.includes('CONSOLIDATED')
        );
        
        if (consolidatedECG) {
          console.log('\n✓ Consolidated ECG record found');
          try {
            const consolidatedData = JSON.parse(consolidatedECG.image_ecg);
            console.log(`  Contains ${consolidatedData.length} ECG images`);
          } catch {
            console.log('  Raw ECG data present');
          }
        }
      }
      
      console.log('=== END ECG VERIFICATION ===');
    } catch (error) {
      console.error('Error verifying ECG captures:', error);
    }
  }
  
  static async verifyTraumaData(pcrId: string): Promise<void> {
    try {
      console.log('=== TRAUMA DATA VERIFICATION ===');
      
      // Load completed PCRs
      const pcrsData = await AsyncStorage.getItem('completedPCRs');
      if (!pcrsData) {
        console.log('No PCRs found');
        return;
      }
      
      const pcrs = JSON.parse(pcrsData);
      const pcr = pcrs.find((p: any) => p.id === pcrId);
      
      if (!pcr) {
        console.log(`PCR ${pcrId} not found`);
        return;
      }
      
      // Check trauma injuries
      if (pcr.incidentInfo.traumaInjuries && pcr.incidentInfo.traumaInjuries.length > 0) {
        console.log(`✓ Trauma injuries found: ${pcr.incidentInfo.traumaInjuries.length}`);
        pcr.incidentInfo.traumaInjuries.forEach((injury: any, index: number) => {
          console.log(`\nInjury ${index + 1}:`);
          console.log(`- Body part: ${injury.bodyPart}`);
          console.log(`- View: ${injury.view}`);
          console.log(`- Severity: ${injury.severity}`);
          console.log(`- Description: ${injury.description}`);
        });
      } else {
        console.log('✗ No trauma injuries recorded');
      }
      
      // Check admin attachments for trauma data
      const attachmentsData = await AsyncStorage.getItem('admin_attachments');
      if (attachmentsData) {
        const attachments = JSON.parse(attachmentsData);
        const traumaAttachment = attachments.find((a: any) => 
          a.attachment_id === `ATT_${pcrId}_TRAUMA`
        );
        
        if (traumaAttachment) {
          console.log('\n✓ Trauma attachment found in admin data');
          try {
            const traumaData = JSON.parse(traumaAttachment.file);
            console.log(`  Injuries: ${traumaData.injuries?.length || 0}`);
            console.log(`  Has diagnosis: ${!!traumaData.provisionalDiagnosis}`);
            console.log(`  Has assessment: ${!!traumaData.assessment}`);
          } catch {
            console.log('  Raw trauma data present');
          }
        }
      }
      
      console.log('=== END TRAUMA VERIFICATION ===');
    } catch (error) {
      console.error('Error verifying trauma data:', error);
    }
  }
  
  static async verifyCompleteReport(pcrId: string): Promise<void> {
    console.log('\n========================================');
    console.log('COMPLETE PCR VERIFICATION REPORT');
    console.log(`PCR ID: ${pcrId}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log('========================================\n');
    
    await this.verifySignatures(pcrId);
    console.log('\n');
    await this.verifyECGCaptures(pcrId);
    console.log('\n');
    await this.verifyTraumaData(pcrId);
    
    console.log('\n========================================');
    console.log('END OF VERIFICATION REPORT');
    console.log('========================================\n');
  }
  
  static async listAllPCRs(): Promise<void> {
    try {
      const pcrsData = await AsyncStorage.getItem('completedPCRs');
      if (!pcrsData) {
        console.log('No PCRs found in storage');
        return;
      }
      
      const pcrs = JSON.parse(pcrsData);
      console.log('\n=== ALL PCRS IN SYSTEM ===');
      console.log(`Total PCRs: ${pcrs.length}`);
      
      pcrs.forEach((pcr: any, index: number) => {
        console.log(`\n${index + 1}. PCR ID: ${pcr.id}`);
        console.log(`   Patient: ${pcr.patientInfo.firstName} ${pcr.patientInfo.lastName}`);
        console.log(`   Submitted: ${new Date(pcr.submittedAt).toLocaleString()}`);
        console.log(`   By: ${pcr.submittedBy?.name || 'Unknown'}`);
        console.log(`   Has refusal: ${!!pcr.refusalInfo.patientName}`);
        console.log(`   ECG captures: ${pcr.vitals.filter((v: any) => v.ecgCapture).length}`);
        console.log(`   Trauma injuries: ${pcr.incidentInfo.traumaInjuries?.length || 0}`);
      });
      
      console.log('\n=== END PCR LIST ===');
    } catch (error) {
      console.error('Error listing PCRs:', error);
    }
  }
}

// Export for use in development console
if (typeof window !== 'undefined') {
  (window as any).DebugHelper = DebugHelper;
}