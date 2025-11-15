// File: /api/login.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // \n ko format karna
};


if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// CORS middleware ko initialize karein
const corsMiddleware = cors({
  origin: [ 'http://localhost:5173' , 'https://business-bachao-pos-system.vercel.app' ] , // <-- Sirf is URL ko allow karein
  methods: ['POST', 'GET', 'OPTIONS'], // Allowable methods
});

// Ek helper function banayein jo pehle CORS check karega
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
export default async function handler(req, res) {
await runMiddleware(req, res, corsMiddleware);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

 if (req.method === 'POST') {
  try {
    const usersRef = db.collection('client'); // Aapke collection ka naam
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // Password sahi hai! User ka data frontend ko bhejein
      // IMPORTANT: Password kabhi wapas na bhejein
  const token = jwt.sign(
        { userId: userId, email: user.email }, // Token mein user ki ID store karein
        process.env.JWT_SECRET, // Aapka Vercel secret
        { expiresIn: '100d' } // Lambi expiry
      );
      
      
      
  
      res.status(200).json({
        uid: userDoc.id,
                token: token,
        name: user.name,
        role: user.role,
        email:user.email,
        adminFirebaseObject: user.AdminFirebaseObject,
        subscriptionStatus: user.subscriptionStatus || 'inactive', // Default value dein agar nahi hai
        subscriptionEndDate: user.subscriptionEndDate || null, // Default value
        
      });
    } else {
      // Password galat hai
      res.status(401).json({ error: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'An error occurred during authentication.' });
  }
 } else if (req.method === 'OPTIONS') {
    // CORS pre-flight request ko handle karein
    res.status(200).end();
    return;
  }
  else {
    res.status(405).send('Method Not Allowed');
  }
  
}
