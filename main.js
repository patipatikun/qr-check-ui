const html5QrCode = new Html5Qrcode("reader");
const overlay = document.getElementById("overlay");
const resultBox = document.getElementById("result");
let scanning = false;

// ✅ カメラ常時起動（枠は正方形で表示）
html5QrCode.start({ facingMode: "environment" }, {
  fps: 10,
  qrbox: function(w, h) {
    const size = Math.min(w, h, 300);
    return { width: size, height: size };
  },
  aspectRatio: 1.0
}, () => {}, () => {}).catch(err => {
  resultBox.textContent = "❌ カメラ起動失敗";
  console.error("カメラ起動エラー:", err);
});

// ✅ ボタン押下で読み取りモード開始
document.getElementById("startScan").addEventListener("click", () => {
  if (scanning) return;
  scanning = true;

  overlay.style.visibility = "visible";
  resultBox.textContent = "";

  html5QrCode.start({ facingMode: "environment" }, {
    fps: 10,
    qrbox: function(w, h) {
      const size = Math.min(w, h, 300);
      return { width: size, height: size };
    },
    aspectRatio: 1.0
  }, decodedText => {
    html5QrCode.stop().catch(() => {});
    scanning = false;
    overlay.style.visibility = "hidden";
    resultBox.textContent = `✅ 読み取り成功: ${decodedText}`;
  }, errorMessage => {
    // 読み取り失敗時のログ（必要なら表示）
  });

  // ✅ タイムアウト処理（5秒）
  setTimeout(() => {
    if (scanning) {
      html5QrCode.stop().catch(() => {});
      scanning = false;
      overlay.style.visibility = "hidden";
      resultBox.textContent = "⚠️ 読み取り失敗（タイムアウト）";
    }
  }, 5000);
});
