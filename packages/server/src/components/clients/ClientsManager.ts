import fs from "fs/promises";
import { join } from "path";

import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { HashHelper, HashedFile } from "@aurora-launcher/core";
import { LogHelper, StorageHelper } from "@root/utils";
import { Service } from "typedi";

import { LangManager } from "../langs";

@Service()
export class ClientsManager {
    readonly hashedClients = new Map<string, HashedFile[]>();

    constructor(private readonly langManager: LangManager, client?: string) {
        this.hashClients(client);
    }

    async hashClients(client?: string): Promise<void> {
        const folders = await fs.readdir(StorageHelper.clientsDir, {
            withFileTypes: true,
        });

        const dirs = client !== undefined
            ? folders.filter((folder) => folder.name == client)
            : folders.filter((folder) => folder.isDirectory());

        if (dirs.length === 0) {
            return LogHelper.info(this.langManager.getTranslate.ClientsManager.syncSkip);
        }

        LogHelper.info(this.langManager.getTranslate.ClientsManager.sync);

        const promises = dirs.map((folder) =>
            this.hashClientFolder(folder.name)
        );

        await Promise.all(promises);

        LogHelper.info(this.langManager.getTranslate.ClientsManager.syncEnd);
    }


    private hashClientFolder(folderName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const worker = new Worker(__filename, {
                workerData: {
                    dirPath: join(StorageHelper.clientsDir, folderName),
                },
            });

            worker.on("message", (hashedFiles: HashedFile[]) => {
                this.hashedClients.set(folderName, hashedFiles);

                LogHelper.info(
                    this.langManager.getTranslate.ClientsManager.syncTime,
                    folderName,
                    Date.now() - startTime,
                );
                resolve();
            });

            worker.on("error", (error) => reject(error));
            worker.on("exit", (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }

    static async hashDir(dirPath: string): Promise<HashedFile[]> {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const arrayOfFiles: HashedFile[] = [];

        for (const entry of entries) {
            const entryPath = join(dirPath, entry.name);
            if (entry.isDirectory()) {
                arrayOfFiles.push(...(await this.hashDir(entryPath)));
            } else {
                arrayOfFiles.push(await this.hashFile(entryPath));
            }
        }

        return arrayOfFiles;
    }

    static async hashFile(path: string): Promise<HashedFile> {
        const size = (await fs.stat(path)).size;

        return {
            path: path.replace(StorageHelper.clientsDir, ""),
            size,
            sha1: await HashHelper.getHashFromFile(path, "sha1"),
        };
    }
}

if (!isMainThread) {
    const { dirPath } = workerData;

    ClientsManager.hashDir(dirPath).then((hashedFiles) => {
        parentPort?.postMessage(hashedFiles);
    });
}
