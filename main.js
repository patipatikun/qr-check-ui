let dqr = null;
let productqr = null;

// アプリケーションの状態を管理
let appState = "ready"; // 'ready', 'previewing_1', 'scanning_1', 'previewing_2', 'scanning_2', 'done'
const SCAN_BOX_SIZE = 100; // スキャン枠のサイズ

// Html5Qrcodeのインスタンスを作成
const dqrScanner = new Html5Qrcode("scanner-dqr");
const productScanner = new Html5Qrcode("scanner-productqr");

// DOM要素の取得
const resultBox = document.getElementById("result");
const btnStart1 = document.getElementById("start-scan-1");
const btnStart2 = document.getElementById("start-scan-2");


// --- 制御関数 ---

/**
 * カメラを起動し、プレビューを表示するが、読み取りは一時停止する
 * @param {Html5Qrcode} scanner - 使用するスキャナーインスタンス
 * @param {string} nextState - プレビュー表示後に移行する状態 ('previewing_1' または 'previewing_2')
 */
function startPreview(scanner, nextState) {
    // 既にプレビュー中であれば何もしない
    if (appState === nextState) return;
    
    // スキャナーを起動
    scanner.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: SCAN_BOX_SIZE },
        qr => {
            // QRコードが読み取られたら、いったん読み取りを一時停止
            // ここでのQRコードは誤読の可能性が高い
            console.log(`一時停止中にQRを読み込みましたが無視しました: ${qr}`);
            scanner.pause();
        }
    ).then(() => {
        appState = nextState;
        resultBox.textContent = "カメラ起動完了。枠内にQRコードを合わせ、ボタンを再度押して読み取り開始。";
        
        // ボタンのラベルを「スキャン開始」に変更
        if (nextState === 'previewing_1') {
            btnStart1.textContent = "QR読み取り開始 (1回目)";
            btnStart1.disabled = false;
        } else if (nextState === 'previewing_2') {
            btnStart2.textContent = "QR読み取り開始 (2回目)";
            btnStart2.disabled = false;
        }

    }).catch(err => {
        console.error("プレビュー起動失敗:", err);
        resultBox.textContent = "エラー: カメラ起動失敗。カメラ権限を確認してください。";
        resetApp();
    });
}

/**
 * プレビュー状態にあるスキャナーの読み取りを再開する
 * @param {Html5Qrcode} scanner - 使用するスキャナーインスタンス
 * @param {string} setState - 読み取り中に移行する状態 ('scanning_1' または 'scanning_2')
 * @param {function} successCallback - 読み取り成功時のコールバック
 */
function resumeScan(scanner, setState, successCallback) {
    appState = setState;
    resultBox.textContent = `${(setState === 'scanning_1' ? '1回目' : '2回目')}読み取り中...`;

    // 読み取りを再開し、成功時にストップする処理を上書き
    scanner.stop().then(() => {
        // 一旦停止して、読み取り成功時の処理を上書きした状態で再起動
        scanner.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: SCAN_BOX_SIZE },
            qr => {
                scanner.stop().then(() => {
                    successCallback(qr); // 成功時の処理を呼び出す
                });
            }
        ).catch(err => {
            console.error("スキャン再開失敗:", err);
            resultBox.textContent = "エラー: スキャン再開失敗。";
            resetApp();
        });
    }).catch(err => {
        // 単純に resume() が使えないため、stop/startで代用
        console.warn("スキャン再開エラー。そのまま再開を試みます。", err);
        // 代替として即座に成功コールバック付きで再スタートを試みる
        scanner.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: SCAN_BOX_SIZE },
            qr => {
                scanner.stop().then(() => {
                    successCallback(qr);
                });
            }
        ).catch(() => {
             resultBox.textContent = "エラー: スキャン再開失敗。";
             resetApp();
        });
    });
}

/**
 * 2つのQRコードをサーバーに送信して照合する
 */
function checkMatch() {
    appState = "done";
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
    appState = "ready";
    
    // スキャナーが動いていたら停止させる
    if (dqrScanner.is scanning) dqrScanner.stop().catch(() => {});
    if (productScanner.is scanning) productScanner.stop().catch(() => {});
    
    resultBox.textContent = "QRをスキャンしてください";
    resultBox.className = "";
    
    // ボタンを初期状態に戻す
    btnStart1.style.display = "block";
    btnStart1.disabled = false;
    btnStart1.textContent = "カメラ起動 (1回目)";
    
    btnStart2.style.display = "none";
    btnStart2.disabled = true;
    btnStart2.textContent = "カメラ起動 (2回目)";
}


// --- イベントリスナーの設定 ---

// 1回目スキャン開始/再開ボタン
btnStart1.addEventListener("click", () => {
    btnStart1.disabled = true;
    if (appState === 'ready') {
        // 1. 初回クリック: プレビュー開始
        startPreview(dqrScanner, 'previewing_1');
    } else if (appState === 'previewing_1') {
        // 2. 2回目クリック: 読み取り再開
        resumeScan(dqrScanner, 'scanning_1', qr => {
            dqr = qr;
            resultBox.textContent = "1回目QR読み取り完了。2回目へ進んでください。";
            
            // 2回目ボタンに切り替え
            btnStart1.style.display = "none";
            btnStart2.style.display = "block";
            btnStart2.disabled = false;
        });
    }
});

// 2回目スキャン開始/再開ボタン
btnStart2.addEventListener("click", () => {
    btnStart2.disabled = true;
    if (appState === 'previewing_2') {
        // 2. 2回目クリック: 読み取り再開
        resumeScan(productScanner, 'scanning_2', qr => {
            productqr = qr;
            checkMatch(); // 照合へ進む
        });
    } else {
        // 1. 初回クリック: プレビュー開始
        startPreview(productScanner, 'previewing_2');
    }
});

// アプリケーションの初回起動
resetApp();
