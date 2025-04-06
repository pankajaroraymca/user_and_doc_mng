// request-context.ts
import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

export class RequestContext {
    static get<T>(key: string): T {
        const store = asyncLocalStorage.getStore();
        return store ? store.get(key) : undefined;
    }

    static set(key: string, value: any): void {
        const store = asyncLocalStorage.getStore();
        if (store) {
            store.set(key, value);
        }
    }

    static run(fn: () => void) {
        asyncLocalStorage.run(new Map(), fn);
    }
}
