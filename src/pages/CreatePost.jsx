import { useEffect, useRef, useState } from "react";
import PostService from "../services/posts/PostService";
import MediaService from "../services/posts/MediaService";
import "../styles/login.css";

const VIDEO_DURATION_OPTIONS = [
  { label: "15 Seconds", seconds: 15 },
  { label: "30 Seconds", seconds: 30 },
  { label: "1 Minute", seconds: 60 },
  { label: "5 Minutes", seconds: 300 },
];

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "0.0s";
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${remaining.toFixed(1).padStart(4, "0")}`;
  }
  return `${seconds.toFixed(1)}s`;
}

function CreatePost({ onBack }) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [videoDuration, setVideoDuration] = useState(30);
  const [videoLength, setVideoLength] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimPreviewTime, setTrimPreviewTime] = useState(0);

  const [trimming, setTrimming] = useState(false);
  const [posting, setPosting] = useState(false);

  const [photoCameraOpen, setPhotoCameraOpen] = useState(false);
  const [photoCameraReady, setPhotoCameraReady] = useState(false);
  const [photoFacingMode, setPhotoFacingMode] = useState("environment");

  const [videoCameraOpen, setVideoCameraOpen] = useState(false);
  const [videoCameraReady, setVideoCameraReady] = useState(false);
  const [videoFacingMode, setVideoFacingMode] = useState("environment");
  const [videoRecording, setVideoRecording] = useState(false);

  const galleryInputRef = useRef(null);
  const videoRef = useRef(null);
  const photoCameraPreviewRef = useRef(null);
  const photoCameraStreamRef = useRef(null);
  const cameraPreviewRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const cameraRecorderRef = useRef(null);
  const cameraChunksRef = useRef([]);
  const cameraRecordingStartedAtRef = useRef(0);
  const cameraRecordedFileRef = useRef(null);
  const cameraRecordedDurationRef = useRef(0);

  const selectedDuration = Math.max(0, trimEnd - trimStart);
  const maximumDuration = Math.min(videoDuration, videoLength || videoDuration);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      stopPhotoCameraTracks();
      stopVideoCameraTracks();
    };
  }, []);

  function resetVideoSelection() {
    setVideoLength(0);
    setTrimStart(0);
    setTrimEnd(0);
    setTrimPreviewTime(0);
  }

  function clearSelectedMedia() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMediaFile(null);
    setMediaType("");
    setPreviewUrl("");
    setVideoDuration(30);
    cameraRecordedFileRef.current = null;
    cameraRecordedDurationRef.current = 0;
    cameraRecordingStartedAtRef.current = 0;
    resetVideoSelection();
  }

  function handleMediaChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    cameraRecordedFileRef.current = null;
    cameraRecordedDurationRef.current = 0;
    cameraRecordingStartedAtRef.current = 0;
    resetVideoSelection();

    if (file.type.startsWith("image/")) {
      setMediaFile(file);
      setMediaType("image");
      setPreviewUrl(URL.createObjectURL(file));
    } else if (file.type.startsWith("video/")) {
      setMediaFile(file);
      setMediaType("video");
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      alert("Please select a valid image or video file.");
    }

    event.target.value = "";
  }

  function getRecordingMimeType() {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];

    return candidates.find((type) => {
      try {
        return MediaRecorder.isTypeSupported(type);
      } catch {
        return false;
      }
    }) || "";
  }

  function stopPhotoCameraTracks() {
    if (photoCameraStreamRef.current) {
      photoCameraStreamRef.current.getTracks().forEach((track) => track.stop());
      photoCameraStreamRef.current = null;
    }
    if (photoCameraPreviewRef.current) photoCameraPreviewRef.current.srcObject = null;
  }

  function stopVideoCameraTracks() {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraPreviewRef.current) cameraPreviewRef.current.srcObject = null;
  }

  function stopPhotoCamera() {
    stopPhotoCameraTracks();
    setPhotoCameraReady(false);
    setPhotoCameraOpen(false);
  }

  async function openPhotoCamera(facingMode = photoFacingMode) {
    if (posting || trimming) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("This browser does not support in-page camera access. Please use the latest version of Chrome.");
      return;
    }

    try {
      stopPhotoCameraTracks();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      });

      photoCameraStreamRef.current = stream;
      setPhotoFacingMode(facingMode);
      setPhotoCameraOpen(true);
      setPhotoCameraReady(false);

      window.requestAnimationFrame(() => {
        if (!photoCameraPreviewRef.current) return;
        photoCameraPreviewRef.current.srcObject = stream;
        photoCameraPreviewRef.current.play()
          .then(() => setPhotoCameraReady(true))
          .catch(() => setPhotoCameraReady(true));
      });
    } catch (error) {
      console.error("Unable to open photo camera:", error);
      stopPhotoCamera();
      alert(error.message || "Unable to access the camera.");
    }
  }

  async function switchPhotoCamera() {
    const nextFacingMode = photoFacingMode === "environment" ? "user" : "environment";
    await openPhotoCamera(nextFacingMode);
  }

  function capturePhoto() {
    const video = photoCameraPreviewRef.current;
    if (!video || !photoCameraStreamRef.current || !photoCameraReady) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      alert("The camera is not ready yet. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      alert("Unable to capture the photo.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (!blob) {
        alert("Unable to create the captured photo.");
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const file = new File([blob], `21st-social-photo-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      setMediaFile(file);
      setMediaType("image");
      setPreviewUrl(URL.createObjectURL(file));
      resetVideoSelection();
      stopPhotoCamera();
    }, "image/jpeg", 0.92);
  }

  async function openVideoCamera(facingMode = videoFacingMode) {
    if (posting || trimming || videoRecording) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      alert("This browser does not support in-page video recording. Please use the latest version of Chrome.");
      return;
    }

    try {
      stopVideoCameraTracks();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: true,
      });

      cameraStreamRef.current = stream;
      setVideoFacingMode(facingMode);
      setVideoCameraOpen(true);
      setVideoCameraReady(false);

      window.requestAnimationFrame(() => {
        if (!cameraPreviewRef.current) return;
        cameraPreviewRef.current.srcObject = stream;
        cameraPreviewRef.current.play()
          .then(() => setVideoCameraReady(true))
          .catch(() => setVideoCameraReady(true));
      });
    } catch (error) {
      console.error("Unable to open video camera:", error);
      stopVideoCameraTracks();
      setVideoCameraOpen(false);
      alert(error.message || "Unable to access the camera and microphone.");
    }
  }

  async function switchVideoCamera() {
    if (posting || trimming || videoRecording || !videoCameraOpen) return;
    const nextFacingMode = videoFacingMode === "environment" ? "user" : "environment";
    await openVideoCamera(nextFacingMode);
  }

  function stopVideoCamera() {
    if (cameraRecorderRef.current && cameraRecorderRef.current.state !== "inactive") {
      try { cameraRecorderRef.current.stop(); } catch {}
    }
    stopVideoCameraTracks();
    cameraRecorderRef.current = null;
    cameraChunksRef.current = [];
    setVideoRecording(false);
    setVideoCameraReady(false);
    setVideoCameraOpen(false);
  }

  function cancelVideoCamera() {
    if (videoRecording) {
      alert("Stop the recording before closing the camera.");
      return;
    }
    stopVideoCamera();
  }

  function startVideoRecording() {
    const stream = cameraStreamRef.current;
    if (!stream || !window.MediaRecorder) return;

    const mimeType = getRecordingMimeType();
    if (!mimeType) {
      alert("This browser cannot record video in a supported format.");
      return;
    }

    try {
      cameraChunksRef.current = [];
      cameraRecordingStartedAtRef.current = performance.now();
      const recorder = new MediaRecorder(stream, { mimeType });
      cameraRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) cameraChunksRef.current.push(event.data);
      };

      recorder.onerror = (event) => {
        console.error("Video camera recorder error:", event);
        setVideoRecording(false);
        alert("The camera recording could not be completed.");
      };

      recorder.onstop = () => {
        const elapsedSeconds = Math.max(
          0.1,
          (performance.now() - cameraRecordingStartedAtRef.current) / 1000
        );
        cameraRecordingStartedAtRef.current = 0;
        const blob = new Blob(cameraChunksRef.current, { type: mimeType });

        if (!blob.size) {
          setVideoRecording(false);
          alert("The camera recording was empty. Please try again.");
          return;
        }

        const extension = mimeType.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `21st-social-camera-${Date.now()}.${extension}`, {
          type: mimeType,
        });

        cameraRecordedFileRef.current = file;
        cameraRecordedDurationRef.current = elapsedSeconds;
        stopVideoCamera();

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setMediaFile(file);
        setMediaType("video");
        setPreviewUrl(URL.createObjectURL(file));
        setVideoLength(elapsedSeconds);
        setTrimStart(0);
        setTrimEnd(Math.min(elapsedSeconds, videoDuration));
        setTrimPreviewTime(0);
      };

      recorder.start(100);
      setVideoRecording(true);
    } catch (error) {
      console.error("Unable to start video recording:", error);
      setVideoRecording(false);
      alert(error.message || "Unable to start video recording.");
    }
  }

  function stopVideoRecording() {
    const recorder = cameraRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    setVideoRecording(false);
    recorder.stop();
  }

  function handleVideoMetadata(event) {
    const metadataDuration = event.currentTarget.duration;
    const recordedDuration = mediaFile === cameraRecordedFileRef.current
      ? cameraRecordedDurationRef.current
      : 0;

    const duration = Number.isFinite(metadataDuration) && metadataDuration > 0
      ? metadataDuration
      : recordedDuration;

    if (!Number.isFinite(duration) || duration <= 0) {
      alert("We couldn't read the duration of this video. Please try another video.");
      return;
    }

    setVideoLength(duration);
    setTrimStart(0);
    setTrimEnd(Math.min(duration, videoDuration));
    setTrimPreviewTime(0);
  }

  function handleMaximumDurationChange(event) {
    const nextMaximum = Number(event.target.value);
    setVideoDuration(nextMaximum);
    if (!videoLength) return;

    setTrimStart((currentStart) => Math.min(currentStart, Math.max(0, videoLength - 0.1)));
    setTrimEnd((currentEnd) => Math.min(videoLength, Math.max(0, Math.min(currentEnd, nextMaximum))));
  }

  function updateTrimStart(value) {
    const nextStart = Number(value);
    const minimumEnd = Math.min(videoLength, nextStart + 0.1);
    setTrimStart(Math.min(nextStart, Math.max(0, videoLength - 0.1)));
    setTrimEnd((currentEnd) => Math.max(minimumEnd, Math.min(currentEnd, videoLength)));
  }

  function updateTrimEnd(value) {
    const nextEnd = Number(value);
    const maximumEnd = Math.min(videoLength, trimStart + videoDuration);
    setTrimEnd(Math.max(trimStart + 0.1, Math.min(nextEnd, maximumEnd)));
  }

  function updateTrimFromPointer(event, handle) {
    const track = event.currentTarget?.parentElement;
    if (!track || !videoLength) return;
    const rect = track.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const nextTime = ratio * videoLength;
    if (handle === "start") updateTrimStart(nextTime);
    else updateTrimEnd(nextTime);
  }

  function handleTrimPointerDown(event, handle) {
    if (posting || trimming || !videoLength) return;
    event.preventDefault();
    event.stopPropagation();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
    updateTrimFromPointer(event, handle);
  }

  function handleTrimPointerMove(event, handle) {
    if (event.buttons === 0 && event.pointerType !== "touch") return;
    event.preventDefault();
    updateTrimFromPointer(event, handle);
  }

  function handleTrimPointerUp(event) {
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
  }

  function seekTrimPreview(time) {
    const video = videoRef.current;
    if (!video) return;
    const nextTime = Math.min(trimEnd, Math.max(trimStart, time));
    video.currentTime = nextTime;
    setTrimPreviewTime(nextTime);
  }

  function handleVideoTimeUpdate(event) {
    const video = event.currentTarget;
    if (video.currentTime >= trimEnd && !video.paused) {
      video.pause();
      video.currentTime = trimStart;
      setTrimPreviewTime(trimStart);
      return;
    }
    if (video.currentTime < trimStart) video.currentTime = trimStart;
    setTrimPreviewTime(video.currentTime);
  }

  function handleVideoPlay(event) {
    const video = event.currentTarget;
    if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
      video.currentTime = trimStart;
      setTrimPreviewTime(trimStart);
    }
  }

  async function getVideoDuration(file, fallbackDuration = 0) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const temporaryUrl = URL.createObjectURL(file);
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(temporaryUrl);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(temporaryUrl);
        if (fallbackDuration > 0) resolve(fallbackDuration);
        else reject(new Error("We couldn't read the duration of this video. Please try another video."));
      };
      video.src = temporaryUrl;
    });
  }

  async function createTrimmedVideo(file, start, end) {
    if (!HTMLVideoElement.prototype.captureStream) {
      throw new Error("This device/browser does not support in-app video trimming yet. Please try the latest version of Chrome or the 21st Social app.");
    }
    if (!window.MediaRecorder) {
      throw new Error("This device/browser does not support in-app video trimming yet.");
    }

    const sourceVideo = document.createElement("video");
    const sourceUrl = URL.createObjectURL(file);
    sourceVideo.src = sourceUrl;
    sourceVideo.preload = "auto";
    sourceVideo.muted = false;
    sourceVideo.playsInline = true;

    await new Promise((resolve, reject) => {
      sourceVideo.onloadedmetadata = resolve;
      sourceVideo.onerror = () => reject(new Error("Unable to prepare the video for trimming."));
    });

    const stream = sourceVideo.captureStream();
    const mimeType = getRecordingMimeType();
    if (!mimeType) {
      URL.revokeObjectURL(sourceUrl);
      throw new Error("This device/browser cannot create a trimmed video in a supported format.");
    }

    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    const result = new Promise((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => reject(new Error("The video could not be trimmed."));
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        if (!blob.size) {
          reject(new Error("The trimmed video was empty."));
          return;
        }
        const extension = mimeType.includes("mp4") ? "mp4" : "webm";
        resolve(new File([blob], `21st-social-trim-${Date.now()}.${extension}`, { type: mimeType }));
      };
    });

    const cleanup = () => {
      try { stream.getTracks().forEach((track) => track.stop()); } catch {}
      sourceVideo.pause();
      sourceVideo.removeAttribute("src");
      sourceVideo.load();
      URL.revokeObjectURL(sourceUrl);
    };

    try {
      sourceVideo.currentTime = start;
      await new Promise((resolve) => {
        if (Math.abs(sourceVideo.currentTime - start) < 0.05) resolve();
        else sourceVideo.onseeked = resolve;
      });
      recorder.start(100);
      await sourceVideo.play();
      await new Promise((resolve) => {
        const timer = window.setInterval(() => {
          if (sourceVideo.currentTime >= end) {
            window.clearInterval(timer);
            resolve();
          }
        }, 25);
      });
      sourceVideo.pause();
      if (recorder.state !== "inactive") recorder.stop();
      const trimmedFile = await result;
      cleanup();
      return trimmedFile;
    } catch (error) {
      if (recorder.state !== "inactive") recorder.stop();
      cleanup();
      throw error;
    }
  }

  async function handlePost() {
    if (!content.trim() && !mediaFile) {
      alert("Please add a caption, photo, or video.");
      return;
    }

    try {
      setPosting(true);
      let fileToUpload = mediaFile;

      if (mediaFile && mediaType === "video") {
        const recordedDuration = mediaFile === cameraRecordedFileRef.current
          ? cameraRecordedDurationRef.current
          : 0;
        let actualDuration = recordedDuration;
        if (actualDuration <= 0) actualDuration = await getVideoDuration(mediaFile, 0);

        if (trimEnd <= trimStart) throw new Error("Please select a portion of the video to post.");
        if (trimEnd > actualDuration + 0.05) throw new Error("The selected video range is invalid.");
        if (selectedDuration > videoDuration + 0.05) throw new Error("The selected clip is longer than the maximum allowed duration.");

        const effectiveEnd = Math.min(trimEnd, actualDuration);
        const selectedRange = Math.max(0, effectiveEnd - trimStart);
        const isAlreadyValidClip = trimStart <= 0.05 && Math.abs(effectiveEnd - actualDuration) <= 0.1 && selectedRange <= videoDuration + 0.05;

        // Keep a valid camera recording intact. This avoids the Android reload
        // that can happen when an already-valid recording is unnecessarily
        // passed through captureStream(). Gallery clips still use the same
        // proven trimming path when the user selects a shorter range.
        if (!isAlreadyValidClip) {
          setTrimming(true);
          fileToUpload = await createTrimmedVideo(mediaFile, trimStart, effectiveEnd);
          setTrimming(false);
        }
      }

      const post = await PostService.createPost(content);

      if (fileToUpload) {
        let mediaUrl = "";
        if (mediaType === "image") mediaUrl = await MediaService.uploadImage(fileToUpload);
        if (mediaType === "video") mediaUrl = await MediaService.uploadVideo(fileToUpload);
        await MediaService.attachMedia({ postId: post.id, mediaUrl, mediaType, sortOrder: 0 });
      }

      alert("Post created successfully!");
      clearSelectedMedia();
      setContent("");
      onBack();
    } catch (error) {
      setTrimming(false);
      alert(error.message || "Unable to create the post.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <>
      <style>{`
        .video-trim-handle {
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }
      `}</style>

      <div className="login-screen">
        <button className="secondary" onClick={onBack} disabled={posting || trimming || videoRecording}>
          ← Back
        </button>

        <h1>✨ Be Creative</h1>

        <p style={{ color: "#bbbbbb", marginBottom: "20px" }}>
          Share a thought, a photo, a video, a story, or something that inspires others.
        </p>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={6}
          placeholder="What's on your mind?"
          disabled={posting || trimming}
          style={{ width: "100%", maxWidth: "500px", padding: "16px", borderRadius: "12px", fontSize: "16px", resize: "vertical", marginBottom: "20px" }}
        />

        <input ref={galleryInputRef} type="file" accept="image/*,video/*" onChange={handleMediaChange} disabled={posting || trimming} style={{ display: "none" }} />

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
          <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={posting || trimming || videoRecording}>
            🖼️ Gallery
          </button>
          <button type="button" onClick={() => openPhotoCamera("environment")} disabled={posting || trimming || photoCameraOpen || videoCameraOpen}>
            📷 Take Photo
          </button>
          <button type="button" onClick={openVideoCamera} disabled={posting || trimming || videoCameraOpen || photoCameraOpen}>
            🎥 Record Video
          </button>
          {mediaFile && (
            <button type="button" onClick={clearSelectedMedia} disabled={posting || trimming || videoRecording}>
              Remove Media
            </button>
          )}
        </div>

        {photoCameraOpen && (
          <div style={{ width: "100%", maxWidth: "500px", marginTop: "16px", padding: "16px", borderRadius: "14px", background: "#111", border: "1px solid #333" }}>
            <h3 style={{ marginTop: 0 }}>Take Photo</h3>
            <video
              ref={photoCameraPreviewRef}
              autoPlay muted playsInline
              style={{ width: "100%", borderRadius: "12px", display: "block", background: "#000", transform: photoFacingMode === "user" ? "scaleX(-1)" : "none" }}
            />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
              <button type="button" onClick={capturePhoto} disabled={!photoCameraReady || posting || trimming}>📸 Capture Photo</button>
              <button type="button" onClick={switchPhotoCamera} disabled={!photoCameraReady || posting || trimming}>🔄 Switch Camera</button>
              <button type="button" onClick={stopPhotoCamera} disabled={posting || trimming}>Cancel</button>
            </div>
          </div>
        )}

        {videoCameraOpen && (
          <div style={{ width: "100%", maxWidth: "500px", marginTop: "16px", padding: "16px", borderRadius: "14px", background: "#111", border: "1px solid #333" }}>
            <h3 style={{ marginTop: 0 }}>Record Video</h3>
            <video
              ref={cameraPreviewRef}
              autoPlay muted playsInline
              style={{ width: "100%", borderRadius: "12px", display: "block", background: "#000", transform: videoFacingMode === "user" ? "scaleX(-1)" : "none" }}
            />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
              {!videoRecording ? (
                <button type="button" onClick={startVideoRecording} disabled={!videoCameraReady || posting || trimming}>🔴 Start Recording</button>
              ) : (
                <button type="button" onClick={stopVideoRecording} disabled={posting || trimming}>⏹️ Stop Recording</button>
              )}
              <button type="button" onClick={switchVideoCamera} disabled={videoRecording || !videoCameraReady || posting || trimming}>🔄 Switch Camera</button>
              <button type="button" onClick={cancelVideoCamera} disabled={videoRecording || posting || trimming}>Cancel</button>
            </div>
            {videoRecording && <p style={{ color: "#ff6b6b", marginBottom: 0 }}>🔴 Recording...</p>}
          </div>
        )}

        {previewUrl && mediaType === "image" && (
          <img src={previewUrl} alt="Be Creative preview" style={{ width: "100%", maxWidth: "500px", marginTop: "20px", borderRadius: "12px" }} />
        )}

        {previewUrl && mediaType === "video" && (
          <video
            ref={videoRef}
            src={previewUrl}
            controls playsInline
            onLoadedMetadata={handleVideoMetadata}
            onTimeUpdate={handleVideoTimeUpdate}
            onPlay={handleVideoPlay}
            style={{ width: "100%", maxWidth: "500px", marginTop: "20px", borderRadius: "12px", background: "#000" }}
          >
            Your browser does not support video playback.
          </video>
        )}

        {mediaType === "video" && videoLength > 0 && (
          <div style={{ width: "100%", maxWidth: "500px", marginTop: "16px", padding: "16px", borderRadius: "14px", background: "#18181b", border: "1px solid #333" }}>
            <label style={{ display: "block", color: "#bbbbbb", marginBottom: "10px" }}>Maximum video length:</label>
            <select value={videoDuration} onChange={handleMaximumDurationChange} disabled={posting || trimming} style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "16px" }}>
              {VIDEO_DURATION_OPTIONS.map((option) => (
                <option key={option.seconds} value={option.seconds}>{option.label}</option>
              ))}
            </select>

            <p style={{ color: "#bbbbbb", marginTop: "14px", marginBottom: "8px" }}>
              Drag either handle to select the exact portion you want to post.
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", color: "#bbbbbb", fontSize: "14px" }}>
              <span>Start: {formatDuration(trimStart)}</span>
              <span>Selected: {formatDuration(selectedDuration)} / {formatDuration(maximumDuration)} max</span>
              <span>End: {formatDuration(trimEnd)}</span>
            </div>

            <div style={{ position: "relative", height: "58px", marginTop: "14px" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: "25px", height: "8px", borderRadius: "8px", background: "#444" }} />
              <div style={{ position: "absolute", left: `${videoLength ? (trimStart / videoLength) * 100 : 0}%`, right: `${videoLength ? 100 - (trimEnd / videoLength) * 100 : 100}%`, top: "25px", height: "8px", borderRadius: "8px", background: "#4fc3f7" }} />

              <div
                className="video-trim-handle"
                role="slider"
                tabIndex={posting || trimming ? -1 : 0}
                aria-label="Video trim start"
                aria-valuemin={0}
                aria-valuemax={videoLength}
                aria-valuenow={trimStart}
                onPointerDown={(event) => handleTrimPointerDown(event, "start")}
                onPointerMove={(event) => handleTrimPointerMove(event, "start")}
                onPointerUp={handleTrimPointerUp}
                onKeyDown={(event) => {
                  if (posting || trimming) return;
                  if (event.key === "ArrowLeft") { event.preventDefault(); updateTrimStart(trimStart - 0.1); }
                  if (event.key === "ArrowRight") { event.preventDefault(); updateTrimStart(trimStart + 0.1); }
                }}
                style={{ position: "absolute", left: `${videoLength ? (trimStart / videoLength) * 100 : 0}%`, top: "10px", width: "30px", height: "38px", transform: "translateX(-50%)", borderRadius: "8px", background: "#fff", border: "3px solid #4fc3f7", boxSizing: "border-box", cursor: posting || trimming ? "default" : "ew-resize", zIndex: 5, opacity: posting || trimming ? 0.6 : 1 }}
              />

              <div
                className="video-trim-handle"
                role="slider"
                tabIndex={posting || trimming ? -1 : 0}
                aria-label="Video trim end"
                aria-valuemin={0}
                aria-valuemax={videoLength}
                aria-valuenow={trimEnd}
                onPointerDown={(event) => handleTrimPointerDown(event, "end")}
                onPointerMove={(event) => handleTrimPointerMove(event, "end")}
                onPointerUp={handleTrimPointerUp}
                onKeyDown={(event) => {
                  if (posting || trimming) return;
                  if (event.key === "ArrowLeft") { event.preventDefault(); updateTrimEnd(trimEnd - 0.1); }
                  if (event.key === "ArrowRight") { event.preventDefault(); updateTrimEnd(trimEnd + 0.1); }
                }}
                style={{ position: "absolute", left: `${videoLength ? (trimEnd / videoLength) * 100 : 0}%`, top: "10px", width: "30px", height: "38px", transform: "translateX(-50%)", borderRadius: "8px", background: "#fff", border: "3px solid #4fc3f7", boxSizing: "border-box", cursor: posting || trimming ? "default" : "ew-resize", zIndex: 6, opacity: posting || trimming ? 0.6 : 1 }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
              <button type="button" className="secondary" onClick={() => seekTrimPreview(trimStart)} disabled={posting || trimming}>▶ Preview Selection</button>
              <button type="button" className="secondary" onClick={() => { const nextEnd = Math.min(videoLength, videoDuration); setTrimStart(0); setTrimEnd(nextEnd); seekTrimPreview(0); }} disabled={posting || trimming}>Reset</button>
            </div>
          </div>
        )}

        <p style={{ color: "#bbbbbb", marginTop: "14px", minHeight: "20px" }}>
          {trimming ? "Trimming your selected video..." : posting ? "Creating your post..." : mediaType === "video" ? `Selected clip: ${formatDuration(selectedDuration)}` : ""}
        </p>

        <button onClick={handlePost} disabled={posting || trimming || videoRecording} style={{ marginTop: "12px" }}>
          {trimming ? "Trimming..." : posting ? "Creating..." : "🚀 Start Creating"}
        </button>
      </div>
    </>
  );
}

export default CreatePost;
