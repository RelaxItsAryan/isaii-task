import { IncomingMessage } from 'http';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let serverModule: any;

async function getServerModule() {
  if (!serverModule) {
    // Import from the built server
    serverModule = await import('../../dist/server/server.js');
  }
  return serverModule;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const server = await getServerModule();
    
    // Convert Vercel request to Web API Request
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    
    // Build request body if needed
    let body: BodyInit | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body instanceof IncomingMessage) {
        // For raw streams - not typically used in Vercel
        body = req.body as any;
      } else if (req.body) {
        body = JSON.stringify(req.body);
      }
    }

    const fetchRequest = new Request(url.toString(), {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body,
    });

    // Call the server handler
    const response = await server.default.fetch(fetchRequest, {}, {});
    
    // Convert Web API Response to Vercel Response
    const responseBody = await response.text();
    
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    res.send(responseBody);
  } catch (error) {
    console.error('API route error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
