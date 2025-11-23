from flask import Flask, render_template, request, jsonify
import numpy as np
import joblib
from PIL import Image
import io
import base64
import tensorflow as tf

app = Flask(__name__)


# Load Models
knn = joblib.load("models/knn.joblib")
svm = joblib.load("models/svm.joblib")
rf  = joblib.load("models/rf.joblib")
lr  = joblib.load("models/lr.joblib")
lenet = tf.keras.models.load_model("models/lenet_model.keras")


# Preprocess Function

def preprocess_image(img):
    img = img.convert("L")
    img = img.resize((28, 28))
    img_arr = np.array(img)

    # Inversion check
    if img_arr.mean() > 127:
        img_arr = 255 - img_arr

    img_arr_norm = img_arr.astype("float32") / 255.0
    return img_arr, img_arr_norm



# Prediction Mechanism

def predict_digit(img_arr_norm):
    # ML inputs → flatten
    flat = img_arr_norm.reshape(1, 784)

    # CNN input
    cnn_input = img_arr_norm.reshape(1, 28, 28, 1)

    # LeNet Prediction
    cnn_preds = lenet.predict(cnn_input)[0]  # shape (10,)
    cnn_class = np.argmax(cnn_preds)
    cnn_conf  = float(np.max(cnn_preds))

    # ML Models
    pred_knn = knn.predict(flat)[0]
    pred_svm = svm.predict(flat)[0]
    pred_lr  = lr.predict(flat)[0]
    pred_rf  = rf.predict(flat)[0]

    votes = [pred_knn, pred_svm, pred_lr, pred_rf]
    ensemble_pred = max(set(votes), key=votes.count)

    return {
        "lenet_pred": int(cnn_class),
        "lenet_conf": cnn_conf,
        "ensemble_pred": int(ensemble_pred),
        "votes": {
            "KNN": int(pred_knn),
            "SVM": int(pred_svm),
            "LR": int(pred_lr),
            "RF": int(pred_rf),
        },
        "all_conf": [float(x) for x in cnn_preds]  # 🔥 confidences for 0–9
    }




# Home Page

@app.route("/")
def index():
    return render_template("index.html")



# Prediction Route (Drawn Image)

@app.route("/predict_canvas", methods=["POST"])
def predict_canvas():
    data = request.json["image"]
    img_bytes = base64.b64decode(data.split(",")[1])
    img = Image.open(io.BytesIO(img_bytes))

    raw, norm = preprocess_image(img)
    result = predict_digit(norm)

    return jsonify(result)



# Prediction Route (Uploaded Image)

@app.route("/predict_upload", methods=["POST"])
def predict_upload():
    file = request.files["file"]
    img = Image.open(file.stream)

    raw, norm = preprocess_image(img)
    result = predict_digit(norm)

    return jsonify(result)



# Run Local

if __name__ == "__main__":
    app.run(debug=True)
