const startButton = document.getElementById("startButton");
const resultDiv = document.getElementById("result");
const readerElem = document.getElementById("reader");

let html5QrCode; // QRコードリーダーオブジェクト
let scanning = false; // 読み取り中かどうか

startButton.addEventListener("click", async () => {
  if (scanning) {
    // 二重起動防止
    return;
  }

  try {
    scanning = true;
    resultDiv.textContent = "カメラを起動しています...";

    // 既にカメラが存在する場合は停止
    if (html5QrCode) {
      await html5QrCode.stop();
      html5QrCode.clear();
    }

    html5QrCode = new Html5Qrcode("reader");

    const cameras = await Html5Qrcode.getCameras();
    if (cameras && cameras.length) {
      const cameraId = cameras[0].id;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }, // 正方形の読み取り枠
        },
        (decodedText) => {
          // 成功時（1回だけ）
          resultDiv.textContent = "読み取り結果: " + decodedText;
          html5QrCode.stop();
          scanning = false;
        },
        (errorMessage) => {
          // デバッグ用：無視してOK
        }
      );

      resultDiv.textContent = "QRコードをかざしてください";
    } else {
      resultDiv.textContent = "カメラが見つかりません。";
      scanning = false;
    }
  } catch (err) {
    console.error(err);
    resultDiv.textContent = "エラーが発生しました: " + err;
    scanning = false;
  }
});
