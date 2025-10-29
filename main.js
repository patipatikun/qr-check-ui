document.addEventListener("DOMContentLoaded", () => {
  const startScanBtn = document.getElementById("startScan");
  const resultDiv = document.getElementById("result");
  const overlay = document.getElementById("overlay");

  let html5QrCode = new Html5Qrcode("reader");
  let cameraId = null;
  let scanning = false;

  startScanBtn.addEventListener("click", async () => {
    if (scanning) return;

    scanning = true;
    overlay.style.visibility = "visible";
    overlay.textContent = "📸 カメラを起動中...";

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error("カメラが検出されません");
      }

      cameraId = devices[0].id;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0, // ✅ iPhoneで正方形プレビューを維持
        },
        (decodedText) => {
          overlay.style.visibility = "hidden";
          resultDiv.textContent = "✅ 読み取り結果: " + decodedText;

          html5QrCode.stop().catch(console.warn);
          scanning = false;
        },
        (errorMessage) => {
          // 読み取り失敗時の軽微なエラーは無視
        }
      );

      overlay.textContent = "🔍 QRコードをかざしてください";
    } catch (err) {
      console.error("カメラ起動エラー:", err);
      overlay.textContent = "⚠️ カメラ起動に失敗しました";
      scanning = false;
    }
  });
});
