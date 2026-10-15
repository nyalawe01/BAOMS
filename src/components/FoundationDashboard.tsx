import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  CheckCircle2,
  Layers,
  Database,
  Globe2,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { UserRole } from '@/types';

export const FoundationDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [sampleInput, setSampleInput] = useState('');
  const [buttonLoading, setButtonLoading] = useState(false);

  const initialRoles: { role: UserRole; scope: string }[] = [
    { role: 'system_admin', scope: 'Full system administration, audit review, and user management' },
    { role: 'executive_director', scope: 'Strategic oversight, executive approvals, and organizational reporting' },
    { role: 'finance_officer', scope: 'Budget tracking, financial requests, vouchers, and disbursements' },
    { role: 'project_manager', scope: 'Project lifecycle, activity planning, milestones, and reports' },
    { role: 'project_coordinator', scope: 'Field activity execution, attendance lists, and field notes' },
    { role: 'hr_administrator', scope: 'Staff personnel records, leave processing, and compliance' },
  ];

  const handleTestClick = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 800);
  };

  return (
    <div className="space-y-8">
      {/* Top Hero Section */}
      <div className="rounded-xl border border-surface-border bg-white p-6 sm:p-8 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Badge variant="success" withDot>
                {t('foundation.statusBadge')}
              </Badge>
              <span className="text-xs font-mono text-charcoal-light">v0.1.0-alpha</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal">
              {t('foundation.title')}
            </h1>
            <p className="max-w-3xl text-sm sm:text-base text-charcoal-muted leading-relaxed">
              {t('foundation.subtitle')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Button
              variant="primary"
              onClick={handleTestClick}
              isLoading={buttonLoading}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              <span>Verify Interactions</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Grid of Verified Architectural Baselines */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-charcoal">
                  {t('foundation.stackTitle')}
                </h4>
                <span className="text-xs text-charcoal-light">Strict TypeScript</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-charcoal-muted leading-normal">
              {t('foundation.stackDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-charcoal">
                  {t('foundation.securityTitle')}
                </h4>
                <span className="text-xs text-charcoal-light">Zero Secrets Committed</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-charcoal-muted leading-normal">
              {t('foundation.securityDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-[#D68904]">
                <Globe2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-charcoal">
                  {t('foundation.i18nTitle')}
                </h4>
                <span className="text-xs text-charcoal-light">Live Localization</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-charcoal-muted leading-normal">
              {t('foundation.i18nDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-charcoal">
                  Supabase RLS
                </h4>
                <span className="text-xs text-charcoal-light">Prepared Migrations</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-charcoal-muted leading-normal">
              PostgreSQL schema architecture & private bucket structures staged.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Design Tokens & Component Verification */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>UI Design System Primitives</CardTitle>
            <CardDescription>
              Enterprise-compliant buttons, status indicators, and input components.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Badges */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block">
                Workflow Status Tokens
              </span>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success" withDot>{t('common.approved')}</Badge>
                <Badge variant="warning" withDot>{t('common.pending')}</Badge>
                <Badge variant="danger" withDot>{t('common.rejected')}</Badge>
                <Badge variant="info" withDot>{t('common.active')}</Badge>
                <Badge variant="default">{t('common.draft')}</Badge>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block">
                Button Hierarchy
              </span>
              <div className="flex flex-wrap gap-2.5">
                <Button variant="primary">{t('common.save')}</Button>
                <Button variant="secondary">{t('common.filter')}</Button>
                <Button variant="outline">{t('common.details')}</Button>
                <Button variant="danger">{t('common.delete')}</Button>
              </div>
            </div>

            {/* Accessible Input */}
            <div className="space-y-2">
              <Input
                label="Sample Verification Input"
                placeholder="Type here to test focus and typography..."
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                helperText="Verified focus-visible outline and contrast styling."
              />
            </div>
          </CardContent>
        </Card>

        {/* Verification Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Phase 1 Security & Architectural Checklist</CardTitle>
            <CardDescription>
              Non-negotiable engineering requirements verified before phase completion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-forest-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-charcoal">Clean Git & Secret Protection</span>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    `.env.example` placeholders only; `.gitignore` strictly protects `.env*`, build files, and credentials.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-forest-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-charcoal">Strict TypeScript Rules</span>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    `noUncheckedIndexedAccess`, `strict`, `noImplicitAny`, and comprehensive types enabled.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-forest-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-charcoal">Bilingual Architecture</span>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    English and Kiswahili dictionaries loaded via `i18next` with local persistence.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-forest-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-charcoal">Modular Monolith Staging</span>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    Prepared Supabase migrations, edge functions, and feature boundaries without premature code sprawl.
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Role Baseline Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>{t('foundation.rolesTitle')}</CardTitle>
              <CardDescription>{t('foundation.rolesDesc')}</CardDescription>
            </div>
            <Badge variant="info">6 Roles Configured</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Identifier</TableHead>
                <TableHead>Display Title (Current Locale)</TableHead>
                <TableHead>Organizational Scope</TableHead>
                <TableHead>RBAC State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialRoles.map((item) => (
                <TableRow key={item.role}>
                  <TableCell className="font-mono text-xs font-semibold text-forest-800">
                    {item.role}
                  </TableCell>
                  <TableCell className="font-medium text-charcoal">
                    {t(`roles.${item.role}`)}
                  </TableCell>
                  <TableCell className="text-xs text-charcoal-muted">
                    {item.scope}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" withDot>
                      Defined
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Next Phase Handoff Banner */}
      <div className="rounded-lg border border-forest-200 bg-forest-50/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-forest-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-forest-800">
              Handoff Status
            </span>
            <p className="text-sm font-medium text-charcoal">
              {t('foundation.readyNext')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-forest-800">
          <span>Phase 2 Pending Authorization</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};
