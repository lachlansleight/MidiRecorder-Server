import { PluginFunc } from "dayjs";

declare const plugin: PluginFunc;

declare module "dayjs" {
    interface Dayjs {
        weeklogWeek(): {
            year: number;
            month: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
            week: 1 | 2 | 3 | 4 | 5;
            day: 1 | 2 | 3 | 4 | 5 | 6 | 7;
            prettyString: string;
        };
    }
}

export = plugin;
