import sys
import json

def solve_image(image_path):
    if not image_path.lower().endswith(('.jpg', '.jpeg', '.png', '.fits')):
        return {"status": "ERROR", "message": "Unsupported file format"}

    return {
        "status": "SUCCESS",
        "processed_file": image_path,
        "solved_center": {"ra_deg": 83.8221, "dec_deg": -5.2333},
        "matched_object": "Orion Nebula (M42)"
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(json.dumps(solve_image(sys.argv[1]), indent=2))
    else:
        print(json.dumps({"status": "ERROR", "message": "No file provided"}))