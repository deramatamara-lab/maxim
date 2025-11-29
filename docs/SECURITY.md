# Security & Privacy Documentation

## Overview
This document outlines the security architecture, PII handling, and GDPR compliance strategy for Project Aura.

## Table of Contents
1. [Secrets Management](#secrets-management)
2. [PII Classification](#pii-classification)
3. [GDPR Compliance](#gdpr-compliance)
4. [Token Management](#token-management)
5. [Data Retention](#data-retention)
6. [Security Best Practices](#security-best-practices)

---

## Secrets Management

### Environment Configuration

**DO:**
- ✅ Use environment-specific `.env` files (`.env.development`, `.env.staging`, `.env.production`)
- ✅ Store all secrets in environment variables prefixed with `EXPO_PUBLIC_`
- ✅ Use CI/CD secret management for production deployments
- ✅ Rotate API keys and tokens regularly (quarterly minimum)

**DON'T:**
- ❌ Never commit actual secrets to version control
- ❌ Never hardcode API keys, tokens, or passwords in source code
- ❌ Never share production credentials via email or chat
- ❌ Never use development keys in production

### Secret Storage Hierarchy

1. **Development**: Local `.env.development` file (git-ignored)
2. **Staging**: CI/CD environment variables or secure vault
3. **Production**: CI/CD environment variables + secure vault (e.g., AWS Secrets Manager, HashiCorp Vault)

### Required Secrets

| Secret | Environment | Rotation Period | Storage |
|--------|-------------|-----------------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | All | N/A | Config |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | All | 90 days | Vault |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | All | 180 days | Vault |
| `EXPO_PUBLIC_SENTRY_DSN` | Staging/Prod | 180 days | Vault |
| Auth Tokens (user) | Runtime | 24 hours | SecureStore |
| Refresh Tokens | Runtime | 30 days | SecureStore |

---

## PII Classification

### Personal Identifiable Information (PII)

#### High-Risk PII (Requires Encryption)
- **User Identity**
  - Full name
  - Email address
  - Phone number
  - Date of birth
  - Government ID numbers
  
- **Financial Data**
  - Payment card numbers (last 4 digits only stored)
  - Bank account information
  - Transaction history
  - Billing addresses
  
- **Location Data**
  - Real-time GPS coordinates
  - Home/work addresses
  - Ride pickup/dropoff locations
  - Location history

- **Biometric Data**
  - Facial recognition data (KYC selfies)
  - Fingerprint data (if biometric auth enabled)

#### Medium-Risk PII
- **Profile Data**
  - Avatar/profile photos
  - User preferences
  - Ride history (anonymized)
  - Ratings and reviews

- **Device Data**
  - Device ID
  - IP address
  - Browser/app version

#### Low-Risk Data
- **Aggregated Analytics**
  - Anonymized usage statistics
  - Performance metrics
  - Crash reports (PII-sanitized)

### PII Handling Rules

1. **Collection**: Only collect PII necessary for service operation
2. **Storage**: 
   - High-risk PII: `SecureStore` with encryption (native platforms)
   - Medium-risk PII: `AsyncStorage` with encryption
   - Low-risk: Standard storage
3. **Transmission**: Always HTTPS/WSS only
4. **Logging**: Never log PII (use sanitization in `utils/logger.ts`)
5. **Display**: Mask sensitive data in UI (e.g., `****1234` for cards)

---

## GDPR Compliance

### User Rights Implementation

#### 1. Right to Access
**Implementation**: `GET /api/user/data-export`
- User can request complete data export
- Format: JSON with all personal data
- Delivery: Secure download link (expires in 7 days)

#### 2. Right to Rectification
**Implementation**: Profile edit screens + `PATCH /api/user/profile`
- Users can update personal information
- Changes logged for audit trail

#### 3. Right to Erasure ("Right to be Forgotten")
**Implementation**: `DELETE /api/user/account`
- Hard delete of all user data within 30 days
- Anonymize ride history (remove PII, keep aggregated stats)
- Notify third parties (payment processors) to delete data

#### 4. Right to Data Portability
**Implementation**: Same as Right to Access
- Machine-readable JSON format
- Includes all user-generated content

#### 5. Right to Object
**Implementation**: Settings > Privacy > Data Processing
- Users can opt-out of analytics
- Users can opt-out of marketing communications
- Core service data processing cannot be opted out (required for operation)

### Consent Management

**Explicit Consent Required For:**
- Marketing communications
- Analytics and crash reporting
- Location tracking (beyond active ride)
- Biometric authentication
- Data sharing with third parties

**Implementation**: `OnboardingModal` + Settings screens
- Clear, plain-language consent requests
- Granular opt-in/opt-out controls
- Consent logged with timestamp

### Data Processing Records

**Maintained in**: `docs/data-processing-records.md`
- Purpose of processing
- Categories of data
- Recipients of data
- Retention periods
- Security measures

---

## Token Management

### Authentication Flow

1. **Login**: User provides credentials
   - Server returns `accessToken` (short-lived, 1 hour) + `refreshToken` (long-lived, 30 days)
   - Tokens stored in `SecureStore` (encrypted on native platforms)

2. **API Requests**: 
   - `accessToken` sent in `Authorization: Bearer <token>` header
   - If `401 Unauthorized`, attempt refresh

3. **Token Refresh**:
   - Send `refreshToken` to `POST /api/auth/refresh`
   - Receive new `accessToken` + `refreshToken`
   - Update `SecureStore`

4. **Logout**:
   - Send `POST /api/auth/logout` with `refreshToken`
   - Clear all tokens from `SecureStore`
   - Redirect to login

### Token Security

- **Storage**: `SecureStore` (Keychain on iOS, Keystore on Android)
- **Transmission**: HTTPS only, never in URL query params
- **Expiration**: Short-lived access tokens (1 hour), refresh tokens (30 days)
- **Rotation**: Refresh token rotates on every refresh request
- **Revocation**: Server maintains revoked token blacklist

### Implementation

```typescript
// Store tokens securely
import { secureStorage, StorageKey } from '@/utils/secureStorage';

await secureStorage.set(StorageKey.AUTH_TOKEN, accessToken, {
  encrypt: true,
  ttl: 3600000, // 1 hour
});

await secureStorage.set(StorageKey.REFRESH_TOKEN, refreshToken, {
  encrypt: true,
  ttl: 2592000000, // 30 days
});

// Retrieve tokens
const accessToken = await secureStorage.get<string>(StorageKey.AUTH_TOKEN);
const refreshToken = await secureStorage.get<string>(StorageKey.REFRESH_TOKEN);
```

---

## Data Retention

### Retention Periods

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| Active user accounts | Indefinite | Service operation |
| Inactive accounts (no login) | 2 years | GDPR compliance |
| Ride history | 7 years | Financial/legal requirements |
| Payment transactions | 7 years | Financial/legal requirements |
| KYC documents | 5 years after account closure | Regulatory compliance |
| Crash logs | 90 days | Debugging |
| Analytics data (anonymized) | 2 years | Business intelligence |
| Audit logs | 1 year | Security monitoring |

### Deletion Process

1. **User-initiated**: Account deletion request
2. **Grace period**: 30 days (user can cancel)
3. **Hard delete**: After grace period
   - Remove all PII from databases
   - Anonymize ride history (keep aggregated stats)
   - Delete KYC documents from storage
   - Notify payment processors
4. **Audit log**: Record deletion with timestamp

### Implementation

```typescript
// Scheduled cleanup job (runs daily)
async function cleanupExpiredData() {
  // Remove expired tokens
  await secureStorage.cleanupExpired();
  
  // Delete inactive accounts (2+ years no login)
  await userService.deleteInactiveAccounts(2 * 365);
  
  // Anonymize old ride history (7+ years)
  await rideService.anonymizeOldRides(7 * 365);
  
  // Delete old crash logs (90+ days)
  await crashTracking.deleteOldLogs(90);
}
```

---

## Security Best Practices

### Code-Level Security

1. **Input Validation**
   - Validate all user inputs (client + server)
   - Sanitize data before storage/display
   - Use TypeScript for type safety

2. **Output Encoding**
   - Escape HTML/JS in dynamic content
   - Use parameterized queries (prevent SQL injection)

3. **Authentication & Authorization**
   - Implement role-based access control (RBAC)
   - Verify user permissions on every API request
   - Use secure session management

4. **Cryptography**
   - Use industry-standard algorithms (AES-256, RSA-2048+)
   - Never implement custom crypto
   - Use `SecureStore` for sensitive data

### Network Security

1. **HTTPS/WSS Only**
   - Enforce HTTPS in production (`config.enforceHttps`)
   - Use WSS for WebSocket connections
   - Implement certificate pinning (future enhancement)

2. **API Security**
   - Rate limiting (prevent brute force)
   - Request signing (prevent tampering)
   - CORS configuration (restrict origins)

### Operational Security

1. **Monitoring**
   - Real-time security alerts (Sentry)
   - Audit logging (all sensitive operations)
   - Anomaly detection (unusual activity patterns)

2. **Incident Response**
   - Security incident playbook
   - Breach notification process (72 hours under GDPR)
   - Post-incident review

3. **Access Control**
   - Principle of least privilege
   - Multi-factor authentication for admin access
   - Regular access reviews

### Security Checklist (Pre-Production)

- [ ] All secrets in environment variables (not hardcoded)
- [ ] HTTPS enforced in production
- [ ] Token refresh flow implemented and tested
- [ ] PII sanitization in logs verified
- [ ] GDPR consent flows implemented
- [ ] Data export/deletion APIs tested
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Rate limiting enabled on API
- [ ] Crash reporting configured (Sentry)
- [ ] Penetration testing completed
- [ ] Security audit by third party

---

## Contact

For security concerns or to report vulnerabilities:
- **Email**: security@auraride.com
- **Bug Bounty**: [Link to program]
- **PGP Key**: [Link to public key]

**Response Time**: We aim to respond to security reports within 24 hours.

---

*Last Updated: 2025-01-24*
*Version: 1.0*
