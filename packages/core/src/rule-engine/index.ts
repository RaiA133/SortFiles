/**
 * Rule Engine Module
 *
 * Provides functionality for evaluating rules and generating sorting plans.
 */

export {
  RuleEngine,
  type SortingPlan,
  type FileMoveOperation,
  type FileSkipOperation,
  type SortingSummary,
} from './engine';

export {
  defaultRules,
  getDefaultRules,
  getRulesByCategory,
  getRuleById,
} from './default-rules';

export {
  RuleParser,
  RuleBuilder,
} from './rule-parser';
