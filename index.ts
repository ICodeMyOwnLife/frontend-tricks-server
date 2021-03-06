import { join } from "path";
import { AddressInfo } from "net";
import express, { Request, Response } from "express";
import morgan from "morgan";
import serveStatic from "serve-static";
import bodyParser from "body-parser";
import contentDisposition from "content-disposition";
import cors from "cors";
import multer from "multer";
import { UAParser } from "ua-parser-js";
import { delay } from "bluebird";
import Axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const DIR_STATIC = join(__dirname, "..", "static");
const DIR_PUBLIC = join(__dirname, "..", "public");
const HEADER_CONTENT_TYPE = "Content-Type";
const HEADER_CONTENT_DISPOSITION = "Content-Disposition";

const app = express();
const upload = multer({ dest: "uploads/" });

const exportHandler = (req: Request, res: Response) => {
  const count = Number(req.body.count || req.query.count) || 10;
  const values = Array(count)
    .fill(0)
    .map((_, idx) => ({ id: idx, value: Math.round(Math.random() * 10000) }));

  res.setHeader(HEADER_CONTENT_TYPE, "text/html");
  res.setHeader(
    HEADER_CONTENT_DISPOSITION,
    contentDisposition(`${count}_items.json`, { type: "attachment" })
  );
  res.status(200).send(values);
};

const longHandler = async (req: Request, res: Response) => {
  const duration = Number(req.body.duration || req.query.duration) || 3000;
  await delay(duration);
  res.status(200).send({ message: "OK" });
};

const memoryUsageHandler = (req: Request, res: Response) => {
  const length = Number(req.body.length || req.query.length) || 100000000;
  const array = Array.from({ length }, () => 5);
  array.reverse();
  const { external, heapTotal, heapUsed, rss } = process.memoryUsage();
  res.status(200).send({ external, heapTotal, heapUsed, rss });
};

const userAgentHandler = (req: Request, res: Response) => {
  const parser = new UAParser(req.header("user-agent"));
  const result = parser.getResult();
  res.status(200).send(result);
};

const createSetHeaders = (type: string) => (res: Response, path: string) =>
  res.setHeader(HEADER_CONTENT_DISPOSITION, contentDisposition(path, { type }));

const verifyReCaptchaToken = async (response: string, secret: string) => {
  const params = { response, secret };
  const res = await Axios.request({
    method: "POST",
    params,
    url: `https://www.google.com/recaptcha/api/siteverify`,
  });
  return res.data;
};

app.set("trust proxy", true);
app.use(morgan("dev"));
app.use(cors({ exposedHeaders: [HEADER_CONTENT_DISPOSITION] }));
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text({}));
app.use(bodyParser.raw({}));

/**
 * Serve Static
 */
app.use(
  "/static",
  serveStatic(DIR_STATIC, {
    setHeaders: createSetHeaders("attachment"),
  })
);

app.use(
  "/public",
  serveStatic(DIR_PUBLIC, {
    setHeaders: createSetHeaders("inline"),
  })
);

/**
 * APIs
 */
app.route("/export").get(exportHandler).post(exportHandler);

app.get("/ip", (req, res) => {
  res.send({
    connectionRemoteAddress: req.connection.remoteAddress,
    ip: req.ip,
    socketRemoteAddress: req.socket.remoteAddress,
    xForwardedFor: req.header("x-forwarded-for"),
  });
});

app.route("/long").get(longHandler).post(longHandler);

app.route("/memory-usage").get(memoryUsageHandler).post(memoryUsageHandler);

app.post("/upload-multiple", upload.array("multiple-files"), (req, res) => {
  const { length } = req.files as Express.Multer.File[];
  const redirect = req.body.redirect as string;
  const responseBody = { ...req.body, length };
  console.log(responseBody);
  redirect ? res.redirect(redirect) : res.status(200).send(responseBody);
});

app.post("/upload-single", upload.single("single-file"), (req, res) => {
  const { originalname, size } = req.file;
  const redirect = req.body.redirect as string;
  const responseBody = { ...req.body, originalname, size };
  console.log(responseBody);
  redirect ? res.redirect(redirect) : res.status(200).send(responseBody);
});

app.route("/user-agent").get(userAgentHandler).post(userAgentHandler);

app.post("/verify-recaptcha-v3", async (req, res) => {
  const data = await verifyReCaptchaToken(
    req.body.response,
    process.env.RECAPTCHA_V3_SECRET_KEY!
  );
  res.status(200).send(data);
});

app.post("/verify-recaptcha-checkbox", async (req, res) => {
  const data = await verifyReCaptchaToken(
    req.body.response,
    process.env.RECAPTCHA_CHECKBOX_SECRET_KEY!
  );
  res.status(200).send(data);
});

app.get("/with-referrer", (req, res) => {
  const referrer = req.header("referrer");
  const redirect = req.query.redirect;
  res.redirect(
    referrer ? `${redirect}?referrer=${referrer}` : String(redirect)
  );
});

const server = app.listen(Number(process.env.PORT) || 1333, () =>
  console.log(
    `Server started on port ${(server.address() as AddressInfo).port}`
  )
);
