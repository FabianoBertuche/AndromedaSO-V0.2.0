export class InMemoryRegistry {
    constructor() {
        this.modules = new Map();
    }
    register(manifest, initialState = 'discovered') {
        if (this.modules.has(manifest.id)) {
            throw new Error(`Module ${manifest.id} is already registered`);
        }
        const record = { ...manifest, state: initialState };
        this.modules.set(manifest.id, record);
        return record;
    }
    get(moduleId) {
        return this.modules.get(moduleId) ?? null;
    }
    list() {
        return Array.from(this.modules.values());
    }
    setState(moduleId, state) {
        const record = this.modules.get(moduleId);
        if (!record) {
            throw new Error(`Module ${moduleId} not registered`);
        }
        record.state = state;
        this.modules.set(moduleId, record);
        return record;
    }
}
//# sourceMappingURL=inMemoryRegistry.js.map