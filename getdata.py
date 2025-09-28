import cv2
import time, turtle
import mediapipe as mp
import numpy as np
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_pose = mp.solutions.pose
board = turtle.Screen()
pen = turtle.Turtle()

# For webcam input:

cap = cv2.VideoCapture(0)
# Define thresholds for posture detection
SLOUCH_THRESHOLD = 0.1 # Threshold for head forward position
SPINE_STRAIGHTNESS_THRESHOLD = 0.11 # Threshold for spine alignment

class PausableStopwatch:
    def __init__(self):
        self.start_time = None
        self.paused_time = None
        self.is_paused = False
        self.elapsed_time = 0

    def start(self):
        if self.start_time is None:
            # First time starting
            self.start_time = time.monotonic()
            #print("Timer started.")
        elif self.is_paused:
            # Resuming from a paused state
            time_difference = time.monotonic() - self.paused_time
            self.start_time += time_difference
            self.is_paused = False
            #print("Timer resumed.")
        else:
            #print("Timer is already running.")
            pass

    def pause(self):
        if self.start_time is not None and not self.is_paused:
            self.paused_time = time.monotonic()
            self.is_paused = True
            #print("Timer paused.")
        else:
            #print("Timer is not running or is already paused.")
            pass

    def reset(self):
        self.start_time = None
        self.paused_time = None
        self.is_paused = False
        self.elapsed_time = 0
        print("Timer reset.")

    def get_elapsed_time(self):
        if self.start_time is None:
            return 0.0
        if self.is_paused:
            return self.elapsed_time
        self.elapsed_time = time.monotonic() - self.start_time
        return self.elapsed_time

totalTimer = PausableStopwatch()
postureTimer = PausableStopwatch()

with mp_pose.Pose(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5) as pose:

  totalTimer.start()
  postureTimer.start()
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
        
        # Get coordinates for posture analysis
        left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        left_ear = landmarks[mp_pose.PoseLandmark.LEFT_EAR]
        right_ear = landmarks[mp_pose.PoseLandmark.RIGHT_EAR]
        
        # Back/spine landmarks
        left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
        right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP]

        # --- ENHANCED POSTURE CHECK ---
        # Check 1: Head alignment (ear vs shoulder) - forward head posture
        #head_slouching_left = left_ear.x < left_shoulder.x - SLOUCH_THRESHOLD
        #head_slouching_right = right_ear.x > right_shoulder.x - SLOUCH_THRESHOLD
        left_neck_alignment = abs(left_ear.x - left_shoulder.x)
        right_neck_alignment = abs(right_ear.x - right_shoulder.x)
        
        
        # Check 2: Spine straightness (shoulder to hip alignment)
        # Calculate the vertical alignment of spine
        left_spine_alignment = abs(left_shoulder.x - left_hip.x)
        right_spine_alignment = abs(right_shoulder.x - right_hip.x)
        spine_straightness = (left_spine_alignment + right_spine_alignment) / 2
        
        # Check 3: Shoulder level (both shoulders should be roughly at same height)
        shoulder_height_diff = abs(left_shoulder.y - right_shoulder.y)
        
        # Determine posture status using both methods
        if ((left_neck_alignment > SLOUCH_THRESHOLD )or (right_neck_alignment > SLOUCH_THRESHOLD) or
            spine_straightness > SPINE_STRAIGHTNESS_THRESHOLD or 
            shoulder_height_diff > 0.05):
            posture_status = 'Slouching Detected!'
            text_color = (100, 100, 255) # Red for bad posture
        else:
            posture_status = 'Good Posture'
            text_color = (100, 255, 100) # Green for good posture
        
        # Text will be added to the flipped image later
        if posture_status == "Slouching Detected!":
            postureTimer.pause()
        else:
            postureTimer.start()
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
    flipped_image = cv2.flip(image, 1)
    
   
        # Display the posture status on the flipped image
    cv2.putText(flipped_image, posture_status, 
                (10, 30), # Position of the text
                cv2.FONT_HERSHEY_SIMPLEX, 1, text_color, 2, cv2.LINE_AA)
    # Testing purposes

    cv2.putText(flipped_image, "left neck "+ str(round(left_neck_alignment,3)), (10,80), cv2.FONT_HERSHEY_SIMPLEX,1,text_color, 2, cv2.LINE_AA)
    cv2.putText(flipped_image, "right neck "+ str(round(right_neck_alignment,3)), (10,120), cv2.FONT_HERSHEY_SIMPLEX,1,text_color, 2, cv2.LINE_AA)
    cv2.putText(flipped_image, "left spine "+ str(round(left_spine_alignment,3)), (10,160), cv2.FONT_HERSHEY_SIMPLEX,1,text_color, 2, cv2.LINE_AA)
    cv2.putText(flipped_image, "right spine "+ str(round(right_spine_alignment,3)), (10,200), cv2.FONT_HERSHEY_SIMPLEX,1,text_color, 2, cv2.LINE_AA)
   


    cv2.imshow('MediaPipe Pose', flipped_image)

    if cv2.waitKey(5) & 0xFF == 27:
      break
postureTimer.start()
score = postureTimer.get_elapsed_time() / totalTimer.get_elapsed_time() * 100
print(f"Score: {score:.2f} out of 100")
pen.penup()
pen.goto(0,0)
pen.pendown()
pen.write(f"Score: {score:.0f}/100", font=("Arial", 40, "normal"), align = "center")
cap.release()
cv2.destroyAllWindows() # Good practice to close the window properly
board.mainloop()
