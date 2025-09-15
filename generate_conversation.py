#!/usr/bin/env python3
import subprocess
import os
import tempfile

# Conversation lines with speaker assignments
conversation = [
    ("Intake desk—name, please?", "en-US-JennyNeural"),
    ("Daniel Ortiz.", "en-US-GuyNeural"),
    ("What happened?", "en-US-JennyNeural"),
    ("Last Wednesday around 8 PM on I-80, a car and I merged at the same time and we sideswiped. Damage looks moderate.", "en-US-GuyNeural"),
    ("Police?", "en-US-JennyNeural"),
    ("Yes, a report was taken.", "en-US-GuyNeural"),
    ("Injuries?", "en-US-JennyNeural"),
    ("Right shoulder and mid back. Pain is five out of ten, up to six when I lift.", "en-US-GuyNeural"),
    ("Treatment?", "en-US-JennyNeural"),
    ("Urgent care two days later; ordered X-rays; started PT.", "en-US-GuyNeural"),
    ("Any chiropractic?", "en-US-JennyNeural"),
    ("One visit so far.", "en-US-GuyNeural"),
    ("Witness present?", "en-US-JennyNeural"),
    ("The car behind us pulled over and gave their info to the officer.", "en-US-GuyNeural"),
    ("Missed work?", "en-US-JennyNeural"),
    ("One day.", "en-US-GuyNeural"),
    ("Insurance?", "en-US-JennyNeural"),
    ("Progressive auto; United Healthcare for medical.", "en-US-GuyNeural"),
]

def generate_conversation():
    temp_files = []
    
    try:
        # Generate individual audio files for each line
        for i, (text, voice) in enumerate(conversation):
            temp_file = f"temp_line_{i:02d}.mp3"
            temp_files.append(temp_file)
            
            # Generate audio for this line
            cmd = [
                "/Users/udit/.local/bin/edge-tts",
                "--voice", voice,
                "--text", text,
                "--write-media", temp_file
            ]
            
            print(f"Generating line {i+1}: {text[:30]}...")
            subprocess.run(cmd, check=True)
        
        # Create file list for ffmpeg concat
        with open("filelist.txt", "w") as f:
            for temp_file in temp_files:
                f.write(f"file '{temp_file}'\n")
        
        # Combine all audio files
        cmd = [
            "ffmpeg",
            "-f", "concat",
            "-safe", "0",
            "-i", "filelist.txt",
            "-c", "copy",
            "src/fixtures/test4_conversation.mp3"
        ]
        
        print("Combining audio files...")
        subprocess.run(cmd, check=True)
        
        print("Conversation audio generated successfully!")
        
    finally:
        # Clean up temporary files
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        if os.path.exists("filelist.txt"):
            os.remove("filelist.txt")

if __name__ == "__main__":
    generate_conversation()
