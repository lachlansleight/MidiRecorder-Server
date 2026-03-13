import dayjs from "dayjs";
import weeklogFormat from "./weeklogFormat";
dayjs.extend(weeklogFormat);

describe("Weeklog Week Formatting", () => {
    it("correctly formats non-edge-cases", () => {
        const d = dayjs(new Date(2021, 0, 14)).weeklogWeek();
        expect(d.year).toBe(2021);
        expect(d.month).toBe(0);
        expect(d.week).toBe(1);
        expect(d.day).toBe(3);
        expect(d.prettyString).toBe("January Week 2");
    });
    it("correctly formats short-first-week edge cases", () => {
        //i.e. if the first week of a month has three or fewer days, it's actually the last week of the previous month still
        const d = dayjs(new Date(2021, 0, 2)).weeklogWeek();
        expect(d.year).toBe(2020);
        expect(d.month).toBe(11);
        expect(d.week).toBe(4);
        expect(d.day).toBe(5);
        expect(d.prettyString).toBe("December Week 5");
    });
    it("correctly formats long first-week edge cases", () => {
        //i.e. if the first week of a month has four or more days, it's the first week of that month
        const d = dayjs(new Date(2021, 3, 1)).weeklogWeek();
        expect(d.year).toBe(2021);
        expect(d.month).toBe(3);
        expect(d.week).toBe(0);
        expect(d.day).toBe(3);
        expect(d.prettyString).toBe("April Week 1");
    });
    it("correctly formats short-last-week edge cases", () => {
        //i.e. if the last week of a month has three or fewer days, it's actually the first week of the next month
        const d = dayjs(new Date(2020, 10, 30)).weeklogWeek();
        expect(d.year).toBe(2020);
        expect(d.month).toBe(11);
        expect(d.week).toBe(0);
        expect(d.day).toBe(0);
        expect(d.prettyString).toBe("December Week 1");
    });
    it("correctly formats long-last-week edge cases", () => {
        //i.e. if the last week of a month has four or more days, it's the last week of that month
        const d = dayjs(new Date(2020, 9, 29)).weeklogWeek();
        expect(d.year).toBe(2020);
        expect(d.month).toBe(9);
        expect(d.week).toBe(4);
        expect(d.day).toBe(3);
        expect(d.prettyString).toBe("October Week 5");
    });
});
