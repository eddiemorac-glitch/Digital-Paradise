# 📚 Research Note: Compliance & Security Hardening

## 1. Costa Rica Law 8968 (Data Protection)
**Status**: mandatory for all databases in CR.
**Key Requirements for Caribe Digital**:
- **Informed Consent**: Must be "explicit, unequivocal, freely given, specific, and documented".
    - *Action*: We cannot just have a "register" button. We need a "I accept the Privacy Policy" checkbox.
    - *Database*: We must store `dataConsent: true` and the `timestamp` of when it happened.
- **ARCO Rights**: Users must be able to Access, Rectify, Cancel (Delete), and Oppose their data processing.
    - *Action*: The Admin Panel (God Mode) needs a specific "Anonymize User" function to comply with deletion requests without breaking order history integrity.
- **Security**: "Appropriate technical measures".
    - *Action*: Our move to `Argon2` hashing (instead of bcrypt) and strict `RolesGuard` covers this.

## 2. NestJS Production Security (2025 Standards)
**Findings**:
- **RBAC**: Use Custom Decorators (`@Roles`) + Enums. *Verified as best practice.*
- **Type Safety**: Strictly define DTOs with `class-validator` to prevent mass assignment attacks.
- **Session Management**: JWTs should be short-lived (15 mins) with Rotation. *Already in our plans.*

## 3. Impact on Implementation
I will modify the `User` entity to include:
```typescript
@Column({ default: false })
agreedToPrivacyPolicy: boolean;

@Column({ nullable: true })
privacyPolicyAgreedAt: Date;

@Column({ nullable: true })
privacyPolicyVersion: string; // e.g. "v1.0"
```
This ensures if we change the policy, we can force a re-consent (future proofing).
