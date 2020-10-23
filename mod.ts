import { Application, send } from "https://deno.land/x/oak/mod.ts";
import * as log from "https://deno.land/std/log/mod.ts";

import api from "./api.ts";

//MiddleWare are just functions that executed in order every time request is send.
//( is processed as a stack, where each middleware function can control the flow of the response.
//When the middleware is called, it is passed a context and reference to the "next" method in the stack.)

const app = new Application();
const PORT = 8000;

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("INFO"),
  },
  loggers: {
    default: {
      level: "INFO",
      handlers: ["console"],
    },
  },
});

//here we can do the final error handle for uncaught errors
app.addEventListener("error",(event)=>{
  log.error(event.error);
})

//Middleware func handle Error
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.body="Internal Server Error!!";
    throw err;
  }
});

//Middleware func
app.use(async (ctx, next) => {
  await next();
  const time = ctx.response.headers.get("X-Response-Time");
  log.info(`${ctx.request.method} ${ctx.request.url} : ${time}`);
});

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const delta = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${delta}ms`);
});

//regist routers
app.use(api.routes());
app.use(api.allowedMethods());

//endpoint Middleware Fun (Serving static files)
app.use(async (ctx) => {
  const filePath = ctx.request.url.pathname;
  const fileWhiteList = [
    "/index.html",
    "/stylesheets/style.css",
    "/javascripts/script.js",
    "/images/favicon.png",
  ];
  if (fileWhiteList.includes(filePath)) {
    await send(ctx, filePath, {
      root: `${Deno.cwd()}/public`,
    });
  }
});

//check whither or not our module is currently being executed as program.
if (import.meta.main) {
  log.info(`Starting server on port ${PORT}...`);
  await app.listen({ port: PORT });
}
