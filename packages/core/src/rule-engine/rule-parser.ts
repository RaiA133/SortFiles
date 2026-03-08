import { Rule, RuleCondition, RuleAction } from '../types';

/**
 * Rule parser - Parse rules from various formats
 */
export class RuleParser {
  /**
   * Parse rule from JSON
   */
  static fromJSON(json: string): Rule {
    try {
      const parsed = JSON.parse(json);
      return this.validateAndNormalize(parsed);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error}`);
    }
  }

  /**
   * Parse rule from object
   */
  static fromObject(obj: any): Rule {
    return this.validateAndNormalize(obj);
  }

  /**
   * Parse multiple rules from JSON array
   */
  static fromJSONArray(json: string): Rule[] {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        throw new Error('Expected an array of rules');
      }
      return parsed.map((r) => this.validateAndNormalize(r));
    } catch (error) {
      throw new Error(`Invalid JSON array: ${error}`);
    }
  }

  /**
   * Convert rule to JSON
   */
  static toJSON(rule: Rule): string {
    return JSON.stringify(rule, null, 2);
  }

  /**
   * Convert rule to compact JSON
   */
  static toCompactJSON(rule: Rule): string {
    return JSON.stringify(rule);
  }

  /**
   * Convert multiple rules to JSON array
   */
  static toJSONArray(rules: Rule[]): string {
    return JSON.stringify(rules, null, 2);
  }

  /**
   * Validate and normalize a rule object
   */
  private static validateAndNormalize(obj: any): Rule {
    if (!obj.id || typeof obj.id !== 'string') {
      throw new Error('Rule must have a valid id');
    }

    if (!obj.name || typeof obj.name !== 'string') {
      throw new Error('Rule must have a valid name');
    }

    if (!obj.conditions || !Array.isArray(obj.conditions)) {
      throw new Error('Rule must have conditions array');
    }

    if (!obj.action || typeof obj.action !== 'object') {
      throw new Error('Rule must have an action object');
    }

    // Validate conditions
    const conditions: RuleCondition[] = obj.conditions.map((c: any) => {
      if (!c.type || !c.operator || c.value === undefined) {
        throw new Error('Each condition must have type, operator, and value');
      }
      return {
        type: c.type,
        operator: c.operator,
        value: c.value,
        negate: c.negate ?? false,
        caseSensitive: c.caseSensitive ?? false,
      };
    });

    // Validate action
    const action: RuleAction = {
      type: obj.action.type || 'move',
      destination: obj.action.destination,
      createFolder: obj.action.createFolder ?? true,
      overwrite: obj.action.overwrite ?? false,
      addSuffixIfExists: obj.action.addSuffixIfExists ?? true,
    };

    return {
      id: obj.id,
      name: obj.name,
      description: obj.description || '',
      conditions,
      action,
      priority: obj.priority ?? 10,
      enabled: obj.enabled ?? true,
      tags: obj.tags || [],
    };
  }

  /**
   * Parse rule from simple expression format
   * Format: "if [condition] then [action] with priority [priority]"
   */
  static fromExpression(expression: string): Rule {
    // Simple expression parser for common patterns
    // Example: "if extension equals .pdf then move to Documents/PDFs"

    const match = expression.match(
      /if\s+(.+?)\s+then\s+(move|copy)\s+to\s+(.+?)(?:\s+with\s+priority\s+(\d+))?$/i
    );

    if (!match) {
      throw new Error('Invalid expression format');
    }

    const [, conditionStr, actionType, destination, priorityStr] = match;
    if (!conditionStr || !actionType || !destination) {
      throw new Error('Invalid expression format: missing required parts');
    }
    const condition = this.parseConditionExpression(conditionStr.trim());

    return {
      id: this.generateId(),
      name: `Rule from expression: ${expression}`,
      description: expression,
      conditions: [condition],
      action: {
        type: actionType as 'move' | 'copy',
        destination: destination.trim(),
      },
      priority: priorityStr ? parseInt(priorityStr, 10) : 10,
      enabled: true,
    };
  }

  /**
   * Parse condition from expression
   */
  private static parseConditionExpression(expr: string): RuleCondition {
    // Pattern: "extension equals .pdf"
    // Pattern: "name contains receipt"
    // Pattern: "size greater than 100"

    const operators = ['equals', 'contains', 'matches', 'greater_than', 'less_than', 'starts_with', 'ends_with'];

    for (const op of operators) {
      const pattern = new RegExp(`^(\\w+)\\s+${op}\\s+(.+)$`, 'i');
      const match = expr.match(pattern);

      if (match) {
        const type = match[1];
        const value = match[2];

        if (!type || !value) {
          continue;
        }

        // Try to parse as number for size
        const numValue = parseFloat(value);
        const finalValue = !isNaN(numValue) ? numValue : value;

        return {
          type: type.toLowerCase() as any,
          operator: op as any,
          value: finalValue,
        };
      }
    }

    throw new Error(`Cannot parse condition: ${expr}`);
  }

  /**
   * Generate a unique rule ID
   */
  private static generateId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Rule template builder - Helper for creating rules
 */
export class RuleBuilder {
  private rule: Partial<Rule> = {
    enabled: true,
    priority: 10,
    tags: [],
  };

  /**
   * Set rule ID
   */
  withId(id: string): this {
    this.rule.id = id;
    return this;
  }

  /**
   * Set rule name
   */
  withName(name: string): this {
    this.rule.name = name;
    return this;
  }

  /**
   * Set rule description
   */
  withDescription(description: string): this {
    this.rule.description = description;
    return this;
  }

  /**
   * Set rule priority
   */
  withPriority(priority: number): this {
    this.rule.priority = priority;
    return this;
  }

  /**
   * Add condition
   */
  addCondition(condition: RuleCondition): this {
    if (!this.rule.conditions) {
      this.rule.conditions = [];
    }
    this.rule.conditions.push(condition);
    return this;
  }

  /**
   * Add extension condition
   */
  withExtension(extension: string): this {
    return this.addCondition({
      type: 'extension',
      operator: 'equals',
      value: extension.startsWith('.') ? extension : `.${extension}`,
    });
  }

  /**
   * Add name pattern condition
   */
  withNameContaining(pattern: string): this {
    return this.addCondition({
      type: 'name_pattern',
      operator: 'contains',
      value: pattern,
    });
  }

  /**
   * Add size condition
   */
  withSizeGreaterThan(sizeMB: number): this {
    return this.addCondition({
      type: 'size',
      operator: 'greater_than',
      value: sizeMB,
    });
  }

  /**
   * Set move action
   */
  moveTo(destination: string): this {
    this.rule.action = {
      type: 'move',
      destination,
      createFolder: true,
    };
    return this;
  }

  /**
   * Set copy action
   */
  copyTo(destination: string): this {
    this.rule.action = {
      type: 'copy',
      destination,
      createFolder: true,
    };
    return this;
  }

  /**
   * Add tags
   */
  withTags(...tags: string[]): this {
    if (!this.rule.tags) {
      this.rule.tags = [];
    }
    this.rule.tags.push(...tags);
    return this;
  }

  /**
   * Build the rule
   */
  build(): Rule {
    if (!this.rule.id) {
      this.rule.id = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    if (!this.rule.name) {
      throw new Error('Rule must have a name');
    }

    if (!this.rule.conditions || this.rule.conditions.length === 0) {
      throw new Error('Rule must have at least one condition');
    }

    if (!this.rule.action) {
      throw new Error('Rule must have an action');
    }

    return this.rule as Rule;
  }
}
