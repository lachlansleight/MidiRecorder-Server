import { useState, useEffect } from "react";
import Link from "next/link";

import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { FaCheckCircle, FaRegCircle } from "react-icons/fa";

import { RecordingMetadata } from "../../lib/data/types";
import { durationToString, semitoneToHue } from "../../lib/utils";
import StarToggle from "./StarToggle";

dayjs.extend(utc);
dayjs.extend(advancedFormat);
dayjs.extend(timezone);

interface GradientSemitone {
    semitone: number;
    proportion: number;
    hue: number;
}

const RecordingTile = ({
    recording,
    className,
    style,
    selecting,
    selected,
    playbackTime = null,
    onMouseEnter,
    onMouseLeave,
    onSelectChange,
}: {
    recording: RecordingMetadata;
    className?: string;
    style?: React.CSSProperties;
    selecting?: boolean;
    selected?: boolean;
    playbackTime: number | null;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onSelectChange?: (id: string) => void;
}): JSX.Element => {
    const [gradient, setGradient] = useState("");

    useEffect(() => {
        if (!recording) return;

        let weightedSemitones = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let totalWeight = 0;
        recording.pitchCounts.forEach((p, i) => {
            weightedSemitones[i % 12] += p * (1 - i / 127);
            totalWeight += p * (1 - i / 127);
        });
        weightedSemitones = weightedSemitones.map(c => c / totalWeight);
        const newSemitones: GradientSemitone[] = weightedSemitones
            .map((t, index) => {
                return {
                    semitone: index,
                    proportion: t,
                    hue: semitoneToHue(index),
                };
            })
            .filter(t => t.proportion > 0);

        let sortedSemitones = [...newSemitones];
        sortedSemitones.sort((a, b) => a.proportion - b.proportion);
        sortedSemitones = sortedSemitones.reverse().slice(0, 5).reverse();

        const proportionSum = sortedSemitones.reduce((acc, item) => acc + item.proportion, 0);

        // console.log({sortedSemitones, length: sortedSemitones.length, first: sortedSemitones[0], last: sortedSemitones.slice(-1)[0]});
        const mainHue = sortedSemitones.slice(-1)[0]?.hue ?? 0;
        const usefulSemitones = sortedSemitones
            .sort((a, b) => Math.abs(b.hue + 360 - mainHue) - Math.abs(a.hue + 360 - mainHue))
            .map(semi => ({
                ...semi,
                proportion: Math.round((100 * semi.proportion) / proportionSum),
            }));

        let totalProp = 0;
        let minAlpha = recording.averageVelocity - recording.velocitySpread;
        let maxAlpha = recording.averageVelocity + recording.velocitySpread;
        const offset = 40;
        minAlpha += offset;
        maxAlpha += offset;

        const keys = usefulSemitones.map((semi, index) => {
            const alpha = Math.min(
                1,
                Math.max(
                    0,
                    (minAlpha + (index / usefulSemitones.length) * (maxAlpha - minAlpha)) * 0.01
                )
            );
            const key: string =
                index === 0
                    ? `hsla(${semi.hue}, 100%, 30%, ${alpha}) 0%`
                    : `hsla(${semi.hue}, 100%, 30%, ${alpha}) ${totalProp}%`;
            totalProp += usefulSemitones[index].proportion;
            return key;
        });
        setGradient(`linear-gradient(90deg, ${keys.join(", ")})`);
    }, [recording]);

    return (
        <Link href={selecting ? "" : `/recording/${recording.id}`}>
            <a
                className={`select-none cursor-pointer noselect group flex justify-between h-12 rounded relative px-4 border-2 border-white border-opacity-0 hover:border-opacity-50 transition-all text-shadow-md relative ${
                    className ? className : ""
                }`}
                style={{
                    backgroundImage: gradient,
                    backgroundRepeat: "no-repeat",
                    backgroundOrigin: "border-box",
                    ...style,
                }}
                onClick={() => {
                    if (!selecting) return;
                    if (onSelectChange) onSelectChange(recording.id || "");
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <div className="flex flex-col justify-center">
                    <p className="text-sm font-bold">
                        {recording.title ||
                            dayjs(recording.recordedAt)
                                .tz("Australia/Melbourne")
                                .format(
                                    recording.duration > 300
                                        ? "Do MMM YYYY - hA"
                                        : recording.duration > 120
                                        ? "D/MM/YY - HH:mm"
                                        : "D/MM/YY"
                                )}
                    </p>
                    <p className="text-xs">{durationToString(Math.round(recording.duration))}</p>
                </div>
                <div
                    className="text-2xl h-full grid place-items-center"
                    style={{
                        filter: "drop-shadow(3px 3px 2px rgb(0 0 0 / 50%))",
                    }}
                >
                    {selecting ? (
                        selected ? (
                            <FaCheckCircle className={""} />
                        ) : (
                            <FaRegCircle className={""} />
                        )
                    ) : (
                        <StarToggle recording={recording} needsHover={true} />
                    )}
                </div>
                {playbackTime !== null && (
                    <div
                        className="h-full w-1 bg-white bg-opacity-50 absolute top-0"
                        style={{
                            left: (playbackTime / recording.duration) * 100 + "%",
                        }}
                    />
                )}
            </a>
        </Link>
    );
};

export default RecordingTile;
