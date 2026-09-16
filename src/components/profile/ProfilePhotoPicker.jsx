import { useEffect, useRef, useState } from "react";
import "../../styles/login.css";

const DEFAULT_POSITION = 50;
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ProfilePhotoPicker({
  onImageSelected,
  currentImageUrl = "",
  currentPositionX = DEFAULT_POSITION,
  currentPositionY = DEFAULT_POSITION,
  currentZoom = DEFAULT_ZOOM,
  onPositionChange,
}) {
  const [image, setImage] = useState(currentImageUrl || "");
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingImage, setPendingImage] = useState("");

  const [positionX, setPositionX] = useState(currentPositionX ?? DEFAULT_POSITION);
  const [positionY, setPositionY] = useState(currentPositionY ?? DEFAULT_POSITION);
  const [zoom, setZoom] = useState(currentZoom ?? DEFAULT_ZOOM);
  const [isConfirming, setIsConfirming] = useState(false);

  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const imageRef = useRef(null);

  const interactionRef = useRef({
    pointers: new Map(),
    lastPointer: null,
    startDistance: 0,
    startZoom: DEFAULT_ZOOM,
    startX: DEFAULT_POSITION,
    startY: DEFAULT_POSITION,
    currentX: currentPositionX ?? DEFAULT_POSITION,
    currentY: currentPositionY ?? DEFAULT_POSITION,
    currentZoom: currentZoom ?? DEFAULT_ZOOM,
  });

  useEffect(() => {
    if (!pendingImage) {
      setImage(currentImageUrl || "");
    }
  }, [currentImageUrl, pendingImage]);

  useEffect(() => {
    const nextX = currentPositionX ?? DEFAULT_POSITION;
    const nextY = currentPositionY ?? DEFAULT_POSITION;
    const nextZoom = currentZoom ?? DEFAULT_ZOOM;

    setPositionX(nextX);
    setPositionY(nextY);
    setZoom(nextZoom);

    interactionRef.current.currentX = nextX;
    interactionRef.current.currentY = nextY;
    interactionRef.current.currentZoom = nextZoom;
  }, [currentPositionX, currentPositionY, currentZoom]);

  function publishFraming(nextX, nextY, nextZoom) {
    const framing = {
      x: clamp(nextX, 0, 100),
      y: clamp(nextY, 0, 100),
      zoom: clamp(nextZoom, MIN_ZOOM, MAX_ZOOM),
    };

    setPositionX(framing.x);
    setPositionY(framing.y);
    setZoom(framing.zoom);

    interactionRef.current.currentX = framing.x;
    interactionRef.current.currentY = framing.y;
    interactionRef.current.currentZoom = framing.zoom;

    onPositionChange?.(framing);
  }

  function resetFraming() {
    publishFraming(DEFAULT_POSITION, DEFAULT_POSITION, DEFAULT_ZOOM);
  }

  function getEditorSize() {
    const rect = editorRef.current?.getBoundingClientRect();

    return {
      width: rect?.width || 320,
      height: rect?.height || 320,
    };
  }

  function getBaseImageSize() {
    const { width, height } = getEditorSize();
    const imageElement = imageRef.current;

    if (!imageElement?.naturalWidth || !imageElement?.naturalHeight) {
      return { width, height };
    }

    const imageRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    const editorRatio = width / height;

    if (imageRatio > editorRatio) {
      return {
        width: height * imageRatio,
        height,
      };
    }

    return {
      width,
      height: width / imageRatio,
    };
  }

  function getPanLimits(nextZoom = zoom) {
    const { width, height } = getEditorSize();
    const base = getBaseImageSize();

    return {
      x: Math.max(0, (base.width * nextZoom - width) / 2),
      y: Math.max(0, (base.height * nextZoom - height) / 2),
    };
  }

  function positionToTranslation(nextX, nextY, nextZoom = zoom) {
    const limits = getPanLimits(nextZoom);

    return {
      x: ((50 - nextX) / 50) * limits.x,
      y: ((50 - nextY) / 50) * limits.y,
    };
  }

  function translationToPosition(translationX, translationY, nextZoom = zoom) {
    const limits = getPanLimits(nextZoom);

    return {
      x: limits.x === 0 ? 50 : clamp(50 - (translationX / limits.x) * 50, 0, 100),
      y: limits.y === 0 ? 50 : clamp(50 - (translationY / limits.y) * 50, 0, 100),
    };
  }

  function getDistance(points) {
    if (points.length < 2) return 0;

    return Math.hypot(
      points[1].x - points[0].x,
      points[1].y - points[0].y
    );
  }

  function handlePointerDown(event) {
    if (!pendingImage) return;

    event.preventDefault();
    event.stopPropagation();

    const state = interactionRef.current;

    state.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    event.currentTarget.setPointerCapture?.(event.pointerId);

    const points = Array.from(state.pointers.values());

    if (points.length === 1) {
      state.lastPointer = {
        x: event.clientX,
        y: event.clientY,
      };
    }

    if (points.length === 2) {
      state.startDistance = getDistance(points);
      state.startZoom = zoom;
      state.startX = positionX;
      state.startY = positionY;
      state.lastPointer = null;
    }
  }

  function handlePointerMove(event) {
    const state = interactionRef.current;

    if (!state.pointers.has(event.pointerId) || !pendingImage) {
      return;
    }

    event.preventDefault();

    state.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const points = Array.from(state.pointers.values());

    if (points.length >= 2) {
      const distance = getDistance(points);

      if (state.startDistance > 0) {
        const nextZoom = clamp(
          state.startZoom * (distance / state.startDistance),
          MIN_ZOOM,
          MAX_ZOOM
        );
        // Keep the selected crop centered while zooming. The user's
        // existing pan position is preserved instead of pulling the
        // image toward a corner.
        publishFraming(state.startX, state.startY, nextZoom);
      }

      return;
    }

    if (points.length === 1 && state.lastPointer) {
      const moveX = event.clientX - state.lastPointer.x;
      const moveY = event.clientY - state.lastPointer.y;

      state.lastPointer = {
        x: event.clientX,
        y: event.clientY,
      };

      const currentTranslation = positionToTranslation(
        state.currentX,
        state.currentY,
        state.currentZoom
      );
      const nextTranslation = {
        x: currentTranslation.x + moveX,
        y: currentTranslation.y + moveY,
      };

      const limits = getPanLimits(state.currentZoom);
      nextTranslation.x = clamp(nextTranslation.x, -limits.x, limits.x);
      nextTranslation.y = clamp(nextTranslation.y, -limits.y, limits.y);

      const nextPosition = translationToPosition(
        nextTranslation.x,
        nextTranslation.y,
        state.currentZoom
      );

      publishFraming(nextPosition.x, nextPosition.y, state.currentZoom);
    }
  }

  function handlePointerUp(event) {
    const state = interactionRef.current;

    state.pointers.delete(event.pointerId);

    if (state.pointers.size === 0) {
      state.lastPointer = null;
      state.startDistance = 0;
    } else if (state.pointers.size === 1) {
      const remaining = Array.from(state.pointers.values())[0];

      state.lastPointer = {
        x: remaining.x,
        y: remaining.y,
      };

      state.startDistance = 0;
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    if (pendingImage) {
      URL.revokeObjectURL(pendingImage);
    }

    setPendingFile(file);
    setPendingImage(imageUrl);
    setImage(imageUrl);

    publishFraming(DEFAULT_POSITION, DEFAULT_POSITION, DEFAULT_ZOOM);

    event.target.value = "";
  }

  function cancelSelection() {
    if (pendingImage) {
      URL.revokeObjectURL(pendingImage);
    }

    setPendingFile(null);
    setPendingImage("");
    setImage(currentImageUrl || "");

    publishFraming(
      currentPositionX ?? DEFAULT_POSITION,
      currentPositionY ?? DEFAULT_POSITION,
      currentZoom ?? DEFAULT_ZOOM
    );
  }

  async function createCroppedFile() {
    const imageElement = imageRef.current;

    if (!imageElement?.naturalWidth || !imageElement?.naturalHeight) {
      throw new Error("The selected image is not ready yet.");
    }

    const { width: editorWidth, height: editorHeight } = getEditorSize();
    const cropSize = Math.min(190, editorWidth, editorHeight);
    const outputSize = 512;

    const base = getBaseImageSize();
    const renderedWidth = base.width * zoom;
    const renderedHeight = base.height * zoom;
    const translation = positionToTranslation(positionX, positionY, zoom);

    const imageLeft =
      (editorWidth - renderedWidth) / 2 + translation.x;
    const imageTop =
      (editorHeight - renderedHeight) / 2 + translation.y;

    const cropLeft = (editorWidth - cropSize) / 2;
    const cropTop = (editorHeight - cropSize) / 2;
    const scale = outputSize / cropSize;

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create the profile photo crop.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.drawImage(
      imageElement,
      (imageLeft - cropLeft) * scale,
      (imageTop - cropTop) * scale,
      renderedWidth * scale,
      renderedHeight * scale
    );

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Unable to create the profile photo file."));
          }
        },
        "image/jpeg",
        0.92
      );
    });

    return new File(
      [blob],
      `profile-photo-${Date.now()}.jpg`,
      { type: "image/jpeg" }
    );
  }

  async function confirmSelection() {
    if (!pendingFile || !pendingImage || isConfirming) return;

    try {
      setIsConfirming(true);

      const croppedFile = await createCroppedFile();

      setImage(URL.createObjectURL(croppedFile));

      onImageSelected?.(croppedFile);

      if (pendingImage) {
        URL.revokeObjectURL(pendingImage);
      }

      setPendingFile(null);
      setPendingImage("");
    } catch (error) {
      console.error("Profile photo crop failed:", error);
      alert(error?.message || "Unable to prepare the selected profile photo.");
    } finally {
      setIsConfirming(false);
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  const editorStyles = {
    position: "relative",
    width: "min(100%, 360px)",
    aspectRatio: "1 / 1",
    margin: "0 auto 14px",
    overflow: "hidden",
    borderRadius: "18px",
    background: "#050914",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 0 28px rgba(80,180,255,0.18)",
    touchAction: "none",
  };

  const translation = positionToTranslation(positionX, positionY, zoom);

  const previewImageStyles = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center center",
    transform: `translate(calc(-50% + ${translation.x}px), calc(-50% + ${translation.y}px)) scale(${zoom})`,
    transformOrigin: "center center",
    userSelect: "none",
    WebkitUserDrag: "none",
    pointerEvents: "none",
  };

  return (
    <div className="profile-photo-picker">
      {pendingImage ? (
        <div>
          <div
            ref={editorRef}
            style={editorStyles}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img
              ref={imageRef}
              src={pendingImage}
              alt="Profile photo framing preview"
              onLoad={() => {
                setPositionX(positionX);
                setPositionY(positionY);
              }}
              style={previewImageStyles}
              draggable={false}
            />

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at center, transparent 0 96px, rgba(0,0,0,0.62) 98px 100%)",
                pointerEvents: "none",
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "190px",
                height: "190px",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.95)",
                boxShadow:
                  "0 0 0 9999px rgba(0,0,0,0.16), 0 0 20px rgba(90,190,255,0.5)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: "10px",
                transform: "translateX(-50%)",
                padding: "5px 10px",
                borderRadius: "999px",
                background: "rgba(0,0,0,0.68)",
                color: "#fff",
                fontSize: "12px",
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              Inside the circle = profile photo
            </div>
          </div>

          <p
            style={{
              color: "#d4d4d4",
              textAlign: "center",
              margin: "4px 0 6px",
              fontSize: "14px",
            }}
          >
            Drag to position • Pinch to zoom
          </p>

          <p
            style={{
              color: "#9ea5b5",
              textAlign: "center",
              margin: "0 0 12px",
              fontSize: "12px",
            }}
          >
            The shaded area is outside your profile-photo crop.
          </p>

          <button
            type="button"
            className="secondary"
            onClick={resetFraming}
            style={{ marginBottom: "12px" }}
          >
            ↺ Reset Framing
          </button>

          <div className="profile-photo-confirmation">
            <h3>Use This Photo?</h3>

            <div>
              <button
                type="button"
                className="secondary"
                onClick={cancelSelection}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmSelection}
              >
                Use This Photo
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              position: "relative",
              width: "190px",
              height: "190px",
              margin: "0 auto 14px",
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            {image ? (
              <img
                src={image}
                alt="Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `${positionX}% ${positionY}%`,
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  userSelect: "none",
                  WebkitUserDrag: "none",
                }}
                draggable={false}
              />
            ) : (
              <span className="profile-photo-icon">👤</span>
            )}
          </div>

          {image && (
            <p
              style={{
                color: "#cfcfcf",
                textAlign: "center",
                margin: "0 0 12px",
                fontSize: "14px",
              }}
            >
              Your current profile photo
            </p>
          )}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: "none" }}
      />

      {!pendingImage && (
        <button
          type="button"
          className="secondary"
          onClick={openFilePicker}
        >
          Upload Profile Photo
        </button>
      )}
    </div>
  );
}

export default ProfilePhotoPicker;
