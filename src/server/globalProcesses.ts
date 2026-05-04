import { ChildProcess, spawn } from "node:child_process";
import { globalLog } from "./globalLog";

export type ProcessMetadata = {
    tag?: string;
    filePathSource?: string;
    filePathOpen?: string;
};

/**
 * Sends kill signal to the process
 * Does not wait for the process to fully close.
 */
function endProcess(process: ChildProcess): void {
    if (process.exitCode !== null || process.killed) {
        process.kill();
    }
}

/**
 * Wait for the process to fully close.
 * @param process
 * @returns
 */
async function endProcessAndWait(process: ChildProcess): Promise<void> {
    if (process.exitCode !== null || process.killed) {
        return;
    }

    return new Promise((resolve) => {
        process.once("close", () => resolve());
        process.kill();
    });
}

class ProcessRegistry {
    private registry: Map<number, { process: ChildProcess; metadata: ProcessMetadata }> = new Map();

    private add(process: ChildProcess, metadata: ProcessMetadata = {}): number {
        const id = process.pid;
        if (id === undefined) {
            throw new Error("Process must have a PID");
        }
        this.registry.set(id, { process, metadata });
        return id;
    }

    private get(pid: number): ChildProcess | undefined {
        return this.registry.get(pid)?.process;
    }

    private remove(pid: number): void {
        this.registry.delete(pid);
    }

    getMetadataByPid(pid: number): ProcessMetadata | undefined {
        return this.registry.get(pid)?.metadata;
    }

    getAllPidMetadata(): [number, ProcessMetadata][] {
        const result: [number, ProcessMetadata][] = [];
        for (const [pid, { metadata }] of this.registry.entries()) {
            result.push([pid, metadata]);
        }
        return result;
    }

    /**
     * Spawn a new process and associate metadata with it.
     * @param path path to the executable
     * @param args arguments to pass to the executable
     * @param metadata metadata associated with the process
     * @returns pid of the process
     */
    spawn(path: string, args: string[], metadata: ProcessMetadata = {}) {
        const childProcess = spawn(path, args, { stdio: "pipe" });
        childProcess.stdout?.on("data", (data) => {
            globalLog.log(`[PID ${childProcess.pid}] stdout: ${data}`);
        });
        childProcess.stderr?.on("data", (data) => {
            globalLog.log(`[PID ${childProcess.pid}] stderr: ${data}`);
        });
        const id = this.add(childProcess, metadata);
        return id;
    }

    /**
     * kill process
     * @param pid
     */
    endByPid(pid: number): void {
        const process = this.get(pid);
        if (process) {
            endProcess(process);
            this.remove(pid);
        }
    }

    /**
     * Kill process and wait for it to fully close.
     * @param pid
     */
    async endByPidAndWait(pid: number): Promise<void> {
        const process = this.get(pid);
        if (process) {
            this.remove(pid);
            await endProcessAndWait(process);
        }
    }

    /**
     * kill all processes
     */
    endAll(): void {
        for (const [pid, { process }] of this.registry.entries()) {
            endProcess(process);
            this.remove(pid);
        }
    }

    /**
     * Kill all processes and wait for them to fully close.
     */
    async endAllAsync(): Promise<void> {
        const pids = [...this.registry.keys()];
        await Promise.all(pids.map((pid) => this.endByPidAndWait(pid)));
    }
}

export const globalProcesses = new ProcessRegistry();
