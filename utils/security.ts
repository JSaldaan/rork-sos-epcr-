import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Crypto from 'expo-crypto';
import { usePCRStore } from '@/store/pcrStore';

/**
 * Comprehensive Security Module
 * Protects against hackers, malicious inputs, and security vulnerabilities
 */

// Security Configuration
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  PASSWORD_MIN_LENGTH: 6,
  ENCRYPTION_KEY_LENGTH: 32,
  MAX_INPUT_LENGTH: 1000,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Security Events
type SecurityEvent = 
  | 'LOGIN_ATTEMPT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'SUSPICIOUS_ACTIVITY'
  | 'DATA_ACCESS'
  | 'UNAUTHORIZED_ACCESS'
  | 'INJECTION_ATTEMPT'
  | 'SESSION_TIMEOUT'
  | 'BRUTE_FORCE_DETECTED';

interface SecurityLog {
  id: string;
  timestamp: string;
  event: SecurityEvent;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  blocked: boolean;
}

interface LoginAttempt {
  timestamp: number;
  corporationId: string;
  success: boolean;
  ipAddress?: string;
}

/**
 * Input Sanitization and Validation
 */
export class InputValidator {
  // Sanitize string input to prevent XSS and injection attacks
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    
    // Remove potentially dangerous characters
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim()
      .substring(0, SECURITY_CONFIG.MAX_INPUT_LENGTH);
  }
  
  // Validate Corporation ID format
  static validateCorporationId(id: string): boolean {
    const sanitized = this.sanitizeString(id);
    const pattern = /^[A-Z0-9]{4,20}$/; // Only alphanumeric, 4-20 chars
    return pattern.test(sanitized);
  }
  
  // Validate medical data input
  static validateMedicalInput(input: string): boolean {
    const sanitized = this.sanitizeString(input);
    // Allow medical terminology but block suspicious patterns
    const suspiciousPatterns = [
      /\b(script|javascript|eval|function)\b/i,
      /[<>"']/,
      /\b(drop|delete|insert|update|select)\s+/i, // SQL injection patterns
      /\b(union|or|and)\s+\d+\s*=\s*\d+/i,
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(sanitized));
  }
  
  // Validate vital signs numeric input
  static validateVitalSigns(value: string, type: 'bp' | 'hr' | 'temp' | 'spo2' | 'rr'): boolean {
    const sanitized = this.sanitizeString(value);
    const numericPattern = /^\d+(\.\d+)?$/;
    
    if (!numericPattern.test(sanitized)) {
      return false;
    }
    
    const num = parseFloat(sanitized);
    
    // Validate realistic medical ranges
    switch (type) {
      case 'bp':
        return num >= 40 && num <= 300; // Blood pressure
      case 'hr':
        return num >= 20 && num <= 250; // Heart rate
      case 'temp':
        return num >= 30 && num <= 45; // Temperature (Celsius)
      case 'spo2':
        return num >= 70 && num <= 100; // Oxygen saturation
      case 'rr':
        return num >= 5 && num <= 60; // Respiratory rate
      default:
        return false;
    }
  }
  
  // Validate file uploads
  static validateFileUpload(file: { uri: string; type?: string; size?: number }): boolean {
    if (!file.uri) return false;
    
    // Check file type
    if (file.type && !SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(file.type as any)) {
      return false;
    }
    
    // Check file size
    if (file.size && file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
      return false;
    }
    
    // Check for suspicious file extensions in URI
    const suspiciousExtensions = /\.(exe|bat|cmd|scr|pif|com|js|vbs|jar|app)$/i;
    if (suspiciousExtensions.test(file.uri)) {
      return false;
    }
    
    return true;
  }
}

/**
 * Encryption and Data Protection
 */
export class DataProtection {
  // Generate secure encryption key
  static async generateEncryptionKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(SECURITY_CONFIG.ENCRYPTION_KEY_LENGTH);
    return Array.from(randomBytes, (byte: number) => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Simple encryption for sensitive data (use proper encryption in production)
  static async encryptSensitiveData(data: string): Promise<string> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      // In production, use proper AES encryption
      // This is a simple obfuscation for demo purposes
      const encoded = btoa(data + key.substring(0, 8));
      return encoded;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }
  
  // Decrypt sensitive data
  static async decryptSensitiveData(encryptedData: string): Promise<string> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      // In production, use proper AES decryption
      const decoded = atob(encryptedData);
      const keyPart = key.substring(0, 8);
      return decoded.replace(keyPart, '');
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }
  
  // Get or create encryption key
  private static async getOrCreateEncryptionKey(): Promise<string> {
    let key = await AsyncStorage.getItem('encryption_key');
    if (!key) {
      key = await this.generateEncryptionKey();
      await AsyncStorage.setItem('encryption_key', key);
    }
    return key;
  }
  
  // Hash sensitive data for storage
  static async hashData(data: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return digest;
  }
  
  // Secure data wipe
  static async secureWipe(keys: string[]): Promise<void> {
    try {
      // Overwrite with random data before deletion
      for (const key of keys) {
        const randomData = await Crypto.getRandomBytesAsync(1024);
        const randomString = Array.from(randomData, (byte: number) => byte.toString(16)).join('');
        await AsyncStorage.setItem(key, randomString);
      }
      
      // Then remove the keys
      await AsyncStorage.multiRemove(keys);
      console.log('Secure wipe completed for', keys.length, 'keys');
    } catch (error) {
      console.error('Secure wipe failed:', error);
      throw error;
    }
  }
}

/**
 * Session Security Manager
 */
export class SessionSecurity {
  private static sessionTimer: NodeJS.Timeout | null = null;
  
  // Start session monitoring
  static startSessionMonitoring(): void {
    this.resetSessionTimer();
    console.log('Session security monitoring started');
  }
  
  // Reset session timer
  static resetSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    
    this.sessionTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, SECURITY_CONFIG.SESSION_TIMEOUT) as any;
  }
  
  // Handle session timeout
  private static async handleSessionTimeout(): Promise<void> {
    console.log('Session timeout detected');
    await SecurityLogger.logEvent('SESSION_TIMEOUT', 'Session expired due to inactivity', 'MEDIUM');
    
    // Force logout
    const { staffLogout } = usePCRStore.getState();
    await staffLogout();
  }
  
  // Stop session monitoring
  static stopSessionMonitoring(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    console.log('Session security monitoring stopped');
  }
  
  // Validate session integrity
  static async validateSession(): Promise<boolean> {
    try {
      const session = await AsyncStorage.getItem('currentSession');
      if (!session) return false;
      
      const sessionData = JSON.parse(session);
      const loginTime = new Date(sessionData.loginTime).getTime();
      const now = Date.now();
      
      // Check if session is expired
      if (now - loginTime > SECURITY_CONFIG.SESSION_TIMEOUT) {
        await this.handleSessionTimeout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }
}

/**
 * Brute Force Protection
 */
export class BruteForceProtection {
  // Check if account is locked
  static async isAccountLocked(corporationId: string): Promise<boolean> {
    try {
      const lockData = await AsyncStorage.getItem(`lock_${corporationId}`);
      if (!lockData) return false;
      
      const { lockedUntil } = JSON.parse(lockData);
      const now = Date.now();
      
      if (now < lockedUntil) {
        return true;
      } else {
        // Lock expired, remove it
        await AsyncStorage.removeItem(`lock_${corporationId}`);
        return false;
      }
    } catch (error) {
      console.error('Error checking account lock:', error);
      return false;
    }
  }
  
  // Record login attempt
  static async recordLoginAttempt(corporationId: string, success: boolean): Promise<void> {
    try {
      const sanitizedId = InputValidator.sanitizeString(corporationId);
      const attemptsKey = `attempts_${sanitizedId}`;
      
      let attempts: LoginAttempt[] = [];
      const stored = await AsyncStorage.getItem(attemptsKey);
      if (stored) {
        attempts = JSON.parse(stored);
      }
      
      // Add new attempt
      attempts.push({
        timestamp: Date.now(),
        corporationId: sanitizedId,
        success,
      });
      
      // Keep only recent attempts (last hour)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      attempts = attempts.filter(attempt => attempt.timestamp > oneHourAgo);
      
      await AsyncStorage.setItem(attemptsKey, JSON.stringify(attempts));
      
      // Check for brute force
      if (!success) {
        await this.checkBruteForce(sanitizedId, attempts);
      }
    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  }
  
  // Check for brute force attack
  private static async checkBruteForce(corporationId: string, attempts: LoginAttempt[]): Promise<void> {
    const failedAttempts = attempts.filter(attempt => !attempt.success);
    
    if (failedAttempts.length >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      // Lock the account
      const lockUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
      await AsyncStorage.setItem(`lock_${corporationId}`, JSON.stringify({
        lockedUntil: lockUntil,
        reason: 'Brute force protection',
      }));
      
      await SecurityLogger.logEvent(
        'BRUTE_FORCE_DETECTED',
        `Account ${corporationId} locked due to ${failedAttempts.length} failed attempts`,
        'CRITICAL',
        true
      );
      
      console.log(`Security: Account ${corporationId} temporarily locked for protection`);
    }
  }
  
  // Get remaining lockout time
  static async getRemainingLockoutTime(corporationId: string): Promise<number> {
    try {
      const lockData = await AsyncStorage.getItem(`lock_${corporationId}`);
      if (!lockData) return 0;
      
      const { lockedUntil } = JSON.parse(lockData);
      const remaining = lockedUntil - Date.now();
      
      return Math.max(0, remaining);
    } catch (error) {
      console.error('Error getting lockout time:', error);
      return 0;
    }
  }
  
  // Clear all account locks (admin function)
  static async clearAllLocks(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const lockKeys = allKeys.filter(key => key.startsWith('lock_') || key.startsWith('attempts_'));
      
      if (lockKeys.length > 0) {
        await AsyncStorage.multiRemove(lockKeys);
        console.log(`Cleared ${lockKeys.length} account locks and attempt records`);
        
        await SecurityLogger.logEvent(
          'SUSPICIOUS_ACTIVITY',
          `Admin cleared ${lockKeys.length} account locks`,
          'MEDIUM'
        );
      }
    } catch (error) {
      console.error('Error clearing account locks:', error);
      throw error;
    }
  }
  
  // Clear specific account lock
  static async clearAccountLock(corporationId: string): Promise<void> {
    try {
      const sanitizedId = InputValidator.sanitizeString(corporationId);
      await AsyncStorage.removeItem(`lock_${sanitizedId}`);
      await AsyncStorage.removeItem(`attempts_${sanitizedId}`);
      
      console.log(`Cleared lock for account: ${sanitizedId}`);
      
      await SecurityLogger.logEvent(
        'SUSPICIOUS_ACTIVITY',
        `Admin cleared lock for account: ${sanitizedId}`,
        'MEDIUM'
      );
    } catch (error) {
      console.error('Error clearing account lock:', error);
      throw error;
    }
  }
}

/**
 * Security Event Logger
 */
export class SecurityLogger {
  // Log security event
  static async logEvent(
    event: SecurityEvent,
    details: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    blocked: boolean = false
  ): Promise<void> {
    try {
      const log: SecurityLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        event,
        details: InputValidator.sanitizeString(details),
        severity,
        blocked,
      };
      
      // Store security log
      const logs = await this.getSecurityLogs();
      logs.push(log);
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      await AsyncStorage.setItem('security_logs', JSON.stringify(logs));
      
      // Log to console for debugging (use appropriate log level)
      if (severity === 'CRITICAL') {
        console.error(`[SECURITY ${severity}] ${event}: ${details}`);
        await this.handleCriticalEvent(log);
      } else if (severity === 'HIGH') {
        console.warn(`[SECURITY ${severity}] ${event}: ${details}`);
      } else {
        console.log(`[SECURITY ${severity}] ${event}: ${details}`);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
  
  // Get security logs
  static async getSecurityLogs(): Promise<SecurityLog[]> {
    try {
      const stored = await AsyncStorage.getItem('security_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get security logs:', error);
      return [];
    }
  }
  
  // Handle critical security events
  private static async handleCriticalEvent(log: SecurityLog): Promise<void> {
    console.warn('SECURITY EVENT:', log.event, '-', log.details);
    
    // In production, you might want to:
    // - Send alert to security team
    // - Lock down the system
    // - Force logout all users
    // - Backup current state
    
    // For now, just ensure the event is prominently logged
    try {
      const criticalLogs = await AsyncStorage.getItem('critical_security_events') || '[]';
      const events = JSON.parse(criticalLogs);
      events.push(log);
      await AsyncStorage.setItem('critical_security_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store critical security event:', error);
    }
  }
  
  // Clear old security logs
  static async clearOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      const logs = await this.getSecurityLogs();
      const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      const filteredLogs = logs.filter(log => 
        new Date(log.timestamp).getTime() > cutoffDate
      );
      
      await AsyncStorage.setItem('security_logs', JSON.stringify(filteredLogs));
      console.log(`Cleared ${logs.length - filteredLogs.length} old security logs`);
    } catch (error) {
      console.error('Failed to clear old security logs:', error);
    }
  }
}

/**
 * Malware and Virus Protection
 */
export class MalwareProtection {
  // Scan input for malicious patterns
  static scanInput(input: string): { safe: boolean; threats: string[] } {
    const threats: string[] = [];
    const sanitized = InputValidator.sanitizeString(input);
    
    // Common malware signatures
    const malwarePatterns = [
      { pattern: /\b(eval|exec|system|shell_exec)\s*\(/i, threat: 'Code execution attempt' },
      { pattern: /<script[^>]*>.*?<\/script>/gi, threat: 'Script injection' },
      { pattern: /javascript:\s*[^\s]/i, threat: 'JavaScript protocol' },
      { pattern: /\b(union|select|insert|delete|drop|update)\s+/i, threat: 'SQL injection' },
      { pattern: /\.\.[\\/\\]/g, threat: 'Directory traversal' },
      { pattern: /\b(cmd|powershell|bash|sh)\s+/i, threat: 'Command injection' },
      { pattern: /\b(virus|malware|trojan|worm|backdoor)\b/i, threat: 'Malware reference' },
    ];
    
    for (const { pattern, threat } of malwarePatterns) {
      if (pattern.test(sanitized)) {
        threats.push(threat);
      }
    }
    
    return {
      safe: threats.length === 0,
      threats,
    };
  }
  
  // Scan file for malicious content
  static async scanFile(file: { uri: string; type?: string }): Promise<{ safe: boolean; threats: string[] }> {
    const threats: string[] = [];
    
    // Check file extension
    const dangerousExtensions = /\.(exe|bat|cmd|scr|pif|com|js|vbs|jar|app|dmg|pkg)$/i;
    if (dangerousExtensions.test(file.uri)) {
      threats.push('Dangerous file extension');
    }
    
    // Check MIME type
    if (file.type) {
      const dangerousMimeTypes = [
        'application/x-executable',
        'application/x-msdownload',
        'application/x-msdos-program',
        'text/javascript',
        'application/javascript',
      ];
      
      if (dangerousMimeTypes.includes(file.type)) {
        threats.push('Dangerous MIME type');
      }
    }
    
    return {
      safe: threats.length === 0,
      threats,
    };
  }
}

/**
 * Security Middleware for API calls
 */
export class SecurityMiddleware {
  // Validate and sanitize API request
  static validateApiRequest(data: any): { valid: boolean; sanitized: any; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Recursively sanitize object
      const sanitizeObject = (obj: any, path: string = ''): any => {
        if (typeof obj === 'string') {
          const scan = MalwareProtection.scanInput(obj);
          if (!scan.safe) {
            errors.push(`Malicious content detected in ${path}: ${scan.threats.join(', ')}`);
            return '';
          }
          return InputValidator.sanitizeString(obj);
        }
        
        if (Array.isArray(obj)) {
          return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`));
        }
        
        if (obj && typeof obj === 'object') {
          const result: any = {};
          for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = InputValidator.sanitizeString(key);
            result[sanitizedKey] = sanitizeObject(value, path ? `${path}.${sanitizedKey}` : sanitizedKey);
          }
          return result;
        }
        
        return obj;
      };
      
      const sanitizedData = sanitizeObject(data);
      
      return {
        valid: errors.length === 0,
        sanitized: sanitizedData,
        errors,
      };
    } catch (error) {
      console.error('API request validation failed:', error);
      return {
        valid: false,
        sanitized: {},
        errors: ['Request validation failed'],
      };
    }
  }
}

/**
 * Main Security Manager
 */
export class SecurityManager {
  private static initialized = false;
  
  // Initialize security system
  static async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      console.log('Initializing security system...');
      
      // Start session monitoring
      SessionSecurity.startSessionMonitoring();
      
      // Clear old security logs
      await SecurityLogger.clearOldLogs();
      
      // Log initialization
      await SecurityLogger.logEvent(
        'SUSPICIOUS_ACTIVITY',
        'Security system initialized',
        'LOW'
      );
      
      this.initialized = true;
      console.log('Security system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize security system:', error);
      throw error;
    }
  }
  
  // Shutdown security system
  static shutdown(): void {
    SessionSecurity.stopSessionMonitoring();
    this.initialized = false;
    console.log('Security system shutdown');
  }
  
  // Perform security health check
  static async healthCheck(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // Check for critical security events
      const criticalEvents = await AsyncStorage.getItem('critical_security_events');
      if (criticalEvents) {
        const events = JSON.parse(criticalEvents);
        if (events.length > 0) {
          issues.push(`${events.length} critical security events detected`);
          recommendations.push('Review critical security events immediately');
        }
      }
      
      // Check session validity
      const sessionValid = await SessionSecurity.validateSession();
      if (!sessionValid) {
        issues.push('Invalid or expired session detected');
        recommendations.push('Force user re-authentication');
      }
      
      // Check for locked accounts
      const allKeys = await AsyncStorage.getAllKeys();
      const lockKeys = allKeys.filter(key => key.startsWith('lock_'));
      if (lockKeys.length > 0) {
        issues.push(`${lockKeys.length} accounts currently locked`);
        recommendations.push('Review locked accounts for potential attacks');
      }
      
      // Determine overall status
      let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
      if (issues.length > 0) {
        status = issues.some(issue => issue.includes('critical')) ? 'CRITICAL' : 'WARNING';
      }
      
      return { status, issues, recommendations };
    } catch (error) {
      console.error('Security health check failed:', error);
      return {
        status: 'CRITICAL',
        issues: ['Security health check failed'],
        recommendations: ['Restart security system'],
      };
    }
  }
}

// Export all security utilities
export {
  SECURITY_CONFIG,
  type SecurityEvent,
  type SecurityLog,
  type LoginAttempt,
};