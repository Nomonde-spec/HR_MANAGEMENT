import create from 'zustand';

const useApplicantStore = create((set, get) => ({
  applicantToken: localStorage.getItem('applicantToken') || null,
  applicant: JSON.parse(localStorage.getItem('applicant') || 'null'),
  setApplicant: (token, applicant) => {
    localStorage.setItem('applicantToken', token);
    localStorage.setItem('applicant', JSON.stringify(applicant));
    set({ applicantToken: token, applicant });
  },
  logout: () => {
    localStorage.removeItem('applicantToken');
    localStorage.removeItem('applicant');
    set({ applicantToken: null, applicant: null });
  }
}));

export default useApplicantStore;
