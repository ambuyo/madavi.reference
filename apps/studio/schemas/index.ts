import { post } from "./post";
import { teamMember } from "./teamMember";
import { service } from "./service";
import { industry } from "./industry";
import { singleWork } from "./caseStudy";
import { infoPage } from "./infoPage";
import { siteSettings } from "./siteSettings";
import { clientLogo } from "./clientLogo";
import { report } from "./report";
import { solution } from "./solution";
import { event } from "./event";
import { seo } from "./seo";

export const schemaTypes = [
  // Objects
  seo,
  // Documents
  post,
  teamMember,
  service,
  industry,
  singleWork,
  infoPage,
  siteSettings,
  clientLogo,
  report,
  solution,
  event,
];
