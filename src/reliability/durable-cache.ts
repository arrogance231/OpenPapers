import { DatabaseSync } from 'node:sqlite';
import type { CacheEntry, DurableResponseCache } from './reliability.js';

export class SqliteResponseCache implements DurableResponseCache {
  private readonly db:DatabaseSync;
  constructor(path:string) {
    this.db=new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS response_cache (cache_key TEXT PRIMARY KEY, status INTEGER NOT NULL, headers TEXT NOT NULL, body TEXT NOT NULL, expires_at INTEGER NOT NULL);');
  }
  async get(key:string):Promise<CacheEntry|undefined> {
    const row=this.db.prepare('SELECT status,headers,body,expires_at AS expiresAt FROM response_cache WHERE cache_key=?').get(key) as {status:number;headers:string;body:string;expiresAt:number}|undefined;
    if(!row)return undefined;
    if(row.expiresAt<=Date.now()){this.db.prepare('DELETE FROM response_cache WHERE cache_key=?').run(key);return undefined;}
    return {status:row.status,headers:JSON.parse(row.headers) as Record<string,string>,body:row.body,expiresAt:row.expiresAt};
  }
  async set(key:string,entry:CacheEntry):Promise<void> { this.db.prepare('INSERT INTO response_cache(cache_key,status,headers,body,expires_at) VALUES(?,?,?,?,?) ON CONFLICT(cache_key) DO UPDATE SET status=excluded.status,headers=excluded.headers,body=excluded.body,expires_at=excluded.expires_at').run(key,entry.status,JSON.stringify(entry.headers),entry.body,entry.expiresAt); }
  async delete(key:string):Promise<void> { this.db.prepare('DELETE FROM response_cache WHERE cache_key=?').run(key); }
  async close():Promise<void> { this.db.close(); }
}
