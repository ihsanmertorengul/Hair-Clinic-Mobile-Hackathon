import cv2
import numpy as np

def detect_brightness(img):
    # Griye çevir
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Ortalama parlaklık (0-255)
    brightness_value = float(np.mean(gray))

    return {
        "value": brightness_value,      # ortalama parlaklık
        "dark": brightness_value < 80,  # 80 altı → karanlık
        "bright": brightness_value > 180  # çok yüksek parlaklık
    }
