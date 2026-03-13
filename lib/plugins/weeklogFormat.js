import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
dayjs.extend(isoWeek);

const monthHasFiveWeeks = d => {
    const startOfMonth = d.startOf("month");
    const endOfMonth = d.endOf("month");
    return (
        startOfMonth.isoWeekday() > 1 &&
        startOfMonth.isoWeekday() < 5 &&
        endOfMonth.isoWeekday() >= 4
    );
};

export const getWeeklogWeek = d => {
    //two edge cases:
    //if the next month begins on the current calendar week's tuesday wednesday or thursday, then we are actually in the first week of the following month
    //if the previous month ends on the current calendar week's thursday, friday or saturday, then we are actually in the final week of the previous month

    const startOfNextMonth = d.add(1, "month").startOf("month");
    const endOfWeek = d.endOf("isoWeek");
    if (endOfWeek.isAfter(startOfNextMonth) && startOfNextMonth.isoWeekday() <= 4) {
        //first edge case - i.e. we're in the final three days of a month but are *actally* in the first week of the next month
        return {
            year: startOfNextMonth.get("year"),
            month: startOfNextMonth.get("month"),
            week: 1,
            day: d.isoWeekday() - 1,
            prettyString: `${startOfNextMonth.format("MMMM")} Week 1`,
        };
    }

    const endOfPreviousMonth = d.subtract(1, "month").endOf("month");
    const startOfWeek = d.startOf("isoWeek");
    if (startOfWeek.isBefore(endOfPreviousMonth) && endOfPreviousMonth.isoWeekday() >= 4) {
        //second edge case - i.e. we're in the first three days of a month but are *actually* in the last week of the previous month
        //if the last month starts on a monday and has 30 days, or if it 1starts on a monday or tuesday and has 31 days, then it has 5 weeks
        const weekNo = monthHasFiveWeeks(endOfPreviousMonth) ? 5 : 4;
        return {
            year: endOfPreviousMonth.get("year"),
            month: endOfPreviousMonth.get("month"),
            week: weekNo,
            day: d.isoWeekday() - 1,
            prettyString: `${endOfPreviousMonth.format("MMMM")} Week ${weekNo}`,
        };
    }

    //otherwise, it's just a normal day in a normal week, calculate as per normal

    //first, count how many full weeks (jumps of seven days back) we can go before hitting the previous month
    //this is the *maximum* possible value
    let week = 0;
    let simM = dayjs(d);
    while (simM.month() === d.month()) {
        week++;
        simM = simM.subtract(7, "day");
    }

    const startOfMonth = d.startOf("month");
    if (startOfMonth.isoWeekday() <= 4 && d.isoWeekday() < startOfMonth.isoWeekday()) {
        //if the month starts on a thursday or earlier, then the first week is fractionally allowed to count
        //add one to the week if the current day is before the day the month starts on
        week++;
    } else if (startOfMonth.isoWeekday() > 4 && d.isoWeekday() >= startOfMonth.isoWeekday()) {
        //if the month starts on a friday or later, then the first week shouldn't count
        //subtract one from the week if the current day is on or after the day the month starts on
        week--;
    }

    return {
        year: d.year(),
        month: d.month(),
        week: week,
        day: d.isoWeekday() - 1,
        prettyString: `${d.format("MMMM")} Week ${week}`,
    };
};

const weeklogWeek = (o, c) => {
    const proto = c.prototype;
    proto.weeklogWeek = function () {
        return getWeeklogWeek(this);
    };
};

export default weeklogWeek;
