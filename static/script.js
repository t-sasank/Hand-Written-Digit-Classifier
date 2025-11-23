// ============ Canvas Setup (White pad, Black marker) ============
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let drawing = false;
let lastX = 0, lastY = 0;

function initCanvas() {
    // Fill white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw settings
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000"; // black marker
}

initCanvas();

// Mouse events
canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mouseleave", () => drawing = false);

canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

// Touch events (for mobile)
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    drawing = true;
    lastX = touch.clientX - rect.left;
    lastY = touch.clientY - rect.top;
});
canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    drawing = false;
});
canvas.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    drawing = false;
});
canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
});

function clearCanvas() {
    initCanvas();
}

// ============ DOM Elements ============
const clearBtn = document.getElementById("clearBtn");
const predictCanvasBtn = document.getElementById("predictCanvasBtn");
const predictUploadBtn = document.getElementById("predictUploadBtn");
const imageUploadInput = document.getElementById("imageUpload");

const noPrediction = document.getElementById("noPrediction");
const predictionSection = document.getElementById("predictionSection");
const loadingEl = document.getElementById("loading");

const lenetDigitEl = document.getElementById("lenetDigit");
const lenetConfEl = document.getElementById("lenetConf");
const ensembleDigitEl = document.getElementById("ensembleDigit");
const votesBoxEl = document.getElementById("votesBox");
const confTableBody = document.getElementById("confTableBody");

// ============ Helper to toggle loading ============
function setLoading(isLoading) {
    loadingEl.classList.toggle("hidden", !isLoading);
    predictionSection.classList.toggle("hidden", isLoading);
}

// ============ Show Results ============
function showResult(data) {
    noPrediction.classList.add("hidden");
    setLoading(false);

    lenetDigitEl.textContent = data.lenet_pred;
    lenetConfEl.textContent = (data.lenet_conf * 100).toFixed(2);

    ensembleDigitEl.textContent = data.ensemble_pred;
    votesBoxEl.textContent = JSON.stringify(data.votes, null, 2);

    // Confidence scores for 0–9
    confTableBody.innerHTML = "";
    if (data.all_conf) {
        data.all_conf.forEach((val, digit) => {
            const tr = document.createElement("tr");
            const tdDigit = document.createElement("td");
            const tdConf = document.createElement("td");
            tdDigit.textContent = digit;
            tdConf.textContent = (val * 100).toFixed(2) + "%";
            tr.appendChild(tdDigit);
            tr.appendChild(tdConf);
            confTableBody.appendChild(tr);
        });
    }

    predictionSection.classList.remove("hidden");
}

// ============ Predict from Canvas ============
async function predictCanvas() {
    setLoading(true);
    noPrediction.classList.add("hidden");

    const imgDataUrl = canvas.toDataURL("image/png");
    try {
        const res = await fetch("/predict_canvas", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ image: imgDataUrl })
        });

        const data = await res.json();
        showResult(data);
    } catch (err) {
        console.error(err);
        setLoading(false);
        alert("Error while predicting from canvas");
    }
}

// ============ Predict from Upload ============
async function predictUpload() {
    const file = imageUploadInput.files[0];
    if (!file) {
        alert("Please select an image file first.");
        return;
    }

    setLoading(true);
    noPrediction.classList.add("hidden");

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/predict_upload", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        showResult(data);
    } catch (err) {
        console.error(err);
        setLoading(false);
        alert("Error while predicting from uploaded image");
    }
}

// ============ Event Listeners ============
clearBtn.addEventListener("click", clearCanvas);
predictCanvasBtn.addEventListener("click", predictCanvas);
predictUploadBtn.addEventListener("click", predictUpload);
