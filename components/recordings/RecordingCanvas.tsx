import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Particles } from "lib/particles";
import useAnimationFrame from "lib/hooks/useAnimationFrame";
import { Recording } from "lib/data/types";
import { getKeyFalloff, isBlackKey, semitoneToHue } from "lib/utils";

interface Note {
    pitch: number;
    velocity: number;
    onTime: number;
    offTime?: number;
}

const RecordingCanvas = ({
    recording,
    width,
    height,
    playbackTime,
    displayDuration,
    onClick,
}: {
    recording: Recording;
    width: number;
    height: number;
    playbackTime?: number;
    displayDuration?: number;
    onClick?: () => void;
}): JSX.Element => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [notes, setNotes] = useState<Note[]>([]);
    const [duration, setDuration] = useState(1);

    const getNoteX = useCallback(
        (pitch: number) => {
            return width * ((pitch - 20.5) / 89) + (width / 88) * 0.5;
        },
        [width]
    );

    const particles = useMemo(() => {
        return new Particles({
            noiseStrength: 30,
            startSize: 2,
            noiseSpeed: 0.1,
            noiseScale: 0.005,
            maxParticles: 5000,
            lifetime: 4,
            attractors: [],
            globalForce: { x: 0, y: 5 },
        });
    }, []);

    useEffect(() => {
        const notes: Note[] = [];
        let activeNotes: Note[] = [];
        let lastTime = 0;
        recording.messages.forEach(message => {
            if (message.type == "noteOn") {
                const currentNote = activeNotes.find(note => note.pitch === message.pitch);
                if (currentNote) {
                    //uh oh there was already a note playing! Set its off time to now, add it to the list, and remove it
                    console.error("Found a note on where a note was already playing...");
                    currentNote.offTime = message.time;
                    notes.push(currentNote);
                    activeNotes = activeNotes.filter(n => n.pitch !== message.pitch);
                }
                activeNotes.push({
                    pitch: message.pitch,
                    velocity: message.velocity,
                    onTime: message.time,
                });
            } else if (message.type === "noteOff") {
                const currentNote = activeNotes.find(note => note.pitch === message.pitch);
                if (!currentNote) {
                    //uh oh where's the start note!?
                    console.error("Found a note off where there was no note already playing...");
                } else {
                    currentNote.offTime = message.time;
                    notes.push(currentNote);
                    activeNotes = activeNotes.filter(n => n.pitch !== message.pitch);
                }
            }
            lastTime = message.time;
        });

        //add the stragglers, if there are any
        activeNotes.forEach(note => {
            note.offTime = lastTime;
            notes.push(note);
        });

        setNotes(notes);
        setDuration(lastTime);
    }, [recording]);

    useAnimationFrame(
        ({ time, delta }) => {
            if (!canvasRef.current) return;
            const ctx = canvasRef.current.getContext("2d");
            if (!ctx) return;

            const noteWidth = width / 88;

            const getTimeY = (time: number) =>
                height -
                20 -
                (height - 20) * ((time - (playbackTime || 0)) / (displayDuration || duration));

            ctx.clearRect(0, 0, width, height);

            const playingNotes: {
                active: boolean;
                time: number;
                velocity: number;
                progress: number;
            }[] = [];
            for (let i = 0; i < 128; i++)
                playingNotes.push({ active: false, time: 0, velocity: 0, progress: 0 });

            for (let i = 21; i <= 109; i++) {
                if (isBlackKey(i)) continue;

                const x = getNoteX(i);
                ctx.fillStyle = "rgba(255,255,255,0.0075)";
                ctx.fillRect(x, 0, noteWidth, height);

                if (i % 12 !== 0 && i % 12 !== 5) continue;
                ctx.strokeStyle = "rgba(255, 255, 255, 0.01)";
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, width, height);

            notes.forEach(note => {
                const x = getNoteX(note.pitch);
                const y1 = getTimeY(note.onTime);
                const y2 = getTimeY(note.offTime || note.onTime);
                let l = 50;
                let s = 50 + note.velocity / 2.54;
                const notePlaying =
                    playbackTime &&
                    playbackTime > note.onTime &&
                    playbackTime < (note.offTime || 0);
                const noteProgress = !notePlaying
                    ? 0
                    : (playbackTime - note.onTime) / ((note.offTime || 0) - note.onTime);
                if (notePlaying) {
                    playingNotes[note.pitch] = {
                        active: true,
                        time: playbackTime - note.onTime,
                        velocity: note.velocity,
                        progress: noteProgress,
                    };
                    l = 90 - 40 * Math.min(1, playingNotes[note.pitch].time * 2);
                    s = 100;
                }

                // const gradient = ctx.createLinearGradient(x, y1, x + noteWidth, y2);
                // gradient.addColorStop(0, `hsla(${semitoneToHue(note.pitch % 12)}, ${s}%, ${l}%, 1)`);
                // gradient.addColorStop(0.5, `hsla(${semitoneToHue(note.pitch % 12)}, ${s}%, ${l}%, 0.5)`);
                // gradient.addColorStop(1, `hsla(${semitoneToHue(note.pitch % 12)}, ${s}%, ${l}%, 0)`);
                // ctx.fillStyle = gradient;
                // ctx.fillRect(x, y1, noteWidth, y2 - y1);

                // return;

                ctx.fillStyle = `hsl(${semitoneToHue(note.pitch % 12)}, ${s}%, ${l}%)`;
                if (note.offTime && note.offTime - note.onTime > (displayDuration || 0) / 50) {
                    const y3 = getTimeY(note.onTime + (displayDuration || 0) / 100);
                    //ctx.fillRect(x, y1, noteWidth, y3 - y1);

                    ctx.beginPath();
                    ctx.moveTo(x + noteWidth, y3);
                    ctx.lineTo(x + noteWidth, y1);
                    ctx.lineTo(x, y1);
                    ctx.lineTo(x, y3);
                    //ctx.moveTo(x, y3);
                    ctx.lineTo(x + noteWidth, y3);
                    ctx.quadraticCurveTo(
                        x + noteWidth * 0.5,
                        y3 + (y2 - y3) * 0.5,
                        x + noteWidth * 0.5,
                        y2
                    );
                    ctx.quadraticCurveTo(x + noteWidth * 0.5, y3 + (y2 - y3) * 0.5, x, y3);
                    ctx.fill();
                } else {
                    ctx.fillRect(x, y1, noteWidth, y2 - y1);
                }
                //ctx.fillRect(x, y1, noteWidth, y2 - y1);
            });

            for (let i = 21; i <= 109; i++) {
                const x = getNoteX(i);
                let hue = semitoneToHue(i % 12);

                const isBlack = isBlackKey(i);

                let playingNoteDistance = -1;
                if (!playingNotes[i].active) {
                    for (let j = 1; j < 5; j++) {
                        const offsetIndexUp = i + j;
                        const offsetIndexDn = i - j;
                        if (offsetIndexDn >= 21) {
                            if (playingNotes[offsetIndexDn].active) {
                                playingNoteDistance =
                                    playingNoteDistance < 0 ? j : Math.min(playingNoteDistance, j);
                                if (playingNoteDistance === j) {
                                    hue = semitoneToHue(offsetIndexDn % 12);
                                }
                            }
                        }
                        if (offsetIndexUp <= 109) {
                            if (playingNotes[offsetIndexUp].active) {
                                playingNoteDistance =
                                    playingNoteDistance < 0 ? j : Math.min(playingNoteDistance, j);
                                if (playingNoteDistance === j) {
                                    hue = semitoneToHue(offsetIndexUp % 12);
                                }
                            }
                        }
                    }
                }
                const alpha =
                    Math.pow(
                        (playingNoteDistance === -1 ? 0 : 1 - playingNoteDistance / 4) * 0.5,
                        2
                    ) + 0.05;

                if (isBlack) {
                    ctx.fillStyle = playingNotes[i].active
                        ? `hsl(${hue}, 100%, 50%)`
                        : `hsl(${hue}, ${playingNoteDistance >= 0 ? "100%" : "0%"}, ${Math.round(
                              15 * alpha
                          )}%)`;
                    ctx.fillRect(x, height - 20, noteWidth, 20);
                } else {
                    if (playingNotes[i].active) {
                        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                        ctx.fillRect(x, height - 20, noteWidth, 20);
                    } else {
                        ctx.fillStyle = `hsl(${hue}, ${
                            playingNoteDistance >= 0 ? "100%" : "0%"
                        }, ${Math.round(100 * alpha)}%)`;
                        ctx.fillRect(x, height - 20, noteWidth - 1, 20);
                        ctx.strokeStyle = "#111";
                        ctx.strokeRect(x, height - 20, noteWidth, 20);
                    }
                }

                if (!playingNotes[i].active) {
                    continue;
                }
                const playingValue =
                    1 - getKeyFalloff(i, playingNotes[i].velocity, playingNotes[i].time);
                //const playingValue = Math.max(playingNotes[i].time, playingNotes[i].progress);
                const gradient = ctx.createLinearGradient(x, height - 140, x, height - 20);
                gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, ${1.0 - playingValue})`);
                gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(x, height - 140, noteWidth, 120);

                const particleAttemptCount = 5;
                for (let j = 0; j < particleAttemptCount; j++) {
                    if (Math.random() > playingValue) {
                        particles.emit(
                            { x: x + noteWidth * Math.random(), y: height - 20 },
                            { x: 5 * (-0.5 + Math.random()), y: -80 * Math.random() },
                            `hsla(${hue}, 100%, 50%, 0.5)`
                        );
                    }
                }
            }

            particles.update(time, delta);
            particles.draw(ctx);

            //proper key widths - but needs to be replicated for the actual notes...
            // ctx.fillStyle = "#FFF";
            // ctx.fillRect(0, height - 20, width, 20);
            // let xPos = noteWidth * 0.5;
            // let lastWasBlack = false;
            // for(let i = 21; i <= 109; i++) {
            //     const isBlack = isBlackKey(i);
            //     if(isBlack) {
            //         ctx.fillStyle ="#111";
            //         ctx.fillRect(xPos + noteWidth / 6, height - 20, noteWidth / 1.5, 10);
            //         lastWasBlack = true;
            //     } else {
            //         if(!lastWasBlack) xPos += noteWidth * 0.5;
            //         ctx.strokeStyle = "#111";
            //         ctx.strokeRect(xPos, height - 20, noteWidth, 20);
            //         lastWasBlack = false;
            //     }
            //     xPos += noteWidth * 0.5;
            // }

            // if(playbackTime) {
            //     ctx.strokeStyle = "#FFF";
            //     ctx.beginPath();
            //     const y = getTimeY(playbackTime);
            //     ctx.moveTo(0, y);
            //     ctx.lineTo(width, y);
            //     ctx.stroke();
            // }
        },
        [
            canvasRef,
            notes,
            duration,
            width,
            height,
            playbackTime,
            displayDuration,
            particles,
            getNoteX,
        ]
    );

    /*
    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        const noteWidth = width / 88;
        
        const getTimeY = (time: number) =>
            height -
            20 -
            (height - 20) * ((time - (playbackTime || 0)) / (displayDuration || duration));

        ctx.clearRect(0, 0, width, height);

        const playingNotes: { active: boolean; time: number; progress: number }[] = [];
        for (let i = 0; i < 128; i++) playingNotes.push({ active: false, time: 0, progress: 0 });

        for (let i = 21; i <= 109; i++) {
            if (isBlackKey(i)) continue;

            const x = getNoteX(i);
            ctx.fillStyle = "rgba(255,255,255,0.0075)";
            ctx.fillRect(x, 0, noteWidth, height);

            if (i % 12 !== 0 && i % 12 !== 5) continue;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.01)";
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        notes.forEach(note => {
            const x = getNoteX(note.pitch);
            const y1 = getTimeY(note.onTime);
            const y2 = getTimeY(note.offTime || note.onTime);
            let l = 50;
            let s = 50 + note.velocity / 2.54;
            const notePlaying =
                playbackTime && playbackTime > note.onTime && playbackTime < (note.offTime || 0);
            const noteProgress = !notePlaying
                ? 0
                : (playbackTime - note.onTime) / ((note.offTime || 0) - note.onTime);
            if (notePlaying) {
                playingNotes[note.pitch] = {
                    active: true,
                    time: playbackTime - note.onTime,
                    progress: noteProgress,
                };
                l = 90 - 40 * Math.min(1, playingNotes[note.pitch].time * 2);
                s = 100;
            }
            ctx.fillStyle = `hsl(${semitoneToHue(note.pitch % 12)}, ${s}%, ${l}%)`;
            if (note.offTime && note.offTime - note.onTime > (displayDuration || 0) / 50) {
                const y3 = getTimeY(note.onTime + (displayDuration || 0) / 100);
                ctx.fillRect(x, y1, noteWidth, y3 - y1 - 1);

                ctx.beginPath();
                ctx.moveTo(x, y3);
                ctx.lineTo(x + noteWidth, y3);
                ctx.quadraticCurveTo(
                    x + noteWidth * 0.5,
                    y3 + (y2 - y3) * 0.5,
                    x + noteWidth * 0.5,
                    y2
                );
                ctx.quadraticCurveTo(x + noteWidth * 0.5, y3 + (y2 - y3) * 0.5, x, y3);
                ctx.fill();
            } else {
                ctx.fillRect(x, y1, noteWidth, y2 - y1);
            }
            //ctx.fillRect(x, y1, noteWidth, y2 - y1);
        });

        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, height - 20, width, 20);
        for (let i = 21; i <= 109; i++) {
            const x = getNoteX(i);
            const hue = semitoneToHue(i % 12);
            const playingValue = Math.max(playingNotes[i].time, playingNotes[i].progress);

            const isBlack = isBlackKey(i);
            if (isBlack) {
                ctx.fillStyle = playingNotes[i].active ? `hsl(${hue}, 100%, 50%)` : "#111";
                ctx.fillRect(x, height - 20, noteWidth, 20);
            } else {
                if (playingNotes[i].active) {
                    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                    ctx.fillRect(x, height - 20, noteWidth, 20);
                } else {
                    ctx.strokeStyle = "#111";
                    ctx.strokeRect(x, height - 20, noteWidth, 20);
                }
            }

            if (!playingNotes[i].active) continue;
            const gradient = ctx.createLinearGradient(x, height - 140, x, height - 20);
            gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, ${1.0 - playingValue})`);
            gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - 140, noteWidth, 120);
        }

        //proper key widths - but needs to be replicated for the actual notes...
        // ctx.fillStyle = "#FFF";
        // ctx.fillRect(0, height - 20, width, 20);
        // let xPos = noteWidth * 0.5;
        // let lastWasBlack = false;
        // for(let i = 21; i <= 109; i++) {
        //     const isBlack = isBlackKey(i);
        //     if(isBlack) {
        //         ctx.fillStyle ="#111";
        //         ctx.fillRect(xPos + noteWidth / 6, height - 20, noteWidth / 1.5, 10);
        //         lastWasBlack = true;
        //     } else {
        //         if(!lastWasBlack) xPos += noteWidth * 0.5;
        //         ctx.strokeStyle = "#111";
        //         ctx.strokeRect(xPos, height - 20, noteWidth, 20);
        //         lastWasBlack = false;
        //     }
        //     xPos += noteWidth * 0.5;
        // }

        // if(playbackTime) {
        //     ctx.strokeStyle = "#FFF";
        //     ctx.beginPath();
        //     const y = getTimeY(playbackTime);
        //     ctx.moveTo(0, y);
        //     ctx.lineTo(width, y);
        //     ctx.stroke();
        // }
    }, [canvasRef, notes, duration, width, height, playbackTime, displayDuration]);
    */

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onClick={onClick}
            className="absolute left-0 top-0 w-full h-full"
        />
    );
};

export default RecordingCanvas;
