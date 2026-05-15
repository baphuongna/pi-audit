/**
 * Audit Trail - pi-audit
 * 
 * Append-only JSONL audit log with typed entries.
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface AuditEntry {
  id: string;
  kind: string;
  created_at: string;
  actor?: string;
  issue_id?: string;
  model?: string;
  prompt?: string;
  response?: string;
  error?: string;
  tool_name?: string;
  exit_code?: number;
  label?: 'good' | 'bad' | 'corrected';
  reason?: string;
  extra?: Record<string, unknown>;
}

export interface AuditTrailOptions {
  filePath?: string;
  maxEntries?: number;
}

/**
 * Creates audit trail manager
 */
export function createAuditTrail(options: AuditTrailOptions = {}) {
  const { filePath = '.audit/interactions.jsonl', maxEntries = 10000 } = options;
  
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  function generateId(): string {
    return `AUD-${randomUUID()}`;
  }
  
  return {
    log(entry: Omit<AuditEntry, 'id' | 'created_at'>): AuditEntry {
      const full: AuditEntry = {
        ...entry,
        id: generateId(),
        created_at: new Date().toISOString()
      };
      const line = JSON.stringify(full) + '\n';
      fs.appendFileSync(filePath, line, 'utf-8');
      return full;
    },
    
    logModelCall(model: string, prompt: string, response: string, error?: string): AuditEntry {
      return this.log({ kind: 'model_call', model, prompt, response, error });
    },
    
    logToolCall(toolName: string, exitCode?: number, error?: string): AuditEntry {
      return this.log({ kind: 'tool_call', tool_name: toolName, exit_code: exitCode, error });
    },
    
    logFinding(kind: string, severity: string, description: string): AuditEntry {
      return this.log({ kind: 'finding', issue_id: kind, response: description, label: severity as AuditEntry['label'] });
    },
    
    readAll(): AuditEntry[] {
      if (!fs.existsSync(filePath)) return [];
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.trim().split('\n').filter(line => line.trim()).map(line => { try { return JSON.parse(line) as AuditEntry; } catch { return null; } }).filter((e): e is AuditEntry => e !== null);
    },
    
    recent(count: number = 10): AuditEntry[] {
      return this.readAll().slice(-count);
    },
    
    getStats(): { total: number; byKind: Record<string, number>; byLabel: Record<string, number> } {
      const entries = this.readAll();
      const byKind: Record<string, number> = {};
      const byLabel: Record<string, number> = {};
      for (const e of entries) {
        byKind[e.kind] = (byKind[e.kind] || 0) + 1;
        if (e.label) byLabel[e.label] = (byLabel[e.label] || 0) + 1;
      }
      return { total: entries.length, byKind, byLabel };
    }
  };
}
