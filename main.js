// main.js
let dqr = null;
let productqr = null;
let cameraReady = false;

let dqrScanner;
let productScanner;

// 📡 カメラ起動
document.getElementById("startCamera").addEventListener("click", async () => {
  if (cameraReady) {
    alert("カメラはすでに起動しています。");
    return;
  }

  const readerDiv = document.getElementById("reader");
  readerDiv.innerHTML = ""; // リセット
  const html5QrCode = new Html5Qrcode("reader");

  try {
    const devices = await Html5Qrcode.getCameras();
    if (devices && devices.length) {
      cameraReady = true;
      alert("カメラが準備できました。📷ボタンでスキャン開始できます。");
    } else {
      alert("カメラが検出されませんでした。");
    }
  } catch (err) {
    console.error("カメラ初期化エラー:", err);
    alert("カメラの初期化に失敗しました。");
  }
});

// 📷 スキャン開始
document.getElementById("startScan").addEventListener("click", () => {
  if (!cameraReady) {
    alert("先に📡 カメラを起動してください。");
    return;
  }

  dqr = null;
  productqr = null;

  document.getElementById("result").textContent = "1回目QRをスキャンしてください";
  document.getElementById("overlay").style.visibility = "visible";

  startLeftScanner();
});

// ✅ 左QRスキャン
function startLeftScanner() {
  dqrScanner = new Html5Qrcode("reader");
  dqrScanner
    .start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 200 },
      qr => {
        dqr = qr;
        dqrScanner.stop();
        document.getElementById("result").textContent =
          "1回目QR読み取り完了。2回目をスキャンしてください（2秒以内）";
        setTimeout(() => startRightScanner(), 2000);
      }
    )
    .catch(err => console.error("左スキャナー起動失敗:", err));
}

// ✅ 右QRスキャン
function startRightScanner() {
  productScanner = new Html5Qrcode("reader");
  productScanner
    .start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 200 },
      qr => {
        productqr = qr;
        productScanner.stop();
        document.getElementById("overlay").style.visibility = "hidden";
        checkMatch();
      }
    )
    .catch(err => console.error("右スキャナー起動失敗:", err));
}

// ✅ 照合処理
function checkMatch() {
  if (dqr && productqr) {
    document.getElementById("result").textContent = "サーバー照合中...";
    fetch("https://script.google.com/macros/s/AKfycbzAfRJoFs9hy0-jw8GcY0egwmjA9dlE6WSXCVdMOiJcs44DnBPHpGmFaEw6FD_ZyVE-LA/exec", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `dp=${encodeURIComponent(dqr)}&productQr=${encodeURIComponent(productqr)}`
    })
      .then(res => res.text())
      .then(result => {
        const resultBox = document.getElementById("result");
        resultBox.textContent = result;
        resultBox.className = result.includes("OK") ? "ok" : "ng";

        document.getElementById("overlay").style.visibility = "hidden";
        dqr = null;
        productqr = null;
      })
      .catch(err => {
        console.error("通信エラー:", err);
        document.getElementById("result").textContent = "通信エラーが発生しました";
        document.getElementById("overlay").style.visibility = "hidden";
      });
  }
}
