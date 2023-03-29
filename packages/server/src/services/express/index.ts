import path from 'path';
import * as Utility from '../../utility';
import { verify } from '../messageProvider';
import express, { Express, Request, Response } from 'express';
import { Endpoints } from '../../types/endpointEnum';
import bodyParser from 'body-parser';
import cors from 'cors';

const args = process.argv;
const app: Express = express();

// Path to vue's build
const staticContentPath = path.join(__dirname, '..', '..', '..', 'dist', 'html');

// Inject any middleware here
app.use(express.json());
app.use(express.static(staticContentPath));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    cors({
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
    })
);

/**
 * API Endpoints
 */

// GET endpoint - returns the html page
if (!args.includes('--mode=dev')) {
    app.get(Endpoints.SignMessage, (req: Request, res: Response) => {
        res.sendFile(staticContentPath + '/' + 'index.html');
    });
}

// POST endpoint - accept signed message and processes it
app.post(Endpoints.VerifySignature, (req: Request, res: Response) => {
    const hash: string = req.body.hash;
    const signature: string = req.body.signature;
    const key: string = req.body.key;

    if (typeof hash === 'undefined') {
        return res.status(400).json({ status: false, message: '"hash" property missing in post request' });
    }

    if (typeof signature === 'undefined') {
        return res.status(400).json({ status: false, message: '"signature" property missing in post request' });
    }

    if (typeof key === 'undefined') {
        return res.status(400).json({ status: false, message: '"key" property missing in post request' });
    }

    // If verificationData.discord exists, then it validated correctly
    const verificationData = verify(hash, signature, key);
    if (!verificationData || !verificationData.discord) {
        return res.status(400).json({
            status: false,
            message: 'Signature failed to validate correctly, obtain a new url through Discord.',
        });
    }

    // Successfully validated...
    // Use the following to propagate the MongoDB database.
    // verificationData.discord
    // signature
    // key -> Public EOS Key
    //      An additional fetch will need to be made here to find the right blockchain id

    return res.status(200).json({ status: true, message: 'successfully verified signatures' });
});

/**
 * Initializes a webserver, and returns true when it is ready.
 *
 * @export
 * @param {number} port
 * @return {Promise<boolean>}
 */
export async function init(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        app.listen(port, () => {
            Utility.log.info(`[Express]: Server is running at http://localhost:${port}`);
            resolve(true);
        }).on('error', (e) => {
            Utility.log.error(`[Express]: ${e}`);
            resolve(false);
        });
    });
}
