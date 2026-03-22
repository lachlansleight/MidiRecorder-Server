import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";

function initMiddleware(middleware: any) {
    return (req: any, res: any) =>
        new Promise((resolve, reject) => {
            middleware(req, res, (result: any) => {
                if (result instanceof Error) {
                    return reject(result);
                }
                return resolve(result);
            });
        });
}

const cors = initMiddleware(
    Cors({
        methods: ["GET"],
    })
);

export const revalidate = 0;

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    await cors(req, res);
    try {
        const response = await axios(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordingList.json`
        );
        const recordings = Object.keys(response.data).map(key => ({
            ...response.data[key],
            id: key,
        }));
        res.status(200);
        res.json({ recordings });
    } catch (error) {
        res.status(500);
        res.json({ success: false, error });
    }
};
