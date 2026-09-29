import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db, signInWithGoogle, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, SystemSettings, CoinTransferRecord } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSubadmin: boolean;
  systemSettings: SystemSettings;
  login: (emailOrPhone: string, pass: string) => Promise<void>;
  signup: (emailOrPhone: string, pass: string, name?: string, refCode?: string) => Promise<void>;
  loginWithPhone: (phone: string, pass: string) => Promise<void>;
  signupWithPhone: (phone: string, pass: string, name?: string, refCode?: string) => Promise<void>;
  loginWithGoogle: (refCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserCoins: (amount: number, reason?: string) => Promise<void>;
  incrementGamesPlayed: () => Promise<number>;
  setGamesPlayedCount: (count: number) => Promise<void>;
  distributeCoins: (targetUserId: string, amount: number, note?: string) => Promise<CoinTransferRecord>;
  assignSubadmin: (userUid: string, referralCode: string, initialCoins: number) => Promise<void>;
  assignSubadminCoins: (subadminUid: string, amount: number, note?: string) => Promise<CoinTransferRecord>;
  demoteSubadmin: (subadminUid: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEFAULT_SETTINGS: SystemSettings = {
  defaultStartingCoins: 0, // Free bonus will come after 1st recharge only
  winRatePercentage: 18, // Strict 15-20% win algorithm requested by user (default 18%)
  minRechargeAmount: 100,
  minWithdrawCoins: 5000, // Minimum withdrawal is Rs 5000 (INR)
  announcement: 'Welcome to WinGo Color Trading! Enjoy fair games & instant INR payouts.',
  newPlayerRulesEnabled: true,
  updatedAt: Date.now(),
};

export const normalizePhoneOrEmail = (input: string): { email: string; isPhone: boolean; cleanPhone: string } => {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    return { email: trimmed.toLowerCase(), isPhone: false, cleanPhone: '' };
  }
  const digits = trimmed.replace(/\D/g, '');
  const cleanPhone = digits.length >= 10 ? digits.slice(-10) : digits;
  return {
    email: `${cleanPhone}@phone.wingo.internal`,
    isPhone: true,
    cleanPhone,
  };
};

// Helper to capture ref code from URL query param or localStorage
export const getSavedReferralCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  const urlParams = new URLSearchParams(window.location.search);
  const fromUrl = urlParams.get('ref');
  if (fromUrl) {
    const cleaned = fromUrl.trim().toUpperCase();
    localStorage.setItem('wingo_ref_code', cleaned);
    return cleaned;
  }
  return localStorage.getItem('wingo_ref_code');
};

export const resolveSubadminByReferralCode = async (refCode?: string | null) => {
  if (!refCode) return null;
  const cleanCode = refCode.trim().toUpperCase();
  if (!cleanCode) return null;
  try {
    const q = query(
      collection(db, 'users'),
      where('referralCode', '==', cleanCode)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const subDoc = snap.docs[0];
      const data = subDoc.data() as UserProfile;
      return {
        uid: subDoc.id,
        code: data.referralCode || cleanCode,
        name: data.displayName || data.email || 'Subadmin Partner',
      };
    }
  } catch (err) {
    console.warn('Could not resolve referral code:', err);
  }
  return null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Subscribe to system settings with robust error callback
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'config'),
      (snapshot) => {
        if (snapshot.exists()) {
          setSystemSettings(snapshot.data() as SystemSettings);
        } else {
          setSystemSettings(DEFAULT_SETTINGS);
        }
      },
      (error) => {
        // If offline or first load, fallback to default settings gracefully
        console.warn('Settings onSnapshot offline / fallback:', error.message);
        setSystemSettings(DEFAULT_SETTINGS);
      }
    );
    return () => unsub();
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const isAdminEmail =
            user.email?.toLowerCase() === 'tirupatibpo6@gmail.com' ||
            user.email?.toLowerCase().includes('admin');

          // Realtime sync on user doc (resilient to offline/connecting state)
          const unsubProfile = onSnapshot(
            userRef,
            async (docSnap) => {
              if (docSnap.exists()) {
                const profileData = docSnap.data() as UserProfile;
                if (isAdminEmail && profileData.role !== 'admin') {
                  updateDoc(userRef, { role: 'admin' }).catch(() => {});
                  profileData.role = 'admin';
                }
                setUserProfile(profileData);
              } else {
                const phoneDigits = user.email?.endsWith('@phone.wingo.internal')
                  ? user.email.replace('@phone.wingo.internal', '')
                  : undefined;

                // Check for referral code association on first registration
                const savedRefCode = getSavedReferralCode();
                const referrerSubadmin = await resolveSubadminByReferralCode(savedRefCode);

                // Clean all undefined values before passing to setDoc
                const newProfileData: Record<string, unknown> = {
                  uid: user.uid,
                  email: user.email || '',
                  displayName: user.displayName || (phoneDigits ? `Player_${phoneDigits.slice(-4)}` : user.email?.split('@')[0]) || 'Trader',
                  role: isAdminEmail ? 'admin' : 'user',
                  coins: isAdminEmail ? 1000000 : 0, // Free bonus will come after 1st recharge only
                  isBlocked: false,
                  hasRechargedToday: false,
                  totalRechargesCount: 0,
                  hasFirstRechargeBonusClaimed: false,
                  dailySpinCount: 0,
                  gamesPlayedCount: 0,
                  createdAt: Date.now(),
                };

                if (phoneDigits) {
                  newProfileData.phoneNumber = phoneDigits;
                  newProfileData.phoneFormatted = `+91 ${phoneDigits}`;
                }
                if (referrerSubadmin) {
                  newProfileData.referredBy = referrerSubadmin.uid;
                  newProfileData.referredByCode = referrerSubadmin.code;
                  newProfileData.referredByName = referrerSubadmin.name;
                }

                const newProfile = newProfileData as unknown as UserProfile;
                setDoc(userRef, newProfileData).catch((e) => console.warn('Could not setDoc user:', e));
                setUserProfile(newProfile);
              }
              setLoading(false);
            },
            (err) => {
              handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
              setUserProfile((prev) => prev || {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || 'Trader',
                role: isAdminEmail ? 'admin' : 'user',
                coins: isAdminEmail ? 1000000 : 0,
                createdAt: Date.now(),
              });
              setLoading(false);
            }
          );

          return () => unsubProfile();
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [systemSettings.defaultStartingCoins]);

  const login = async (emailOrPhone: string, pass: string) => {
    const { email } = normalizePhoneOrEmail(emailOrPhone);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginWithPhone = async (phone: string, pass: string) => {
    return login(phone, pass);
  };

  const signup = async (emailOrPhone: string, pass: string, name?: string, refCode?: string) => {
    const { email, isPhone, cleanPhone } = normalizePhoneOrEmail(emailOrPhone);
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = cred.user;
    const isAdminEmail =
      email.toLowerCase() === 'tirupatibpo6@gmail.com' || email.toLowerCase().includes('admin');

    const effectiveRefCode = refCode || getSavedReferralCode();
    const referrerSubadmin = await resolveSubadminByReferralCode(effectiveRefCode);

    const newProfileData: Record<string, unknown> = {
      uid: user.uid,
      email: user.email || email,
      displayName: name || (isPhone ? `Player_${cleanPhone.slice(-4)}` : email.split('@')[0]),
      role: isAdminEmail ? 'admin' : 'user',
      coins: isAdminEmail ? 1000000 : 0,
      isBlocked: false,
      hasRechargedToday: false,
      totalRechargesCount: 0,
      hasFirstRechargeBonusClaimed: false,
      dailySpinCount: 0,
      gamesPlayedCount: 0,
      createdAt: Date.now(),
    };

    if (isPhone && cleanPhone) {
      newProfileData.phoneNumber = cleanPhone;
      newProfileData.phoneFormatted = `+91 ${cleanPhone}`;
    }
    if (referrerSubadmin) {
      newProfileData.referredBy = referrerSubadmin.uid;
      newProfileData.referredByCode = referrerSubadmin.code;
      newProfileData.referredByName = referrerSubadmin.name;
    }

    const newProfile = newProfileData as unknown as UserProfile;
    await setDoc(doc(db, 'users', user.uid), newProfileData);
    setUserProfile(newProfile);
  };

  const signupWithPhone = async (phone: string, pass: string, name?: string, refCode?: string) => {
    return signup(phone, pass, name, refCode);
  };

  const loginWithGoogle = async (refCode?: string) => {
    if (refCode) {
      localStorage.setItem('wingo_ref_code', refCode.trim().toUpperCase());
    }
    await signInWithGoogle();
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const updateUserCoins = async (amount: number) => {
    if (!currentUser || !userProfile) return;
    const newCoins = Math.max(0, Math.round((userProfile.coins + amount) * 100) / 100);
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userRef, {
        coins: newCoins,
        updatedAt: Date.now(),
      });
      setUserProfile((prev) => (prev ? { ...prev, coins: newCoins } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      setUserProfile((prev) => (prev ? { ...prev, coins: newCoins } : null));
    }
  };

  const incrementGamesPlayed = async (): Promise<number> => {
    if (!currentUser) return 1;
    const currentCount = userProfile?.gamesPlayedCount ?? 0;
    const newCount = currentCount + 1;
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userRef, {
        gamesPlayedCount: newCount,
        updatedAt: Date.now(),
      });
      setUserProfile((prev) => (prev ? { ...prev, gamesPlayedCount: newCount } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      setUserProfile((prev) => (prev ? { ...prev, gamesPlayedCount: newCount } : null));
    }
    return newCount;
  };

  const setGamesPlayedCount = async (count: number) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userRef, {
        gamesPlayedCount: count,
        updatedAt: Date.now(),
      });
      setUserProfile((prev) => (prev ? { ...prev, gamesPlayedCount: count } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      setUserProfile((prev) => (prev ? { ...prev, gamesPlayedCount: count } : null));
    }
  };

  // Subadmin or Admin distributing coins to users
  const distributeCoins = async (targetUserId: string, amount: number, note?: string): Promise<CoinTransferRecord> => {
    if (!currentUser || !userProfile) throw new Error('Not authenticated');
    if (userProfile.role !== 'subadmin' && userProfile.role !== 'admin') {
      throw new Error('Only admins or subadmins can distribute coins');
    }
    if (amount <= 0) throw new Error('Amount must be greater than 0');
    if (userProfile.role === 'subadmin' && userProfile.coins < amount) {
      throw new Error(`Insufficient coins balance. You have ₹${userProfile.coins}`);
    }

    const userRef = doc(db, 'users', targetUserId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error('Target player not found');
    const targetUserData = userSnap.data() as UserProfile;

    // Subadmins can only distribute to their own referred players
    if (
      userProfile.role === 'subadmin' &&
      targetUserData.referredBy !== currentUser.uid &&
      targetUserData.referredByCode !== userProfile.referralCode
    ) {
      throw new Error('You can only distribute coins to players registered via your referral code');
    }

    // Deduct from subadmin balance (if subadmin)
    if (userProfile.role === 'subadmin') {
      const newSubBalance = Math.max(0, userProfile.coins - amount);
      const newTotalDist = (userProfile.totalCoinsDistributed || 0) + amount;
      await updateDoc(doc(db, 'users', currentUser.uid), {
        coins: newSubBalance,
        totalCoinsDistributed: newTotalDist,
        updatedAt: Date.now(),
      });
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              coins: newSubBalance,
              totalCoinsDistributed: newTotalDist,
            }
          : null
      );
    }

    // Credit recipient user
    const newUserBalance = (targetUserData.coins || 0) + amount;
    await updateDoc(userRef, {
      coins: newUserBalance,
      updatedAt: Date.now(),
    });

    // Record transfer
    const transferRef = doc(collection(db, 'transfers'));
    const transferRecord: CoinTransferRecord = {
      id: transferRef.id,
      fromUid: currentUser.uid,
      fromName: userProfile.displayName || userProfile.email || 'Subadmin',
      fromRole: userProfile.role,
      toUid: targetUserId,
      toName: targetUserData.displayName || targetUserData.email || 'Player',
      toEmail: targetUserData.email,
      amount,
      note: note || (userProfile.role === 'subadmin' ? 'Subadmin Coins Distribution' : 'Admin Coins Credit'),
      timestamp: Date.now(),
    };
    await setDoc(transferRef, transferRecord);

    return transferRecord;
  };

  // Admin assigns / promotes a user to Subadmin
  const assignSubadmin = async (userUid: string, referralCode: string, initialCoins: number) => {
    if (!currentUser || userProfile?.role !== 'admin') {
      throw new Error('Only Master Admin can assign subadmins');
    }
    const cleanCode = referralCode.trim().toUpperCase();
    if (!cleanCode) throw new Error('Referral code is required');

    // Verify code is not already taken by another subadmin
    const existingQ = query(collection(db, 'users'), where('referralCode', '==', cleanCode));
    const existingSnap = await getDocs(existingQ);
    const isTaken = existingSnap.docs.some((d) => d.id !== userUid);
    if (isTaken) {
      throw new Error(`Referral code "${cleanCode}" is already in use by another subadmin. Choose a different code.`);
    }

    const targetRef = doc(db, 'users', userUid);
    const targetSnap = await getDoc(targetRef);
    if (!targetSnap.exists()) throw new Error('User not found');
    const targetData = targetSnap.data() as UserProfile;

    const newCoins = (targetData.coins || 0) + initialCoins;
    await updateDoc(targetRef, {
      role: 'subadmin',
      referralCode: cleanCode,
      coins: newCoins,
      assignedByAdmin: currentUser.uid,
      updatedAt: Date.now(),
    });

    if (initialCoins > 0) {
      const transferRef = doc(collection(db, 'transfers'));
      const transferRecord: CoinTransferRecord = {
        id: transferRef.id,
        fromUid: currentUser.uid,
        fromName: 'Master Admin',
        fromRole: 'admin',
        toUid: userUid,
        toName: targetData.displayName || targetData.email || 'Subadmin',
        toEmail: targetData.email,
        amount: initialCoins,
        note: `Subadmin promotion with initial coins allocation (Code: ${cleanCode})`,
        timestamp: Date.now(),
      };
      await setDoc(transferRef, transferRecord);
    }
  };

  // Admin tops-up coins for a subadmin
  const assignSubadminCoins = async (subadminUid: string, amount: number, note?: string): Promise<CoinTransferRecord> => {
    if (!currentUser || userProfile?.role !== 'admin') {
      throw new Error('Only Master Admin can assign coins to subadmin');
    }
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    const subRef = doc(db, 'users', subadminUid);
    const subSnap = await getDoc(subRef);
    if (!subSnap.exists()) throw new Error('Subadmin not found');
    const subData = subSnap.data() as UserProfile;

    const newCoins = (subData.coins || 0) + amount;
    await updateDoc(subRef, {
      coins: newCoins,
      updatedAt: Date.now(),
    });

    const transferRef = doc(collection(db, 'transfers'));
    const transferRecord: CoinTransferRecord = {
      id: transferRef.id,
      fromUid: currentUser.uid,
      fromName: 'Master Admin',
      fromRole: 'admin',
      toUid: subadminUid,
      toName: subData.displayName || subData.email || 'Subadmin',
      toEmail: subData.email,
      amount,
      note: note || `Admin coins top-up for Subadmin ${subData.referralCode || ''}`,
      timestamp: Date.now(),
    };
    await setDoc(transferRef, transferRecord);
    return transferRecord;
  };

  // Admin revokes subadmin back to user
  const demoteSubadmin = async (subadminUid: string) => {
    if (!currentUser || userProfile?.role !== 'admin') {
      throw new Error('Only Master Admin can demote subadmin');
    }
    const subRef = doc(db, 'users', subadminUid);
    await updateDoc(subRef, {
      role: 'user',
      updatedAt: Date.now(),
    });
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
    }
  };

  const isAdmin =
    userProfile?.role === 'admin' || currentUser?.email?.toLowerCase() === 'tirupatibpo6@gmail.com';
  const isSubadmin = userProfile?.role === 'subadmin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isSubadmin,
        systemSettings,
        login,
        signup,
        loginWithPhone,
        signupWithPhone,
        loginWithGoogle,
        logout,
        updateUserCoins,
        incrementGamesPlayed,
        setGamesPlayedCount,
        distributeCoins,
        assignSubadmin,
        assignSubadminCoins,
        demoteSubadmin,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
