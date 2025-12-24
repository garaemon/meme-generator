import Dexie, { Table } from 'dexie';

export interface MemeTemplate {
  id?: number;
  name: string;
  data: string; // Base64 or Blob url
  isCustom: boolean;
  addedAt: Date;
}

export interface MemeHistory {
  id?: number;
  thumbnail: string; // Base64 image of the result
  canvasState: object; // Fabric.js JSON object
  createdAt: Date;
}

export class MemeGeneratorDB extends Dexie {
  templates!: Table<MemeTemplate>;
  history!: Table<MemeHistory>;

  constructor() {
    super('MemeGeneratorDB');
    this.version(1).stores({
      templates: '++id, name, isCustom, addedAt',
      history: '++id, createdAt'
    });
  }
}

export const db = new MemeGeneratorDB();
