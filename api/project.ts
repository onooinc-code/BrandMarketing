// This file should be placed in the `api` directory at the root of your project.
// Vercel will automatically deploy it as a serverless function.
// Note: This requires the Vercel KV storage integration to be set up for your project.
// You can do this from your Vercel project dashboard.
// The `@vercel/kv` package will be available in the Vercel build environment.

import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  const PROJECT_KEY = 'onoo-marketing-project-data';

  // Set CORS headers for all responses
  response.setHeader('Access-Control-Allow-Origin', '*'); // Or specify your app's domain
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests for CORS
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method === 'POST') {
    try {
      // The body is automatically parsed by Vercel for JSON content types
      const projectData = request.body;
      if (!projectData || Object.keys(projectData).length === 0) {
        return response.status(400).json({ error: 'No project data provided.' });
      }
      // Vercel KV expects a string, so we stringify our JSON object
      await kv.set(PROJECT_KEY, JSON.stringify(projectData));
      return response.status(200).json({ message: 'Project saved successfully.' });
    } catch (error) {
      console.error('Error saving project to Vercel KV:', error);
      return response.status(500).json({ error: 'Failed to save project.' });
    }
  } else if (request.method === 'GET') {
    try {
      const projectDataString = await kv.get(PROJECT_KEY);
      if (projectDataString) {
        // Parse the string from KV back into a JSON object
        const projectData = JSON.parse(projectDataString as string);
        return response.status(200).json(projectData);
      } else {
        return response.status(404).json({ message: 'No project found.' });
      }
    } catch (error) {
      console.error('Error loading project from Vercel KV:', error);
      return response.status(500).json({ error: 'Failed to load project.' });
    }
  } else {
    response.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }
}
