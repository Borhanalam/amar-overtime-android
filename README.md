# আমার ওভার টাইম — Android App

**App name:** আমার ওভার টাইম  
**Developer:** BORHAN  
**Application ID:** `com.borhan.amarot`  
**Version:** 1.1 (versionCode 2)

## Included
- Supplied app icon and BORHAN branding
- Bengali mobile-first dashboard
- Monthly salary, OT, attendance bonus, late and night-bill calculation
- Day / Night / Holiday / Leave / Sick / Absent duty records
- Multiple Worker profiles
- Worker-specific salary settings and duty history
- Search, edit and delete records
- CSV export to Android Downloads
- Full JSON Backup / Restore through Android file picker
- Offline-first local storage
- Android 12+ splash screen configuration
- targetSdk 36 / compileSdk 36

## Open in Android Studio
1. Open the project folder in Android Studio.
2. Let Gradle sync finish.
3. Connect an Android phone or start an emulator.
4. Run the `app` configuration.

## Generate Play Store AAB
Use **Build → Generate Signed Bundle / APK → Android App Bundle**.
Create your own upload/release keystore and keep it private. `keystore.properties.example` is provided as a template.

## Privacy policy
`PRIVACY_POLICY.md` contains the current offline-data privacy policy text. For Play Console, publish the policy at a public HTTPS URL (for example, from your own GitHub Pages site) and enter that URL in Play Console.

## Important
This project does not contain a signing key. A Play Store release must be signed with a keystore controlled by the developer.
