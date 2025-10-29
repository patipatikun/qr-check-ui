let dqr = null;
let productqr = null;

const SCAN_BOX_SIZE = 100; // スキャン枠のサイズ (誤読込防止)
const SCANNER_ID_LEFT = "scanner-dqr";
const SCANNER_ID_RIGHT = "scanner-productqr";
const MAX_TEXT_LENGTH = 8; // 表示する文字の最大長

// Html5Qrcodeのインスタンスを作成
const dqrScanner = new Html5Qrcode(SCANNER_ID_LEFT);
const productScanner = new Html5Qrcode(SCANNER_ID_RIGHT);

// DOM要素の取得
const resultBox = document.getElementById("result");
const btnStart1 = document.getElementById("start-scan-1");
const btnStart2 = document.getElementById("start-scan-2");


// --- ヘルパー関数 ---

/**
 * QRコードの文字情報をスキャナーエリアに表示する
 * @param {string} scannerId - スキャナー要素のID
 * @param {string} text - QRコードから読み取った文字情報
 */
function displayQrText(scannerId, text) {
    const el = document.getElementById(scannerId);
    let displayText = text;
    
    // 8文字に制限する
    if (displayText.length > MAX_TEXT_LENGTH) {
        // 8文字まで切り詰め、末尾に「...」を付与
        displayText = displayText.substring(0, MAX_TEXT_LENGTH) + '...'; 
    }
    
    el.innerHTML = `<div style="
        font-size: 1.5em; 
        font-weight: bold; 
        color: #333; 
        padding: 20px; 
        text-align: center;
        background: #e0ffe0; /* 読み取り済みを示す薄い緑 */
        border: 2px solid #4CAF50;
        border-radius: 5px;
        margin: 20px 0;
    ">${displayText}</div>`;
}

/**
 * スキャナーのエリアに代替の枠（エイマー）を表示し、ユーザーに狙いを定めやすくする
 * @param {string} scannerId - スキャナー要素のID
 */
function showAimerBox(scannerId) {
    const el = document.getElementById(scannerId);
    // カメラのプレビューがない状態でも、ユーザーにQRコードを合わせる場所を示す
    el.innerHTML = `<div style="
        width: ${SCAN_BOX_SIZE}px; height: ${SCAN_BOX_SIZE}px; 
        border: 2px dashed #007bff; margin: auto; 
        display: flex; justify-content: center; align-items: center; 
        font-size: 0.8em; color: #555;
    ">QR枠 (${SCAN_BOX_SIZE}x${SCAN_BOX_SIZE})</div>`;
}

/**
 * スキャナーエリアをクリアする (カメラ起動前やリセット時用)
 * @param {string} scannerId - スキャナー要素のID
 */
function clearScannerArea(scannerId) {
    document.getElementById(scannerId).innerHTML = '';
}

/**
 * 全スキャナーエリアにヒント枠を表示する
 */
function resetAimerBoxes() {
    showAimerBox(SCANNER_ID_LEFT);
    clearScannerArea(SCANNER_ID_RIGHT); // 2回目スキャンエリアは最初はクリア（1回目完了時にエイマーを表示するため）
}


// --- メインロジック関数 ---

/**
 * 1回目のQRコードスキャン（製品貼付QR）を開始する
 */
function startLeftScanner() {
    resultBox.textContent = "1回目スキャン中...枠内にQRコードを合わせてください";
    clearScannerArea(SCANNER_ID_RIGHT); // 2回目エリアは必ずクリア

    dqrScanner.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: SCAN_BOX_SIZE },
        qr => {
            // 読み取り成功
            dqr = qr;
            dqrScanner.stop().then(() => {
                // ✅ 読み取った文字情報を表示
                displayQrText(SCANNER_ID_LEFT, dqr); 
                
                resultBox.textContent = "1回目QR読み取り完了。2回目スキャン開始ボタンを押してください。";
                
                // 1回目スキャンボタンを非表示、2回目スキャンボタンを表示
                btnStart1.style.display = "none";
                btnStart2.style.display = "block";
                btnStart2.disabled = false;
                
                // 2回目のスキャンエリアに照準合わせのヒント枠を表示
                showAimerBox(SCANNER_ID_RIGHT); 
            });
        }
    ).catch(err => {
        console.error("左スキャナー起動失敗:", err);
        resultBox.textContent = "エラー: 1回目スキャナー起動失敗。カメラ権限を確認してください。";
        btnStart1.disabled = false;
        resetAimerBoxes(); // エラー時はエイマーを再表示
    });
}

/**
 * 2回目のQRコードスキャン（出荷時QR）を開始する
 */
function startRightScanner() {
    resultBox.textContent = "2回目スキャン中...枠内にQRコードを合わせてください";
    
    productScanner.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: SCAN_BOX_SIZE },
        qr => {
            // 読み取り成功
            productqr = qr;
            
            // ✅ 読み取った文字情報を表示
            displayQrText(SCANNER_ID_RIGHT, productqr);

            productScanner.stop().then(() => {
                checkMatch();
            });
        }
    ).catch(err => {
        console.error("右スキャナー起動失敗:", err);
        resultBox.textContent = "エラー: 2回目スキャナー起動失敗。";
        btnStart2.disabled = false;
        showAimerBox(SCANNER_ID_RIGHT); // エラー時はエイマーを再表示
    });
}

/**
 * 2つのQRコードをサーバーに送信して照合する
 */
function checkMatch() {
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
            resultBox.className = result.includes("OK") ? "ok" : "ng";

            setTimeout(resetApp, 3000); // 3秒後にリセット
        })
        .catch(err => {
            console.error("Fetchエラー:", err);
            resultBox.textContent = "エラー: サーバーとの通信に失敗しました。";
            resultBox.className = "ng";
            setTimeout(resetApp, 3000);
        });
    }
}

/**
 * アプリケーションの状態を初期状態にリセットする
 */
function resetApp() {
    dqr = null;
    productqr = null;
    
    // スキャナーが動いていたら停止させる
    dqrScanner.stop().catch(() => {});
    productScanner.stop().catch(() => {});
    
    resultBox.textContent = "QRをスキャンしてください";
    resultBox.className = "";
    
    // ボタンを初期状態に戻す
    btnStart1.style.display = "block";
    btnStart1.disabled = false;
    btnStart2.style.display = "none";
    btnStart2.disabled = true;

    // 照準合わせ用のヒント枠を再表示
    resetAimerBoxes();
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
