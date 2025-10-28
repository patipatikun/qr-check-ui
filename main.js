let dqr = null;
let productqr = null;
let scanning = false;

const dqrScanner = new Html5Qrcode("scanner-dqr");
const productScanner = new Html5Qrcode("scanner-productqr");

function startLeftScanner() {
  dqrScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 150 }, qr => {
    dqr = qr;
    dqrScanner.stop();

    document.getElementById("result").textContent = "1回目QR読み取り完了。2回目をスキャンしてください（2秒以内）";

    setTimeout(() => {
      startRightScanner();
    }, 2000);
  }).catch(err => console.error("左スキャナー起動失敗:", err));
}

function startRightScanner() {
  productScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 150 }, qr => {
    productqr = qr;
    productScanner.stop();
    checkMatch();
  }).catch(err => console.error("右スキャナー起動失敗:", err));
}

function checkMatch() {
  if (dqr && productqr) {
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

      setTimeout(() => {
        dqr = null;
        productqr = null;
        resultBox.textContent = "QRをスキャンしてください";
        resultBox.className = "";

        if (scanning) startLeftScanner(); // トグルがONなら再スキャン
      }, 3000);
    });
  }
}

// ✅ トグル式ボタン操作
document.getElementById("startScan").addEventListener("click", () => {
  scanning = !scanning;

  const btn = document.getElementById("startScan");
  if (scanning) {
    btn.textContent = "⏹ 停止";
    startLeftScanner();
  } else {
    btn.textContent = "📷 読み取り開始";
    dqrScanner.stop().catch(() => {});
    productScanner.stop().catch(() => {});
  }
});
