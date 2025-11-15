import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import jwt from 'jsonwebtoken'; // <-- Token verify karne ke liye

// Service account
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Har API file ko initialization check karna chahiye
// Multiple apps ke liye alag naam use karein taaki conflict na ho
const appName = 'changePasswordApp';
if (!getApps().some(app => app.name === appName)) {
  initializeApp({ credential: cert(serviceAccount), appName: appName });
}

const db = getFirestore(getApps().find(app => app.name === appName));

// CORS middleware
const corsMiddleware = cors({
  origin: true, // Ya specific domains
  methods: ['POST', 'OPTIONS'],
  credentials: true,
});

const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// --- Authentication Middleware ---
// Ye function check karega ke user logged in hai ya nahi (token ke zariye)
const authMiddleware = (req) => {
  return new Promise((resolve, reject) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reject({ status: 401, error: 'Authorization token missing or invalid.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
       return reject({ status: 401, error: 'No token provided.' });
    }

    try {
      // Token ko verify karein
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Token se user ki info (e.g., userId) wapas karega
      resolve(decoded); 
    } catch (error) {
      // Token galat hai ya expire ho gaya hai
      return reject({ status: 401, error: 'Invalid or expired token.' });
    }
  });
};
// --- End of Auth Middleware ---


export default async function handler(req, res) {
  await runMiddleware(req, res, corsMiddleware);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).send('Method Not Allowed');
  }

  let decodedToken;
  try {
    // 1. Pehle user ko authenticate karein (token check karein)
    decodedToken = await authMiddleware(req);
  } catch (authError) {
    return res.status(authError.status || 401).json({ error: authError.error || 'Authentication failed.' });
  }

  // Agar token valid hai, to decodedToken mein { userId, email } hoga
  const { userId } = decodedToken; // Ye ID token se aa rahi hai, ispar bharosa kiya ja sakta hai
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old password and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  try {
    // 2. User ka document Firestore se get karein
    const userRef = db.collection('client').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userDoc.data();

    // 3. Purana password check karein
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect old password.' });
    }

    // 4. Naya password hash karke update karein
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    await userRef.update({
      password: newHashedPassword
    });

    res.status(200).json({ message: 'Password updated successfully.' });

  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ error: 'An error occurred while changing password.' });
  }
}


