const html5QrCode = new Html5Qrcode("reader");

// ✅ カメラだけ起動（読み取りはまだしない）
html5QrCode.start({ facingMode: "environment" }, {
  fps: 10,
  qrbox: { width: 250, height: 250 }
}, () => {}, () => {})
.catch(err => {
  document.getElementById("result").textContent = "❌ カメラ起動失敗";
  console.error("カメラ起動エラー:", err);
});

// ✅ ボタンを押した瞬間だけ読み取り
document.getElementById("startScan").addEventListener("click", () => {
  document.getElementById("result").textContent = "🔍 読み取り中...";

  html5QrCode.scanOnce()
    .then(decodedText => {
      document.getElementById("result").textContent = `✅ 読み取り成功: ${decodedText}`;
    })
    .catch(err => {
      document.getElementById("result").textContent = "⚠️ 読み取り失敗（QRが枠に入っていない可能性）";
      console.warn("読み取りエラー:", err);
    });
});
