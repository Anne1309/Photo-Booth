import React, { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import "./PhotoStudio.css";
import html2canvas from "html2canvas";
import { motion } from "framer-motion";

const filters = [
  "90s",
  "2000s",
  "Noir",
  "Fisheye",
  "Rainbow",
  "Glitch",
  "Crosshatch",
];

const PhotoStudio = () => {
  const [selectedFilter, setSelectedFilter] = useState("90s");
  const [photos, setPhotos] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const webcamRef = useRef(null);
  const [stripCount, setStripCount] = useState(3); // New state for number of pictures per strip
  const [currentPictureIndex, setCurrentPictureIndex] = useState(0); // Track current picture in sequence

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const getFilterClass = (filter) => {
    switch (filter.toLowerCase()) {
      case "90s":
        return "_90s";
      case "2000s":
        return "_2000s";
      default:
        return filter.toLowerCase();
    }
  };

  const takePhoto = useCallback(async () => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState < 2) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    let cssFilter = "none";
    switch (selectedFilter.toLowerCase()) {
      case "noir":
        cssFilter = "grayscale(1) contrast(0.8) brightness(1.1)";
        break;
      case "90s":
        cssFilter =
          "contrast(1.1) sepia(0.3) hue-rotate(-10deg) saturate(0.8) brightness(1.1)";
        break;
      case "2000s":
        cssFilter =
          "saturate(1.8) contrast(1.05) brightness(1.1) sepia(0.1) hue-rotate(10deg)";
        break;
      case "rainbow":
        cssFilter = "hue-rotate(90deg)";
        break;
      case "glitch":
        cssFilter = "contrast(1.5) saturate(2)";
        break;
      case "crosshatch":
        cssFilter = "grayscale(0.5) blur(1px)";
        break;
      case "fisheye":
        cssFilter = "brightness(1.1)";
        break;
      default:
        cssFilter = "none"; // Ensure a default filter
        break;
    }

    ctx.filter = cssFilter;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const filteredImg = canvas.toDataURL("image/jpeg");
    setPhotos((prev) => [
      ...prev,
      { src: filteredImg, filter: selectedFilter },
    ]);
  }, [selectedFilter]); // Added selectedFilter to useCallback dependencies

  const countdownStep = async (value) => {
    setCountdown(value);
    await new Promise((r) => requestAnimationFrame(r));
    await delay(1000);
  };

  const startPhotoSequence = async () => {
    setIsCapturing(true);
    setPhotos([]); // Clear previous photos
    setCurrentPictureIndex(0); // Reset current picture index
    setShowResult(false);

    for (let i = 0; i < stripCount; i++) { // Loop based on stripCount
      setCurrentPictureIndex(i); // Update index for display
      await countdownStep("3..");
      await countdownStep("2..");
      await countdownStep("1..");
      await countdownStep("Smile!");
      await takePhoto();
      setCountdown(null);
      await delay(500); // Small delay between photos
    }

    setIsCapturing(false);
    setShowResult(true);
  };

  const handleReshoot = () => {
    setPhotos([]);
    setShowResult(false);
    setCurrentPictureIndex(0); // Reset index on reshoot
  };

  const handleDownload = async () => {
    const frame = document.getElementById("photostrip-canvas-source");
    if (!frame) return;

    const canvas = await html2canvas(frame, { useCORS: true });
    const dataURL = canvas.toDataURL("image/jpeg");

    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "dvBooth-strip.jpg";
    link.click();
  };

  const handleStripCountChange = (event) => {
    setStripCount(Number(event.target.value));
  };

  const slideIn = {
    hidden: { x: "100%", opacity: 0 },
    visible: {
      x: "0%",
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className="photoStudio"
      variants={slideIn}
      initial="hidden"
      animate="visible"
    >
      {!showResult && (
        <div className="studio-container">
          <div className="studio-webcam-container">
            {countdown && <div className="countdown-overlay">{countdown}</div>}

            <div className={`studio-webcam ${getFilterClass(selectedFilter)}`}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="webcam-view"
              />
            </div>
          </div>

          <div className="controls-section"> {/* Added a wrapper for controls */}
            <div className="filter-bar">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`filter-btn ${
                    selectedFilter === filter ? "active" : ""
                  }`}
                  disabled={isCapturing}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="strip-count-selector">
              <label htmlFor="stripCount">Pictures:</label>
              <select
                id="stripCount"
                value={stripCount}
                onChange={handleStripCountChange}
                disabled={isCapturing}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>

            <button
              className="capture-btn"
              onClick={startPhotoSequence}
              disabled={isCapturing}
            >
              📸 {isCapturing ? `(${currentPictureIndex + 1}/${stripCount})` : ''}
            </button>
          </div>
        </div>
      )}

      {showResult && (
        <div className="studio-result slide-in-top">
          <div
            className={`photostrip-frame ${showResult ? "strip-slide-in" : ""}`}
            id="photostrip-canvas-source"
            style={{ gridTemplateColumns: `repeat(${stripCount}, 1fr)` }} {/* Dynamic grid for results */}
          >
            {photos.map((photo, idx) => (
              <div className="strip-photo-wrapper" key={idx}>
                <img
                  src={photo.src}
                  alt={`snap-${idx}`}
                  className={`strip-photo-img ${getFilterClass(photo.filter)}`}
                />
              </div>
            ))}
             {/* Add placeholders for missing photos if any */}
             {photos.length < stripCount && Array.from({ length: stripCount - photos.length }).map((_, idx) => (
                <div key={`placeholder-${idx}`} className="strip-photo-wrapper placeholder">
                    {/* You can add a placeholder image or text here */}
                    <div className="placeholder-text"></div>
                </div>
            ))}
            <p className="photostrip-caption">
              dvBooth •{" "}
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="result-controls">
            <button onClick={handleReshoot} className="reshoot">
              Reshoot
            </button>
            <button onClick={handleDownload} className="download">
              Download Strip
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PhotoStudio;
