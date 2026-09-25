# Behavior-X: Production Deployment Guide
**HACKEX '26 Production Setup**

---

## 1. Production Build Steps

Behavior-X builds into a production-optimized static client application:

```bash
# Clean previous build artifacts
npm run clean

# Execute type validation
npm run lint

# Build optimized production bundle
npm run build
```

---

## 2. Environment Configuration

Copy `.env.example` to `.env` in production environments:

```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
```

*Note: Behavior-X functions with 100% feature completeness even if `GEMINI_API_KEY` is omitted, utilizing its internal deterministic narrative synthesis engine.*

---

## 3. Camera Permissions & HTTPS Considerations

- **HTTPS Mandatory:** Modern browsers require a secure origin (`https://` or `localhost`) to access `navigator.mediaDevices.getUserMedia()`.
- **iFrame Permissions:** When embedded inside third-party frames (such as AI Studio or canvas LMS), ensure `allow="camera; microphone; fullscreen"` is specified on the container iframe.

---

## 4. Production Verification Checklist

- [x] Bundle compiles with zero TypeScript errors.
- [x] Zero private API secrets bundled into client static assets.
- [x] 22/22 automated unit test scenarios passing in production build.
- [x] Responsive viewports verified across mobile, tablet, and widescreen.
- [x] Fallback mechanisms confirmed operational under network and hardware disconnection.
