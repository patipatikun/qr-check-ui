const html5QrCode = new Html5Qrcode("reader");
const overlay = document.getElementById("overlay");
const resultBox = document.getElementById("result");
let scanning = false;

// 📷 読み取り開始ボタン
document.getElementById("startScan").addEventListener("click", async () => {
  if (scanning) return;
  scanning = true;

  overlay.style.visibility = "visible";
  resultBox.textContent = "";

  try {
    await html5QrCode.stop(); // ← 先に止めておく
    console.log("🛑 stop() 成功");
  } catch (e) {
    console.log("⚠️ stop() 無視:", e);
  }

  try {
    await html5QrCode.start({ facingMode: "environment" }, {
      fps: 10,
      qrbox: { width: 200, height: 300 },
      aspectRatio: 1.0,
      disableFlip: true
    }, decodedText => {
      console.log("✅ 読み取り成功:", decodedText);
      html5QrCode.stop().catch(() => {});
      scanning = false;
      overlay.style.visibility = "hidden";
      resultBox.textContent = `✅ 読み取り成功: ${decodedText}`;
    }, errorMessage => {
      console.log("❌ 読み取り失敗:", errorMessage);
    });

    console.log("📡 start() 成功");
  } catch (err) {
    console.error("❌ start() 失敗:", err);
    scanning = false;
    overlay.style.visibility = "hidden";
    resultBox.textContent = "❌ 読み取り開始失敗";
  }

  setTimeout(() => {
    if (scanning) {
      html5QrCode.stop().catch(() => {});
      scanning = false;
      overlay.style.visibility = "hidden";
      resultBox.textContent = "⚠️ 読み取り失敗（タイムアウト）";
    }
  }, 5000);
});
