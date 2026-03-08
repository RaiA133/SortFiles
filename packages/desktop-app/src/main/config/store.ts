import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

class ConfigStore<T extends Record<string, any>> {
  private path: string;
  private data: T;
  private defaults: T;

  constructor(defaults: T, fileName = 'config.json') {
    const userDataPath = app.getPath('userData');
    this.path = path.join(userDataPath, fileName);
    this.defaults = defaults;
    this.data = { ...defaults };
  }

  async init(): Promise<void> {
    try {
      const fileData = await fs.readFile(this.path, 'utf-8');
      this.data = {
        ...this.defaults,
        ...JSON.parse(fileData),
      };
    } catch (error) {
      // File doesn't exist or is invalid, use defaults
      this.data = { ...this.defaults };
      await this.save();
    }
  }

  async get<K extends keyof T>(key: K): Promise<T[K]> {
    return this.data[key];
  }

  async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    this.data[key] = value;
    await this.save();
  }

  async getAll(): Promise<T> {
    return { ...this.data };
  }

  async setAll(value: Partial<T>): Promise<void> {
    this.data = {
      ...this.defaults,
      ...value,
    };
    await this.save();
  }

  async clear(): Promise<void> {
    this.data = { ...this.defaults };
    await this.save();
  }

  async delete<K extends keyof T>(key: K): Promise<void> {
    delete this.data[key];
    await this.save();
  }

  private async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.path), { recursive: true });
    await fs.writeFile(this.path, JSON.stringify(this.data, null, 2));
  }
}

export default ConfigStore;
