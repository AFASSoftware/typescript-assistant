import * as fs from "fs";
import * as http from "http";

import * as WebSocket from "ws";

import { Bus, Report } from "./bus";
import { Formatter } from "./code-style/formatter";
import { Linter } from "./code-style/linter";
import { Logger } from "./logger";

export interface Server {
  start(port: number): void;
}

let indexHtml = fs.readFileSync(`${__dirname}/../public/index.html`, {
  encoding: "utf-8",
});

export let createServer = (deps: {
  bus: Bus;
  logger: Logger;
  linter: Linter;
  formatter: Formatter;
}): Server => {
  let { logger, bus, linter, formatter } = deps;

  let lastReports: { [tool: string]: Report } = {};

  return {
    start: (port) => {
      let processReport = (report: Report) => {
        lastReports[report.tool] = report;
        let data = JSON.stringify(report, undefined, 2);
        wss.clients.forEach((client) => client.send(data));
      };

      bus.register("report", processReport);

      let server = http.createServer((req, res) => {
        indexHtml = fs.readFileSync(`${__dirname}/../public/index.html`, {
          encoding: "utf-8",
        });

        res.writeHead(200, { type: "text/html" });
        res.write(indexHtml);
        res.end();
      });
      const wss = new WebSocket.Server({ server, path: "/ws" });

      server.on("listening", () => {
        logger.log(
          "server",
          `Experimental server listening on http://localhost:${port}`
        );
      });
      server.listen(port);

      wss.on("connection", function connection(ws) {
        ws.on("message", function incoming(message) {
          logger.log("server", `received: ${message}`);
          if (message === "lint-fix") {
            linter
              .lintOnce(true)
              .catch((err: any) =>
                logger.error("server", `Error during lint-fix ${err}`)
              );
          }
          if (message === "format-fix") {
            formatter
              .formatFiles(undefined)
              .catch((err: any) =>
                logger.error("server", `Error during format-fix ${err}`)
              );
          }
        });
        Object.keys(lastReports).forEach((tool) => {
          ws.send(JSON.stringify(lastReports[tool], undefined, 2));
        });
      });
    },
  };
};
