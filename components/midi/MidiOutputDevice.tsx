import { useState, useEffect } from "react";
import { WebMidiEventConnected, WebMidiEventDisconnected } from "webmidi";
import useMidi from "../../lib/midi/useMidi";

const defaultOption = (
    <option key={"none"} value={""}>
        Select MIDI Device
    </option>
);

const MidiOutputDevice = (): JSX.Element => {
    const { midi, enabled, outputDevice, setOutputDevice, supported } = useMidi();
    const [midiOutputDevices, setMidiOutputDevices] = useState<JSX.Element[]>([defaultOption]);

    const setMidiOutputDevice = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "") {
            setOutputDevice(null);
            return;
        }
        const output = e.target.value === "" ? null : midi.getOutputByName(e.target.value);
        if (output) {
            setOutputDevice(output);
        } else {
            console.error("Didn't find an output with that name!");
        }
    };

    useEffect(() => {
        const doSet = () => {
            setMidiOutputDevices([
                <option key="none" value="">
                    {midi.outputs.length > 0 ? "None" : "Select MIDI Device"}
                </option>,
                ...midi.outputs.map(output => {
                    return (
                        <option key={output.name} value={output.name}>
                            {output.name}
                        </option>
                    );
                }),
            ]);
        };

        const handleConnected = (e: WebMidiEventConnected) => {
            if (e.port.type === "output") doSet();
        };

        const handleDisconnected = (e: WebMidiEventDisconnected) => {
            if (e.port.type === "output") doSet();
        };

        if (!midi) return;
        if (!enabled) return;

        doSet();

        midi.addListener("connected", handleConnected);
        midi.addListener("disconnected", handleDisconnected);

        return () => {
            midi.removeListener("connected", handleConnected);
            midi.removeListener("disconnected", handleDisconnected);
        };
    }, [midi, enabled]);

    return (
        <div>
            {!supported ? (
                <p className="text-red-300 text-center">MIDI not supported!</p>
            ) : (
                <select
                    id={"midiDevice"}
                    value={outputDevice ? outputDevice.name : ""}
                    onChange={setMidiOutputDevice}
                    className="bg-neutral-900 text-neutral-500 border-none p-1 rounded"
                >
                    {midiOutputDevices}
                </select>
            )}
        </div>
    );
};

export default MidiOutputDevice;
