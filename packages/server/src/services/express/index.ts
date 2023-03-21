import path from 'path';
import fs from 'fs';
import * as Utility from '../../utility';
import express, { Express, Request, Response } from 'express';
const app: Express = express();

// Path to vue's build
const staticContentPath = path.join(__dirname, '..', '..', '..', 'dist', 'html');

// Inject any middleware here
app.use(express.json());
app.use(express.static(staticContentPath));

/**
 * API Endpoints
 */

// GET endpoint - returns the html page
app.get('/signMessage', (req: Request, res: Response) => {
    res.sendFile(staticContentPath + '/' + 'index.html');
});

// POST endpoint - accept signed message and processes it
app.post('/signMessage', (req: Request, res: Response) => {
    // TODO: Validate req.body
    // TODO: Verify signed message and add to db
    return res.status(201).json({ foo: true, data: req.body });
});

/**
 * Initializes a webserver, and returns true when it is ready.
 *
 * @export
 * @param {number} port
 * @return {Promise<boolean>}
 */
export async function init(port: number): Promise<boolean> {
    return await new Promise<boolean>((resolve, reject) => {
        app.listen(port, () => {
            Utility.log.info(`[Express]: Server is running at http://localhost:${port}`);
            resolve(true);
        }).on('error', (e) => {
            Utility.log.error(`[Express]: ${e}`);
            resolve(false);
        });
    });
}
