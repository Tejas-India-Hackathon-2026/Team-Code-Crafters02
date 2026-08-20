import crypto from 'crypto';
import { sanitizeMessageContent } from './sanitizers/chatSanitizer.js';
import { verifyCourierHMAC } from './webhooks/courierRelayer.js';

console.log('=== RUNNING SECURITY & INGRESS AUDIT ===\n');

// 1. Ingress Sanitization Tests
const sample1 = 'Hey, call me directly at +91-9876543210 for offline pricing.';
const res1 = sanitizeMessageContent(sample1);
console.log('Test 1 (Phone Redaction):', res1.isFlagged ? '✅ PASS' : '❌ FAIL');
console.log('Sanitized:', res1.sanitizedContent);

const sample2 = 'Pay me directly on UPI at maker@oksbi or my email art@crafts.com';
const res2 = sanitizeMessageContent(sample2);
console.log('\nTest 2 (UPI & Email Redaction):', res2.isFlagged ? '✅ PASS' : '❌ FAIL');
console.log('Sanitized:', res2.sanitizedContent);

// 2. Carrier Webhook HMAC Tests
process.env.COURIER_WEBHOOK_SECRET = 'super_secret_audit_key';
const validPayload = JSON.stringify({ trackingId: 'DEL-10029', status: 'DELIVERED' });
const validSig = crypto
    .createHmac('sha256', 'super_secret_audit_key')
    .update(validPayload)
    .digest('hex');

const validCheck = verifyCourierHMAC(validPayload, validSig);
console.log('\nTest 3 (Valid Courier HMAC):', validCheck ? '✅ PASS' : '❌ FAIL');

const invalidCheck = verifyCourierHMAC(validPayload, 'malformed_tampered_signature_hex');
console.log('Test 4 (Forged Signature Rejection):', !invalidCheck ? '✅ PASS (Rejected)' : '❌ FAIL');

console.log('\n=== AUDIT COMPLETE ===');