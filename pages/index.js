import React, { useCallback, useState, useRef, useEffect } from "react";
import Script from "next/script";
import Head from 'next/head';
import EventEmitter from "events";
import WaveformPlaylist from "waveform-playlist";

export default function Home() {
  const [ee] = useState(new EventEmitter());
  const playlistRef = useRef(null);
  const containerRef = useRef(null);
  const timelineRef = useRef(null); // Restore timelineRef
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [blobUrls, setBlobUrls] = useState([]); // To keep track of blob URLs for revocation
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 }); // State for progress
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true); // State for auto-scroll checkbox
  const [currentTime, setCurrentTime] = useState(0); // State for current playback time

  // Removed zoom related state and constants
  // const zoomLevels = [500, 1000, 3000, 5000, 15000];
  // const initialZoomIndex = 2;
  // const [currentZoomIndex, setCurrentZoomIndex] = useState(initialZoomIndex);

  // Function to revoke previously created blob URLs
  const revokePreviousBlobUrls = useCallback(() => {
    blobUrls.forEach((url) => URL.revokeObjectURL(url));
    setBlobUrls([]);
  }, [blobUrls]); // Dependency on blobUrls

  // Store the setup an effect chain.
  const setupEffects = useRef(null);

  useEffect(() => {
    // Ensure WaveformPlaylist is loaded and container is available
    if (WaveformPlaylist && containerRef.current && timelineRef.current && !playlistRef.current) {
      const playlist = WaveformPlaylist(
        {
          samplesPerPixel: 3000,
          waveHeight: 100,
          container: containerRef.current, // Container for tracks
          timescaleContainer: timelineRef.current, // Restore separate container for the timescale
          timescale: true,
          state: "cursor",
          isAutomaticScroll: true, // Set initial state via option
          exclSolo: true, // Enable exclusive solo
          colors: {
            waveOutlineColor: "#005BBB", // Keep or remove outline? Let's keep for now.
            timeColor: "grey",
            fadeColor: "black",
            waveColor: 'grey', // Color for unplayed part
            progressColor: 'orange', // Color for played part
          },
          controls: {
            show: true,
            width: 200,
          },
          zoomLevels: [500, 1000, 3000, 5000], // Provide zoomLevels including the samplesPerPixel value
          ac: WaveformPlaylist.ac, // Use the AudioContext from the library
        },
        ee
      );

      playlistRef.current = playlist; // Store playlist instance

      // Removed exporter initialization
      // playlist.initExporter();

      // Removed rendering event listeners
      // ee.on("audiorenderingstarting", function (offlineCtx, setup) {
      //   console.log("Audio rendering starting", offlineCtx, setup);
      // });
      //
      // ee.on("audiorenderingfinished", function (type, data) {
      //   console.log("Audio rendering finished", type);
      //   if (type === "wav") {
      //     saveAs(data, "rendered_playlist.wav");
      //   }
      // });

      console.log("Playlist initialized, waiting for file upload.");

      // --- Event Listener for Time Update ---
      const handleTimeUpdate = (time) => {
        // console.log("Time update event received:", time); // Log received time - Removed
        setCurrentTime(time);
      };
      ee.on('timeupdate', handleTimeUpdate); // Correct event name: timeupdate
      // console.log("Attached timeupdate listener."); // Log listener attachment - Removed

    }

    // Cleanup function
    return () => {
      revokePreviousBlobUrls(); // Revoke URLs on component unmount
      if (playlistRef.current) {
        // playlistRef.current.clear(); // Maybe clear is needed? Check library docs if issues arise
      }
      // --- Remove Time Update Listener ---
      ee.off('timeupdate', handleTimeUpdate); // Correct event name: timeupdate
      // console.log("Removed timeupdate listener."); // Log listener removal - Removed
      // ee.removeAllListeners(); // Commented out to ensure specific listener removal works
    };
  // Run only once on mount, revoke function has its own dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ee]);

  // --- File Input Handler ---
  const handleFileChange = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !playlistRef.current) {
      return;
    }

    revokePreviousBlobUrls(); // Clean up old URLs first
    setIsPlayerReady(false); // Player is not ready while loading
    setIsLoading(true); // Start loading indicator
    setLoadingProgress({ current: 0, total: files.length }); // Initialize progress

    const currentPlaylist = playlistRef.current;
    currentPlaylist.clear(); // Clear existing tracks before loading new ones

    const newTracks = [];
    const newBlobUrls = [];

    Array.from(files).forEach((file) => {
      const blobUrl = URL.createObjectURL(file);
      newBlobUrls.push(blobUrl);
      newTracks.push({
        src: blobUrl,
        name: file.name,
        // You might want custom controls or states per track here
      });
    });

    setBlobUrls(newBlobUrls); // Store new URLs for future revocation

    // Load tracks sequentially to show progress
    if (newTracks.length > 0) {
      try {
        for (let i = 0; i < newTracks.length; i++) {
          const trackDef = newTracks[i];
          console.log(`Loading track ${i + 1} of ${newTracks.length}: ${trackDef.name}`);
          await currentPlaylist.load([trackDef]); // Load one track at a time
          setLoadingProgress({ current: i + 1, total: newTracks.length }); // Update progress state
        }
        console.log("All tracks loaded successfully!");
        // Removed automatic zoom out logic
        // const maxIndex = zoomLevels.length - 1;
        // const zoomOutTimes = maxIndex - initialZoomIndex;
        // console.log(`Auto Zooming Out by emitting 'zoomout' ${zoomOutTimes} times.`);
        // for (let k = 0; k < zoomOutTimes; k++) {
        //     ee.emit('zoomout');
        // }
        // setCurrentZoomIndex(maxIndex);

        setIsPlayerReady(true);
      } catch (error) {
        console.error("Error loading tracks sequentially:", error);
        revokePreviousBlobUrls(); // Clean up blobs on error
        // Optionally, display an error message to the user here
      } finally {
        setIsLoading(false); // Stop loading indicator regardless of success/error
        setLoadingProgress({ current: 0, total: 0 }); // Reset progress state
      }
    }

    // Reset file input to allow selecting the same file again
    event.target.value = null;
  }, [playlistRef, revokePreviousBlobUrls]); // Include dependencies

  // --- UI Event Handlers ---
  const handlePlay = () => ee.emit("play");
  const handlePause = () => ee.emit("pause");
  const handleStop = () => ee.emit("stop");
  const handleRewind = () => ee.emit("rewind");
  const handleFastForward = () => ee.emit("fastforward");
  // const handleRecord = () => ee.emit("record"); // Recording needs separate setup
  const handleMasterVolumeChange = (event) => {
    // No need to check isPlayerReady here, mastervolumechange might work without tracks
    ee.emit("mastervolumechange", event.target.value);
  };

  // --- Auto Scroll Handler ---
  const handleAutoScrollChange = (event) => {
    const checked = event.target.checked;
    setIsAutoScrollEnabled(checked);
    console.log("Emitting automaticscroll event:", checked);
    ee.emit('automaticscroll', checked);
  };

  // Removed Zoom Handlers
  // const handleZoomIn = () => {
  //   const newIndex = Math.max(0, currentZoomIndex - 1);
  //   if (newIndex !== currentZoomIndex) {
  //     console.log("Emitting zoomin event");
  //     setCurrentZoomIndex(newIndex);
  //     ee.emit('zoomin');
  //   }
  // };
  //
  // const handleZoomOut = () => {
  //   const newIndex = Math.min(zoomLevels.length - 1, currentZoomIndex + 1);
  //   if (newIndex !== currentZoomIndex) {
  //     console.log("Emitting zoomout event");
  //     setCurrentZoomIndex(newIndex);
  //     ee.emit('zoomout');
  //   }
  // };

  // --- Format Time Function ---
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds * 1000) % 1000);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(secs).padStart(2, '0');
    const formattedMillis = String(millis).padStart(3, '0');

    return `${formattedMinutes}:${formattedSeconds}:${formattedMillis}`;
  };

  return (
    <>
      <Head>
        <title>✟Heart of Worship✟</title>
      </Head>
      {/* Removed Tone.js Script tag */}
      {/* <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.37/Tone.js"
        onLoad={handleLoad}
      /> */}
      <main>
        <h1>✟Heart of Worship✟</h1>
        {/* File Input */}
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="audio-upload">上傳音訊檔案：</label>
          <input
            type="file"
            id="audio-upload"
            multiple
            accept="audio/*"
            onChange={handleFileChange}
            disabled={isLoading} // Disable input while loading
          />
          {/* Loading Indicator */}
          {isLoading && (
            <div style={{ marginTop: '10px' }}>
              <div>Loading track {loadingProgress.current} of {loadingProgress.total}...</div>
              <progress value={loadingProgress.current} max={loadingProgress.total} style={{ width: '100%' }} />
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
          <button onClick={handlePause} disabled={!isPlayerReady} title="Pause"><i className="fas fa-pause"></i> 暫停</button>
          <button onClick={handlePlay} disabled={!isPlayerReady} title="Play"><i className="fas fa-play"></i> 播放</button>
          <button onClick={handleStop} disabled={!isPlayerReady} title="Stop"><i className="fas fa-stop"></i> 停止</button>
          <button onClick={handleRewind} disabled={!isPlayerReady} title="Rewind"><i className="fas fa-fast-backward"></i> 倒轉</button>
          <button onClick={handleFastForward} disabled={!isPlayerReady} title="Fast Forward"><i className="fas fa-fast-forward"></i> 快進</button>
          {/* Timer Display */}
          <div style={{ marginLeft: '20px', fontFamily: 'monospace', fontSize: '1.2em' }}>
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Playlist Container & Timeline (Restored Separation) */}
        <div ref={timelineRef} id="playlist-timeline" style={{ height: '20px' /* Adjust height as needed */ }}></div>
        <div ref={containerRef} id="playlist-container"></div>

        {/* Master Volume and Automatic Scroll */}
        <div style={{ marginTop: '10px' }}>
           <label htmlFor="master-gain">主音量：</label>
           <input
             type="range"
             id="master-gain"
             min="0"
             max="100"
             defaultValue="100" // Use defaultValue for uncontrolled or manage state for controlled
             onChange={handleMasterVolumeChange}
            // No need to disable volume slider based on isPlayerReady
             className="master-gain" // Keep class for potential styling
           />
           {/* Automatic Scroll Checkbox */}
           <div style={{ marginLeft: '20px', display: 'inline-block' }}>
             <input
               // Removed automatic-scroll class
               // className="automatic-scroll"
               type="checkbox"
               id="automatic_scroll"
               checked={isAutoScrollEnabled} // Controlled by React state
               onChange={handleAutoScrollChange} // Use new handler that emits event
             />
             <label htmlFor="automatic_scroll" style={{ marginLeft: '5px' }}>
               自動捲動
             </label>
           </div>
         </div>
      </main>
       {/* Add FontAwesome if needed - requires setup in Next.js (_app.js or _document.js) */}
       <Script src="https://kit.fontawesome.com/ef69927139.js" crossorigin="anonymous" strategy="lazyOnload"></Script>

      {/* Add custom styles for waveform background */}
      <style jsx global>{`
        /* Target the container where waveforms are rendered */
        /* You might need to inspect the actual generated HTML to find the correct selector */
        #playlist-container .waveform > div {
           background-color: rgba(0, 0, 139, 0.2) !important; /* Dark blue with 80% transparency */
        }
      `}</style>

      {/* Add styles for the main container */}
      <style jsx>{`
        main {
          width: 90%;
          margin: 20px auto; /* Add some top/bottom margin too */
        }
      `}</style>

      {/* Add styles for active Solo button */}
      <style jsx global>{`
        /* Target the active solo button within the controls */
        /* You might need to inspect the actual generated HTML to find the correct selector */
        /* Assuming the button has btn-solo class and active class */
        .playlist .controls .btn-solo.active {
          background-color: black !important;
          color: white !important;
          border-color: black !important; /* Ensure border matches */
        }
      `}</style>

      {/* Add footer */}
      <footer>
        <hr /> {/* Optional horizontal line */}
        <p style={{ textAlign: 'center', fontSize: '0.9em', color: 'grey' }}>
          Adapted from <a href="https://github.com/naomiaro/waveform-playlist/tree/main" target="_blank" rel="noopener noreferrer">naomiaro/waveform-playlist</a> by <a href="https://github.com/arturiaxnight" target="_blank" rel="noopener noreferrer">Gunpow</a>.
        </p>
        <p style={{ textAlign: 'center', fontSize: '0.9em', color: 'grey' }}>
          Licensed under the MIT License.
        </p>
      </footer>
    </>
  );
}
