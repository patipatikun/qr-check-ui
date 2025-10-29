let dqr = null;
let productqr = null;

// Html5QrcodeインスタンスはHTML要素IDに紐づいています
const dqrScanner = new Html5Qrcode("scanner-dqr");
const productScanner = new Html5Qrcode("scanner-productqr");

// HTML要素の参照
const resultBox = document.getElementById("result");
const btnStart1 = document.getElementById("start-scan-1");
const btnStart2 = document.getElementById("start-scan-2");
const scannerDqrEl = document.getElementById("scanner-dqr");
const scannerProductQrEl = document.getElementById("scanner-productqr");

// --- スキャナーの関数 ---

// 1回目のスキャンを開始
function startLeftScanner() {
  // 1回目スキャナーの領域を表示 (もし非表示にしていた場合)
  // scannerDqrEl.style.display = "block"; // 必要に応じて
  
  resultBox.textContent = "1回目 (製品QR) をスキャン中です...";
  
  // スキャナーを起動
  dqrScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 200 }, // qrboxを少し大きくして狙いやすく
    qr => {
      dqr = qr;
      dqrScanner.stop();
      
      // scannerDqrEl.style.display = "none"; // 停止後に非表示に
      
      resultBox.textContent = "✅ 1回目QR読み取り完了。2回目のスキャンボタンを押してください。";

      // 1回目スキャンボタンを非表示、2回目スキャンボタンを表示・有効化
      btnStart1.style.display = "none";
      btnStart2.style.display = "block";
      btnStart2.disabled = false;
    }
  ).catch(err => {
    console.error("左スキャナー起動失敗:", err);
    resultBox.textContent = "❌ 1回目スキャナー起動失敗。再試行してください。";
    btnStart1.disabled = false; // エラー時はボタンを再有効化
  });
}

// 2回目のスキャンを開始
function startRightScanner() {
  // 2回目スキャナーの領域を表示 (もし非表示にしていた場合)
  // scannerProductQrEl.style.display = "block"; // 必要に応じて
  
  resultBox.textContent = "2回目 (出荷時QR) をスキャン中です...";

  // スキャナーを起動
  productScanner.start(
    { facingMode: "environment" }, 
    { fps: 10, qrbox: 200 }, 
    qr => {
      productqr = qr;
      productScanner.stop();
      // scannerProductQrEl.style.display = "none"; // 停止後に非表示に
      checkMatch();
    }
  ).catch(err => {
    console.error("右スキャナー起動失敗:", err);
    resultBox.textContent = "❌ 2回目スキャナー起動失敗。再試行してください。";
    btnStart2.disabled = false; // エラー時はボタンを再有効化
  });
}

// 読み取り結果をチェック
function checkMatch() {
  // ボタンを無効化し、ユーザーに待機を促す
  btnStart2.disabled = true;
  resultBox.textContent = "照合結果を確認中です...";
  resultBox.className = "";

  if (dqr && productqr) {
    fetch("https://script.google.com/macros/s/AKfycbzAfRJoFs9hy0-jw8GcY0egwmjA9dlE6WSXCVdMOiJcs44DnBPHpGmFaEw6FD_ZyVE-LA/exec", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `dp=${encodeURIComponent(dqr)}&productQr=${encodeURIComponent(productqr)}`
    })
    .then(res => res.text())
    .then(result => {
      resultBox.textContent = result;
      resultBox.className = result.includes("OK") ? "ok" : "ng";

      setTimeout(resetApp, 3000); // 3秒後にリセット
    })
    .catch(err => {
        console.error("Fetchエラー:", err);
        resultBox.textContent = "❌ 通信エラーが発生しました。";
        resultBox.className = "ng";
        setTimeout(resetApp, 3000); // エラー時もリセット
    });
  } else {
      // 本来は到達しないはずだが、念のため
      resultBox.textContent = "❌ 必要なQRデータが揃っていません。";
      resultBox.className = "ng";
      setTimeout(resetApp, 3000); 
  }
}

// アプリケーションの状態をリセット
function resetApp() {
  dqr = null;
  productqr = null;
  
  resultBox.textContent = "QRをスキャンしてください";
  resultBox.className = "";
  
  // ボタンを初期状態に戻す
  btnStart1.style.display = "block";
  btnStart1.disabled = false;
  btnStart2.style.display = "none";
  btnStart2.disabled = true; // 初期状態では無効
  
  // 必要に応じてスキャナーの表示もリセット (今回は非表示にしない)
}


// --- イベントリスナーの設定 ---

// 1回目スキャン開始ボタン
btnStart1.addEventListener("click", () => {
  btnStart1.disabled = true; // ボタンを無効化
  startLeftScanner();
});

// 2回目スキャン開始ボタン
btnStart2.addEventListener("click", () => {
  btnStart2.disabled = true; // ボタンを無効化
  startRightScanner();
});

// ✅ 初回起動：リセット関数を呼び出して初期状態に設定
resetApp();
