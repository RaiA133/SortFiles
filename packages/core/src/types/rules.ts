/**
 * Rule condition types
 */
export type RuleConditionType =
  | 'extension'
  | 'name_pattern'
  | 'size'
  | 'date'
  | 'mime_type'
  | 'path_pattern';

/**
 * Rule condition operators
 */
export type RuleOperator = 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with';

/**
 * Rule action types
 */
export type RuleActionType = 'move' | 'copy';

/**
 * Single rule condition
 */
export interface RuleCondition {
  /** Type of condition */
  type: RuleConditionType;
  /** Operator for comparison */
  operator: RuleOperator;
  /** Value to compare against (can be string, number, or RegExp pattern) */
  value: string | number | RegExp;
  /** Whether to negate the condition (NOT) */
  negate?: boolean;
  /** Optional case sensitivity for string operations */
  caseSensitive?: boolean;
}

/**
 * Rule action
 */
export interface RuleAction {
  /** Type of action to perform */
  type: RuleActionType;
  /** Destination path template (supports variables) */
  destination: string;
  /** Whether to create destination folder if it doesn't exist */
  createFolder?: boolean;
  /** Whether to overwrite existing files */
  overwrite?: boolean;
  /** Whether to add suffix if file exists */
  addSuffixIfExists?: boolean;
}

/**
 * Sorting rule
 */
export interface Rule {
  /** Unique identifier for the rule */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what the rule does */
  description: string;
  /** Conditions that must all match */
  conditions: RuleCondition[];
  /** Action to perform when conditions match */
  action: RuleAction;
  /** Priority (higher = evaluated first) */
  priority: number;
  /** Whether the rule is enabled */
  enabled?: boolean;
  /** Optional tags for grouping */
  tags?: string[];
}

/**
 * Supported variables for destination paths
 */
export type DestinationVariable =
  | '{base}'
  | '{name}'
  | '{name_no_ext}'
  | '{ext}'
  | '{year}'
  | '{month}'
  | '{day}'
  | '{date}'
  | '{time}';

/**
 * Rule validation result
 */
export interface RuleValidationResult {
  /** Whether the rule is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}
