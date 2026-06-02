'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  AlertTriangle,
  FlaskConical,
  GitBranch,
  Megaphone,
  Boxes,
  Zap,
  FileText,
  CreditCard,
  ShoppingCart,
  Warehouse,
  Truck,
  Users,
  ScrollText,
  Shield,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Rocket,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TutorialStep {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  details: string[];
  navigationPath?: string;
  tip?: string;
}

// ---------------------------------------------------------------------------
// Step definitions — the full product tour
// ---------------------------------------------------------------------------

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to OrionOps!',
    icon: Rocket,
    description:
      'Your ISO 20000-aligned Enterprise Service Management platform is ready. This quick tour will show you around.',
    details: [
      'Manage incidents, problems, changes, and service requests (ITSM)',
      'Track configuration items and service-level agreements',
      'Run ERP operations: finance, procurement, inventory, billing',
      'BPMN workflow orchestration with approvals and escalations',
    ],
    tip: 'You can restart this tutorial anytime from the Help button in the sidebar.',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    description:
      'Your command center. See open incidents, SLA compliance, pending approvals, and recent activity at a glance.',
    details: [
      'Summary cards show key metrics in real time',
      'Recent incidents table with priority and status badges',
      'SLA compliance gauge — watch for breaches',
      'Quick Actions panel for common tasks',
    ],
    navigationPath: '/dashboard',
    tip: 'Enable auto-refresh (30 s) on the dashboard to keep metrics current.',
  },
  {
    id: 'incidents',
    title: 'Incidents',
    icon: AlertTriangle,
    description:
      'ITIL-aligned incident management. Log, triage, assign, escalate, and resolve incidents with full audit trail.',
    details: [
      'Priority matrix: Critical / High / Medium / Low',
      'Parent-child linking for major incidents',
      'Automatic SLA tracking with breach notifications',
      'Comments, attachments, and assignment history',
    ],
    navigationPath: '/incidents',
    tip: 'Use the global search (Ctrl+K) to find any incident by number or title.',
  },
  {
    id: 'problems',
    title: 'Problems',
    icon: FlaskConical,
    description:
      'Perform root-cause analysis and manage known errors to prevent incident recurrence.',
    details: [
      'Track problems from identification through to closure',
      'Link related incidents to a single problem record',
      'Mark known errors and publish workarounds',
      'Root cause documentation and knowledge integration',
    ],
    navigationPath: '/problems',
  },
  {
    id: 'changes',
    title: 'Change Management',
    icon: GitBranch,
    description:
      'BPMN-powered change management with CAB approval workflows. Standard, normal, and emergency changes.',
    details: [
      'Standard changes: pre-approved, low risk',
      'Normal changes: CAB review and multi-step approval',
      'Emergency changes: expedited approval for critical fixes',
      'Full implementation, rollback, and test plan tracking',
    ],
    navigationPath: '/changes',
    tip: 'Every change can have risk and impact assessments attached.',
  },
  {
    id: 'requests',
    title: 'Service Requests',
    icon: Megaphone,
    description:
      'Self-service catalog for employees. Request equipment, software, access, and more.',
    details: [
      'Submit requests from the service catalog',
      'Approval workflows for high-value requests',
      'Track fulfillment progress end-to-end',
      'Link to procurement for automatic purchase creation',
    ],
    navigationPath: '/requests',
  },
  {
    id: 'cmdb',
    title: 'CMDB',
    icon: Boxes,
    description:
      'Configuration Management Database — map every server, application, database, and network device with their relationships.',
    details: [
      'Track CIs across environments (prod, staging, dev)',
      'Map dependencies: depends_on, hosts, connects_to, contains',
      'Impact analysis for change planning',
      'JSONB attributes for flexible metadata',
    ],
    navigationPath: '/cmdb',
    tip: 'CI relationships power the impact analysis shown during incident triage.',
  },
  {
    id: 'sla',
    title: 'SLA Management',
    icon: Zap,
    description:
      'Define and enforce service-level agreements. Track response and resolution targets per priority.',
    details: [
      'Priority-based SLA definitions (response + resolution)',
      'Real-time SLA instance tracking per incident',
      'Breach notifications and escalation triggers',
      'SLA compliance reporting and dashboards',
    ],
    navigationPath: '/sla',
  },
  {
    id: 'knowledge',
    title: 'Knowledge Base',
    icon: FileText,
    description:
      'Centralized knowledge repository with full-text search. How-to guides, procedures, references, and policies.',
    details: [
      'Article types: how-to, procedure, reference, policy',
      'Review and publish workflow',
      'Tag-based categorization and full-text search',
      'Track views and helpfulness ratings',
    ],
    navigationPath: '/knowledge',
    tip: 'Check the knowledge base before creating a new incident — it might already be solved!',
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: CreditCard,
    description:
      'Enterprise financial management — budgets, cost centers, expenses, invoices, and payments.',
    details: [
      'Manage cost centers and annual budgets',
      'Track expenses and link to incidents/services',
      'Invoice management with line-item detail (JSONB)',
      'Payment processing and audit trail',
    ],
    navigationPath: '/finance',
  },
  {
    id: 'procurement',
    title: 'Procurement',
    icon: ShoppingCart,
    description:
      'End-to-end procurement — purchase requests, RFQs, purchase orders, contracts, and 3-way matching.',
    details: [
      'Raise purchase requests with approval workflows',
      'Issue POs to vendors and track delivery',
      'Contract management with auto-renewal tracking',
      '3-way matching: PO vs. receipt vs. invoice',
    ],
    navigationPath: '/procurement',
  },
  {
    id: 'inventory',
    title: 'Inventory & Assets',
    icon: Warehouse,
    description:
      'Track physical and IT assets, manage stock levels, warehouses, and depreciation.',
    details: [
      'Inventory items with low-stock alerts',
      'Warehouse management and stock movements',
      'IT asset lifecycle: procurement → assignment → retirement',
      'Depreciation tracking and current value calculation',
    ],
    navigationPath: '/inventory',
  },
  {
    id: 'vendors',
    title: 'Vendors',
    icon: Truck,
    description:
      'Vendor master data, performance tracking, and SLA monitoring for your supplier ecosystem.',
    details: [
      'Vendor profiles with ratings and notes',
      'SLA tracking per vendor contract',
      'Periodic performance evaluations',
      'Quality scores and responsiveness metrics',
    ],
    navigationPath: '/vendors',
  },
  {
    id: 'workforce',
    title: 'Workforce',
    icon: Users,
    description:
      'Employee directory, skills management, and capacity planning for your teams.',
    details: [
      'Employee records linked to user accounts',
      'Skills inventory with proficiency levels',
      'Skill-based resource lookup for assignments',
      'Team capacity planning and allocation',
    ],
    navigationPath: '/workforce',
  },
  {
    id: 'billing',
    title: 'Billing',
    icon: ScrollText,
    description:
      'SaaS billing with usage metering, cost models, and invoice generation.',
    details: [
      'Service usage recording and metering',
      'Cost models with configurable pricing parameters',
      'Automated billing record generation',
      'Cost center chargebacks',
    ],
    navigationPath: '/billing',
  },
  {
    id: 'admin',
    title: 'Admin & Compliance',
    icon: Shield,
    description:
      'System administration, role-based access control, audit logging, and reporting.',
    details: [
      'User management with Keycloak SSO',
      'Role-based permissions with fine-grained access control',
      'Immutable audit trail for compliance',
      'Executive dashboards and reporting',
    ],
    navigationPath: '/admin',
    tip: 'The audit log records every data change with old/new values for full traceability.',
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts & Tips',
    icon: HelpCircle,
    description: 'Power-user shortcuts to navigate OrionOps faster.',
    details: [],
    tip: '',
  },
  {
    id: 'done',
    title: "You're All Set!",
    icon: CheckCircle2,
    description:
      'You now know your way around OrionOps. Start by exploring the dashboard or creating your first incident.',
    details: [],
  },
];

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'orionops_tutorial_completed';
const DISMISSED_KEY = 'orionops_tutorial_dismissed';

function getTutorialState(): { completed: boolean; dismissed: boolean } {
  if (typeof window === 'undefined') return { completed: false, dismissed: false };
  return {
    completed: localStorage.getItem(STORAGE_KEY) === 'true',
    dismissed: localStorage.getItem(DISMISSED_KEY) === 'true',
  };
}

function markTutorialCompleted() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

function markTutorialDismissed() {
  localStorage.setItem(DISMISSED_KEY, 'true');
}

function resetTutorialState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DISMISSED_KEY);
}

// ---------------------------------------------------------------------------
// Shortcuts data for the shortcuts step
// ---------------------------------------------------------------------------

const SHORTCUTS = [
  { keys: 'Ctrl + B', action: 'Toggle sidebar' },
  { keys: 'Ctrl + K', action: 'Global search' },
  { keys: 'Ctrl + /', action: 'Keyboard shortcuts' },
  { keys: 'Escape', action: 'Close dialog / overlay' },
];

// ---------------------------------------------------------------------------
// Tutorial Component
// ---------------------------------------------------------------------------

interface InteractiveTutorialProps {
  /** Force the tutorial to show regardless of completion state */
  forceOpen?: boolean;
  /** Callback when tutorial is closed */
  onClose?: () => void;
}

export function InteractiveTutorial({ forceOpen = false, onClose }: InteractiveTutorialProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Auto-open for first-time users
  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    const { completed, dismissed } = getTutorialState();
    if (!completed && !dismissed) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const step = TUTORIAL_STEPS[currentStep];
  const StepIcon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  const handleClose = useCallback(() => {
    setOpen(false);
    if (!forceOpen) {
      markTutorialDismissed();
    }
    onClose?.();
  }, [forceOpen, onClose]);

  const handleNext = useCallback(() => {
    if (isLast) {
      markTutorialCompleted();
      setCompletedSteps((prev) => new Set([...prev, step.id]));
      setOpen(false);
      onClose?.();
      return;
    }
    setCompletedSteps((prev) => new Set([...prev, step.id]));
    setCurrentStep((prev) => Math.min(prev + 1, TUTORIAL_STEPS.length - 1));
  }, [isLast, step.id, onClose]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    markTutorialCompleted();
    setOpen(false);
    onClose?.();
  }, [onClose]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Step counter + skip */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs text-muted-foreground">
              Skip tour
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {/* Icon + Title */}
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <StepIcon className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-xl">{step.title}</DialogTitle>
            </div>
            <DialogDescription className="text-sm leading-relaxed">
              {step.description}
            </DialogDescription>
          </DialogHeader>

          {/* Step content */}
          <div className="mt-5 space-y-4">
            {/* Detail bullets */}
            {step.details.length > 0 && (
              <ul className="space-y-2">
                {step.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground/80">{detail}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Shortcuts table (for shortcuts step) */}
            {step.id === 'shortcuts' && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                {SHORTCUTS.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{s.action}</span>
                    <kbd className="rounded border bg-background px-2 py-0.5 text-xs font-mono shadow-sm">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation hint */}
            {step.navigationPath && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
                <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs text-primary font-medium">
                  Find this in the sidebar under {step.title}
                </span>
              </div>
            )}

            {/* Tip callout */}
            {step.tip && (
              <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <span className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  <strong>Pro tip:</strong> {step.tip}
                </span>
              </div>
            )}

            {/* Completion step */}
            {step.id === 'done' && (
              <div className="text-center py-4 space-y-3">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Head to the <strong>Dashboard</strong> to see your demo data, or create your first incident.
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={isFirst}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {/* Step dots */}
            <div className="hidden sm:flex items-center gap-1">
              {TUTORIAL_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentStep(idx);
                  }}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    idx === currentStep
                      ? 'w-6 bg-primary'
                      : completedSteps.has(s.id)
                        ? 'w-1.5 bg-primary/40'
                        : 'w-1.5 bg-muted-foreground/25'
                  )}
                  aria-label={`Go to step ${idx + 1}: ${s.title}`}
                />
              ))}
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              className="gap-1"
            >
              {isLast ? 'Get Started' : 'Next'}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Hook to check / reset tutorial state (used by sidebar Help button)
// ---------------------------------------------------------------------------

export function useTutorialState() {
  const [showTutorial, setShowTutorial] = useState(false);

  const startTutorial = useCallback(() => {
    resetTutorialState();
    setShowTutorial(true);
  }, []);

  const handleTutorialClose = useCallback(() => {
    setShowTutorial(false);
  }, []);

  return { showTutorial, startTutorial, handleTutorialClose };
}
