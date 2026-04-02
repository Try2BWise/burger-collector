# Burger Collector

Burger Collector is an iPhone-first progressive web app for tracking burgers you've eaten, inspired by pocket tasting journals.

## Planned product direction

- Fast personal burger logging
- Ratings, notes, toppings, patty style, and photos
- Offline-first behavior for quick entry
- PWA installability, then iOS packaging with Capacitor

## Getting started

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

## Storage

Entries and photos are now stored in IndexedDB for better durability than `localStorage`, with automatic migration from older local-only data.

## iOS Packaging Prep

Capacitor has been added and the `ios/` project has already been scaffolded.

```powershell
npm run cap:sync
```

On a Mac with Xcode and CocoaPods installed:

```powershell
npm run build
npm run cap:sync
npm run cap:open:ios
```

Then open `ios/App/App.xcworkspace` in Xcode, configure signing, and archive from there for TestFlight/App Store distribution.
