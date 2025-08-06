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
  const [stripCount, setStripCount] = useState(3); // State for number of pictures per strip (default 3)
  const [currentPictureIndex, setCurrentPictureIndex] = useState(0); // Track current picture in sequence

  // Helper function for delays in async operations
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  // Function to get CSS class based on selected filter
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

  // Function to capture a single image with the selected filter
  const takePhoto = useCallback(async () => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState < 2) return; // Ensure webcam is ready

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    let cssFilter = "none"; // Default filter
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
        cssFilter = "none";
        break;
    }

    ctx.filter = cssFilter; // Apply CSS filter to canvas context
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // Draw video frame to canvas

    const filteredImg = canvas.toDataURL("image/jpeg"); // Get image data URL
    setPhotos((prev) => [
      ...prev,
      { src: filteredImg, filter: selectedFilter }, // Store image and its applied filter
    ]);
  }, [selectedFilter]); // Re-create if selectedFilter changes

  // Handles each step of the countdown (3.., 2.., 1.., Smile!)
  const countdownStep = async (value) => {
    setCountdown(value);
    await new Promise((r) => requestAnimationFrame(r)); // Ensure UI updates before delay
    await delay(1000); // Pause for 1 second
  };

  // Starts the entire photo-taking sequence
  const startPhotoSequence = async () => {
    setIsCapturing(true); // Set capturing state to true
    setPhotos([]); // Clear any previously captured photos
    setCurrentPictureIndex(0); // Reset picture index for the new sequence
    setShowResult(false); // Hide results view

    // Loop to take photos based on the selected stripCount
    for (let i = 0; i < stripCount; i++) {
      setCurrentPictureIndex(i); // Update current picture index for UI display
      await countdownStep("3..");
      await countdownStep("2..");
      await countdownStep("1..");
      await countdownStep("Smile!");
      await takePhoto(); // Capture the photo
      setCountdown(null); // Clear countdown display
      await delay(500); // Short delay before next photo in sequence
    }

    setIsCapturing(false); // Set capturing state to false
    setShowResult(true); // Show the results view
  };

  // Handles reshooting the photo strip
  const handleReshoot = () => {
    setPhotos([]); // Clear photos
    setShowResult(false); // Hide results
    setCurrentPictureIndex(0); // Reset index
  };

  // Handles downloading the generated photo strip
  const handleDownload = async () => {
    const frame = document.getElementById("photostrip-canvas-source");
    if (!frame) return; // Ensure the element exists

    // Use html2canvas to capture the entire photo strip div
    const canvas = await html2canvas(frame, { useCORS: true });
    const dataURL = canvas.toDataURL("image/jpeg"); // Get image data URL

    // Create a temporary link element to trigger download
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "dvBooth-strip.jpg"; // Set download filename
    document.body.appendChild(link); // Append to body (required for click)
    link.click(); // Simulate click to download
    document.body.removeChild(link); // Clean up the link element
  };

  // Handles changes from the "Pictures per strip" dropdown
  const handleStripCountChange = (event) => {
    setStripCount(Number(event.target.value)); // Update stripCount state
  };

  // Framer Motion animation variants for sliding in the studio
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
      {!showResult && ( // Show studio view if results are not being shown
        <div className="studio-container">
          <div className="studio-webcam-container">
            {countdown && <div className="countdown-overlay">{countdown}</div>} {/* Countdown display */}

            <div className={`studio-webcam ${getFilterClass(selectedFilter)}`}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="webcam-view"
              />
            </div>
          </div>

          <div className="controls-section"> {/* Wrapper for all controls */}
            <div className="filter-bar">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`filter-btn ${
                    selectedFilter === filter ? "active" : ""
                  }`}
                  disabled={isCapturing} // Disable filter selection during capture
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
                disabled={isCapturing} // Disable selection during capture
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>

            <button
              className="capture-btn"
              onClick={startPhotoSequence}
              disabled={isCapturing} // Disable button during capture
            >
              📸 {isCapturing ? `(${currentPictureIndex + 1}/${stripCount})` : ''} {/* Show capture progress */}
            </button>
          </div>
        </div>
      )}

      {showResult && ( // Show results view if results are available
        <div className="studio-result slide-in-top">
          <div
            className={`photostrip-frame ${showResult ? "strip-slide-in" : ""}`}
            id="photostrip-canvas-source"
            // Dynamically set grid columns based on stripCount for the generated strip
            style={{ gridTemplateColumns: `repeat(${stripCount}, 1fr)` }}
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
             {/* Add placeholders for missing photos if the strip isn't full (e.g., if cancelled mid-capture) */}
             {photos.length < stripCount && Array.from({ length: stripCount - photos.length }).map((_, idx) => (
                <div key={`placeholder-${idx}`} className="strip-photo-wrapper placeholder">
                    <div className="placeholder-text"></div> {/* Placeholder content */}
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
