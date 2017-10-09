import { Bus, Report } from './bus';
import * as WebSocket from 'ws';
import * as http from 'http';
import * as fs from 'fs';
import { Logger } from './logger';

export interface Server {
  start(): void;
}

let indexHtml = fs.readFileSync(`${__dirname}/../public/index.html`, { encoding: 'UTF8' });

export let createServer = (deps: { bus: Bus, logger: Logger }): Server => {
  let { logger, bus } = deps;

  return {
    start: () => {
      let server = new http.Server((req, res) => {
        indexHtml = fs.readFileSync(`${__dirname}/../public/index.html`, { encoding: 'UTF8' });

        res.writeHead(200, { type: 'text/html' });
        res.write(indexHtml);
        res.end();
      });
      const wss = new WebSocket.Server({ server, path: '/ws' });

      server.listen(4551);

      wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
          logger.log('server', `received: ${message}`);
        });
      });

      let processReport = (report: Report) => {
        let data = JSON.stringify(report, undefined, 2);
        wss.clients.forEach(client => client.send(data));
      };

      bus.register('report', processReport);

      logger.log('server', 'Experimental server listening on http://localhost:4551');
    }
  };
};
