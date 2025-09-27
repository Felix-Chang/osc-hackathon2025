/**
 * Pose Landmarker Web - MediaPipe Integration
 * 
 * How to supply models:
 * 1. Place .task files at public/models/pose_landmarker_{lite|full|heavy}.task
 * 2. Or set MODEL_FALLBACK to a remote URL
 */

import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';

// Constants
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_LOCAL = (variant) => `/models/pose_landmarker_${variant}.task`;
const MODEL_FALLBACK = (variant) => {
  // TODO: Replace with official remote URL when available
  console.warn(`Model ${variant} not found locally. Please either:
    1. Add pose_landmarker_${variant}.task to public/models/
    2. Set MODEL_FALLBACK to a valid remote URL`);
  return ""; // Placeholder - user should replace with actual URL
};

// DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const enableBtn = document.getElementById('enable');
const modelSelect = document.getElementById('modelVariant');
const fpsDisplay = document.getElementById('fps');

// State
let landmarker = null;
let lastVideoTime = -1;
let animationId = null;
let isStreaming = false;

// FPS tracking
const fpsTimestamps = [];
const FPS_WINDOW_SIZE = 30;

/**
 * Calculate distance between two landmarks
 */
function calculateDistance(landmark1, landmark2) {
  if (!landmark1 || !landmark2) return 0;
  
  const dx = landmark1.x - landmark2.x;
  const dy = landmark1.y - landmark2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between three landmarks (in degrees)
 */
function calculateAngle(point1, point2, point3) {
  if (!point1 || !point2 || !point3) return 0;
  
  const a = calculateDistance(point1, point2);
  const b = calculateDistance(point2, point3);
  const c = calculateDistance(point1, point3);
  
  if (a === 0 || b === 0) return 0;
  
  const angle = Math.acos((a * a + b * b - c * c) / (2 * a * b));
  return angle * (180 / Math.PI);
}

/**
 * Try to load model locally first, fallback to remote if 404
 */
async function tryLocalThenFallback(variant) {
  const localPath = MODEL_LOCAL(variant);
  
  try {
    // Check if local model exists
    const response = await fetch(localPath, { method: 'HEAD' });
    if (response.ok) {
      console.log(`Using local model: ${localPath}`);
      return localPath;
    }
  } catch (error) {
    console.log(`Local model not found: ${localPath}`);
  }
  
  // Fallback to remote
  const fallbackPath = MODEL_FALLBACK(variant);
  if (fallbackPath) {
    console.log(`Using fallback model: ${fallbackPath}`);
    return fallbackPath;
  }
  
  throw new Error(`No model available for variant: ${variant}`);
}

/**
 * Initialize MediaPipe Pose Landmarker
 */
async function initializeLandmarker(variant = 'lite') {
  try {
    // Clean up existing landmarker
    if (landmarker) {
      landmarker.close();
      landmarker = null;
    }
    
    // Cancel any pending animation
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    
    console.log(`Initializing Pose Landmarker with ${variant} model...`);
    
    // Initialize MediaPipe Vision Tasks
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
    
    // Get model path (local or fallback)
    const modelPath = await tryLocalThenFallback(variant);
    
    // Create Pose Landmarker
    landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { 
        modelAssetPath: modelPath 
      },
      runningMode: "VIDEO", // Use VIDEO mode for continuous processing
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputSegmentationMasks: false
    });
    
    console.log('Pose Landmarker initialized successfully');
    return true;
    
  } catch (error) {
    console.error('Failed to initialize Pose Landmarker:', error);
    // Don't reset the button here - let the calling function handle it
    return false;
  }
}

/**
 * Update FPS display
 */
function updateFPS() {
  const now = performance.now();
  fpsTimestamps.push(now);
  
  // Keep only recent timestamps
  if (fpsTimestamps.length > FPS_WINDOW_SIZE) {
    fpsTimestamps.shift();
  }
  
  // Calculate FPS
  if (fpsTimestamps.length >= 2) {
    const timeDiff = fpsTimestamps[fpsTimestamps.length - 1] - fpsTimestamps[0];
    const fps = Math.round((fpsTimestamps.length - 1) * 1000 / timeDiff);
    fpsDisplay.textContent = `FPS: ${fps}`;
  }
}

/**
 * Process video frame and draw pose landmarks
 */
function processFrame() {
  if (!isStreaming) return;
  
  // Only process new frames to avoid duplicate processing
  if (video.currentTime === lastVideoTime) {
    animationId = requestAnimationFrame(processFrame);
    return;
  }
  
  lastVideoTime = video.currentTime;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Only run pose detection if landmarker is available
  if (landmarker) {
    // Detect poses in the current video frame
    // Using detectForVideo() for VIDEO mode - processes continuous video stream
    const result = landmarker.detectForVideo(video, performance.now());
    
    // Draw pose landmarks and connections
    if (result.landmarks && result.landmarks.length > 0) {
      for (const poseLandmarks of result.landmarks) {
        // Draw landmarks with better visibility
        DrawingUtils.drawLandmarks(ctx, poseLandmarks, {
          radius: 4,
          color: '#FF0000'
        });
        
        // Draw connections between landmarks
        DrawingUtils.drawConnectors(ctx, poseLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 3
        });
        
        // EXTRACT ALL POSE DATA FOR CALCULATIONS
        const poseData = {
          // Face landmarks (0-10)
          nose: poseLandmarks[0],
          leftEye: poseLandmarks[1],
          rightEye: poseLandmarks[2],
          leftEar: poseLandmarks[3],
          rightEar: poseLandmarks[4],
          mouthLeft: poseLandmarks[9],
          mouthRight: poseLandmarks[10],
          
          // Upper body landmarks (11-22)
          leftShoulder: poseLandmarks[11],
          rightShoulder: poseLandmarks[12],
          leftElbow: poseLandmarks[13],
          rightElbow: poseLandmarks[14],
          leftWrist: poseLandmarks[15],
          rightWrist: poseLandmarks[16],
          leftPinky: poseLandmarks[17],
          rightPinky: poseLandmarks[18],
          leftIndex: poseLandmarks[19],
          rightIndex: poseLandmarks[20],
          leftThumb: poseLandmarks[21],
          rightThumb: poseLandmarks[22],
          
          // Lower body landmarks (23-32)
          leftHip: poseLandmarks[23],
          rightHip: poseLandmarks[24],
          leftKnee: poseLandmarks[25],
          rightKnee: poseLandmarks[26],
          leftAnkle: poseLandmarks[27],
          rightAnkle: poseLandmarks[28],
          leftHeel: poseLandmarks[29],
          rightHeel: poseLandmarks[30],
          leftFootIndex: poseLandmarks[31],
          rightFootIndex: poseLandmarks[32]
        };
        
        // EXAMPLE CALCULATIONS - Replace with your own math
        if (poseData.nose && poseData.nose.visibility > 0.5) {
          // Convert normalized coordinates to pixel coordinates
          const nosePixelX = poseData.nose.x * canvas.width;
          const nosePixelY = poseData.nose.y * canvas.height;
          
          // Calculate distance between shoulders
          const shoulderDistance = calculateDistance(
            poseData.leftShoulder, 
            poseData.rightShoulder
          );
          
          // Calculate arm angles
          const leftArmAngle = calculateAngle(
            poseData.leftShoulder,
            poseData.leftElbow,
            poseData.leftWrist
          );
          
          const rightArmAngle = calculateAngle(
            poseData.rightShoulder,
            poseData.rightElbow,
            poseData.rightWrist
          );
          
          // Calculate leg angles
          const leftLegAngle = calculateAngle(
            poseData.leftHip,
            poseData.leftKnee,
            poseData.leftAnkle
          );
          
          const rightLegAngle = calculateAngle(
            poseData.rightHip,
            poseData.rightKnee,
            poseData.rightAnkle
          );
          
          // Calculate body proportions
          const torsoLength = calculateDistance(poseData.leftShoulder, poseData.leftHip);
          const leftArmLength = calculateDistance(poseData.leftShoulder, poseData.leftWrist);
          const rightArmLength = calculateDistance(poseData.rightShoulder, poseData.rightWrist);
          
          // Log calculated data
          console.log('Calculated Data:', {
            nosePosition: { x: nosePixelX, y: nosePixelY },
            shoulderDistance: shoulderDistance,
            leftArmAngle: leftArmAngle,
            rightArmAngle: rightArmAngle,
            leftLegAngle: leftLegAngle,
            rightLegAngle: rightLegAngle,
            torsoLength: torsoLength,
            leftArmLength: leftArmLength,
            rightArmLength: rightArmLength
          });
          
          // You can now use this data for your application logic
          // For example: detect gestures, track movements, etc.
        }
      }
    }
  } else {
    // If no landmarker, just show webcam feed
    console.log('Webcam running (no pose detection)');
  }
  
  // Update FPS
  updateFPS();
  
  // Continue animation loop
  animationId = requestAnimationFrame(processFrame);
}

/**
 * Start webcam stream
 */
async function startWebcam() {
  try {
    enableBtn.disabled = true;
    enableBtn.textContent = 'Starting...';
    
    // Request webcam access
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        width: 640, 
        height: 480 
      }
  });
    
    // Set video source
    video.srcObject = stream;
    
    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        resolve();
      };
    });
    
    // Initialize landmarker
    const success = await initializeLandmarker(modelSelect.value);
    if (!success) {
      // If landmarker fails, still allow webcam to work (just without pose detection)
      console.warn('Pose landmarker failed to initialize, but webcam is working');
      isStreaming = true;
      enableBtn.textContent = 'Stop Webcam';
      enableBtn.disabled = false;
      return;
    }
    
    // Start processing
    isStreaming = true;
    enableBtn.textContent = 'Stop Webcam';
    enableBtn.disabled = false;
    
    // Start animation loop
    processFrame();
    
  } catch (error) {
    console.error('Failed to start webcam:', error);
    enableBtn.disabled = false;
    enableBtn.textContent = 'Enable Webcam';
    alert('Failed to access webcam. Please ensure camera permissions are granted and you\'re using HTTPS or localhost.');
  }
}

/**
 * Stop webcam stream
 */
function stopWebcam() {
  isStreaming = false;
  
  // Stop video stream
  if (video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }
  
  // Clean up landmarker
  if (landmarker) {
    landmarker.close();
    landmarker = null;
  }
  
  // Cancel animation
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Reset UI
  enableBtn.textContent = 'Enable Webcam';
  fpsDisplay.textContent = 'FPS: --';
  fpsTimestamps.length = 0;
}

/**
 * Handle model variant change
 */
async function onModelChange() {
  if (!isStreaming) return;
  
  console.log(`Switching to ${modelSelect.value} model...`);
  
  // Re-initialize with new model
  const success = await initializeLandmarker(modelSelect.value);
  if (success && isStreaming) {
    // Restart processing if still streaming
    processFrame();
  }
}

// Event listeners
enableBtn.addEventListener('click', () => {
  if (isStreaming) {
    stopWebcam();
  } else {
    startWebcam();
  }
});

modelSelect.addEventListener('change', onModelChange);

// Web Worker scaffold (commented for future performance optimization)
/*
// For better performance, pose detection could be moved to a Web Worker:
// 1. Create pose-worker.js
// 2. Move landmarker initialization and detection to worker
// 3. Use postMessage/onmessage for communication
// 4. Transfer video frame data or use OffscreenCanvas
// 
// Example structure:
// const worker = new Worker('./pose-worker.js');
// worker.postMessage({ type: 'init', variant: modelSelect.value });
// worker.postMessage({ type: 'detect', frameData: videoFrame });
// worker.onmessage = (e) => { // handle results };
*/

console.log('Pose Landmarker Web initialized');