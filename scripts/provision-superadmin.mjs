/**
 * SECURE SUPER-ADMINISTRATOR PROVISIONING SCRIPT
 * ISKCON Sādhana Tracker
 *
 * This script runs locally or in secure server-side CI using the Firebase Admin SDK.
 * Never expose service account credentials in browser code or public repositories.
 *
 * Usage:
 *   node scripts/provision-superadmin.mjs <DEVOTEE_EMAIL_OR_UID>
 *
 * Prerequisites:
 *   Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   OR set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

const targetIdentifier = process.argv[2];

if (!targetIdentifier) {
  console.error('\n[Error] Please provide the devotee email or UID:');
  console.error('  Usage: node scripts/provision-superadmin.mjs devotee@example.com\n');
  process.exit(1);
}

// Initialize Admin App
let app;
if (getApps().length === 0) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    app = initializeApp({ credential: cert(serviceAccount) });
  } else if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // If running in development without credentials, log instructions
    console.warn('\n[Notice] No Firebase Admin Service Account credentials detected.');
    console.warn('Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_ADMIN_* environment variables.');
    console.warn('For local offline development/testing, admin privileges are managed via local storage state.\n');
    process.exit(0);
  }
}

const auth = getAuth(app);
const db = getFirestore(app);

async function provisionSuperAdmin() {
  try {
    let uid = targetIdentifier;
    let email = targetIdentifier;

    if (targetIdentifier.includes('@')) {
      const user = await auth.getUserByEmail(targetIdentifier);
      uid = user.uid;
      email = user.email || targetIdentifier;
    }

    console.log(`\nProvisioning Super Administrator privileges for UID: ${uid} (${email})...`);

    // Write to userRoles collection
    const rolesRef = db.collection('userRoles').doc(uid);
    const rolesDoc = await rolesRef.get();

    const existingRoles = rolesDoc.exists ? (rolesDoc.data()?.roles || []) : [];
    const updatedRoles = Array.from(new Set([...existingRoles, 'super_admin', 'devotee']));

    await rolesRef.set(
      {
        uid,
        roles: updatedRoles,
        groupScopes: rolesDoc.exists ? (rolesDoc.data()?.groupScopes || []) : [],
        grantedBy: 'system-provisioning-cli',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Audit log entry
    await db.collection('adminAuditLogs').add({
      actorUid: 'system-provisioning-cli',
      actionType: 'PROVISION_SUPER_ADMIN',
      targetType: 'userRoles',
      targetId: uid,
      timestamp: new Date().toISOString(),
      safeMetadata: { email, assignedRoles: updatedRoles },
    });

    console.log('✓ Successfully provisioned Super Administrator privileges!');
    console.log(`✓ User ${email} can now access the Temple Super Administrator portal.\n`);
  } catch (error) {
    console.error('Failed to provision super administrator:', error);
    process.exit(1);
  }
}

provisionSuperAdmin();
