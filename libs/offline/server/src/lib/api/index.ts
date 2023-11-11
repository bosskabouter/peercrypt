import {  type CorsOptions } from "cors";
// import  {cors} from "cors";
// import * as express from "express";
import {Router} from "express";

import PublicApi from "./v1/public";
import type { EP2PushServerConfig } from "../config";
// import  * as pubContent from "../app.json" ;
import { ID } from "../../";
// import version from "./version";

export const Api = ({
  key,
  config,
  corsOptions,
}: {
  key: ID;
  config: EP2PushServerConfig;
  corsOptions: CorsOptions;
}): Router => {
  const router = Router();
  // corsOptions && router.use(cors());

  router.get("/", (_, res) => {
    res.send("peercrypt offline service");
  });
  // router.get("/version", (_, res) => {
  //   res.send(version());
  // });
  router.use("/", PublicApi({ key, config }));

  return router;
};
