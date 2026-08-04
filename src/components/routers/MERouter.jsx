import React from 'react';
import {
  MEDashboardView, MEProjectsView, MEIndicatorsView,
  METargetsView, MEBeneficiariesView, MECollectionView,
  MESurveysView, MEVisitsView,
  MEQualityView, MEMapsView, MEAnalyticsView,
  MEDocumentsView, MESettingsView
} from '../../views/MEViews';

const Denied = () => <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;

export default function MERouter({ activeTab, role }) {
  if (role !== 'M&E Officer' && role !== 'Monitoring & Evaluation Officer') return <Denied />;

  switch (activeTab) {
    case 'me_dashboard': return <MEDashboardView />;
    case 'me_projects': return <MEProjectsView />;
    case 'me_indicators': return <MEIndicatorsView />;
    case 'me_targets': return <METargetsView />;
    case 'me_beneficiaries': return <MEBeneficiariesView />;
    case 'me_collection': return <MECollectionView />;
    case 'me_surveys': return <MESurveysView />;
    case 'me_visits': return <MEVisitsView />;
    case 'me_quality': return <MEQualityView />;
    case 'me_maps': return <MEMapsView />;
    case 'me_analytics': return <MEAnalyticsView />;
    case 'me_documents': return <MEDocumentsView />;
    case 'me_settings': return <MESettingsView />;
    default: return <div className="p-8 text-slate-500 font-semibold">View not found.</div>;
  }
}
