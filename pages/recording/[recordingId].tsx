"use client";

import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import axios from "axios";

import { useState, useEffect, useRef } from "react";

import { FaInfoCircle } from "react-icons/fa";
import { Recording } from "lib/data/types";

import FullscreenLayout from "components/layout/FullscreenLayout";
import RecordingCanvas from "components/recordings/RecordingCanvas";
import RecordingTitle from "components/recordings/RecordingTitle";

import StarToggle from "components/recordings/StarToggle";
import RecordingInfoPanel from "components/recordings/RecordingInfoPanel";
import RecordingPlayer from "components/recordings/RecordingPlayer";
import Button from "components/controls/Button";

const RecordingPage = ({ recording }: { recording: Recording }): JSX.Element => {
    const parentRef = useRef<HTMLDivElement>(null);
    const playbackBarRef = useRef<HTMLDivElement>(null);

    const [playing, setPlaying] = useState(false);
    const [paused, setPaused] = useState(false);
    const [firstPlay, setFirstPlay] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [canvasWidth, setCanvasWidth] = useState(800);
    const [canvasHeight, setCanvasHeight] = useState(800);
    const [showingInfoPanel, setShowingInfoPanel] = useState(false);
    const [displayDuration, setDisplayDuration] = useState(10);
    const [open, setOpen] = useState(false);

    const [activeElement, setActiveElement] = useState<Element | null>(null);

    useEffect(() => {
        if (!(navigator as any)?.userActivation) {
            setOpen(false);
        } else {
            setOpen(true);
        }
    }, []);

    useEffect(() => {
        const handleFocusIn = () => {
            if (!document?.activeElement) {
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
                Math.min(100, (100 * playbackTime) / recording.duration) + "%"
            );
    }, [playing, playbackTime, playbackBarRef]);

    const handlePlaybackTimeChanged = (playbackTime: number) => {
        setPlaybackTime(playbackTime);
        //three extra seconds for effect
        if (playbackTime >= recording.duration + 3) setPlaying(false);
    };

    return (
        <FullscreenLayout>
            <div
                className={`flex-grow relative`}
                ref={parentRef}
                onClick={() => {
                    if (!playing) {
                        setPlaying(true);
                        setFirstPlay(true);
                    } else setPaused(!paused);
                }}
            >
                {open && (
                    <RecordingCanvas
                        recording={recording}
                        width={canvasWidth}
                        height={canvasHeight}
                        playbackTime={playbackTime}
                        displayDuration={Math.min(displayDuration, recording.duration)}
                    />
                )}
                {open ? (
                    <RecordingPlayer
                        recording={recording}
                        playing={playing}
                        paused={paused}
                        onPlaybackTimeChanged={handlePlaybackTimeChanged}
                    />
                ) : (
                    <div className="absolute top-0 left-0 w-screen h-screen grid place-items-center">
                        <Button onClick={() => setOpen(true)}>Initialise</Button>
                    </div>
                )}

                <div
                    className={`absolute grid place-items-center text-3xl w-full bg-black bg-opacity-50 ${
                        firstPlay ? "opacity-0" : "opacity-100"
                    }`}
                    style={{
                        top: "calc(40vh - 4rem)",
                        height: "8rem",
                    }}
                >
                    <p>Press space or click to play and stop</p>
                </div>

                <div
                    className={`absolute top-0 h-0.5 bg-white bg-opacity-30`}
                    ref={playbackBarRef}
                />
                <div
                    className="relative flex justify-between p-4 text-4xl h-10"
                    onClick={e => e.stopPropagation()}
                >
                    <StarToggle recording={recording} />
                    <RecordingTitle
                        recording={recording}
                        className={`text-5xl ${playing ? "opacity-0" : "opacity-100"}`}
                    />
                    <button onClick={() => setShowingInfoPanel(cur => !cur)}>
                        <FaInfoCircle />
                    </button>
                </div>
                <RecordingInfoPanel
                    recording={recording}
                    showing={showingInfoPanel}
                    onCloseClicked={() => setShowingInfoPanel(false)}
                />
            </div>
        </FullscreenLayout>
    );
};

export async function getServerSideProps(
    ctx: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{ recording: Recording }>> {
    try {
        const response = await axios(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${ctx.query.recordingId}.json`
        );
        return {
            props: {
                recording: { ...response.data, id: ctx.query.recordingId },
            },
        };
    } catch (error) {
        return {
            notFound: true,
        };
    }
}

export default RecordingPage;
