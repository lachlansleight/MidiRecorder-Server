import { useState, useEffect } from "react";
import Head from "next/head";
import Layout from "../layout/Layout";
import { RecordingMetadata } from "../../lib/data/types";
import firebase from "firebase/app";
import "firebase/database";

import style from "./RecordingBrowser.module.scss";
import RecordingTile from "../recordings/RecordingTile";
import dayjs from "dayjs";
import { FaCheckCircle, FaTimesCircle, FaTrash } from "react-icons/fa";
import axios from "axios";
import useAuth from "lib/auth/useAuth";

interface RecordingGroup {
    name: string;
    recordings: RecordingMetadata[];
}

export const RecordingBrowser = (): JSX.Element => {
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [recordings, setRecordings] = useState<RecordingGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        firebase
            .database()
            .ref("recordingList")
            .on("value", snapshot => {
                //const newRecordingData = {...snapshot.val(), id: snapshot.key};
                const sortedRecordings = Object.keys(snapshot.val())
                    .map(key => ({ ...snapshot.val()[key], id: key }))
                    .sort(
                        (a, b) =>
                            new Date(b.recordedAt).valueOf() - new Date(a.recordedAt).valueOf()
                    );
                const todayRecordings = [];
                const thisWeekRecordings = [];
                const thisMonthRecordings = [];
                const monthRecordings = {};
                const yearRecordings = {};
                sortedRecordings.forEach(recording => {
                    const djs = dayjs(recording.recordedAt);
                    if (djs.format("DD/MM/YYYY") === dayjs().format("DD/MM/YYYY")) {
                        todayRecordings.push(recording);
                        return;
                    }
                    if (dayjs().diff(djs, "day") < 7) {
                        thisWeekRecordings.push(recording);
                        return;
                    }
                    if (djs.format("MM/YYYY") === dayjs().format("MM/YYYY")) {
                        thisMonthRecordings.push(recording);
                        return;
                    }
                    if (djs.format("YYYY") === dayjs().format("YYYY")) {
                        if (monthRecordings[djs.format("MMMM")]) {
                            monthRecordings[djs.format("MMMM")].push(recording);
                            return;
                        } else {
                            monthRecordings[djs.format("MMMM")] = [recording];
                        }
                        return;
                    }
                    if (yearRecordings[djs.format("MMMM YYYY")]) {
                        yearRecordings[djs.format("MMMM YYYY")].push(recording);
                        return;
                    } else {
                        yearRecordings[djs.format("MMMM YYYY")] = [recording];
                    }
                });
                const finalGroups: RecordingGroup[] = [];
                if (todayRecordings.length > 0)
                    finalGroups.push({
                        name: "Today",
                        recordings: todayRecordings,
                    });
                if (thisWeekRecordings.length > 0)
                    finalGroups.push({
                        name: "Earlier this week",
                        recordings: thisWeekRecordings,
                    });
                if (thisMonthRecordings.length > 0)
                    finalGroups.push({
                        name: "Earlier this month",
                        recordings: thisMonthRecordings,
                    });
                Object.keys(monthRecordings).forEach(month => {
                    finalGroups.push({
                        name: month,
                        recordings: monthRecordings[month],
                    });
                });
                Object.keys(yearRecordings).forEach(year => {
                    finalGroups.push({
                        name: year,
                        recordings: yearRecordings[year],
                    });
                });
                setRecordings(finalGroups);
                setLoading(false);
            });
    }, []);

    const handleSelectChanged = (id: string) => {
        if (selected.findIndex(i => i === id) !== -1) setSelected(selected.filter(i => i !== id));
        else setSelected([...selected, id]);
    };

    const deleteSelected = () => {
        const doDelete = async () => {
            setLoading(true);
            const response = await axios.post("/api/deleteMultiple", {
                ids: selected,
            });
            if (response.data.error) {
                console.error(response.data.error);
            }
            setSelecting(false);
            setSelected([]);
        };

        if (!window.confirm(`Really delete ${selected.length} recordings? This CANNOT be undone!`))
            return;
        doDelete();
    };

    return (
        <div>
            <Head>
                <title>Keyboard Recorder</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Layout>
                <div className={style.heading}>
                    <div className={style.intro}>
                        <h1>Lachlan&apos;s Piano Recordings</h1>
                        <p>Welcome! This is the playback engine for my MIDI recorder, an ESP32-based electronic device that automatically records and uploads everything I play on my digital piano. You can read all about how I built it on it&apos;s <a rel="noreferrer" target="_blank" href="https://lachlansleight.io/projects/midi-recorder">Weeklog project page.</a></p>
                        <p>This is an almost entirely-unfiltered record of every note played on my piano, build with the intention of my eventually forgetting that it exists and removing &quot;recording anxiety&quot;. Because I don&apos;t spend any time curating these recordings, you shouldn&apos;t expect much quality, and you should expect a lot of repetition. The colours of each tile indicate the proportion of semitones that were played, and the opacity represents the velocities.</p>
                        <p>Click a tile to open the player - space bar pauses and unpauses.</p>
                    </div>
                    {user ? (
                        <div className={style.selectionButtons}>
                            {selected.length > 0 ? (
                                <button
                                    className={style.deleteButton}
                                    onClick={() => deleteSelected()}
                                >
                                    <FaTrash />
                                </button>
                            ) : null}
                            {selecting ? <span>{selected.length}</span> : null}
                            <button
                                onClick={() => {
                                    if (selecting) setSelected([]);
                                    setSelecting(!selecting);
                                }}
                            >
                                {selecting ? <FaTimesCircle /> : <FaCheckCircle />}
                            </button>
                        </div>
                    ) : (
                        <div className={style.selectionButtons}></div>
                    )}
                </div>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div>
                        {recordings.map(recordingGroup => {
                            return (
                                <div key={recordingGroup.name} className={style.recordingGrid}>
                                    <h2>{recordingGroup.name}</h2>
                                    <div>
                                        {recordingGroup.recordings.map(recording => {
                                            return (
                                                <RecordingTile
                                                    key={recording.recordedAt.valueOf()}
                                                    recording={recording}
                                                    className={
                                                        selecting
                                                            ? selected.findIndex(
                                                                  id => id === recording.id
                                                              ) !== -1
                                                                ? style.selected
                                                                : style.notSelected
                                                            : null
                                                    }
                                                    selecting={selecting}
                                                    selected={
                                                        selected.findIndex(
                                                            id => id === recording.id
                                                        ) !== -1
                                                    }
                                                    onSelectChange={handleSelectChanged}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Layout>
        </div>
    );
};

export default RecordingBrowser;
