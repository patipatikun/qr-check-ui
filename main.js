let dqr = null;
let productqr = null;

const SCAN_BOX_SIZE = 100; // ✅ スキャン枠のサイズを小さく維持
const SCANNER_ID_LEFT = "scanner-dqr";
const SCANNER_ID_RIGHT = "scanner-productqr";

const dqrScanner = new Html5Qrcode(SCANNER_ID_LEFT);
const productScanner = new Html5Qrcode(SCANNER_ID_RIGHT);

const resultBox = document.getElementById("result");
const btnStart1 = document.getElementById("start-scan-1");
const btnStart2 = document.getElementById("start-scan-2");


// --- ヘルパー関数 ---

/**
 * スキャナーのエリアに代替の枠を表示し、ユーザーに狙いを定めやすくする
 * @param {string} scannerId - スキャナー要素のID
 */
function showAimerBox(scannerId) {
    const el = document.getElementById(scannerId);
    el.innerHTML = `<div style="
        width: ${SCAN_BOX_SIZE}px; height: ${SCAN_BOX_SIZE}px; 
        border: 2px dashed #007bff; margin: auto; 
        display: flex; justify-content: center; align-items: center; 
        font-size: 0.8em; color: #555;
    ">QR枠 (${SCAN_BOX_SIZE}x${SCAN_BOX_SIZE})</div>`;
}

/**
 * 枠をクリアする
 * @param {string} scannerId - スキャナー要素のID
 */
function clearScannerArea(scannerId) {
    document.getElementById(scannerId).innerHTML = '';
}


// --- メインロジック関数 ---

/**
 * 1回目のスキャンを開始する (ボタンを押したら即座にカメラ起動と読み取り開始)
 */
function startLeftScanner() {
    resultBox.textContent = "1回目スキャン中...枠内にQRコードを合わせてください";
    clearScannerArea(SCANNER_ID_RIGHT); // 2回目スキャンエリアのヒント枠をクリア

    dqrScanner.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: SCAN_BOX_SIZE },
        qr => {
            // 読み取り成功
            dqr = qr;
            dqrScanner.stop().then(() => {
                resultBox.textContent = "1回目QR読み取り完了。2回目のカメラ起動ボタンを押してください。";
                
                // 2回目ボタンを表示し、ヒント枠を表示
                btnStart1.style.display = "none";
                btnStart2.style.display = "block";
                btnStart2.disabled = false;
                showAimerBox(SCANNER_ID_RIGHT); // 2回目のスキャンエリアにヒント枠を表示
            });
        }
    ).catch(err => {
        console.error("左スキャナー起動失敗:", err);
        resultBox.textContent = "エラー: 1回目スキャナー起動失敗。カメラ権限と接続を確認してください。";
        btnStart1.disabled = false;
        resetAimerBoxes();
    });
}

/**
 * 2回目のスキャンを開始する
 */
function startRightScanner() {
    resultBox.textContent = "2回目スキャン中...枠内にQRコードを合わせてください";
    
    productScanner.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: SCAN_BOX_SIZE },
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
        btnStart2.disabled = false;
        showAimerBox(SCANNER_ID_RIGHT); // エラー時はヒント枠を再表示
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
 * 全スキャナーエリアにヒント枠を表示する
 */
function resetAimerBoxes() {
    showAimerBox(SCANNER_ID_LEFT);
    clearScannerArea(SCANNER_ID_RIGHT); // 2回目スキャンエリアは一旦クリア
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

    // ヒント枠を再表示
    resetAimerBoxes();
}


// --- イベントリスナーの設定 ---

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
