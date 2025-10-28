const html5QrCode = new Html5Qrcode("reader");
const overlay = document.getElementById("overlay");
const resultBox = document.getElementById("result");
let scanning = false;

// 📡 カメラ起動ボタン
document.getElementById("startCamera").addEventListener("click", () => {
  html5QrCode.start({ facingMode: "environment" }, {
    fps: 10,
    qrbox: function(w, h) {
      const size = Math.min(w, h) * 0.8;
      return { width: size, height: size };
    },
    aspectRatio: 1.0
  }, () => {
    console.log("✅ カメラ起動完了");
  }, error => {
    console.warn("❌ カメラ起動エラー:", error);
    resultBox.textContent = "❌ カメラ起動失敗";
  });
});

// 📷 読み取り開始ボタン
document.getElementById("startScan").addEventListener("click", () => {
  if (scanning) return;
  scanning = true;

  overlay.style.visibility = "visible";
  resultBox.textContent = "";

  html5QrCode.start({ facingMode: "environment" }, {
    fps: 10,
    qrbox: function(w, h) {
      const size = Math.min(w, h) * 0.8;
      return { width: size, height: size };
    },
    aspectRatio: 1.0
  }, decodedText => {
    console.log("✅ 読み取り成功:", decodedText);
    html5QrCode.stop().catch(() => {});
    scanning = false;
    overlay.style.visibility = "hidden";
    resultBox.textContent = `✅ 読み取り成功: ${decodedText}`;
  }, errorMessage => {
    console.log("❌ 読み取り失敗:", errorMessage);
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
