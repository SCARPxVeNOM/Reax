/**
 * Linera Proxy Routes
 * Proxies GraphQL requests to the Linera service to bypass CORS issues
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const LINERA_SERVICE_URL = process.env.LINERA_SERVICE_URL || 'http://localhost:8081';
const LINERA_CHAIN_ID = process.env.LINERA_CHAIN_ID || '';
const LINERA_APP_ID = process.env.LINERA_APP_ID || '';

// Proxy to node service root
router.post('/node', async (req: Request, res: Response) => {
    try {
        const response = await axios.post(
            LINERA_SERVICE_URL,
            req.body,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );
        res.json(response.data);
    } catch (error: any) {
        console.error('Linera node proxy error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Proxy to application-specific endpoint
router.post('/app', async (req: Request, res: Response) => {
    try {
        const chainId = req.query.chainId || LINERA_CHAIN_ID || LINERA_APP_ID;
        const appId = req.query.appId || LINERA_APP_ID;

        const appUrl = `${LINERA_SERVICE_URL}/chains/${chainId}/applications/${appId}`;
        console.log(`Linera app proxy -> ${appUrl}`);

        const response = await axios.post(
            appUrl,
            req.body,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );
        res.json(response.data);
    } catch (error: any) {
        console.error('Linera app proxy error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            res.status(503).json({ error: 'Linera service not available' });
        } else if (error.code === 'ETIMEDOUT') {
            res.status(504).json({ error: 'Linera service timeout' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Get Linera service status
router.get('/status', async (_req: Request, res: Response) => {
    try {
        const response = await axios.post(
            LINERA_SERVICE_URL,
            { query: '{ chains { list default } }' },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000,
            }
        );
        res.json({
            status: 'connected',
            serviceUrl: LINERA_SERVICE_URL,
            chainId: LINERA_CHAIN_ID,
            appId: LINERA_APP_ID,
            chains: response.data?.data?.chains || null,
        });
    } catch (error: any) {
        res.json({
            status: 'disconnected',
            error: error.message,
            serviceUrl: LINERA_SERVICE_URL,
        });
    }
});

export default router;
