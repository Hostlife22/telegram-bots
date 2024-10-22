import dotenv from "dotenv";
import path from "path";

const env = process.env.NODE_ENV || "dev";
dotenv.config({ path: path.resolve(__dirname, `.${env}.env`) });
