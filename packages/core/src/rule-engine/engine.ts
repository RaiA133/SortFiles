import { FileInfo, Rule, RuleCondition } from '../types';
import { join, dirname, basename } from 'path';

/**
 * Sorting plan for file organization
 */
export interface SortingPlan {
  moves: FileMoveOperation[];
  skips: FileSkipOperation[];
  errors: string[];
  summary: SortingSummary;
}

export interface FileMoveOperation {
  source: string;
  destination: string;
  ruleId: string;
  ruleName: string;
  action: 'move' | 'copy';
}

export interface FileSkipOperation {
  source: string;
  reason: string;
}

export interface SortingSummary {
  totalFiles: number;
  filesToMove: number;
  filesToSkip: number;
  filesToCopy: number;
  estimatedReduction?: number;
}

/**
 * Rule Engine - Evaluates rules and generates sorting plans
 */
export class RuleEngine {
  private rules: Rule[];

  constructor(rules: Rule[] = []) {
    this.rules = this.sortRulesByPriority(rules);
  }

  /**
   * Add a rule to the engine
   */
  addRule(rule: Rule): void {
    this.rules.push(rule);
    this.rules = this.sortRulesByPriority(this.rules);
  }

  /**
   * Remove a rule from the engine
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update an existing rule
   */
  updateRule(ruleId: string, updatedRule: Rule): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      this.rules[index] = updatedRule;
      this.rules = this.sortRulesByPriority(this.rules);
      return true;
    }
    return false;
  }

  /**
   * Get all rules
   */
  getRules(): Rule[] {
    return [...this.rules];
  }

  /**
   * Get a rule by ID
   */
  getRule(ruleId: string): Rule | undefined {
    return this.rules.find((r) => r.id === ruleId);
  }

  /**
   * Generate sorting plan for files based on rules
   */
  generatePlan(files: FileInfo[], destinationBase: string): SortingPlan {
    const plan: SortingPlan = {
      moves: [],
      skips: [],
      errors: [],
      summary: {
        totalFiles: files.length,
        filesToMove: 0,
        filesToSkip: 0,
        filesToCopy: 0,
      },
    };

    for (const file of files) {
      try {
        const matchedRule = this.findMatchingRule(file);

        if (matchedRule) {
          const destination = this.resolveDestination(
            matchedRule.action.destination,
            file,
            destinationBase
          );

          plan.moves.push({
            source: file.path,
            destination,
            ruleId: matchedRule.id,
            ruleName: matchedRule.name,
            action: matchedRule.action.type,
          });

          if (matchedRule.action.type === 'move') {
            plan.summary.filesToMove++;
          } else {
            plan.summary.filesToCopy++;
          }
        } else {
          // No matching rule - add to "Other" folder as fallback
          const otherDestination = this.resolveDestination(
            'Other/{name}',
            file,
            destinationBase
          );

          plan.moves.push({
            source: file.path,
            destination: otherDestination,
            ruleId: 'default-other',
            ruleName: 'Other (Uncategorized)',
            action: 'move',
          });

          plan.summary.filesToMove++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        plan.errors.push(`${file.path}: ${errorMsg}`);
        plan.summary.filesToSkip++;
      }
    }

    // Detect and resolve conflicts
    this.resolveConflicts(plan);

    // Calculate estimated reduction (for moves)
    if (plan.summary.filesToMove > 0) {
      const uniqueDestinations = new Set(plan.moves.map((m) => dirname(m.destination)));
      plan.summary.estimatedReduction = files.length - uniqueDestinations.size;
    }

    return plan;
  }

  /**
   * Find first matching rule for a file (rules are pre-sorted by priority)
   */
  private findMatchingRule(file: FileInfo): Rule | null {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (this.matchesRule(file, rule)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Check if a file matches all conditions of a rule
   */
  private matchesRule(file: FileInfo, rule: Rule): boolean {
    // Group conditions by type
    const conditionsByType = new Map<string, typeof rule.conditions>();

    for (const condition of rule.conditions) {
      if (!conditionsByType.has(condition.type)) {
        conditionsByType.set(condition.type, []);
      }
      conditionsByType.get(condition.type)!.push(condition);
    }

    // All condition types must match (AND between different types)
    // But multiple conditions of the same type use OR logic
    return Array.from(conditionsByType.values()).every((conditions) => {
      return conditions.some((condition) => {
        const matches = this.matchesCondition(file, condition);
        return condition.negate ? !matches : matches;
      });
    });
  }

  /**
   * Check if a file matches a single condition
   */
  private matchesCondition(file: FileInfo, condition: RuleCondition): boolean {
    const caseSensitive = condition.caseSensitive ?? false;

    switch (condition.type) {
      case 'extension':
        return this.evaluateStringCondition(
          file.extension.toLowerCase(),
          condition.operator,
          condition.value as string,
          caseSensitive
        );

      case 'name_pattern':
        const name = caseSensitive ? file.name : file.name.toLowerCase();
        const patternValue = condition.value as string;

        switch (condition.operator) {
          case 'contains':
            return name.includes(caseSensitive ? patternValue : patternValue.toLowerCase());
          case 'matches':
            const pattern = condition.value instanceof RegExp
              ? condition.value
              : new RegExp(patternValue, caseSensitive ? '' : 'i');
            return pattern.test(file.name);
          case 'starts_with':
            return name.startsWith(caseSensitive ? patternValue : patternValue.toLowerCase());
          case 'ends_with':
            return name.endsWith(caseSensitive ? patternValue : patternValue.toLowerCase());
          default:
            return false;
        }

      case 'size':
        return this.evaluateNumberCondition(
          file.size,
          condition.operator,
          this.convertSizeToBytes(condition.value as number)
        );

      case 'date':
        const fileDate = file.modifiedAt;
        const compareDate = new Date(condition.value as string);
        return this.evaluateDateCondition(fileDate, condition.operator, compareDate);

      case 'mime_type':
        const mimeType = file.mimeType || '';
        return this.evaluateStringCondition(
          mimeType,
          condition.operator,
          condition.value as string,
          caseSensitive
        );

      case 'path_pattern':
        const path = caseSensitive ? file.path : file.path.toLowerCase();
        const pathValue = condition.value as string;

        switch (condition.operator) {
          case 'contains':
            return path.includes(caseSensitive ? pathValue : pathValue.toLowerCase());
          case 'matches':
            const pathPattern = condition.value instanceof RegExp
              ? condition.value
              : new RegExp(pathValue, caseSensitive ? '' : 'i');
            return pathPattern.test(file.path);
          default:
            return false;
        }

      default:
        return false;
    }
  }

  /**
   * Resolve destination path with variable substitution
   * File name is ALWAYS preserved - never changed
   */
  private resolveDestination(template: string, file: FileInfo, base: string): string {
    const now = new Date();
    const fileBasename = basename(file.name, file.extension);
    const fileDirname = dirname(file.path);

    const substitutions: Record<string, string> = {
      '{name}': file.name,
      '{name_no_ext}': fileBasename,
      '{ext}': file.extension,
      '{year}': now.getFullYear().toString(),
      '{month}': (now.getMonth() + 1).toString().padStart(2, '0'),
      '{day}': now.getDate().toString().padStart(2, '0'),
      '{date}': (now.toISOString().split('T')[0] ?? now.toISOString()),
      '{time}': (now.toTimeString().split(' ')[0] ?? ''),
      '{file_year}': file.modifiedAt.getFullYear().toString(),
      '{file_month}': (file.modifiedAt.getMonth() + 1).toString().padStart(2, '0'),
      '{file_day}': file.modifiedAt.getDate().toString().padStart(2, '0'),
      '{file_date}': (file.modifiedAt.toISOString().split('T')[0] ?? file.modifiedAt.toISOString()),
      '{parent_dir}': basename(fileDirname),
    };

    // Apply substitutions to the template
    let resolved = template;
    for (const [key, value] of Object.entries(substitutions)) {
      resolved = resolved.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    // Check if the template already includes {name} variable
    const templateHasName = template.includes('{name}');

    if (templateHasName) {
      // Template already specifies where to put the filename
      return join(base, resolved);
    } else {
      // Template only specifies folder structure, append filename
      // File names are NEVER changed
      return join(base, resolved, file.name);
    }
  }

  /**
   * Resolve conflicts in the sorting plan
   * Strategy: Skip files that would overwrite existing files (keep original)
   */
  private resolveConflicts(plan: SortingPlan): void {
    // Group operations by final destination file name
    const destFileMap = new Map<string, FileMoveOperation[]>();

    for (const move of plan.moves) {
      const destFileName = move.destination; // Full path including filename
      if (!destFileMap.has(destFileName)) {
        destFileMap.set(destFileName, []);
      }
      destFileMap.get(destFileName)!.push(move);
    }

    // Check for collisions - keep first file, mark others for skip
    const toSkip: string[] = [];
    for (const moves of destFileMap.values()) {
      if (moves.length > 1) {
        // Keep the first file, mark others for skip
        for (let i = 1; i < moves.length; i++) {
          const move = moves[i];
          if (move) {
            toSkip.push(move.source);
          }
        }
      }
    }

    // Remove skipped moves from plan
    if (toSkip.length > 0) {
      plan.moves = plan.moves.filter((move) => !toSkip.includes(move.source));
      plan.skips.push(...toSkip.map((source) => ({
        source,
        reason: 'File with same name already exists at destination. Keeping original.',
      })));
      plan.summary.filesToSkip += toSkip.length;
      plan.summary.filesToMove -= toSkip.length;
    }
  }

  /**
   * Evaluate string condition
   */
  private evaluateStringCondition(
    actual: string,
    operator: string,
    expected: string,
    caseSensitive: boolean
  ): boolean {
    const a = caseSensitive ? actual : actual.toLowerCase();
    const e = caseSensitive ? expected : expected.toLowerCase();

    switch (operator) {
      case 'equals':
        return a === e;
      case 'contains':
        return a.includes(e);
      case 'starts_with':
        return a.startsWith(e);
      case 'ends_with':
        return a.endsWith(e);
      default:
        return false;
    }
  }

  /**
   * Evaluate number condition
   */
  private evaluateNumberCondition(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      default:
        return false;
    }
  }

  /**
   * Evaluate date condition
   */
  private evaluateDateCondition(actual: Date, operator: string, expected: Date): boolean {
    const actualTime = actual.getTime();
    const expectedTime = expected.getTime();

    switch (operator) {
      case 'equals':
        return actualTime === expectedTime;
      case 'greater_than':
        return actualTime > expectedTime;
      case 'less_than':
        return actualTime < expectedTime;
      default:
        return false;
    }
  }

  /**
   * Convert size to bytes (assumes input is in MB)
   */
  private convertSizeToBytes(size: number): number {
    return size * 1024 * 1024;
  }

  /**
   * Sort rules by priority (highest first)
   */
  private sortRulesByPriority(rules: Rule[]): Rule[] {
    return [...rules].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Validate a rule
   */
  validateRule(rule: Rule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.id) {
      errors.push('Rule must have an ID');
    }

    if (!rule.name) {
      errors.push('Rule must have a name');
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push('Rule must have at least one condition');
    }

    if (!rule.action) {
      errors.push('Rule must have an action');
    }

    if (rule.action?.destination) {
      // Check if destination contains valid variables
      const validVariables = [
        '{base}',
        '{name}',
        '{name_no_ext}',
        '{ext}',
        '{year}',
        '{month}',
        '{day}',
        '{date}',
        '{time}',
        '{file_year}',
        '{file_month}',
        '{file_day}',
        '{file_date}',
        '{parent_dir}',
      ];

      const variablePattern = /\{[^}]+\}/g;
      const variables = rule.action.destination.match(variablePattern);
      if (variables) {
        for (const variable of variables) {
          if (!validVariables.includes(variable)) {
            errors.push(`Unknown variable: ${variable}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
