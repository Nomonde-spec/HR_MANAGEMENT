import React from 'react';
import { Navigate } from 'react-router-dom';
import useApplicantStore from '../store/applicantStore';

export default function ApplicantProtectedRoute({ children }) {
  const { applicantToken, applicant } = useApplicantStore();

  if (!applicantToken || !applicant) {
    return <Navigate to="/apply-register" replace />;
  }

  return children;
}
