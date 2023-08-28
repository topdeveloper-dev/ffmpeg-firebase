const ffmpeg = require("fluent-ffmpeg");
const admin = require("firebase-admin");
const ffmpegStatic = require("ffmpeg-static");
const serviceAccount = require("./service-account.json");
const fs = require("fs");

function checkAndCreateDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "fluent-ffmpeg.appspot.com",
});

const bucket = admin.storage().bucket();
bucket.upload("./asset/input/1690557207958", {
  destination: "path/to/storage/file",
});

ffmpeg.setFfmpegPath(ffmpegStatic);
const filePath = "path/to/storage";

//Function to download the video file from firebase storage to local storage
async function downloadFromFirebase(inputFilePath) {
  const tempLocalFile = `./asset/input/firebase/firebase_download`;

  await bucket.file(inputFilePath).download({ destination: tempLocalFile });
  return tempLocalFile;
}

function convertToMp4(inputFilePath, outputFilePath) {
  // Before converting, ensure the output directory exists
  const outputDir = outputFilePath.substring(
    0,
    outputFilePath.lastIndexOf("/")
  );

  checkAndCreateDir(outputDir);

  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .output(outputFilePath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

// Input File path:
const inputPath = "path/to/storage/file";
const outputPath = "./asset/output/video.mp4";

downloadFromFirebase(inputPath)
  .then((tempLocalFile) => convertToMp4(tempLocalFile, outputPath))
  .then(() => console.log("Video conversion successful."))
  .catch((error) => console.error("Video conversion error:", error));

const firebasePath = "./asset/output/video.mp4";

//Upload converted file to Firebase
async function uploadFile(firebasePath) {
  await bucket.upload(firebasePath.replace(/\.[^/.]+$/, ".mp4"), {
    destination: filePath.replace(/\.[^/.]+$/, ".mp4"),
  });
  return firebasePath;
}

uploadFile(firebasePath)
  .then(() => console.log("Upload converted file successfule"))
  .catch((error) => console.error("Video conversion error:", error));
