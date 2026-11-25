# JourKnows Community: backend setup

The chat lives at `public/community/` and is served at `jourknowsph.com/community/`.
Until you finish the steps below it runs in **demo mode** (each person's data stays in their own
browser). Filling in `public/community/firebase-config.js` switches it to the shared, real-time chat.

## 1. Create the Firebase project
1. Go to https://console.firebase.google.com and create a project.
2. **Build > Firestore Database > Create database.** Production mode, location **asia-southeast1 (Singapore)**.
   The location can't be changed later. If you pick another, change `REGION` in `functions/index.js`.
3. **Build > Authentication > Get started > Sign-in method > Google > Enable.**
   Then **Settings > Authorized domains > Add domain:** `jourknowsph.com` (and `jourknows.github.io`).
4. **Project settings (gear) > General > Your apps > Web (`</>`).** Register an app and copy the config values.
5. **Project settings > Cloud Messaging > Web configuration > Generate key pair.** Copy the key.
6. Open `public/community/firebase-config.js` and paste the config values and the key (`vapidKey`).
   Check that `appUrl` is the address people use.

## 2. Add your editors
In **Firestore Database > Start collection**, create a collection called `editors`.
For each editor, add a document whose **Document ID is their Google email in lowercase**
(for example `editor@gmail.com`) with any field (such as `role` = `editor`).
Editors can post in Breaking Updates, add the ✓ Verified reaction, tick 🛡 Fact-checked, publish stories,
delete any message, and send `@everyone` push alerts. Remove the document to remove the editor.

## 3. Deploy the rules and the push function
The function needs the **Blaze (pay-as-you-go)** plan. A campus-sized community normally stays within
the free monthly allowance.

```bash
npm install -g firebase-tools
cd firebase
firebase login
firebase use --add            # pick your project
(cd functions && npm install)
firebase deploy --only firestore,functions
```

## 4. Publish the site
Copy this package over the site repo, **delete `src/components/CommunityFab.astro`** (the old left-side pill, no longer used),
then commit `public/community/`, `firebase/` and the `src/` changes and push. GitHub Actions deploys the site.
The files under `src/` that changed or are new: `components/CommunityFab.tsx`, `components/SwipeLauncher.tsx`,
`layouts/Layout.astro`, `styles/base.css` (new block at the end), `utils/communityTransition.ts`, `utils/draggable.ts`.

## 5. Protect the API key
Google Cloud console > APIs & Services > Credentials > the browser key for your web app >
**Application restrictions: Websites**, and allow `https://jourknowsph.com/*` and `https://jourknows.github.io/*`.

## Test checklist
- [ ] Open `jourknowsph.com/community/` on two devices, sign in with two Google accounts.
- [ ] Post in News Desk on one; it appears on the other within a second or two.
- [ ] As a non-editor, the Breaking Updates box is locked, and ✓ Verified shows "Only editors…".
- [ ] As an editor, post `@everyone test`. Another device with notifications on gets an alert.
      Close the chat on that device and send again; the push still arrives.
- [ ] iPhone: Share > Add to Home Screen, open the app from the Home Screen, tap 🔔 Enable notifications.
- [ ] Pitch a message, move the story along the pipeline, pin a message to the Evidence Board.

You can test the rules without touching real data: `firebase emulators:start --only firestore`.

## Good to know
- `@everyone` only sends a push when an editor posts it (`EDITORS_ONLY` in `functions/index.js`).
  Other members' `@everyone` is still highlighted in the chat.
- Photos are stored inside Firestore documents (kept under ~900 KB each), so no Storage setup is needed.
- Reaction names are stored by display name, so someone could in theory add a reaction under another
  person's name. Only the ✓ Verified reaction is protected (editors only).
- Possible next steps: rate limiting (App Check + Cloud Function), reporting and muting tools.
- The site shows two floating navy/white pills on the right (nothing on the left): **Community chat**
  (`src/components/CommunityFab.tsx`, rendered by `AppNavbar` on every page) and **Stories for you**
  (`src/components/SwipeLauncher.tsx`, home page; its styles are the block at the end of `src/styles/base.css`).
  Both collapse to an icon while scrolling down and bring the label back on scroll up or when idle.
  They can be dragged anywhere **as one group** (`src/utils/draggable.ts`); the position is kept in the browser's
  localStorage (`jk-fab-group`) and shared through the `--jk-gx` / `--jk-gy` CSS variables.
- Tapping the Community chat pill, or the COMMUNITY nav link, plays an expanding-circle transition into `/community/`;
  the house button in the chat plays it in reverse, collapsing into the pill wherever it was dragged, and returns to the
  page the person came from. The cover icon in `public/community/index.html` uses the same white-on-navy artwork.
  Both directions respect "reduce motion". Nothing here touches Firebase, so no redeploy of the rules or function is needed.
- Members can delete their own messages and editors can delete any message (Delete button under each message, with a
  confirmation sheet). The `firestore.rules` delete rule already enforces this; nothing needs redeploying.
