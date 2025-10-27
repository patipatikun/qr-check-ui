let dqr = null;
let productqr = null;

const dqrScanner = new Html5Qrcode("scanner-dqr");
const productScanner = new Html5Qrcode("scanner-productqr");

function startLeftScanner() {
  dqrScanner.start({ facingMode: "environment" }, { fps: 3, qrbox: 150 }, qr => {
    dqr = qr;
    dqrScanner.stop();

    document.getElementById("result").textContent = "1回目QR読み取り完了。2回目をスキャンしてください（10秒以内）";

    setTimeout(() => {
      startRightScanner();
    }, 10000);
  }).catch(err => console.error("左スキャナー起動失敗:", err));
}

function startRightScanner() {
  productScanner.start({ facingMode: "environment" }, { fps: 3, qrbox: 150 }, qr => {
    productqr = qr;
    productScanner.stop();
    checkMatch();
  }).catch(err => console.error("右スキャナー起動失敗:", err));
}

function checkMatch() {
  if (dqr && productqr) {
    fetch("https://script.google.com/macros/s/AKfycbwnp3LQTIbcSYuWQGW8U_FrfeaEeZ8kpmGDlfQnn8n_e169qxCBb22cT_nITL2V6cOICw/exec", {
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

        startLeftScanner();
      }, 3000);
    });
  }
}

// ✅ 初回起動
startLeftScanner();
