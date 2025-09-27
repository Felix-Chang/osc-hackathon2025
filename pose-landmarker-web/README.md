# Pose Landmarker Web

A minimal, production-ready JavaScript web app that runs Google MediaPipe Pose Landmarker in the browser using `@mediapipe/tasks-vision`.

## Features

- Real-time pose detection using MediaPipe Pose Landmarker
- Webcam access with mirrored preview (selfie view)
- Multiple model variants (lite, full, heavy)
- Live FPS monitoring
- Clean, responsive UI
- Local model support with remote fallback

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

**Important**: Use HTTPS or localhost for camera access. The browser requires secure context for webcam permissions.

### Build for Production

```bash
npm run build
npm run preview
```

## Model Setup

### Option 1: Local Models (Recommended)

Place MediaPipe model files in the `public/models/` directory:

```
public/models/
  ├── pose_landmarker_lite.task
  ├── pose_landmarker_full.task
  └── pose_landmarker_heavy.task
```

Download models from [MediaPipe Model Zoo](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker#models).

### Option 2: Remote Models

If local models are not available, the app will attempt to use remote models. Update the `MODEL_FALLBACK` function in `main.js` with the appropriate remote URLs.

## Usage

1. Click "Enable Webcam" to start camera access
2. Select model variant from dropdown (lite/full/heavy)
3. Pose landmarks and connections will be overlaid on the video
4. Monitor FPS in the top-right corner
5. Click "Stop Webcam" to end the session

## Technical Notes

### Performance Tips

- **Lite model**: Fastest, good for real-time applications
- **Full model**: Balanced accuracy and speed
- **Heavy model**: Highest accuracy, slower processing

### Browser Requirements

- Modern browser with WebRTC support
- HTTPS or localhost (required for camera access)
- WebAssembly support

### Architecture

- **VIDEO mode**: Uses `detectForVideo()` for continuous processing
- **Frame deduplication**: Only processes new video frames
- **Canvas overlay**: Mirrored to match video preview
- **Graceful cleanup**: Proper resource management on stop/restart

### Future Optimizations

The code includes a scaffolded Web Worker implementation (commented) for moving pose detection to a background thread, which can improve performance on slower devices.

## Troubleshooting

### Camera Access Issues

- Ensure you're using HTTPS or localhost
- Check browser permissions for camera access
- Try refreshing the page and granting permissions again

### Model Loading Issues

- Verify model files are in `public/models/` directory
- Check browser console for specific error messages
- Ensure model files are not corrupted

### Performance Issues

- Try switching to the "lite" model variant
- Reduce browser window size
- Close other tabs/applications using camera
- Check FPS display for performance metrics

## Development

Built with:
- Vite (vanilla JavaScript)
- MediaPipe Tasks Vision
- Modern ES6+ features
- Responsive CSS Grid/Flexbox
