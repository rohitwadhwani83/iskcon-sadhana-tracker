import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBP5gnBXJrL2HRh66elVXz9c5mAcxXDHtc",
  authDomain: "iskcon-sadhana-tracker-2d3c9.firebaseapp.com",
  projectId: "iskcon-sadhana-tracker-2d3c9",
  storageBucket: "iskcon-sadhana-tracker-2d3c9.firebasestorage.app",
  messagingSenderId: "827137008890",
  appId: "1:827137008890:web:3d8624ab9e0b602a355543"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testFirebaseSetup() {
  console.log('\n--- VERIFYING LIVE FIREBASE CONFIGURATION ---');
  console.log('Project ID:', firebaseConfig.projectId);

  // 1. Test Firestore Connectivity
  try {
    console.log('\n[1/3] Testing Cloud Firestore Connection...');
    const groupsRef = collection(db, 'groups');
    const snapshot = await getDocs(groupsRef);
    console.log('✓ Firestore is ONLINE and accessible!');
    console.log(`✓ Queried "groups" collection successfully (found ${snapshot.docs.length} documents).`);
  } catch (err) {
    console.error('⨯ Firestore error:', err.message);
  }

  // 2. Test Firebase Authentication
  try {
    console.log('\n[2/3] Testing Firebase Authentication Service...');
    // Attempting a test probe with an invalid password to verify Auth service is enabled
    try {
      await signInWithEmailAndPassword(auth, 'probe-test@sadhana.iskcon.org', 'invalid_pwd_test');
    } catch (authErr) {
      if (
        authErr.code === 'auth/invalid-credential' ||
        authErr.code === 'auth/user-not-found' ||
        authErr.code === 'auth/wrong-password'
      ) {
        console.log('✓ Firebase Authentication is ONLINE and Email/Password provider is active!');
        console.log(`✓ Auth provider responded expectedly: (${authErr.code})`);
      } else if (authErr.code === 'auth/operation-not-allowed') {
        console.warn('! Notice: Email/Password provider might still be disabled in Firebase Console.');
      } else {
        console.log('Auth check response:', authErr.code || authErr.message);
      }
    }
  } catch (err) {
    console.error('⨯ Authentication error:', err.message);
  }

  // 3. Test Live Web App Deployment
  try {
    console.log('\n[3/3] Testing Live Vercel Production Web App...');
    const res = await fetch('https://iskcon-sadhana-tracker-rose.vercel.app');
    if (res.status === 200) {
      console.log('✓ Live Production Website is responding with HTTP 200 OK!');
      console.log('✓ URL: https://iskcon-sadhana-tracker-rose.vercel.app');
    } else {
      console.warn('! Website responded with status:', res.status);
    }
  } catch (err) {
    console.error('⨯ Live website fetch error:', err.message);
  }

  console.log('\n--- VERIFICATION FINISHED ---\n');
}

testFirebaseSetup();
