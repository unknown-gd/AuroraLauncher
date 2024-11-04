import { LauncherServerConfig } from "@root/components/config/utils/LauncherServerConfig";

export class SkinManager {
    private skinUrl: string;
    private capeUrl: string;

    constructor(
        skin: LauncherServerConfig["skin"],
    ) {
        this.skinUrl = skin.skinUrl;
        this.capeUrl = skin.capeUrl;
    }

    getSkin(uuid: string, username: string): string {
        return this.skinUrl.replace("{uuid}", uuid).replace("{username}", username);
    }

    getCape(uuid: string, username: string) {
        return this.capeUrl.replace("{uuid}", uuid).replace("{username}", username);
    }

    getDomenUrl() {
        return new URL(this.skinUrl).hostname;
    }
}