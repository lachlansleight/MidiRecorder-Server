import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import initFirebase from "lib/initFirebase";
import FirebaseUtils from "lib/FirebaseUtils";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    try {
        const authResponse = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY}`,
            {
                email: process.env.FB_EMAIL,
                password: process.env.FB_PASSWORD,
                returnSecureToken: true,
            }
        );
        const idToken = authResponse.data.idToken;

        await axios.delete(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${req.body.id}.json?auth=${idToken}`
        );
        await axios.delete(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordingList/${req.body.id}.json?auth=${idToken}`
        );
        initFirebase();
        await FirebaseUtils.deleteFile(`recordings/${req.body.id}.mid`);

        res.status(200);
        res.json({ success: true });
    } catch (error) {
        res.status(500);
        res.json({ success: false, error });
    }
};
