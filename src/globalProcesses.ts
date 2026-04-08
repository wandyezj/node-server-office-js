import { ChildProcess } from "node:child_process";

class ProcessRegistry {
    private registry: Map<number, ChildProcess> = new Map();

    add(process: ChildProcess): number {
        const id = process.pid;
        if (id === undefined) {
            throw new Error("Process must have a PID");
        }
        this.registry.set(id, process);
        return id;
    }

    get(pid: number): ChildProcess | undefined {
        return this.registry.get(pid);
    }

    remove(pid: number): void {
        this.registry.delete(pid);
    }
}

export const globalProcesses = new ProcessRegistry();
