import falloffData from "./falloffs.json";

export const semitoneToHue = (semitone: number): number => {
    semitone = semitone % 12;
    switch (semitone) {
        case 0:
            return 130;
        case 1:
            return 295;
        case 2:
            return 60;
        case 3:
            return 245;
        case 4:
            return 22;
        case 5:
            return 180;
        case 6:
            return 330;
        case 7:
            return 80;
        case 8:
            return 275;
        case 9:
            return 45;
        case 10:
            return 220;
        case 11:
            return 350;
    }
    return 0;
};

export const isBlackKey = (pitch: number): boolean => {
    const semitone = pitch % 12;
    switch (semitone) {
        case 0:
            return false;
        case 1:
            return true;
        case 2:
            return false;
        case 3:
            return true;
        case 4:
            return false;
        case 5:
            return false;
        case 6:
            return true;
        case 7:
            return false;
        case 8:
            return true;
        case 9:
            return false;
        case 10:
            return true;
        case 11:
            return false;
    }
    return false;
};

/** The idea here is to take in a MIDI pitch and (assuming it is held forever) return an approximate volume curve */
export const getKeyFalloff = (pitch: number, velocity: number, time: number): number => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

    if (time > 25) return 0;

    //clamp pitch and velocity to valid ranges
    pitch = Math.min(Math.max(pitch, 24), 108);
    velocity = Math.min(Math.max(velocity, 15), 127);

    //get actual pitch and velocity values that exist in the dataset, to be used for interpolation
    const lowerPitch = Math.floor(pitch / 3) * 3;
    const upperPitch = Math.floor(pitch / 3) * 3 + 3;
    const lowerVelocity = Math.floor(velocity / 16) * 16 + 15;
    const upperVelocity = Math.floor(velocity / 16) * 16 + 31;

    //console.log({pitch, velocity, lowerPitch, upperPitch, lowerVelocity, upperVelocity})

    const timeBin = Math.max(0, Math.log2(time * 10) - 1);
    const timeBinIndex = Math.floor(timeBin);
    const timeBinT = timeBin % 1.0;

    //console.log({timeBin, timeBinIndex, timeBinT});

    const data: Record<string, Record<string, number[]>> = falloffData;

    const _pv = data[lowerPitch][lowerVelocity];
    const _pV = data[lowerPitch][upperVelocity];
    const _Pv = data[upperPitch][lowerVelocity];
    const _PV = data[upperPitch][upperVelocity];

    if (!_pv || !_pV || !_Pv || !_PV) {
        console.error("Missing data for ", { pitch, velocity, time });
        return 0;
    }

    const pv =
        _pv.length > timeBinIndex
            ? lerp(
                  _pv[timeBinIndex],
                  _pv.length > timeBinIndex + 1 ? _pv[timeBinIndex + 1] : 0,
                  timeBinT
              )
            : 0;
    const pV =
        _pV.length > timeBinIndex
            ? lerp(
                  _pV[timeBinIndex],
                  _pV.length > timeBinIndex + 1 ? _pV[timeBinIndex + 1] : 0,
                  timeBinT
              )
            : 0;
    const Pv =
        _Pv.length > timeBinIndex
            ? lerp(
                  _Pv[timeBinIndex],
                  _Pv.length > timeBinIndex + 1 ? _Pv[timeBinIndex + 1] : 0,
                  timeBinT
              )
            : 0;
    const PV =
        _PV.length > timeBinIndex
            ? lerp(
                  _PV[timeBinIndex],
                  _PV.length > timeBinIndex + 1 ? _PV[timeBinIndex + 1] : 0,
                  timeBinT
              )
            : 0;

    //console.log({pv, pV, Pv, PV});

    const vT = (velocity - lowerVelocity) / (upperVelocity - lowerVelocity);
    const pT = (pitch - lowerPitch) / (upperPitch - lowerPitch);

    return lerp(lerp(pv, Pv, pT), lerp(pV, PV, pT), vT);
};

export const durationToString = (duration: number, short = false): string => {
    let output = "";
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration - hours * 3600) / 60);
    const seconds = duration - minutes * 60 - hours * 3600;
    if (hours > 0) {
        output += hours + ":";
        if (minutes > 10) output += minutes + ":";
        else if (minutes > 0) output += "0" + minutes + ":";
        else output += "00:";
    } else if (minutes > 0) {
        output += minutes + ":";
    } else output += "00:";
    if (seconds >= 10) output += seconds;
    else if (seconds > 0) output += "0" + seconds;
    else output += "00";
    if (!short) {
        return output;
    }
    if (minutes === 0) return Math.round(seconds) + "sec";
    if (hours === 0) return Math.round(minutes) + "min";
    return Math.floor(hours) + "hr " + Math.round(minutes) + "min";
};
