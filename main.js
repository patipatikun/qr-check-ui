document.addEventListener("DOMContentLoaded", () => {
  const startCameraBtn = document.getElementById("startCamera");
  const startScanBtn = document.getElementById("startScan");
  const resultDiv = document.getElementById("result");
  const overlay = document.getElementById("overlay");
  const readerElem = document.getElementById("reader");
  let html5QrCode;
  let cameraId;
  let isCameraReady = false;

  // カメラ起動
  startCameraBtn.addEventListener("click", async () => {
    try {
      overlay.style.visibility = "visible";
      overlay.textContent = "📸 カメラを起動中...";
      html5QrCode = new Html5Qrcode("reader");

      const devices = await Html5Qrcode.getCameras();
      console.log("検出されたカメラ:", devices);
      if (devices && devices.length) {
        cameraId = devices[0].id;
        await html5QrCode.start(
          cameraId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          () => {}, // まだ読み取らない
          () => {}
        );
        await html5QrCode.stop();
        overlay.style.visibility = "hidden";
        resultDiv.textContent = "✅ カメラ準備完了";
        isCameraReady = true;
      } else {
        overlay.textContent = "❌ カメラが検出できません";
      }
    } catch (err) {
      console.error("カメラ起動エラー:", err);
      overlay.textContent = "⚠️ カメラ起動に失敗";
    }
  });

  // スキャン開始（1回だけ）
  startScanBtn.addEventListener("click", async () => {
    if (!isCameraReady || !cameraId) {
      alert("先にカメラを起動してください。");
      return;
    }

    overlay.style.visibility = "visible";
    overlay.textContent = "🔍 読み取り中...";

    try {
      await html5QrCode.start(
        cameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          overlay.style.visibility = "hidden";
          resultDiv.textContent = "✅ 読み取り結果: " + decodedText;
          html5QrCode.stop(); // 一度読み取ったら停止
        },
        (error) => {}
      );
    } catch (err) {
      console.error("読み取りエラー:", err);
      overlay.textContent = "⚠️ 読み取り失敗";
    }
  });
});
