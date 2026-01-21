import cv2
import numpy as np

def detect_blur(image, threshold=180):
    # Gri tona çevir
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Tenengrad (Sobel Gradients)
    Gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0)
    Gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1)
    G = np.sqrt(Gx**2 + Gy**2)

    score = G.mean()

    # True = bulanık
    is_blurry = score < threshold

    return {
        "score": float(score),
        "is_blurry": is_blurry
    }
