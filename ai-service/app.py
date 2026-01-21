from flask import Flask, request, jsonify
import cv2
import numpy as np
import mediapipe as mp
from werkzeug.utils import secure_filename
import os
import math
import google.generativeai as genai
import tempfile
from PIL import Image

# --- Ayarlar ---
GOOGLE_API_KEY = "YOUR_API_KEY"  # 🔑 Buraya kendi API anahtarını yaz!

# --- Flask App ---
app = Flask(__name__)
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# ---------------------------------------------------
# Flask Setup
# ---------------------------------------------------
app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ---------------------------------------------------
# Mediapipe Modelleri
# ---------------------------------------------------
mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True)

# ---------------------------------------------------
# Utility: JSON temizleyici
# ---------------------------------------------------
def clean_json(d):
    out = {}
    for k, v in d.items():
        if isinstance(v, (np.bool_,)):
            out[k] = bool(v)
        elif isinstance(v, (np.float32, np.float64)):
            out[k] = float(v)
        elif isinstance(v, (np.int32, np.int64)):
            out[k] = int(v)
        else:
            out[k] = v
    return out

# ---------------------------------------------------
# Brightness / Blur
# ---------------------------------------------------
def get_brightness(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    return float(hsv[:, :, 2].mean())

def get_blur(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return float(variance)

# ---------------------------------------------------
# Hybrid head segmentation
# ---------------------------------------------------
def compute_head_ratio(img):
    h, w = img.shape[:2]
    crop = img[0:int(h * 0.7), :]

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (9, 9), 0)

    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    if th.mean() > 127:
        th = 255 - th

    kernel = np.ones((9, 9), np.uint8)
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0.0

    cnt = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(cnt)
    total_area = float(crop.shape[0] * crop.shape[1])
    if total_area <= 0:
        return 0.0

    return max(0.0, min(float(area / total_area), 1.0))

# ---------------------------------------------------
# Face ratio (yüz alanı / görüntü alanı)
# ---------------------------------------------------
def detect_face_ratio(img):
    h, w, _ = img.shape
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    result = face_detection.process(img_rgb)
    if not result.detections:
        return 0.0

    detection = result.detections[0]
    box = detection.location_data.relative_bounding_box
    face_area = box.width * w * box.height * h
    image_area = w * h
    return float(face_area / image_area)

# ---------------------------------------------------
# Back-head segmentation (ense foto analizi)
# ---------------------------------------------------
def detect_head_ratio(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (25, 25), 0)

    _, th = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return 0.0

    largest = max(contours, key=cv2.contourArea)
    head_area = cv2.contourArea(largest)

    h, w, _ = img.shape
    image_area = w * h

    return float(head_area / image_area)

# ---------------------------------------------------
# Head pose - face mesh (yaw, pitch, roll)
# ---------------------------------------------------
MODEL_POINTS = np.array([
    (0.0, 0.0, 0.0),
    (0.0, -63.6, -12.5),
    (-43.3, 32.7, -26.0),
    (43.3, 32.7, -26.0),
    (-28.9, -28.9, -24.1),
    (28.9, -28.9, -24.1)
], dtype=np.float64)

def get_camera_matrix(size):
    focal_length = size[1]
    center = (size[1] / 2, size[0] / 2)
    return np.array(
        [[focal_length, 0, center[0]],
         [0, focal_length, center[1]],
         [0, 0, 1]], dtype="double"
    )

def get_head_pose(path):
    img = cv2.imread(path)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(img_rgb)

    if not results.multi_face_landmarks:
        return None

    lm = results.multi_face_landmarks[0].landmark

    image_points = np.array([
        (lm[1].x * img.shape[1], lm[1].y * img.shape[0]),
        (lm[152].x * img.shape[1], lm[152].y * img.shape[0]),
        (lm[33].x * img.shape[1], lm[33].y * img.shape[0]),
        (lm[263].x * img.shape[1], lm[263].y * img.shape[0]),
        (lm[61].x * img.shape[1], lm[61].y * img.shape[0]),
        (lm[291].x * img.shape[1], lm[291].y * img.shape[0])
    ], dtype=np.float64)

    camera_matrix = get_camera_matrix(img.shape)
    dist_coeffs = np.zeros((4, 1))

    ok, rv, tv = cv2.solvePnP(MODEL_POINTS, image_points, camera_matrix, dist_coeffs)
    if not ok:
        return None

    rm, _ = cv2.Rodrigues(rv)
    sy = math.sqrt(rm[0, 0] ** 2 + rm[1, 0] ** 2)

    if sy >= 1e-6:
        x = math.atan2(rm[2, 1], rm[2, 2])
        y = math.atan2(-rm[2, 0], sy)
        z = math.atan2(rm[1, 0], rm[0, 0])
    else:
        x = math.atan2(-rm[1, 2], rm[1, 1])
        y = math.atan2(-rm[2, 0], sy)
        z = 0

    return {
        "pitch": math.degrees(x),
        "yaw": math.degrees(y),
        "roll": math.degrees(z)
    }

# ---------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------

@app.route('/check-neck', methods=['POST'])
def check_neck():
    if 'image' not in request.files:
        return jsonify({"error": "Görsel dosyası eksik"}), 400

    file = request.files['image']
    if not file or file.filename == '':
        return jsonify({"error": "Geçersiz dosya"}), 400

    try:
        img = Image.open(file.stream).convert("RGB")
        prompt = (
            "Bu görselde bir kişinin ensesi (başın arka kısmı) görünüyor mu? "
            "Dikkat: Eğer kişinin yüzü veya yüzün herhangi bir kısmı görünüyorsa cevap 'Hayır' olsun. "
            "Sadece kişi arkaya dönükse ve başın arka kısmı (ense) görünüyorsa cevap 'Evet' olsun. "
            "Omuzların üstü veya sırtın üst kısmı tek başına yeterli değildir; mutlaka başın arka kısmı görünmelidir. "
            "Eğer ense açıkça görünüyorsa sadece 'Evet' yaz. Görünmüyorsa sadece 'Hayır' yaz. "
            "Cevap sadece 'Evet' veya 'Hayır' olsun."
        )
        response = model.generate_content([prompt, img], stream=False)
        answer = response.text.strip()

        if "Evet" in answer:
            result = True
            text = "Evet"
        elif "Hayır" in answer:
            result = False
            text = "Hayır"
        else:
            result = False
            text = "Belirsiz"

        return jsonify({
            "is_neck_visible": result,
            "answer": text
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyze", methods=["POST"])
def analyze_image():
    # Dosya kontrolü
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Only JPG/PNG files allowed"}), 400

    # Geçici dosya olarak kaydet (temizlik kolay)
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        # Dosyayı Gemini'ye yükle
        uploaded_file = genai.upload_file(tmp_path, mime_type=file.content_type or "image/jpeg")

        # Prompt ile analiz
        prompt = (
            "Bu görüntü, bir insanın kafa tepesini (vertex bölgesini) mi gösteriyor? "
            "Lütfen sadece şu formatta yanıt ver: "
            "{'is_vertex': true/false, 'reason': 'kısa açıklama'}"
        )
        response = model.generate_content([prompt, uploaded_file])

        # Yanıtı JSON'a dönüştürmeye çalış
        try:
            # Gemini düz JSON dönmeyebilir; düzeltmeye çalış
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3] if text.endswith("```") else text[7:]
            import json
            result = json.loads(text)
        except Exception:
            # JSON parse başarısızsa, manuel çıkarım yap
            txt_lower = response.text.lower()
            is_vertex = "evet" in txt_lower or "true" in txt_lower or "yes" in txt_lower
            result = {
                "is_vertex": is_vertex,
                "reason": response.text.strip()
            }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # Geçici dosyayı sil
        if "tmp_path" in locals():
            try:
                os.unlink(tmp_path)
            except:
                pass

# --- Sağlık kontrolü (opsiyonel) ---
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "OK"})

# 1) FRONT ANALYZE
@app.route("/analyze", methods=["POST"])
def analyze():
    if "photo" not in request.files:
        return jsonify({"error": "fotoğraf bulunamadı"}), 400

    file = request.files["photo"]
    path = os.path.join(UPLOAD_FOLDER, file.filename or "temp.jpg")
    file.save(path)

    img = cv2.imread(path)
    if img is None:
        return jsonify({"error": "görsel okunamadı"}), 400

    pitch_raw = request.form.get("pitch")
    roll_raw = request.form.get("roll")

    try: pitch = float(pitch_raw)
    except: pitch = None

    try: roll = float(roll_raw)
    except: roll = None

    brightness = get_brightness(img)
    blur_score = get_blur(img)
    head_ratio = compute_head_ratio(img)

    pitch_ok = (pitch is not None) and (-20 <= pitch <= 20)
    roll_ok = (roll is not None) and (abs(roll) <= 20)
    head_ok = head_ratio >= 0.35
    blur_ok = blur_score >= 60
    brightness_ok = 60 <= brightness <= 200

    vertex_ok = pitch_ok and roll_ok and head_ok and blur_ok and brightness_ok

    data = {
        "pitch": pitch,
        "roll": roll,
        "pitch_ok": pitch_ok,
        "roll_ok": roll_ok,
        "brightness": brightness,
        "brightness_ok": brightness_ok,
        "blur_score": blur_score,
        "blur_ok": blur_ok,
        "head_ratio": head_ratio,
        "head_ok": head_ok,
        "vertex_ok": vertex_ok
    }

    return jsonify(clean_json(data))

# 2) BACK ANALYZE
@app.route("/back_analyze", methods=["POST"])
def back_analyze():
    if "photo" not in request.files:
        return jsonify({"error": "Photo not found"}), 400

    file = request.files["photo"]
    path = os.path.join(UPLOAD_FOLDER, file.filename or "temp.jpg")
    file.save(path)

    img = cv2.imread(path)
    if img is None:
        return jsonify({"error": "Image read error"}), 400

    pitch = float(request.form.get("pitch", 0))
    roll = float(request.form.get("roll", 0))

    pitch_ok = -10 <= pitch <= 10
    roll_ok = 10 <= roll <= 30

    head_ratio = detect_head_ratio(img)
    head_ok = head_ratio >= 0.20

    face_ratio = detect_face_ratio(img)
    face_ok = face_ratio < 0.02

    correct = pitch_ok and roll_ok and head_ok and face_ok

    return jsonify({
        "pitch": pitch,
        "roll": roll,
        "pitch_ok": bool(pitch_ok),
        "roll_ok": bool(roll_ok),
        "head_ratio": float(head_ratio),
        "head_ok": bool(head_ok),
        "face_ratio": float(face_ratio),
        "face_ok": bool(face_ok),
        "correct": bool(correct)
    })

# 3) COMPARE (yaw karşılaştırma)
@app.route("/compare", methods=["POST"])
def compare_images():
    if "model" not in request.files or "user" not in request.files:
        return jsonify({"error": "Both images are required"}), 400

    model_file = request.files["model"]
    user_file = request.files["user"]

    model_path = os.path.join(UPLOAD_FOLDER, secure_filename(model_file.filename))
    user_path = os.path.join(UPLOAD_FOLDER, secure_filename(user_file.filename))

    model_file.save(model_path)
    user_file.save(user_path)

    pose1 = get_head_pose(model_path)
    pose2 = get_head_pose(user_path)

    if pose1 is None or pose2 is None:
        return jsonify({"error": "Could not detect face"}), 500

    diff = abs(pose1["yaw"] - pose2["yaw"])
    match = diff <= 15

    return jsonify({
        "yaw_model": pose1["yaw"],
        "yaw_user": pose2["yaw"],
        "difference": diff,
        "match": match
    })

# ---------------------------------------------------
# RUN
# ---------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
