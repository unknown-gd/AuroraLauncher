export class SkinConfig {
    skinUrl: string;
    capeUrl: string;

    static getDefaultConfig(): SkinConfig {
        return {
            skinUrl: "https://crafthead.net/skin/{username}",
            capeUrl: "https://crafthead.net/cape/{username}",
        };
    }
}
