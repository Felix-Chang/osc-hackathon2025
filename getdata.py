import cv2
import mediapipe as mp
import numpy as np
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_pose = mp.solutions.pose

# For webcam input:

cap = cv2.VideoCapture(0)
# Define a threshold for slouching
SLOUCH_THRESHOLD = 0.07 # You can tune this value

with mp_pose.Pose(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5) as pose:
  while cap.isOpened():
    success, image = cap.read()
    if not success:
      print("Ignoring empty camera frame.")
      continue

    # To improve performance
    image.flags.writeable = False
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = pose.process(image)

    # Make the image writeable again and convert back to BGR
    image.flags.writeable = True
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    # --- START OF NEW LOGIC ---

    try:
        # Get the landmarks
        landmarks = results.pose_landmarks.landmark
        
        # Get coordinates for left shoulder and left ear
        # MediaPipe provides landmarks as an enum for easy access
        left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
        left_ear = landmarks[mp_pose.PoseLandmark.LEFT_EAR]

        # --- POSTURE CHECK ---
        # Check if the ear's x-coordinate is in front of the shoulder's x-coordinate
        if left_ear.x < left_shoulder.x - SLOUCH_THRESHOLD:
            posture_status = 'Slouching Detected!'
            text_color = (0, 0, 255) # Red for bad posture
        else:
            posture_status = 'Good Posture'
            text_color = (0, 255, 0) # Green for good posture
        
        # Display the posture status on the screen
        cv2.putText(image, posture_status, 
                    (10, 30), # Position of the text
                    cv2.FONT_HERSHEY_SIMPLEX, 1, text_color, 2, cv2.LINE_AA)

    except:
        # This part runs if no landmarks are detected (no person in frame)
        pass

    # --- END OF NEW LOGIC ---


    # Draw the pose annotation on the image
    mp_drawing.draw_landmarks(
        image,
        results.pose_landmarks,
        mp_pose.POSE_CONNECTIONS,
        landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style())
        
    # Flip the image horizontally for a selfie-view display
    cv2.imshow('MediaPipe Pose', cv2.flip(image, 1))

    if cv2.waitKey(5) & 0xFF == 27:
      break

cap.release()
cv2.destroyAllWindows() # Good practice to close the window properly