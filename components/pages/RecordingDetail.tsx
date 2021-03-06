import { useState, useEffect, useRef } from "react";

import { FaInfoCircle } from "react-icons/fa";

import FullscreenLayout from "../layout/FullscreenLayout";
import RecordingCanvas from "../recordings/RecordingCanvas";
import RecordingTitle from "../recordings/RecordingTitle";

import StarToggle from "../recordings/StarToggle";
import { Recording } from "../../lib/data/types";
import RecordingInfoPanel from "../recordings/RecordingInfoPanel";
import RecordingPlayer from "../recordings/RecordingPlayer";

import style from "./RecordingDetail.module.scss";

const RecordingTile = ({ recording }: { recording: Recording }): JSX.Element => {
    const parentRef = useRef<HTMLDivElement>();
    const playbackBarRef = useRef<HTMLDivElement>();

    const [playing, setPlaying] = useState(false);
    const [paused, setPaused] = useState(false);
    const [firstPlay, setFirstPlay] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [canvasWidth, setCanvasWidth] = useState(800);
    const [canvasHeight, setCanvasHeight] = useState(800);
    const [showingInfoPanel, setShowingInfoPanel] = useState(false);
    const [displayDuration, setDisplayDuration] = useState(10);

    const [activeElement, setActiveElement] = useState(null);
    useEffect(() => {
        const handleFocusIn = () => {
            if (!document) {
                setActiveElement(null);
                return;
            }
            switch (document.activeElement.tagName) {
                case "INPUT":
                    setActiveElement(document.activeElement);
                    break;
                case "TEXTAREA":
                    setActiveElement(document.activeElement);
                    break;
                case "SELECT":
                    setActiveElement(document.activeElement);
                    break;
            }
        };
        const handleFocusOut = () => {
            if (!document) {
                setActiveElement(null);
                return;
            }
            console.log("active is null");
            setActiveElement(null);
        };

        document.addEventListener("focusin", handleFocusIn);
        document.addEventListener("focusout", handleFocusOut);
        return () => {
            document.removeEventListener("focusin", handleFocusIn);
            document.removeEventListener("focusout", handleFocusOut);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (!parentRef.current) return;
            setCanvasWidth(parentRef.current.offsetWidth);
            setCanvasHeight(parentRef.current.offsetHeight);
        };

        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [parentRef]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (activeElement) return;

            if (e.key === " ") {
                if (!playing) {
                    setPlaying(true);
                    setFirstPlay(true);
                } else setPaused(!paused);
            } else if (e.key === "r") {
                if (playing) {
                    setPlaying(false);
                    setPaused(false);
                }
            } else if (e.key === "-" && displayDuration < recording.duration) {
                setDisplayDuration(displayDuration * 1.5);
            } else if (e.key === "+" && displayDuration > 5) {
                setDisplayDuration(displayDuration / 1.5);
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [playing, paused, activeElement, displayDuration, recording.duration]);

    useEffect(() => {
        if (!playbackBarRef.current) return;

        if (!playing || playbackTime === 0) playbackBarRef.current.style.setProperty("width", "0%");
        else
            playbackBarRef.current.style.setProperty(
                "width",
                (100 * playbackTime) / recording.duration + "%"
            );
    }, [playing, playbackTime, playbackBarRef]);

    const handlePlaybackTimeChanged = (playbackTime: number) => {
        setPlaybackTime(playbackTime);
        //three extra seconds for effect
        if (playbackTime >= recording.duration + 3) setPlaying(false);
    };

    return (
        <FullscreenLayout>
            <div className={style.recording} ref={parentRef}>
                <div className={style.playbackBar} ref={playbackBarRef}></div>

                <RecordingCanvas
                    recording={recording}
                    width={canvasWidth}
                    height={canvasHeight}
                    playbackTime={playbackTime}
                    displayDuration={Math.min(displayDuration, recording.duration)}
                />
                <RecordingPlayer
                    recording={recording}
                    playing={playing}
                    paused={paused}
                    onPlaybackTimeChanged={handlePlaybackTimeChanged}
                />

                <div className={style.firstPlay} style={firstPlay ? { opacity: 0 } : null}>
                    <p>Press space to play and stop</p>
                </div>

                <RecordingTitle
                    recording={recording}
                    className={`${style.title} ${playing ? style.playingTitle : null}`}
                />
                <StarToggle className={style.starButton} recording={recording} />
                <button className={style.infoButton} onClick={() => setShowingInfoPanel(true)}>
                    <FaInfoCircle />
                </button>
                <RecordingInfoPanel
                    recording={recording}
                    showing={showingInfoPanel}
                    onCloseClicked={() => setShowingInfoPanel(false)}
                />
            </div>
        </FullscreenLayout>
    );
};

export default RecordingTile;
