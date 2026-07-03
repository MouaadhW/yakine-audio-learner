# Store Assets

These files must exist before running `eas build --profile production`.

| File | Size | Format | Notes |
|---|---|---|---|
| `icon.png` | 1024×1024 | PNG, **no alpha channel** | App Store + Play Store launcher icon |
| `adaptive-icon.png` | 1024×1024 | PNG (with alpha OK) | Android adaptive icon foreground layer |
| `splash.png` | 1284×2778 | PNG | Splash screen — content is centred at 200px wide |
| `favicon.png` | 48×48 | PNG | Web only |

### Design guidelines
- `icon.png`: Use a white/transparent-free background. Apple rejects icons with alpha.
- `adaptive-icon.png`: Foreground only — Android composites it over the `#6C63FF` background defined in `app.config.js`.
- `splash.png`: Keep the logo centred — Expo crops/scales to fit all device sizes.
- Brand colour: `#6C63FF`

### Android additional assets (submitted manually in Play Console)
- **Feature graphic**: 1024×500 PNG (shown on Play Store listing page)
- **Phone screenshots**: at least 2, 1080×1920 PNG or JPG
- **7-inch tablet screenshots** (if supporting tablets)

### iOS additional assets (submitted in App Store Connect)
- **App Store screenshots**: iPhone 6.5" (1242×2688), iPhone 5.5" (1242×2208)
- **iPad screenshots** (only if `supportsTablet: true`)
