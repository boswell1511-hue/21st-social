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

  const videoRef = useRef(null);

  const selectedDuration = Math.max(0, trimEnd - trimStart);
  const maximumDuration = Math.min(videoDuration, videoLength || videoDuration);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetVideoSelection() {
    setVideoLength(0);
    setTrimStart(0);
    setTrimEnd(0);
    setTrimPreviewTime(0);
  }

  function handleMediaChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    resetVideoSelection();

    if (file.type.startsWith("image/")) {
      setMediaFile(file);
      setMediaType("image");
      setPreviewUrl(URL.createObjectURL(file));
      return;
    }

    if (file.type.startsWith("video/")) {
      setMediaFile(file);
      setMediaType("video");
      setPreviewUrl(URL.createObjectURL(file));
      return;
    }

    alert("Please select a valid image or video file.");
    e.target.value = "";
  }

  function handleVideoMetadata(e) {
    const duration = e.currentTarget.duration;

    if (!Number.isFinite(duration) || duration <= 0) {
      alert("We couldn't read the duration of this video. Please try another video.");
      return;
    }

    setVideoLength(duration);

    const initialEnd = Math.min(duration, videoDuration);
    setTrimStart(0);
    setTrimEnd(initialEnd);
    setTrimPreviewTime(0);
  }

  function handleMaximumDurationChange(e) {
    const nextMaximum = Number(e.target.value);
    setVideoDuration(nextMaximum);

    if (!videoLength) return;

    setTrimStart((currentStart) =>
      Math.min(currentStart, Math.max(0, videoLength - 0.1))
    );

    setTrimEnd((currentEnd) =>
      Math.min(videoLength, Math.max(0, Math.min(currentEnd, nextMaximum)))
    );
  }

  function updateTrimStart(value) {
    const nextStart = Number(value);
    const minimumEnd = Math.min(videoLength, nextStart + 0.1);

    setTrimStart(Math.min(nextStart, Math.max(0, videoLength - 0.1)));
    setTrimEnd((currentEnd) =>
      Math.max(minimumEnd, Math.min(currentEnd, videoLength))
    );
  }

  function updateTrimEnd(value) {
    const nextEnd = Number(value);
    const maximumEnd = Math.min(videoLength, trimStart + videoDuration);

    setTrimEnd(Math.max(trimStart + 0.1, Math.min(nextEnd, maximumEnd)));
  }

  function seekTrimPreview(time) {
    const video = videoRef.current;

    if (!video) return;

    const nextTime = Math.min(trimEnd, Math.max(trimStart, time));
    video.currentTime = nextTime;
    setTrimPreviewTime(nextTime);
  }

  function handleVideoTimeUpdate(e) {
    const video = e.currentTarget;

    if (video.currentTime >= trimEnd && !video.paused) {
      video.pause();
      video.currentTime = trimStart;
      setTrimPreviewTime(trimStart);
      return;
    }

    if (video.currentTime < trimStart) {
      video.currentTime = trimStart;
    }

    setTrimPreviewTime(video.currentTime);
  }

  function handleVideoPlay(e) {
    const video = e.currentTarget;

    if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
      video.currentTime = trimStart;
      setTrimPreviewTime(trimStart);
    }
  }

  async function getVideoDuration(file) {
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
        reject(
          new Error(
            "We couldn't read the duration of this video. Please try another video."
          )
        );
      };

      video.src = temporaryUrl;
    });
  }

  function getRecordingMimeType() {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];

    return (
      candidates.find((type) => {
        try {
          return MediaRecorder.isTypeSupported(type);
        } catch {
          return false;
        }
      }) || ""
    );
  }

  async function createTrimmedVideo(file, start, end) {
    if (!videoRef.current) {
      throw new Error("Video preview is not ready yet.");
    }

    if (!HTMLVideoElement.prototype.captureStream) {
      throw new Error(
        "This device/browser does not support in-app video trimming yet. Please try the latest version of Chrome or the 21st Social app."
      );
    }

    if (!window.MediaRecorder) {
      throw new Error(
        "This device/browser does not support in-app video trimming yet."
      );
    }

    const sourceVideo = document.createElement("video");
    const sourceUrl = URL.createObjectURL(file);

    sourceVideo.src = sourceUrl;
    sourceVideo.preload = "auto";
    sourceVideo.muted = false;
    sourceVideo.playsInline = true;

    await new Promise((resolve, reject) => {
      sourceVideo.onloadedmetadata = resolve;
      sourceVideo.onerror = () =>
        reject(new Error("Unable to prepare the video for trimming."));
    });

    const stream = sourceVideo.captureStream();
    const mimeType = getRecordingMimeType();

    if (!mimeType) {
      URL.revokeObjectURL(sourceUrl);
      throw new Error(
        "This device/browser cannot create a trimmed video in a supported format."
      );
    }

    const chunks = [];
    const recorder = new MediaRecorder(stream, {
      mimeType,
    });

    const result = new Promise((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = () => {
        reject(new Error("The video could not be trimmed."));
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });

        if (!blob.size) {
          reject(new Error("The trimmed video was empty."));
          return;
        }

        const extension = mimeType.includes("mp4") ? "mp4" : "webm";
        resolve(
          new File(
            [blob],
            `21st-social-trim-${Date.now()}.${extension}`,
            { type: mimeType }
          )
        );
      };
    });

    const cleanup = () => {
      try {
        stream.getTracks().forEach((track) => track.stop());
      } catch {}

      sourceVideo.pause();
      sourceVideo.removeAttribute("src");
      sourceVideo.load();
      URL.revokeObjectURL(sourceUrl);
    };

    try {
      sourceVideo.currentTime = start;

      await new Promise((resolve) => {
        if (Math.abs(sourceVideo.currentTime - start) < 0.05) {
          resolve();
        } else {
          sourceVideo.onseeked = resolve;
        }
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

      if (recorder.state !== "inactive") {
        recorder.stop();
      }

      const trimmedFile = await result;
      cleanup();
      return trimmedFile;
    } catch (error) {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }

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
        const actualDuration = await getVideoDuration(mediaFile);

        if (trimEnd <= trimStart) {
          throw new Error("Please select a portion of the video to post.");
        }

        if (trimEnd > actualDuration + 0.05) {
          throw new Error("The selected video range is invalid.");
        }

        if (selectedDuration > videoDuration + 0.05) {
          throw new Error(
            "The selected clip is longer than the maximum allowed duration."
          );
        }

        setTrimming(true);

        fileToUpload = await createTrimmedVideo(
          mediaFile,
          trimStart,
          Math.min(trimEnd, actualDuration)
        );

        setTrimming(false);
      }

      const post = await PostService.createPost(content);

      if (fileToUpload) {
        let mediaUrl = "";

        if (mediaType === "image") {
          mediaUrl = await MediaService.uploadImage(fileToUpload);
        }

        if (mediaType === "video") {
          mediaUrl = await MediaService.uploadVideo(fileToUpload);
        }

        await MediaService.attachMedia({
          postId: post.id,
          mediaUrl,
          mediaType,
          sortOrder: 0,
        });
      }

      alert("Post created successfully!");

      setContent("");
      setMediaFile(null);
      setMediaType("");
      setPreviewUrl("");
      setVideoDuration(30);
      resetVideoSelection();

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
        .video-trim-range {
          pointer-events: none;
        }

        .video-trim-range::-webkit-slider-thumb {
          pointer-events: auto;
          cursor: ew-resize;
        }

        .video-trim-range::-moz-range-thumb {
          pointer-events: auto;
          cursor: ew-resize;
        }
      `}</style>

      <div className="login-screen">
      <button className="secondary" onClick={onBack} disabled={posting}>
        ← Back
      </button>

      <h1>✨ Be Creative</h1>

      <p
        style={{
          color: "#bbbbbb",
          marginBottom: "20px",
        }}
      >
        Share a thought, a photo, a video, a story, or something that inspires
        others.
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        placeholder="What's on your mind?"
        disabled={posting}
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "16px",
          borderRadius: "12px",
          fontSize: "16px",
          resize: "vertical",
          marginBottom: "20px",
        }}
      />

      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleMediaChange}
        disabled={posting}
      />

      {mediaType === "video" && videoLength > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            marginTop: "20px",
            padding: "16px",
            borderRadius: "14px",
            background: "#18181b",
            border: "1px solid #333",
          }}
        >
          <label
            style={{
              display: "block",
              color: "#bbbbbb",
              marginBottom: "10px",
            }}
          >
            Maximum video length:
          </label>

          <select
            value={videoDuration}
            onChange={handleMaximumDurationChange}
            disabled={posting || trimming}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              fontSize: "16px",
            }}
          >
            {VIDEO_DURATION_OPTIONS.map((option) => (
              <option key={option.seconds} value={option.seconds}>
                {option.label}
              </option>
            ))}
          </select>

          <p
            style={{
              color: "#bbbbbb",
              marginTop: "14px",
              marginBottom: "8px",
            }}
          >
            Drag the handles to select the exact portion you want to post.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#bbbbbb",
              fontSize: "14px",
            }}
          >
            <span>Start: {formatDuration(trimStart)}</span>
            <span>
              Selected: {formatDuration(selectedDuration)} /{" "}
              {formatDuration(maximumDuration)} max
            </span>
            <span>End: {formatDuration(trimEnd)}</span>
          </div>

          <div
            style={{
              position: "relative",
              height: "58px",
              marginTop: "14px",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "0",
                right: "0",
                top: "25px",
                height: "8px",
                borderRadius: "8px",
                background: "#444",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: `${videoLength ? (trimStart / videoLength) * 100 : 0}%`,
                right: `${
                  videoLength
                    ? 100 - (trimEnd / videoLength) * 100
                    : 100
                }%`,
                top: "25px",
                height: "8px",
                borderRadius: "8px",
                background: "#4fc3f7",
              }}
            />

            <input
              className="video-trim-range"
              type="range"
              min="0"
              max={videoLength}
              step="0.01"
              value={trimStart}
              onChange={(e) => updateTrimStart(e.target.value)}
              disabled={posting || trimming}
              aria-label="Video trim start"
              style={{
                position: "absolute",
                left: "0",
                right: "0",
                top: "12px",
                width: "100%",
                pointerEvents: "none",
                background: "transparent",
                accentColor: "#4fc3f7",
                zIndex: 3,
              }}
            />

            <input
              className="video-trim-range"
              type="range"
              min="0"
              max={videoLength}
              step="0.01"
              value={trimEnd}
              onChange={(e) => updateTrimEnd(e.target.value)}
              disabled={posting || trimming}
              aria-label="Video trim end"
              style={{
                position: "absolute",
                left: "0",
                right: "0",
                top: "12px",
                width: "100%",
                pointerEvents: "none",
                background: "transparent",
                accentColor: "#4fc3f7",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: `${videoLength ? (trimStart / videoLength) * 100 : 0}%`,
                top: "13px",
                width: "22px",
                height: "32px",
                transform: "translateX(-50%)",
                borderRadius: "8px",
                background: "#ffffff",
                border: "2px solid #4fc3f7",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: `${videoLength ? (trimEnd / videoLength) * 100 : 0}%`,
                top: "13px",
                width: "22px",
                height: "32px",
                transform: "translateX(-50%)",
                borderRadius: "8px",
                background: "#ffffff",
                border: "2px solid #4fc3f7",
                pointerEvents: "none",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "4px",
            }}
          >
            <button
              type="button"
              className="secondary"
              onClick={() => seekTrimPreview(trimStart)}
              disabled={posting || trimming}
            >
              ▶ Preview Selection
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => {
                const nextEnd = Math.min(videoLength, videoDuration);
                setTrimStart(0);
                setTrimEnd(nextEnd);
                seekTrimPreview(0);
              }}
              disabled={posting || trimming}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {previewUrl && mediaType === "image" && (
        <img
          src={previewUrl}
          alt="Preview"
          style={{
            width: "100%",
            maxWidth: "500px",
            marginTop: "20px",
            borderRadius: "12px",
          }}
        />
      )}

      {previewUrl && mediaType === "video" && (
        <video
          ref={videoRef}
          src={previewUrl}
          controls
          playsInline
          onLoadedMetadata={handleVideoMetadata}
          onTimeUpdate={handleVideoTimeUpdate}
          onPlay={handleVideoPlay}
          style={{
            width: "100%",
            maxWidth: "500px",
            marginTop: "20px",
            borderRadius: "12px",
          }}
        >
          Your browser does not support video playback.
        </video>
      )}

      <p
        style={{
          color: "#bbbbbb",
          marginTop: "14px",
          minHeight: "20px",
        }}
      >
        {trimming
          ? "Trimming your selected video..."
          : posting
          ? "Creating your post..."
          : mediaType === "video"
          ? `Selected clip: ${formatDuration(selectedDuration)}`
          : ""}
      </p>

      <button
        onClick={handlePost}
        disabled={posting || trimming}
        style={{
          marginTop: "12px",
        }}
      >
        {trimming
          ? "Trimming..."
          : posting
          ? "Creating..."
          : "🚀 Start Creating"}
      </button>
    </div>
    </>
  );
}

export default CreatePost;
