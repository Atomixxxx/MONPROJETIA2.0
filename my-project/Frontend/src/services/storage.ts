import { Storage } from 'some-storage-library'; // Replace with actual storage library import

class StorageService {
    private storage: Storage;

    constructor() {
        this.storage = new Storage();
    }

    // Save data to storage
    saveData(key: string, value: any): void {
        this.storage.setItem(key, JSON.stringify(value));
    }

    // Retrieve data from storage
    getData(key: string): any {
        const data = this.storage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // Remove data from storage
    removeData(key: string): void {
        this.storage.removeItem(key);
    }

    // Clear all storage
    clearStorage(): void {
        this.storage.clear();
    }
}

export default new StorageService();