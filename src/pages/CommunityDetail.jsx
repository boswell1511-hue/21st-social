import { useEffect, useRef, useState } from "react";
import supabase from "../lib/supabase";
import MediaService from "../services/posts/MediaService";

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

function CommunityDetail({ community, onBack, onJoin, joined }) {
  if (!community) return null;

  const [showComposer, setShowComposer] = useState(false);
  const [postText, setPostText] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [posts, setPosts] = useState([]);

  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [sectionIcon, setSectionIcon] = useState("📁");

  const [memberCount, setMemberCount] = useState(
    community.member_count ?? 0
  );
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

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
  const photoCameraInputRef = useRef(null);
  const videoCameraInputRef = useRef(null);
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
  const maximumDuration = Math.min(
    videoDuration,
    videoLength || videoDuration
  );

  useEffect(() => {
    let cancelled = false;

    async function initializeCommunity() {
      setCheckingAccess(true);

      const accessGranted = await checkCommunityAccess();

      if (cancelled) return;

      if (accessGranted) {
        await Promise.all([loadCommunity(), loadSections(), loadPosts()]);
      } else {
        setSections([]);
        setPosts([]);
      }

      if (!cancelled) {
        setCheckingAccess(false);
      }
    }

    initializeCommunity();

    return () => {
      cancelled = true;
    };
  }, [community]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (photoCameraStreamRef.current) {
        photoCameraStreamRef.current.getTracks().forEach((track) => track.stop());
        photoCameraStreamRef.current = null;
      }
      if (cameraRecorderRef.current && cameraRecorderRef.current.state !== "inactive") {
        try { cameraRecorderRef.current.stop(); } catch {}
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  async function checkCommunityAccess() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const allowed = community.visibility === "public";
      setHasAccess(allowed);
      return allowed;
    }

    if (community.owner_id === user.id) {
      setHasAccess(true);
      return true;
    }

    if (community.visibility === "public") {
      setHasAccess(true);
      return true;
    }

    const { data, error } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .eq("status", "joined")
      .maybeSingle();

    if (error) {
      console.error(error);
      setHasAccess(false);
      return false;
    }

    const allowed = !!data;
    setHasAccess(allowed);
    return allowed;
  }

  async function loadCommunity() {
    const { data, error } = await supabase
      .from("communities")
      .select("member_count")
      .eq("id", community.id)
      .single();

    if (!error && data) {
      setMemberCount(data.member_count ?? 0);
    }
  }

  async function loadSections() {
    const { data, error } = await supabase
      .from("community_sections")
      .select("*")
      .eq("community_id", community.id)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setSections(data || []);

    if (data?.length > 0) {
      setSelectedSectionId((current) => current || data[0].id);
    }
  }

  async function createSection() {
    if (!sectionName.trim()) {
      alert("Please enter a section name.");
      return;
    }

    const { error } = await supabase.from("community_sections").insert({
      community_id: community.id,
      name: sectionName.trim(),
      description: sectionDescription.trim() || "",
      icon: sectionIcon.trim() || "📁",
      sort_order: sections.length,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await loadSections();

    setSectionName("");
    setSectionDescription("");
    setSectionIcon("📁");
    setShowCreateSection(false);
  }

  async function loadPosts() {
    setLoadingPosts(true);

    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          community_sections (
            id,
            name,
            icon
          )
        `)
        .eq("community_id", community.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error(error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }

  function resetVideoSelection() {
    setVideoLength(0);
    setTrimStart(0);
    setTrimEnd(0);
    setTrimPreviewTime(0);
  }

  function clearSelectedMedia() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setMediaFile(null);
    setMediaType("");
    setPreviewUrl("");
    setVideoDuration(30);
    cameraRecordedFileRef.current = null;
    cameraRecordedDurationRef.current = 0;
    cameraRecordingStartedAtRef.current = 0;
    resetVideoSelection();
  }

  function stopPhotoCamera() {
    if (photoCameraStreamRef.current) {
      photoCameraStreamRef.current.getTracks().forEach((track) => track.stop());
      photoCameraStreamRef.current = null;
    }

    if (photoCameraPreviewRef.current) {
      photoCameraPreviewRef.current.srcObject = null;
    }

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
      if (photoCameraStreamRef.current) {
        photoCameraStreamRef.current.getTracks().forEach((track) => track.stop());
        photoCameraStreamRef.current = null;
      }

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
        photoCameraPreviewRef.current
          .play()
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
    const nextFacingMode =
      photoFacingMode === "environment" ? "user" : "environment";
    await openPhotoCamera(nextFacingMode);
  }

  function capturePhoto() {
    const video = photoCameraPreviewRef.current;

    if (!video || !photoCameraStreamRef.current || !photoCameraReady) {
      return;
    }

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

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const file = new File(
        [blob],
        `21st-social-photo-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

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
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }

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
        cameraPreviewRef.current
          .play()
          .then(() => setVideoCameraReady(true))
          .catch(() => setVideoCameraReady(true));
      });
    } catch (error) {
      console.error("Unable to open video camera:", error);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      setVideoCameraOpen(false);
      alert(error.message || "Unable to access the camera and microphone.");
    }
  }

  async function switchVideoCamera() {
    if (posting || trimming || videoRecording || !videoCameraOpen) return;

    const nextFacingMode =
      videoFacingMode === "environment" ? "user" : "environment";

    await openVideoCamera(nextFacingMode);
  }

  function stopVideoCamera() {
    if (cameraRecorderRef.current && cameraRecorderRef.current.state !== "inactive") {
      try { cameraRecorderRef.current.stop(); } catch {}
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraPreviewRef.current) cameraPreviewRef.current.srcObject = null;
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
        const elapsedSeconds = Math.max(0.1,
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
        const file = new File([blob], `21st-social-camera-${Date.now()}.${extension}`, { type: mimeType });
        cameraRecordedFileRef.current = file;
        cameraRecordedDurationRef.current = elapsedSeconds;

        stopVideoCamera();
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

  function handleMediaChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

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

  function handleVideoMetadata(event) {
    const metadataDuration = event.currentTarget.duration;

    // Android/Chrome can expose a freshly-recorded MediaRecorder blob with
    // missing or zero duration metadata even though the recording itself is
    // valid. We captured the real elapsed time when recording stopped, so use
    // that value for camera recordings instead of rejecting the video.
    const recordedDuration =
      mediaFile === cameraRecordedFileRef.current
        ? cameraRecordedDurationRef.current
        : 0;

    const duration =
      Number.isFinite(metadataDuration) && metadataDuration > 0
        ? metadataDuration
        : recordedDuration;

    if (!Number.isFinite(duration) || duration <= 0) {
      alert(
        "We couldn't read the duration of this video. Please try another video."
      );
      return;
    }

    setVideoLength(duration);

    const initialEnd = Math.min(duration, videoDuration);

    setTrimStart(0);
    setTrimEnd(initialEnd);
    setTrimPreviewTime(0);
  }

  function handleMaximumDurationChange(event) {
    const nextMaximum = Number(event.target.value);

    setVideoDuration(nextMaximum);

    if (!videoLength) return;

    setTrimStart((currentStart) =>
      Math.min(currentStart, Math.max(0, videoLength - 0.1))
    );

    setTrimEnd((currentEnd) =>
      Math.min(
        videoLength,
        Math.max(0, Math.min(currentEnd, nextMaximum))
      )
    );
  }

  function updateTrimStart(value) {
    const nextStart = Number(value);
    const minimumEnd = Math.min(videoLength, nextStart + 0.1);

    setTrimStart(
      Math.min(nextStart, Math.max(0, videoLength - 0.1))
    );

    setTrimEnd((currentEnd) =>
      Math.max(minimumEnd, Math.min(currentEnd, videoLength))
    );
  }

  function updateTrimEnd(value) {
    const nextEnd = Number(value);
    const maximumEnd = Math.min(videoLength, trimStart + videoDuration);

    setTrimEnd(
      Math.max(
        trimStart + 0.1,
        Math.min(nextEnd, maximumEnd)
      )
    );
  }

  function handleTrimPointerDown(event, handle) {
    if (posting || trimming || !videoLength) return;

    event.preventDefault();
    event.stopPropagation();

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}

    updateTrimFromPointer(event, handle);
  }

  function updateTrimFromPointer(event, handle) {
    const track = event.currentTarget?.parentElement;

    if (!track || !videoLength) return;

    const rect = track.getBoundingClientRect();
    if (!rect.width) return;

    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const nextTime = ratio * videoLength;

    if (handle === "start") {
      updateTrimStart(nextTime);
    } else {
      updateTrimEnd(nextTime);
    }
  }

  function handleTrimPointerMove(event, handle) {
    if (event.buttons === 0 && event.pointerType !== "touch") return;
    event.preventDefault();
    updateTrimFromPointer(event, handle);
  }

  function handleTrimPointerUp(event) {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
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

    if (video.currentTime < trimStart) {
      video.currentTime = trimStart;
    }

    setTrimPreviewTime(video.currentTime);
  }

  function handleVideoPlay(event) {
    const video = event.currentTarget;

    if (
      video.currentTime < trimStart ||
      video.currentTime >= trimEnd
    ) {
      video.currentTime = trimStart;
      setTrimPreviewTime(trimStart);
    }
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
        if (fallbackDuration > 0) {
          resolve(fallbackDuration);
          return;
        }
        reject(new Error("We couldn't read the duration of this video. Please try another video."));
      };

      video.src = temporaryUrl;
    });
  }

  async function createTrimmedVideo(file, start, end) {
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
    const recorder = new MediaRecorder(stream, { mimeType });

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
            `21st-social-community-trim-${Date.now()}.${extension}`,
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

  async function publishPost() {
    if (!postText.trim() && !mediaFile) {
      alert("Please add text, a photo, or a video.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to post.");
      return;
    }

    setPosting(true);

    let uploadedMediaUrl = "";

    try {
      let fileToUpload = mediaFile;

      if (mediaFile && mediaType === "video") {
        const recordedDuration =
          mediaFile === cameraRecordedFileRef.current
            ? cameraRecordedDurationRef.current
            : 0;

        let actualDuration = recordedDuration;

        // For camera recordings, the real elapsed recording time is the
        // authoritative duration on Android. Only read container metadata for
        // gallery/imported videos or when no recorded duration is available.
        if (actualDuration <= 0) {
          actualDuration = await getVideoDuration(mediaFile, 0);
        }

        if (trimEnd <= trimStart) {
          throw new Error(
            "Please select a portion of the video to post."
          );
        }

        if (trimEnd > actualDuration + 0.05) {
          throw new Error("The selected video range is invalid.");
        }

        if (selectedDuration > videoDuration + 0.05) {
          throw new Error(
            "The selected clip is longer than the maximum allowed duration."
          );
        }

        const effectiveEnd = Math.min(trimEnd, actualDuration);
        const selectedRange = Math.max(0, effectiveEnd - trimStart);
        const isAlreadyValidClip =
          trimStart <= 0.05 &&
          Math.abs(effectiveEnd - actualDuration) <= 0.1 &&
          selectedRange <= videoDuration + 0.05;

        // Camera recordings should be uploaded directly when the full recording
        // is selected. Re-encoding them through captureStream() can cause an
        // Android browser page reload. Gallery videos still use the existing
        // trimming path when a shorter range is selected.
        if (!isAlreadyValidClip) {
          setTrimming(true);
          fileToUpload = await createTrimmedVideo(
            mediaFile,
            trimStart,
            effectiveEnd
          );
          setTrimming(false);
        }
      }

      const postType = mediaType || "text";

      if (fileToUpload && mediaType === "image") {
        uploadedMediaUrl = await MediaService.uploadImage(fileToUpload);
      }

      if (fileToUpload && mediaType === "video") {
        uploadedMediaUrl = await MediaService.uploadVideo(fileToUpload);
      }

      const { data: post, error: postError } = await supabase
        .from("community_posts")
        .insert({
          community_id: community.id,
          section_id: selectedSectionId || null,
          user_id: user.id,
          post_type: postType,
          text_content: postText.trim() || null,
          video_url: uploadedMediaUrl || null,
        })
        .select()
        .single();

      if (postError) {
        throw postError;
      }

      clearSelectedMedia();
      setPostText("");
      setShowComposer(false);

      await loadPosts();

      alert("Community post published!");
    } catch (error) {
      console.error(error);
      setTrimming(false);
      alert(
        error.message || "Unable to publish the community post."
      );
    } finally {
      setPosting(false);
    }
  }

  if (checkingAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading community...
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="text-5xl mb-4">🔒</div>

        <h2 className="text-xl font-bold mb-2">
          Private Community
        </h2>

        <p className="text-sm opacity-70 max-w-sm">
          This community is private. You must be invited by the
          community owner or an administrator to access its content.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <button
        onClick={onBack}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <div
        style={{
          height: "180px",
          borderRadius: "18px",
          background:
            "linear-gradient(135deg,#7c3aed,#5b21b6,#312e81)",
          marginBottom: "20px",
        }}
      />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "64px" }}>
          {community.icon}
        </div>

        <h1>{community.name}</h1>
        <p>{community.description}</p>

        <h3>{memberCount.toLocaleString()} Members</h3>

        <button
          onClick={onJoin}
          style={{
            marginTop: "10px",
            padding: "12px 26px",
            borderRadius: "999px",
            border: "none",
            background: joined ? "#16a34a" : "#7c3aed",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {joined ? "✓ Joined" : "+ Join Community"}
        </button>
      </div>

      <hr style={{ margin: "30px 0" }} />

      <h2>About</h2>

      <p>
        Welcome to the {community.name} community. This is where
        members will be able to share posts, ideas, discussions,
        photos, videos, and much more.
      </p>

      <hr style={{ margin: "30px 0" }} />

      <button
        style={{
          marginBottom: "20px",
          padding: "12px 20px",
          borderRadius: "10px",
          border: "none",
          background: "#7c3aed",
          color: "#fff",
          cursor: "pointer",
          fontWeight: "bold",
        }}
        onClick={() => setShowCreateSection(true)}
      >
        + Create Section
      </button>

      {sections.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          {sections.map((section) => {
            const sectionPosts = posts.filter(
              (post) => post.section_id === section.id
            );

            return (
              <div
                key={section.id}
                style={{
                  marginBottom: "12px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#18181b",
                  border: "1px solid #333",
                }}
              >
                <h3>
                  {section.icon} {section.name}
                </h3>

                {section.description && (
                  <p>{section.description}</p>
                )}

                <p style={{ opacity: 0.6, fontSize: "13px" }}>
                  {sectionPosts.length}{" "}
                  {sectionPosts.length === 1 ? "post" : "posts"}
                </p>

                <button
                  onClick={() => {
                    setSelectedSectionId(section.id);
                    setShowComposer(true);
                  }}
                  style={{
                    marginTop: "12px",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#7c3aed",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  + Create Post
                </button>
              </div>
            );
          })}
        </div>
      )}

      <h2>Community Feed</h2>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          borderRadius: "16px",
          background: "#1f1f1f",
        }}
      >
        <button
          onClick={() => {
            if (sections.length === 0) {
              alert(
                "Please create a section before creating a post."
              );
              return;
            }

            setSelectedSectionId(sections[0].id);
            setShowComposer(true);
          }}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: "#7c3aed",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          + Create Community Post
        </button>

        {showComposer && (
          <div
            style={{
              marginBottom: "20px",
              padding: "20px",
              borderRadius: "14px",
              background: "#18181b",
              border: "1px solid #333",
            }}
          >
            <h3>Create Community Post</h3>

            <select
              value={selectedSectionId}
              onChange={(event) =>
                setSelectedSectionId(event.target.value)
              }
              disabled={posting || trimming}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #444",
                background: "#111",
                color: "#fff",
              }}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.icon} {section.name}
                </option>
              ))}
            </select>

            <textarea
              value={postText}
              onChange={(event) => setPostText(event.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              disabled={posting || trimming}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #444",
                background: "#111",
                color: "#fff",
                resize: "vertical",
              }}
            />

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaChange}
              disabled={posting || trimming}
              style={{ display: "none" }}
            />

            <input
              ref={photoCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleMediaChange}
              disabled={posting || trimming}
              style={{ display: "none" }}
            />


            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "14px",
              }}
            >
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={posting || trimming}
              >
                🖼️ Gallery
              </button>

              <button
                type="button"
                onClick={() => openPhotoCamera("environment")}
                disabled={posting || trimming || photoCameraOpen}
              >
                📷 Add Photo / Camera
              </button>

              <button
                type="button"
                onClick={openVideoCamera}
                disabled={posting || trimming || videoCameraOpen}
              >
                🎥 Record Video
              </button>

              {mediaFile && (
                <button
                  type="button"
                  onClick={clearSelectedMedia}
                  disabled={posting || trimming}
                >
                  Remove Media
                </button>
              )}
            </div>

            {photoCameraOpen && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  borderRadius: "14px",
                  background: "#111",
                  border: "1px solid #333",
                }}
              >
                <h4 style={{ marginTop: 0 }}>Take Photo</h4>

                <video
                  ref={photoCameraPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    maxWidth: "500px",
                    borderRadius: "12px",
                    display: "block",
                    background: "#000",
                    transform:
                      photoFacingMode === "user" ? "scaleX(-1)" : "none",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "12px",
                  }}
                >
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!photoCameraReady || posting || trimming}
                  >
                    📸 Capture Photo
                  </button>

                  <button
                    type="button"
                    onClick={switchPhotoCamera}
                    disabled={!photoCameraReady || posting || trimming}
                  >
                    🔄 Switch Camera
                  </button>

                  <button
                    type="button"
                    onClick={stopPhotoCamera}
                    disabled={posting || trimming}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {videoCameraOpen && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  borderRadius: "14px",
                  background: "#111",
                  border: "1px solid #333",
                }}
              >
                <h4 style={{ marginTop: 0 }}>Record Video</h4>
                <video
                  ref={cameraPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    maxWidth: "500px",
                    borderRadius: "12px",
                    display: "block",
                    background: "#000",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "12px",
                  }}
                >
                  {!videoRecording ? (
                    <button
                      type="button"
                      onClick={startVideoRecording}
                      disabled={!videoCameraReady || posting || trimming}
                    >
                      🔴 Start Recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopVideoRecording}
                      disabled={posting || trimming}
                    >
                      ⏹️ Stop Recording
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={switchVideoCamera}
                    disabled={videoRecording || !videoCameraReady || posting || trimming}
                  >
                    🔄 Switch Camera
                  </button>
                  <button
                    type="button"
                    onClick={cancelVideoCamera}
                    disabled={videoRecording || posting || trimming}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {previewUrl && mediaType === "image" && (
              <img
                src={previewUrl}
                alt="Community post preview"
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  marginTop: "16px",
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
                  marginTop: "16px",
                  borderRadius: "12px",
                }}
              >
                Your browser does not support video playback.
              </video>
            )}

            {mediaType === "video" && videoLength > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  borderRadius: "14px",
                  background: "#111",
                  border: "1px solid #333",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
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
                    padding: "10px",
                    borderRadius: "10px",
                  }}
                >
                  {VIDEO_DURATION_OPTIONS.map((option) => (
                    <option
                      key={option.seconds}
                      value={option.seconds}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                <p style={{ opacity: 0.75, marginTop: "12px" }}>
                  Drag either handle to select the exact portion
                  you want to post.
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    opacity: 0.8,
                  }}
                >
                  <span>
                    Start: {formatDuration(trimStart)}
                  </span>
                  <span>
                    Selected: {formatDuration(selectedDuration)} /{" "}
                    {formatDuration(maximumDuration)} max
                  </span>
                  <span>
                    End: {formatDuration(trimEnd)}
                  </span>
                </div>

                <div
                  style={{
                    position: "relative",
                    height: "58px",
                    marginTop: "10px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "25px",
                      height: "8px",
                      borderRadius: "8px",
                      background: "#444",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: `${
                        videoLength
                          ? (trimStart / videoLength) * 100
                          : 0
                      }%`,
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

                  <div
                    role="slider"
                    tabIndex={posting || trimming ? -1 : 0}
                    aria-label="Video trim start"
                    aria-valuemin={0}
                    aria-valuemax={videoLength}
                    aria-valuenow={trimStart}
                    onPointerDown={(event) =>
                      handleTrimPointerDown(event, "start")
                    }
                    onPointerMove={(event) =>
                      handleTrimPointerMove(event, "start")
                    }
                    onPointerUp={handleTrimPointerUp}
                    onKeyDown={(event) => {
                      if (posting || trimming) return;
                      if (event.key === "ArrowLeft") {
                        event.preventDefault();
                        updateTrimStart(trimStart - 0.1);
                      } else if (event.key === "ArrowRight") {
                        event.preventDefault();
                        updateTrimStart(trimStart + 0.1);
                      }
                    }}
                    style={{
                      position: "absolute",
                      left: `${
                        videoLength
                          ? (trimStart / videoLength) * 100
                          : 0
                      }%`,
                      top: "10px",
                      width: "30px",
                      height: "38px",
                      transform: "translateX(-50%)",
                      borderRadius: "8px",
                      background: "#fff",
                      border: "3px solid #4fc3f7",
                      boxSizing: "border-box",
                      cursor: posting || trimming ? "default" : "ew-resize",
                      touchAction: "none",
                      userSelect: "none",
                      zIndex: 5,
                      opacity: posting || trimming ? 0.6 : 1,
                    }}
                  />

                  <div
                    role="slider"
                    tabIndex={posting || trimming ? -1 : 0}
                    aria-label="Video trim end"
                    aria-valuemin={0}
                    aria-valuemax={videoLength}
                    aria-valuenow={trimEnd}
                    onPointerDown={(event) =>
                      handleTrimPointerDown(event, "end")
                    }
                    onPointerMove={(event) =>
                      handleTrimPointerMove(event, "end")
                    }
                    onPointerUp={handleTrimPointerUp}
                    onKeyDown={(event) => {
                      if (posting || trimming) return;
                      if (event.key === "ArrowLeft") {
                        event.preventDefault();
                        updateTrimEnd(trimEnd - 0.1);
                      } else if (event.key === "ArrowRight") {
                        event.preventDefault();
                        updateTrimEnd(trimEnd + 0.1);
                      }
                    }}
                    style={{
                      position: "absolute",
                      left: `${
                        videoLength
                          ? (trimEnd / videoLength) * 100
                          : 0
                      }%`,
                      top: "10px",
                      width: "30px",
                      height: "38px",
                      transform: "translateX(-50%)",
                      borderRadius: "8px",
                      background: "#fff",
                      border: "3px solid #4fc3f7",
                      boxSizing: "border-box",
                      cursor: posting || trimming ? "default" : "ew-resize",
                      touchAction: "none",
                      userSelect: "none",
                      zIndex: 6,
                      opacity: posting || trimming ? 0.6 : 1,
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
                    onClick={() =>
                      seekTrimPreview(trimStart)
                    }
                    disabled={posting || trimming}
                  >
                    ▶ Preview Selection
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextEnd = Math.min(
                        videoLength,
                        videoDuration
                      );
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

            <p
              style={{
                minHeight: "20px",
                opacity: 0.75,
                marginTop: "14px",
              }}
            >
              {trimming
                ? "Trimming your selected video..."
                : posting
                ? "Publishing your community post..."
                : mediaType === "video"
                ? `Selected clip: ${formatDuration(
                    selectedDuration
                  )}`
                : ""}
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  clearSelectedMedia();
                  setPostText("");
                  setShowComposer(false);
                }}
                disabled={posting || trimming}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={publishPost}
                disabled={posting || trimming}
              >
                {trimming
                  ? "Trimming..."
                  : posting
                  ? "Publishing..."
                  : "Publish"}
              </button>
            </div>
          </div>
        )}

        <h3>Community Posts</h3>

        {loadingPosts ? (
          <p>Loading posts...</p>
        ) : sections.length === 0 ? (
          <p style={{ opacity: 0.6 }}>
            Create a section to begin organizing community posts.
          </p>
        ) : (
          sections.map((section) => {
            const sectionPosts = posts.filter(
              (post) => post.section_id === section.id
            );

            return (
              <div
                key={section.id}
                style={{ marginBottom: "30px" }}
              >
                <h4>
                  {section.icon} {section.name}
                </h4>

                {section.description && (
                  <p style={{ opacity: 0.7 }}>
                    {section.description}
                  </p>
                )}

                <p
                  style={{
                    opacity: 0.6,
                    marginTop: "4px",
                  }}
                >
                  {sectionPosts.length}{" "}
                  {sectionPosts.length === 1 ? "post" : "posts"}
                </p>

                {sectionPosts.length === 0 ? (
                  <p style={{ opacity: 0.6 }}>
                    No posts in this section yet.
                  </p>
                ) : (
                  sectionPosts.map((post) => (
                    <div
                      key={post.id}
                      style={{
                        marginTop: "16px",
                        padding: "16px",
                        borderRadius: "12px",
                        background: "#18181b",
                        border: "1px solid #333",
                      }}
                    >
                      {post.text_content && (
                        <p style={{ whiteSpace: "pre-wrap" }}>
                          {post.text_content}
                        </p>
                      )}

                      {post.video_url && post.post_type === "image" && (
                        <img
                          src={post.video_url}
                          alt="Community post media"
                          style={{
                            width: "100%",
                            maxHeight: "500px",
                            objectFit: "cover",
                            borderRadius: "12px",
                            marginTop: "14px",
                          }}
                        />
                      )}

                      {post.video_url && post.post_type === "video" && (
                        <video
                          src={post.video_url}
                          controls
                          playsInline
                          style={{
                            width: "100%",
                            maxHeight: "500px",
                            borderRadius: "12px",
                            marginTop: "14px",
                          }}
                        />
                      )}

                      {post.created_at && (
                        <small style={{ opacity: 0.6 }}>
                          {new Date(
                            post.created_at
                          ).toLocaleString()}
                        </small>
                      )}
                    </div>
                  ))
                )}
              </div>
            );
          })
        )}
      </div>

      {showCreateSection && (
        <div
          style={{
            marginTop: "24px",
            padding: "20px",
            borderRadius: "16px",
            background: "#18181b",
            border: "1px solid #333",
          }}
        >
          <h3>Create Section</h3>

          <input
            type="text"
            placeholder="Section name"
            value={sectionName}
            onChange={(event) =>
              setSectionName(event.target.value)
            }
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "12px",
              borderRadius: "10px",
            }}
          />

          <input
            type="text"
            placeholder="Description (optional)"
            value={sectionDescription}
            onChange={(event) =>
              setSectionDescription(event.target.value)
            }
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "12px",
              borderRadius: "10px",
            }}
          />

          <input
            type="text"
            placeholder="Icon (optional)"
            value={sectionIcon}
            onChange={(event) =>
              setSectionIcon(event.target.value)
            }
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "12px",
              borderRadius: "10px",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            <button
              type="button"
              onClick={() => setShowCreateSection(false)}
            >
              Cancel
            </button>

            <button type="button" onClick={createSection}>
              Create Section
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityDetail;
