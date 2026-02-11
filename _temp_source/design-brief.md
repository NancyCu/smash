This is a comprehensive summary of the "Lipid Lotto" project design and logic. Use this as your "master blueprint" to port the features into your existing codebase (the smash repo).
1. The Core Concept: "Lipid Lotto"
The Bet: A single Over/Under bet on a total cholesterol result (Target: 385 mg/dL).
The Theme: "Clinical Neon" / Asian Parent Edition. High-stakes sports betting aesthetic mixed with medical humor and Vietnamese cultural memes.
The Tone: Funny, graphic, and stressful.
2. Visual & UI Design (Referencing Input Files)
Style Matching (input_file_0, 1, 2):
Maintain the Dark Mode (#0f0f1b) and Neon Green (#00e676) highlights from your "Souper Bowl Squares" app.
Use the same "Total Pot" and "Entry Fee" card layout.
The Artery Visualizer (input_file_4, 5):
Shape: An organic, curved "S-shape" tube (not a straight "hotdog" bar).
The Ends: Must look jagged and "torn" (as sketched in input_file_5) to look like a biological specimen.
The Plaque: Yellow cholesterol that isn't smooth. It must look like rough, lumpy blobs (using SVG feTurbulence filters for a "crusty" texture).
Blood Flow: A central red stream that visibly "chokes" or narrows as the yellow plaque grows.
Platelets: Small red circles/white beans drifting slowly through the tube.
3. Interactive Mechanics (The Marker)
The Custom Marker: Replace the sports icons with a "Dép Tổ Ong" (Honeycomb Sandal) or a Sriracha bottle.
Auto-Scan Mode: The marker moves automatically left-to-right on a "yoyo" loop when the page loads, showing shifting numbers.
User Override:
Dragging the marker stops the auto-animation.
The marker follows the "S-curve" of the artery (requires Sine/Cosine math to stay inside the tube).
Locking: On dragEnd, the selected mg/dL is "locked" in local state until the user clicks pay.
Feedback: The artery turns deeper red and the marker shakes violently as the user slides toward the "Over" (600 mg/dL) side.
4. Betting & Payout Rules
The 
5.00.
Team Selection:
TEAM KHỔ QUA (Bitter Melon/Under) vs. TEAM NƯỚC BÉO (Fatty Broth/Over).
The Payout Box: Mimics the "50/50 Split Rollover" from input_file_0, but labeled "The Survivor's Payout."
5. Funny Copy & "Asian Parent" Ticker
Statuses: "STATUS: RISKY (NƯỚC BÉO)", "IMPENDING DOOM", "GẶP ÔNG BÀ SOON."
Ticker Tape: A scrolling bar at the top with:
"MÁ LA (MOM IS SCREAMING)"
"WHY YOU SO FAT?"
"DELICIOUS, BUT SPEEDS UP THE INHERITANCE PROCESS."
6. Technical Porting Instructions (For the smash Repo)
Firebase Integration:
Collection: Create a bets collection in Firestore.
Document Structure: Store { uid: string, betAmount: 5, targetValue: number, timestamp: serverTimestamp }.
Validation: Use Firestore Rules to ensure a UID can only exist once in the collection (preventing double betting).
Deployment (input_file_6):
Since the Google Project creation failed, create the project directly in the Firebase Console (console.firebase.google.com).
Host the frontend on Vercel (linking your GitHub repo) and point the Firebase Config keys to your new project.
7. Porting Logic Checklist
Artery Component: Replace the 100-square grid with the SVG Artery Visualizer.
State Management: Replace the "Square Selection" state with a single selectedCholesterol number state.
Payment Flow: Update the handlePayment function to trigger a modal with your Venmo/CashApp link and a $5 fixed price.
Real-time Pot: Calculate the Total Pot by multiplying bets.length * 5.
