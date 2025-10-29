let dqr = null;
let productqr = null;

// Html5Qrcodeのインスタンスを作成
const dqrScanner = new Html5Qrcode("scanner-dqr");
const productScanner = new Html5Qrcode("scanner-productqr");

// DOM要素の取得
const resultBox = document.getElementById("result");
const btnStart1 = document.getElementById("start-scan-1");
const btnStart2 = document.getElementById("start-scan-2");

const SCAN_BOX_SIZE = 100; // ✅ スキャン枠のサイズを小さく設定 (誤読込防止)

// --- スキャナーの関数 ---

/**
 * 1回目のQRコードスキャン（製品貼付QR）を開始する
 */
function startLeftScanner() {
  resultBox.textContent = "1回目スキャン中...枠内にQRコードを合わせてください";
  
  dqrScanner.start(
    { facingMode: "environment" }, 
    { fps: 10, qrbox: SCAN_BOX_SIZE }, // ✅ 小さなスキャン枠を設定
    qr => {
      // 読み取り成功
      dqr = qr;
      dqrScanner.stop().then(() => {
        resultBox.textContent = "1回目QR読み取り完了。2回目をスキャンしてください";
        
        // 1回目スキャンボタンを非表示、2回目スキャンボタンを表示
        btnStart1.style.display = "none";
        btnStart2.style.display = "block";
        btnStart2.disabled = false; // 2回目ボタンを有効化
      });
    }
  ).catch(err => {
    console.error("左スキャナー起動失敗:", err);
    resultBox.textContent = "エラー: 1回目スキャナー起動失敗。カメラ権限を確認してください。";
    btnStart1.disabled = false; // エラー時はボタンを再有効化
  });
}

/**
 * 2回目のQRコードスキャン（出荷時QR）を開始する
 */
function startRightScanner() {
  resultBox.textContent = "2回目スキャン中...枠内にQRコードを合わせてください";
  
  productScanner.start(
    { facingMode: "environment" }, 
    { fps: 10, qrbox: SCAN_BOX_SIZE }, // ✅ 小さなスキャン枠を設定
    qr => {
      // 読み取り成功
      productqr = qr;
      productScanner.stop().then(() => {
        checkMatch();
      });
    }
  ).catch(err => {
    console.error("右スキャナー起動失敗:", err);
    resultBox.textContent = "エラー: 2回目スキャナー起動失敗。";
    btnStart2.disabled = false; // エラー時はボタンを再有効化
  });
}

/**
 * 2つのQRコードをサーバーに送信して照合する
 */
function checkMatch() {
  // 2回目スキャンボタンを無効化し、ユーザーに待機を促す
  btnStart2.disabled = true; 
  resultBox.textContent = "照合中...";
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
      // サーバーからのレスポンスに応じて結果の色を変更
      resultBox.className = result.includes("OK") ? "ok" : "ng";

      setTimeout(resetApp, 3000); // 3秒後にリセット
    })
    .catch(err => {
        console.error("Fetchエラー:", err);
        resultBox.textContent = "エラー: サーバーとの通信に失敗しました。";
        resultBox.className = "ng";
        setTimeout(resetApp, 3000); // エラー時もリセット
    });
  }
}

/**
 * アプリケーションの状態を初期状態にリセットする
 */
function resetApp() {
  dqr = null;
  productqr = null;
  
  resultBox.textContent = "QRをスキャンしてください";
  resultBox.className = "";
  
  // ボタンを初期状態に戻す
  btnStart1.style.display = "block";
  btnStart1.disabled = false;
  btnStart2.style.display = "none";
  btnStart2.disabled = true; // 初期状態では2回目ボタンは無効
}


// --- イベントリスナーの設定 (メインロジック) ---

// 1回目スキャン開始ボタン
btnStart1.addEventListener("click", () => {
  btnStart1.disabled = true; // ボタンを無効化し、重複クリックを防ぐ
  startLeftScanner();
});

// 2回目スキャン開始ボタン
btnStart2.addEventListener("click", () => {
  btnStart2.disabled = true; // ボタンを無効化
  startRightScanner();
});

// アプリケーションの初回起動
resetApp();
