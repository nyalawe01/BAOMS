import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserX, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const AccountDeactivatedPage: React.FC = () => {
  const { t } = useTranslation();
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-surface-bg p-4">
      <Card className="max-w-md w-full text-center p-6 sm:p-8 shadow-modal border-status-danger-border">
        <CardContent className="space-y-5 p-0">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-danger-bg text-status-danger-text border border-status-danger-border">
            <UserX className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <Badge variant="danger" withDot>
              Account Suspended
            </Badge>
            <h2 className="text-xl font-bold tracking-tight text-charcoal">
              {t('auth.deactivatedTitle', 'Account Deactivated')}
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              {t(
                'auth.deactivatedDesc',
                'Your staff account has been deactivated by Organization Administration. You can no longer access internal documents, budgets, or operational workflows.'
              )}
            </p>
          </div>

          {user && (
            <div className="rounded-md border border-surface-border bg-surface-muted/40 p-3 text-xs text-charcoal-muted">
              <span>Account: </span>
              <strong className="text-charcoal">{user.email}</strong>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              <span>{t('nav.signOut', 'Sign Out')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
