let dqr = null;
let productqr = null;

const SCAN_BOX_SIZE = 150; // スキャン枠のサイズ (誤読込防止)
const SCANNER_ID_LEFT = "scanner-dqr";
const SCANNER_ID_RIGHT = "scanner-productqr";
const MAX_TEXT_LENGTH = 10; // 表示する文字の最大長

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
        displayText = displayText.substring(0, MAX_TEXT_LENGTH) + '...'; 
    }
    
    el.innerHTML = `<div style="
        font-size: 1.5em; 
        font-weight: bold; 
        color: #333; 
        padding: 20px; 
        text-align: center;
        background: #e0ffe0; 
        border: 2px solid #4CAF50;
        border-radius: 5px;
        margin: 20px 0;
    ">${displayText}</div>`;
}

/**
 * スキャナーエリアをクリアする (リセット時用)
 * @param {string} scannerId - スキャナー要素のID
 */
function clearScannerArea(scannerId) {
    document.getElementById(scannerId).innerHTML = '';
}

/**
 * スキャナーが動いていれば停止させる
 * @param {Html5Qrcode} scanner - スキャナーインスタンス
 */
async function stopScannerIfRunning(scanner) {
    // isScanning プロパティは推奨されていないため、例外処理で対応
    try {
        await scanner.stop();
    } catch (err) {
        // スキャナーが既に停止している、またはエラーで起動しなかった場合は無視
        console.warn("スキャナー停止時にエラー発生（無視）:", err);
    }
}


// --- メインロジック関数 ---

/**
 * 1回目のQRコードスキャン（製品貼付QR）を開始する
 */
function startLeftScanner() {
    resultBox.textContent = "1回目スキャン中...枠内にQRコードを合わせてください";
    clearScannerArea(SCANNER_ID_RIGHT);

    dqrScanner.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: SCAN_BOX_SIZE },
        qr => {
            // 読み取り成功
            dqr = qr;
            dqrScanner.stop().then(() => {
                displayQrText(SCANNER_ID_LEFT, dqr); 
                
                resultBox.textContent = "1回目QR読み取り完了。2回目スキャン開始ボタンを押してください。";
                
                btnStart1.style.display = "none";
                btnStart2.style.display = "block";
                btnStart2.disabled = false;
            });
        }
    ).catch(err => {
        console.error("左スキャナー起動失敗:", err);
        resultBox.textContent = "エラー: 1回目スキャナー起動失敗。カメラ権限を確認してください。";
        btnStart1.disabled = false;
        // エラー時もカメラリソースを確実に解放する
        stopScannerIfRunning(dqrScanner).then(() => resetApp(false)); 
    });
}

/**
 * 2回目のQRコードスキャン（出荷時QR）を開始する
 */
function startRightScanner() {
    resultBox.textContent = "2回目スキャン中...枠内にQRコードを合わせてください";
    
    // 2回目起動前に、念のため1回目スキャナーが停止していることを確認（二重起動防止）
    stopScannerIfRunning(dqrScanner).then(() => {
        productScanner.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: SCAN_BOX_SIZE },
            qr => {
                // 読み取り成功
                productqr = qr;
                
                // ✅ 停止処理が完了してから次の処理へ進む
                productScanner.stop().then(() => { 
                    displayQrText(SCANNER_ID_RIGHT, productqr);
                    checkMatch();
                });
            }
        ).catch(err => {
            console.error("右スキャナー起動失敗:", err);
            resultBox.textContent = "エラー: 2回目スキャナー起動失敗。";
            btnStart2.disabled = false;
            // エラー時もカメラリソースを確実に解放する
            stopScannerIfRunning(productScanner).then(() => resetApp(false));
        });
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

            setTimeout(resetApp, 3000); 
        })
        .catch(err => {
            console.error("Fetchエラー:", err);
            resultBox.textContent = "エラー: サーバーとの通信に失敗しました。リセットします。";
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
    
    // すべてのスキャナーの停止を待ってからDOMを更新する
    Promise.all([
        stopScannerIfRunning(dqrScanner),
        stopScannerIfRunning(productScanner)
    ]).then(() => {
        resultBox.textContent = "QRをスキャンしてください";
        resultBox.className = "";
        
        clearScannerArea(SCANNER_ID_LEFT);
        clearScannerArea(SCANNER_ID_RIGHT);
        
        btnStart1.style.display = "block";
        btnStart1.disabled = false;
        btnStart2.style.display = "none";
        btnStart2.disabled = true;
    });
}


// --- イベントリスナーの設定 (メインロジック) ---

// 1回目スキャン開始ボタン
btnStart1.addEventListener("click", () => {
    btnStart1.disabled = true; 
    startLeftScanner();
});

// 2回目スキャン開始ボタン
btnStart2.addEventListener("click", () => {
    btnStart2.disabled = true; 
    startRightScanner();
});

// アプリケーションの初回起動
resetApp();
