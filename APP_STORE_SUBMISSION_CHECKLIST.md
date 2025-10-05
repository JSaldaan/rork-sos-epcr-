# iOS App Store Submission Checklist

## Pre-Submission Requirements ✅

### 1. App Configuration
- [x] Bundle identifier: com.hamadmedical.epcr
- [x] App name: SOS ePCR
- [x] Version: 1.0.0
- [x] Build number: 1
- [x] Device family: iPhone only
- [x] Orientation: Portrait only
- [x] Full screen: Required

### 2. Permissions & Privacy
- [x] Camera permission with clear description
- [x] Microphone permission with clear description
- [x] Location permission with clear description
- [x] Photo library permission with clear description
- [x] Health data permissions (optional)
- [x] No tracking permissions
- [x] Privacy policy URL configured

### 3. Security & Compliance
- [x] Encryption compliance (ITSAppUsesNonExemptEncryption: false)
- [x] App Transport Security configured
- [x] HTTPS only connections
- [x] No arbitrary loads
- [x] TLS 1.2+ minimum

### 4. App Store Connect Setup
- [ ] Create app in App Store Connect
- [ ] Upload app icon (1024x1024)
- [ ] Upload screenshots for all required sizes
- [ ] Add app description
- [ ] Set keywords
- [ ] Select category: Medical
- [ ] Set age rating: 17+
- [ ] Add privacy policy URL
- [ ] Add support URL
- [ ] Add marketing URL (optional)

### 5. Build & Submission
- [ ] Update EAS project ID in app.json
- [ ] Configure Apple ID and Team ID in eas.json
- [ ] Build production version: `eas build --platform ios --profile production`
- [ ] Test on physical device
- [ ] Submit to App Store: `eas submit --platform ios --profile production`

## Required Information for App Store Connect

### App Information
```
Name: SOS ePCR
Subtitle: Emergency Patient Care Reporting
Description: Emergency Patient Care Reporting (ePCR) system for medical professionals to document patient care, vital signs, and emergency medical incidents.

Keywords: medical, emergency, healthcare, patient care, medical records, EMS, paramedic

Category: Medical
Age Rating: 17+ (Medical/Treatment Information)
```

### Privacy Information
```
Data Collection:
- Camera: For capturing patient care photos
- Microphone: For recording voice notes
- Location: For incident location recording
- Photos: For attaching images to reports

Data Usage: Medical documentation and patient care reporting
Data Sharing: No third-party sharing
Data Retention: Local storage with secure deletion
```

### Contact Information
```
Developer: Hamad Medical Corporation
Support Email: [Your Support Email]
Privacy Policy: https://rork.com/privacy-policy
Support URL: https://rork.com/support
Marketing URL: https://rork.com/epcr
```

## Build Commands

### Development Build
```bash
eas build --platform ios --profile development
```

### Production Build
```bash
eas build --platform ios --profile production
```

### Submit to App Store
```bash
eas submit --platform ios --profile production
```

## Common Issues & Solutions

### 1. Build Errors
- Ensure all dependencies are properly installed
- Check for deprecated APIs
- Verify signing certificates

### 2. App Store Rejection
- Review rejection reason carefully
- Address all feedback points
- Test thoroughly before resubmission

### 3. Privacy Issues
- Ensure all permission descriptions are clear
- Provide privacy policy URL
- Be transparent about data usage

## Post-Submission

### 1. Monitor Status
- Check App Store Connect for review status
- Respond to any review feedback
- Monitor for approval notification

### 2. After Approval
- App will be available for download
- Monitor for user feedback
- Plan for future updates

### 3. Updates
- Use same submission process
- Increment version number
- Test thoroughly before submission

## Support Resources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
