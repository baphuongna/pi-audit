/**
 * Category Audit - pi-audit
 * 
 * Categorizes audit findings by type for better organization
 * and filtering.
 */


import { randomUUID } from 'node:crypto';
export type AuditCategory = 
  | 'security'      // Security vulnerabilities
  | 'performance'   // Performance issues
  | 'maintainability' // Code maintainability
  | 'testing'       // Testing coverage
  | 'production'    // Production readiness
  | 'correctness'   // Logic/behavior bugs
  | 'style'         // Code style issues
  | 'documentation' // Documentation gaps
  | 'dependency'    // Dependency issues
  | 'accessibility'; // Accessibility issues

export interface CategorizedFinding {
  id: string;
  category: AuditCategory;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  file?: string;
  line?: number;
  rule?: string;
  effort?: 'small' | 'medium' | 'large';
}

export interface CategorySummary {
  category: AuditCategory;
  count: number;
  bySeverity: Record<string, number>;
  totalEffort?: Record<string, number>;
}

/**
 * Creates category analyzer for audit findings
 */
export function createCategoryAnalyzer() {
  const findings: CategorizedFinding[] = [];
  
  function generateId(): string {
    return `AUDIT-${randomUUID()}`;
  }
  
  return {
    /**
     * Add a finding
     */
    add(finding: Omit<CategorizedFinding, 'id'>): CategorizedFinding {
      const categorized: CategorizedFinding = {
        ...finding,
        id: generateId()
      };
      findings.push(categorized);
      return categorized;
    },
    
    /**
     * Get all findings
     */
    getAll(): CategorizedFinding[] {
      return [...findings];
    },
    
    /**
     * Get findings by category
     */
    byCategory(category: AuditCategory): CategorizedFinding[] {
      return findings.filter(f => f.category === category);
    },
    
    /**
     * Get findings by severity
     */
    bySeverity(severity: CategorizedFinding['severity']): CategorizedFinding[] {
      return findings.filter(f => f.severity === severity);
    },
    
    /**
     * Filter findings
     */
    filter(options: {
      category?: AuditCategory;
      severity?: CategorizedFinding['severity'];
      minSeverity?: CategorizedFinding['severity'];
      file?: string;
      effort?: CategorizedFinding['effort'];
    }): CategorizedFinding[] {
      return findings.filter(f => {
        if (options.category && f.category !== options.category) return false;
        if (options.severity && f.severity !== options.severity) return false;
        if (options.file && f.file !== options.file) return false;
        if (options.effort && f.effort !== options.effort) return false;
        
        if (options.minSeverity) {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
          if (severityOrder[f.severity] > severityOrder[options.minSeverity]) return false;
        }
        
        return true;
      });
    },
    
    /**
     * Generate category summary
     */
    getSummary(): CategorySummary[] {
      const summaries: Record<AuditCategory, CategorySummary> = {} as Record<AuditCategory, CategorySummary>;
      
      // Initialize
      const categories: AuditCategory[] = [
        'security', 'performance', 'maintainability', 'testing',
        'production', 'correctness', 'style', 'documentation', 'dependency', 'accessibility'
      ];
      
      for (const cat of categories) {
        summaries[cat] = {
          category: cat,
          count: 0,
          bySeverity: {}
        };
      }
      
      // Count
      for (const finding of findings) {
        summaries[finding.category].count++;
        summaries[finding.category].bySeverity[finding.severity] = 
          (summaries[finding.category].bySeverity[finding.severity] || 0) + 1;
        
        if (finding.effort) {
          if (!summaries[finding.category].totalEffort) {
            summaries[finding.category].totalEffort = {};
          }
          summaries[finding.category].totalEffort![finding.effort] =
            (summaries[finding.category].totalEffort![finding.effort] || 0) + 1;
        }
      }
      
      return Object.values(summaries).filter(s => s.count > 0);
    },
    
    /**
     * Generate markdown report
     */
    generateReport(): string {
      const lines = ['# Audit Report\n'];
      const summary = this.getSummary();
      
      // Summary table
      lines.push('## Summary\n');
      lines.push('| Category | Count | Critical | High | Medium | Low | Info |');
      lines.push('|----------|-------|----------|------|--------|-----|------|');
      
      for (const s of summary) {
        lines.push(`| ${s.category} | ${s.count} | ${s.bySeverity.critical || 0} | ${s.bySeverity.high || 0} | ${s.bySeverity.medium || 0} | ${s.bySeverity.low || 0} | ${s.bySeverity.info || 0} |`);
      }
      
      // Detailed findings by category
      lines.push('\n## Detailed Findings\n');
      
      for (const s of summary) {
        lines.push(`\n### ${s.category.charAt(0).toUpperCase() + s.category.slice(1)} (${s.count})\n`);
        const catFindings = this.byCategory(s.category);
        
        for (const f of catFindings) {
          lines.push(`#### ${f.severity.toUpperCase()}: ${f.title}\n`);
          lines.push(`${f.description}\n`);
          if (f.file) {
            lines.push(`- **File**: ${f.file}${f.line ? `:${f.line}` : ''}`);
          }
          if (f.rule) {
            lines.push(`- **Rule**: ${f.rule}`);
          }
          if (f.effort) {
            lines.push(`- **Effort**: ${f.effort}`);
          }
          lines.push('');
        }
      }
      
      return lines.join('\n');
    },
    
    /**
     * Clear findings
     */
    clear(): void {
      findings.length = 0;
    }
  };
}
