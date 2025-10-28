const html5QrCode = new Html5Qrcode("reader");
const overlay = document.getElementById("overlay");
const resultBox = document.getElementById("result");
let scanning = false;

// ✅ カメラ起動ボタンで start() 実行
document.getElementById("startCamera").addEventListener("click", () => {
  html5QrCode.start({ facingMode: "environment" }, {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  }, () => {}, () => {}).catch(err => {
    resultBox.textContent = "❌ カメラ起動失敗";
    console.error("カメラ起動エラー:", err);
  });
});

// ✅ 読み取りボタンで読み取り処理
document.getElementById("startScan").addEventListener("click", () => {
  if (scanning) return;
  scanning = true;

  overlay.style.visibility = "visible";
  resultBox.textContent = "";

  html5QrCode.start({ facingMode: "environment" }, {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  }, decodedText => {
    html5QrCode.stop().catch(() => {});
    scanning = false;
    overlay.style.visibility = "hidden";
    resultBox.textContent = `✅ 読み取り成功: ${decodedText}`;
  }, errorMessage => {
    // 読み取り失敗時のログ（必要なら表示）
  });

  setTimeout(() => {
    if (scanning) {
      html5QrCode.stop().catch(() => {});
      scanning = false;
      overlay.style.visibility = "hidden";
      resultBox.textContent = "⚠️ 読み取り失敗（タイムアウト）";
    }
  }, 5000);
});
