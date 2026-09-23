// Konfiguration för Remotions CLI (npx remotion studio / still / render).
import { Config } from "@remotion/cli/config";
import { withProjectAliases } from "./lib/remotion/webpack-override";

Config.overrideWebpackConfig(withProjectAliases);
