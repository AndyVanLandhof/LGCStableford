# Amplesoft Font Integration Guide

## Step 1: Purchase & Download Amplesoft

### Recommended Sources:
1. **MyFonts.com** - Most reliable source
   - Search for "Amplesoft"
   - Purchase required weights (Regular, Medium, Bold)
   - Download web fonts (.woff2, .woff, .ttf)

2. **Adobe Fonts** - If you have Creative Cloud
   - Check availability in Adobe Fonts library
   - Activate for web use

3. **Alternative Fonts** (if Amplesoft unavailable):
   - Inter
   - Poppins
   - Nunito Sans
   - DM Sans

## Step 2: File Structure

Place your downloaded font files in this structure:
```
public/
  fonts/
    Amplesoft-Regular.woff2
    Amplesoft-Regular.woff
    Amplesoft-Regular.ttf
    Amplesoft-Medium.woff2
    Amplesoft-Medium.woff
    Amplesoft-Medium.ttf
    Amplesoft-Bold.woff2
    Amplesoft-Bold.woff
    Amplesoft-Bold.ttf
```

## Step 3: Usage in Components

The font is now automatically applied to all elements. For specific usage:

```tsx
// Use the font-amplesoft class for explicit application
<h1 className="font-amplesoft">Golf Stableford</h1>

// Or use the CSS variable
<div style={{ fontFamily: 'var(--font-family-primary)' }}>
  Content with Amplesoft font
</div>
```

## Step 4: iOS App Considerations

For Capacitor iOS builds, ensure fonts are properly bundled:

1. Add fonts to `public/fonts/` directory
2. Fonts will be automatically included in the iOS bundle
3. Test on physical device to ensure proper loading

## Step 5: Verification

To verify the font is loading correctly:

1. Open browser Developer Tools
2. Go to Network tab
3. Refresh your app
4. Look for font file requests (should see 200 status)
5. Check Elements tab to confirm font-family is applied

## Fallback Strategy

If Amplesoft fails to load, the app will automatically fall back to:
1. System fonts (-apple-system for iOS)
2. BlinkMacSystemFont for macOS
3. Segoe UI for Windows
4. Roboto for Android
5. Generic sans-serif

## File Size Optimization

- WOFF2 format is most efficient (smallest file size)
- WOFF is the fallback for older browsers
- TTF is included for maximum compatibility

## License Compliance

Ensure your Amplesoft license covers:
- ✅ Web use
- ✅ Mobile app distribution
- ✅ Commercial use (if applicable)
- ✅ Number of users/installs permitted