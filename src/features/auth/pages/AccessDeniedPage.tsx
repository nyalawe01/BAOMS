import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const AccessDeniedPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roles, user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center p-6 sm:p-8 shadow-modal border-status-warning-border">
        <CardContent className="space-y-5 p-0">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-warning-bg text-status-warning-text border border-status-warning-border">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="warning" withDot>
                403 Forbidden
              </Badge>
              <span className="text-xs font-mono text-charcoal-light">RBAC Boundary</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-charcoal">
              {t('auth.accessDeniedTitle', 'Access Denied')}
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-sm mx-auto leading-relaxed">
              {t(
                'auth.accessDeniedDesc',
                'Your assigned organizational role does not possess the required permissions to access this administrative resource.'
              )}
            </p>
          </div>

          {user && (
            <div className="rounded-md border border-surface-border bg-surface-muted/40 p-3 text-xs text-charcoal-muted text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-charcoal-light">Authenticated User:</span>
                <span className="font-semibold text-charcoal">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-charcoal-light">Assigned Roles:</span>
                <div className="flex gap-1">
                  {roles.map((r) => (
                    <Badge key={r} variant="info" className="text-[10px]">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span>{t('common.back', 'Go Back')}</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-1.5" />
              <span>{t('nav.dashboard', 'Return to Dashboard')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
