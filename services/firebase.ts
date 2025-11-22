import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";

// --------------------------------------------------------------------------------
// FIREBASE CONFIGURATION
// --------------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDIc_V40VT5cpOHfYWVedzOF2y2GK4lqyo",
  authDomain: "curate-f1355.firebaseapp.com",
  projectId: "curate-f1355",
  storageBucket: "curate-f1355.firebasestorage.app",
  messagingSenderId: "632910253686",
  appId: "1:632910253686:web:cd831ed9cc9668e807d957",
  measurementId: "G-DS5S3EYS0P"
};

let app;
let auth: any = null;
let isMockMode = false;

// Helper to get a mock user for fallback
const getMockUser = (): User => {
    return {
        uid: "mock-user-" + Date.now(),
        displayName: "Fashion Editor",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64",
        email: "editor@auralog.xyz",
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: "mock-token",
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => "mock-token",
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
    } as User;
};

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} catch (e) {
    console.warn("Firebase initialization failed:", e);
    isMockMode = true;
}

export { auth };
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithDemo = async (): Promise<User> => {
    return getMockUser();
};

export const signInWithGoogle = async (): Promise<User> => {
    // 1. Try Real Firebase Auth
    if (!isMockMode && auth) {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error: any) {
            console.error("Authentication Error:", error);
            // Throw the error so the UI can alert the user (e.g. about unauthorized domains)
            throw error;
        }
    }
    
    if (isMockMode) {
         throw new Error("Firebase is not configured correctly. Check your API keys.");
    }
    
    throw new Error("Authentication system unavailable.");
};

export const logout = async () => {
    try {
        if (auth) {
            await signOut(auth);
        }
    } catch (e) {
        console.error("Logout failed", e);
    }
};