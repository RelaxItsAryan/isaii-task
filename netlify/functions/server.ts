import type { Context } from '@netlify/functions';

let serverModule: any;

async function getServerModule() {
  if (!serverModule) {
    serverModule = await import('../../dist/server/server.js');
  }
  return serverModule;
}

export default async (req: Request, context: Context) => {
  try {
    const server = await getServerModule();
    
    // Call the server handler
    const response = await server.default.fetch(req, {}, context);
    
    return response;
  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
