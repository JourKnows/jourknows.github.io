/*
 * JourKnows Community: Firebase settings.
 *
 * While `apiKey` is empty the chat runs in DEMO MODE (data stays in each person's own browser).
 * Paste the values from Firebase console > Project settings > Your apps > Web app to switch on
 * the shared, real-time chat. These values are public by design; security comes from
 * firebase/firestore.rules, not from hiding this file.
 *
 * vapidKey: Firebase console > Project settings > Cloud Messaging > Web Push certificates > Generate key pair.
 */
self.JK_FIREBASE = {
  config: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  },
  vapidKey: "",
  appUrl: "https://jourknowsph.com/community/"
};
