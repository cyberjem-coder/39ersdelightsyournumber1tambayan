# 39ers Delights POS — Netlify-ready package

## What is preserved
- The uploaded POS HTML is retained as the application base.
- Existing local POS menu, cart, discounts/promotions, VAT, inventory, checkout, receipt, sales, audit and CEO reporting code is retained.
- The uploaded Google Sheets Apps Script and setup guide are included unchanged.
- Google Sheets continues to receive the existing POS reporting snapshots. Netlify is used only for the public mobile menu and mobile-order queue.

## Mobile order flow
1. The cashier opens the POS on the deployed Netlify site. The first POS browser publishes the menu and registers its device key in Netlify Blobs.
2. The QR code opens `/?customerOrder=1&station=...` and reads the public menu from `/api/mobile-menu`.
3. Customer submission creates a `PENDING` order at `/api/mobile-orders`.
4. The cashier's POS polls the protected pending queue every five seconds.
5. Confirming an order validates every menu item, variant and tracked stock quantity, then changes the order to `CONFIRMED` and imports the lines into the active POS cart. It does not create a sale or deduct stock.
6. Existing `processTransaction()` checkout remains the only route that records the sale, deducts stock and triggers the existing Google Sheets reporting sync.
7. Rejecting changes the order to `REJECTED`.

## Deploy
1. Extract this ZIP into a new Git repository and push it to GitHub, GitLab or another Git provider supported by Netlify. This project includes serverless Functions, so do not use a static-only drag-and-drop deploy.
2. In Netlify, import/connect that repository and deploy with the included `netlify.toml`. No build command is required; publish directory is `public`.
3. Confirm Netlify Blobs is available for the site (it is accessed by the Functions automatically).
4. Open the deployed site in the cashier POS browser first. Keep using that same browser/device profile: it stores the registered POS device key in localStorage.
5. Open the Customer QR / Mobile Order panel. Wait for the status to say the menu has been published to Netlify. Print or copy the QR link only after successful publication.
6. In the existing POS, configure Google Sheets Sync using the companion Apps Script URL as before. The mobile-order queue does not require the Apps Script URL.
7. Test with a low-value test order: submit from a phone, confirm on the POS, verify the items appear in the cart, and confirm that Sales Reports and Google Sheets do not gain a sale until normal checkout is completed.

## Important operational notes
- The first POS browser that successfully publishes the menu becomes the authorized cashier device. Do not clear its browser site data or move the POS to a different browser without planning a key reset/migration.
- The QR page and customer order submission are public by design. Do not collect payment card details or sensitive customer data in order notes.
- This package does not include your Netlify account, site URL, deployed state, or a live test. Deployment and end-to-end testing are still required.
- Keep a backup of the original uploaded POS HTML and Google Apps Script before replacing any live site files.

## Repair cashier-device authorization (only if you see "POS device not authorized")
1. In Netlify, open **Site configuration → Environment variables** (the wording may vary by dashboard version).
2. Add an environment variable named `POS_DEVICE_RESET_TOKEN`. Set its value to a new private random code at least 24 characters long. Do not share this code.
3. Trigger a new deploy so the Function receives the variable.
4. Open `https://YOUR-SITE-NAME.netlify.app/reset-pos-device.html` in your browser.
5. Enter the private reset code and click **Reset cashier authorization**. The page should confirm that authorization was reset.
6. On the intended cashier computer and Chrome profile, open the POS website, then open the Customer QR / Mobile Order panel. The browser should register its current device key and publish the menu.
7. Verify `https://YOUR-SITE-NAME.netlify.app/api/mobile-menu` now returns a non-empty `menu` array.
8. Once the cashier device is working, remove the `POS_DEVICE_RESET_TOKEN` environment variable from Netlify and redeploy. Keep the code private until it is removed.

This reset deletes only the stored cashier-device key hash from Netlify Blobs. It does not delete the customer menu or mobile order records.
