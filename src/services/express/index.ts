import path from 'path';
import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import { Endpoints } from '../../types/endpointEnum';
import * as Utility from '../../utility';
import * as Services from '..';

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
app.post(Endpoints.VerifySignature, async (req: Request, res: Response) => {
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
    const verificationData = await (Services.messageProvider.verify(hash, signature, key));
    if (!verificationData || !verificationData.discord) {
        return res.status(400).json({
            status: false,
            message: 'Signature failed to validate correctly, obtain a new url through Discord.',
        });
    }

    const accounts = await Services.blockchain.getAccountsByKey(key);
    if (accounts == null) {
        return res.status(500).json({
            status: false,
            message: 'Failed to make internal request for blockchain accounts.',
        });
    } else if (accounts.length <= 0) {
        return res.status(400).json({
            status: false,
            message: 'No blockchain accounts exist for the provided public key.',
        });
    }

    const blockchainid = accounts[0];
    const didAddUser = await Services.database.user.addUser(verificationData.discord, blockchainid, signature);
    if (!didAddUser.status) {
        return res.status(400).json({
            status: false,
            message: didAddUser.data,
        });
    }

    await Services.users.refreshUser(verificationData.discord, blockchainid);
    return res.status(200).json({ status: true, message: 'successfully verified signatures' });
});

app.get(Endpoints.Health, async (req: Request, res: Response) => {
    return res.send(true);
});

app.get('*', function(req, res){
    // Prevent malformed URL
    try {
        decodeURIComponent(req.path);
    } catch (err) {
        return res.status(400).json({ status: false, message: 'Malformed URL' });
    }
    res.status(400).send('Not Found');
});

/**
 * Initializes a webserver, and returns true when it is ready.
 *
 * @export
 * @param {number} port
 * @return {Promise<boolean>}
 */
export async function init(port: number | string): Promise<boolean> {
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
