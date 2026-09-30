import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'module';
import { spawn } from 'child_process';
import net from 'net';
import path from 'path';

const require = createRequire(import.meta.url);

/**
 * Vite plugin that:
 * 1. Mounts the Express + MongoDB/Disk Backend (`server/server.js`) directly inside Vite's
 *    HTTP server so `/api/*` works on ANY port Vite picks (5173, 5174, 5177, etc.) in VS Code!
 * 2. Also starts standalone port 5000 in the background if not already running.
 */
function ordercraftFullstackPlugin() {
  let backendProcess = null;

  function isPortListening(port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(500);
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.once('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, '127.0.0.1');
    });
  }

  return {
    name: 'ordercraft-fullstack-middleware',
    async configureServer(server) {
      // 1. Mount Express API app directly inside Vite's middleware stack!
      try {
        const expressApp = require('./server/server.js');
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            return expressApp(req, res, next);
          }
          return next();
        });
        console.log('[OrderCraft] Express + Database API mounted directly on Vite dev server (/api)!');
      } catch (err) {
        console.error('[OrderCraft] Failed to mount Express middleware:', err);
      }

      // 2. Also start standalone port 5000 server if free
      const running = await isPortListening(5000);
      if (!running && !backendProcess) {
        const serverScript = path.resolve(process.cwd(), 'server/server.js');
        backendProcess = spawn(process.execPath, [serverScript], {
          cwd: process.cwd(),
          stdio: 'inherit',
          env: { ...process.env, PORT: '5000' },
        });
        backendProcess.on('exit', () => {
          backendProcess = null;
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), ordercraftFullstackPlugin()],
  server: {
    port: 5173,
    open: false,
  },
});
