# Vitals

A native iOS and Android health tracker built with React Native and Expo. One codebase, no backend, no account.

## Features

- Daily tracking of water, sleep, steps, active minutes, weight, mood, and a note
- Editable goals with a progress ring for each of the first four
- 14-day trend chart for any metric, with your goal shown as a dashed line
- Logging streak, light and dark mode, and day-by-day navigation
- Data stays on the device (AsyncStorage). Export shares your data as JSON; Import restores it

## Run it

Requirements: Node.js 20 or newer, and the free **Expo Go** app on your phone (or an iOS simulator / Android emulator).

```bash
npm install
npx expo install --fix      # aligns package versions with your Expo SDK
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). Press `i` or `a` to open a simulator or emulator.

## Build an installable app

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview   # APK you can install directly
eas build -p ios                         # needs an Apple Developer account
```

Before publishing, change `ios.bundleIdentifier` and `android.package` in `app.json` from `com.example.vitals` to your own ID, and add an `icon` and `splash` there.

## Automatic Android build (GitHub Actions)

Every push to `main` runs `.github/workflows/build-android.yml`, which builds an APK. Open the repo's **Actions** tab, click the latest run, and download the `vitals-apk` file under **Artifacts**. You can also start it by hand with **Run workflow**.

## Project layout

```
App.js                     Main screen and app state
index.js                   Entry point
src/theme.js               Colors (light/dark), metric definitions
src/storage.js             Load/save with AsyncStorage
src/utils.js               Date helpers and streak calculation
src/components/Ring.js     Progress ring
src/components/TrendChart.js
src/components/NumberField.js
```

## Customize

- Default goals: `DEFAULT_STATE` in `src/storage.js`
- Add or rename metrics: `METRICS` and `RING_KEYS` in `src/theme.js`, plus a matching color of the same name in both palettes
- Colors: the `light` and `dark` objects in `src/theme.js`

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## Ideas for next steps

- Daily reminder notifications (`expo-notifications`)
- Apple Health / Health Connect sync for steps and sleep
- File-based export and import (`expo-file-system`, `expo-document-picker`)
- Weekly summary screen
