#!/bin/bash

# Build script for iOS deployment
echo "🏗️  Building Golf Stableford for iOS..."

# Build the React app
echo "📦 Building React app..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync

if [ $? -ne 0 ]; then
  echo "❌ Capacitor sync failed!"
  exit 1
fi

# Open in Xcode
echo "🍎 Opening in Xcode..."
npx cap open ios

echo "✅ Build complete! Configure in Xcode and test on device."
echo ""
echo "Next steps:"
echo "1. Set your Bundle Identifier in Xcode"
echo "2. Select your Development Team"
echo "3. Add app icons"
echo "4. Test on device or simulator"
echo "5. Archive for TestFlight when ready"