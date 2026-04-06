declare module "unzipper" {
    import { Stream } from "stream";

    interface ExtractOptions {
        path: string;
    }

    interface Unzipper {
        Extract(options: ExtractOptions): Stream;
    }

    const unzipper: Unzipper;
    export default unzipper;
}