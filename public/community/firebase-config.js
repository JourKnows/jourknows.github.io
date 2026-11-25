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
    apiKey: "AIzaSyAKyGY0CDo_kxJLOIz7k1HFtZqkTYKHtP4",
    authDomain: "jourknows-community.firebaseapp.com",
    projectId: "jourknows-community",
    storageBucket: "jourknows-community.firebasestorage.app",
    messagingSenderId: "1027551161926",
    appId: "1:1027551161926:web:4c81d89d396802646ca447"
  },
  vapidKey: "BOpM1cnkCd0t3O9WwlKjjjC3mU1T1hZMfwVFuudGnU74MBOkSvPygB4jF9b8zcyvgFfUv5qAnnVIZ_qP9oCAbvQ",
  appUrl: "https://jourknowsph.com/community/",
  // Address of the free push worker (see push-worker/), e.g. https://jourknows-push.YOURNAME.workers.dev
  pushUrl: ""
};
